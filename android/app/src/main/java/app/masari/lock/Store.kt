package app.masari.lock

import android.content.Context
import java.time.LocalDate

object Store {
    private fun p(c: Context) = c.getSharedPreferences("masari", Context.MODE_PRIVATE)
    fun today(): String = LocalDate.now().toString()

    fun secret(c: Context): String = p(c).getString("secret", "") ?: ""
    fun setSecret(c: Context, s: String) { p(c).edit().putString("secret", s.trim().replace(" ", "")).apply() }
    fun mode(c: Context): String = p(c).getString("mode", "self") ?: "self"
    fun setMode(c: Context, m: String) { p(c).edit().putString("mode", m).apply() }
    fun blockAll(c: Context): Boolean = p(c).getBoolean("blockAll", false)
    fun setBlockAll(c: Context, v: Boolean) { p(c).edit().putBoolean("blockAll", v).apply() }
    fun blocked(c: Context): Set<String> = HashSet(p(c).getStringSet("blocked", emptySet()) ?: emptySet())
    fun setBlocked(c: Context, s: Set<String>) { p(c).edit().putStringSet("blocked", HashSet(s)).apply() }
    fun allowed(c: Context): Set<String> = HashSet(p(c).getStringSet("allowed", emptySet()) ?: emptySet())
    fun setAllowed(c: Context, s: Set<String>) { p(c).edit().putStringSet("allowed", HashSet(s)).apply() }
    fun webBlock(c: Context): Boolean = p(c).getBoolean("webBlock", false)
    fun setWebBlock(c: Context, v: Boolean) { p(c).edit().putBoolean("webBlock", v).apply() }
    /** أسماء ظهرت في إشعارات واتساب مؤخرًا (للاختيار منها بدل الكتابة)؛ الأحدث أولًا */
    fun waSeen(c: Context): List<String> = (p(c).getString("waSeen", "") ?: "").split("\n").filter { it.isNotBlank() }
    fun addWaSeen(c: Context, name: String) {
        val n = name.trim(); if (n.isEmpty() || n.length > 60) return
        val l = ArrayList<String>(); l.add(n); l.addAll(waSeen(c).filter { it != n })
        p(c).edit().putString("waSeen", l.take(40).joinToString("\n")).apply()
    }
    @Volatile private var domRaw: String? = null
    @Volatile private var domSet: Set<String> = emptySet()
    /** Résultat mis en cache : cette fonction est appelée à chaque requête DNS. */
    fun domains(c: Context): Set<String> {
        val raw = p(c).getString("domains", "") ?: ""
        if (raw == domRaw) return domSet
        val set = raw.split(Regex("[\\s,]+")).map { it.trim().lowercase().removePrefix("www.") }.filter { it.contains('.') }.toSet()
        domSet = set; domRaw = raw; return set
    }
    fun setDomains(c: Context, t: String) { p(c).edit().putString("domains", t).apply() }
    // v2 : deux clés séparées — celle du jour (calculée par le site Masari) et celle du partenaire (Google Authenticator)
    fun selfSecret(c: Context): String = p(c).getString("selfSecret", null) ?: (if (mode(c) == "self") secret(c) else "")
    fun setSelfSecret(c: Context, s: String) { p(c).edit().putString("selfSecret", s.trim()).apply() }
    fun partnerSecret(c: Context): String = p(c).getString("partnerSecret", null) ?: (if (mode(c) == "partner") secret(c) else "")
    fun setPartnerSecret(c: Context, s: String) { p(c).edit().putString("partnerSecret", s.trim()).apply() }
    // Passage de 10 minutes vers les réglages protégés, accordé par le code du partenaire
    fun settingsPass(c: Context): Boolean = p(c).getLong("settingsPass", 0L) > System.currentTimeMillis()
    fun setSettingsPass(c: Context) { p(c).edit().putLong("settingsPass", System.currentTimeMillis() + 10 * 60_000L).apply() }
    // وقت إضافي ذاتي (٥ دقائق) لتطبيق ذي ميزانية: الأول فورًا، ثم الانتظار يتضاعف ساعة بعد ساعة، وبحدّ ٣ في اليوم
    fun extraCount(c: Context): Int = if (p(c).getString("exDay", "") == today()) p(c).getInt("exN", 0) else 0
    fun extraWaitMs(c: Context): Long {
        val n = extraCount(c); if (n == 0) return 0L
        return maxOf(0L, p(c).getLong("exAt", 0L) + n * 3600_000L - System.currentTimeMillis())
    }
    fun extraLeft(c: Context): Int = 3 - extraCount(c)
    fun recordExtra(c: Context) { p(c).edit().putString("exDay", today()).putInt("exN", extraCount(c) + 1).putLong("exAt", System.currentTimeMillis()).apply() }
    fun dayDoneToday(c: Context): Boolean = p(c).getString("dayDone", "") == today()
    fun setDayDone(c: Context) { p(c).edit().putString("dayDone", today()).putString("unlocked", today()).apply() }
    fun unlocked(c: Context): Boolean = p(c).getString("unlocked", "") == today() || emergencyActive(c)
    fun emergencyActive(c: Context): Boolean = p(c).getLong("emergencyUntil", 0L) > System.currentTimeMillis()
    fun setEmergency(c: Context) { p(c).edit().putLong("emergencyUntil", System.currentTimeMillis() + 30 * 60_000L).apply() }
    fun setUnlocked(c: Context) { p(c).edit().putString("unlocked", today()).apply() }

    // طلب إلغاء الحماية: انتظار 24 ساعة ثم نافذة 30 دقيقة
    fun disableReq(c: Context): Long = p(c).getLong("disableReq", 0L)
    fun setDisableReq(c: Context, t: Long) { p(c).edit().putLong("disableReq", t).apply() }
    private const val WAIT = 24L * 3600_000L
    private const val WINDOW = 30L * 60_000L
    // نافذة إعداد: ٣٠ دقيقة بعد أول فتح لمساري بعد التثبيت، حتى تُنهي الإعداد دون عوائق
    fun firstRun(c: Context): Long = p(c).getLong("firstRun", 0L)
    fun markFirstRun(c: Context) { if (firstRun(c) == 0L) p(c).edit().putLong("firstRun", System.currentTimeMillis()).apply() }
    fun setupWindow(c: Context): Boolean { val f = firstRun(c); return f != 0L && System.currentTimeMillis() - f < 30 * 60_000L }
    fun disableAllowed(c: Context): Boolean {
        if (setupWindow(c)) return true
        val r = disableReq(c); if (r == 0L) return false
        val e = System.currentTimeMillis() - r
        if (e > WAIT + WINDOW) { setDisableReq(c, 0L); return false }
        return e >= WAIT
    }
    fun disableRemainingMs(c: Context): Long {
        val r = disableReq(c); if (r == 0L) return -1L
        return maxOf(0L, WAIT - (System.currentTimeMillis() - r))
    }

    // حماية من التخمين
    fun failCount(c: Context): Int = p(c).getInt("fails", 0)
    fun lockedUntil(c: Context): Long = p(c).getLong("lockedUntil", 0L)
    fun recordFail(c: Context) {
        val n = failCount(c) + 1
        val e = p(c).edit().putInt("fails", n)
        if (n >= 5) { e.putLong("lockedUntil", System.currentTimeMillis() + 5 * 60_000L).putInt("fails", 0) }
        e.apply()
    }
    fun clearFails(c: Context) { p(c).edit().putInt("fails", 0).putLong("lockedUntil", 0L).apply() }

    /**
     * Garde-fou contre le changement de l'heure du téléphone (qui permettrait de sauter l'attente de 24 h
     * ou de remettre à zéro les budgets de temps). On compare l'horloge murale à l'horloge monotone (elapsedRealtime),
     * que l'utilisateur ne peut pas modifier. Un écart de plus de 10 min = horloge touchée :
     * budgets du jour épuisés, attente de 24 h relancée, partenaire prévenu. Ne s'assouplit jamais.
     */
    fun clockCheck(c: Context) {
        val wall = System.currentTimeMillis(); val el = android.os.SystemClock.elapsedRealtime()
        val aw = p(c).getLong("cwWall", 0L); val ae = p(c).getLong("cwEl", 0L)
        if (aw == 0L || el < ae) { p(c).edit().putLong("cwWall", wall).putLong("cwEl", el).apply(); return }   // premier passage ou redémarrage
        val drift = (wall - aw) - (el - ae)
        if (Math.abs(drift) > 10 * 60_000L) {
            Events.add(c, "clock")
            Policy.exhaustBudgets(c)
            if (disableReq(c) != 0L) setDisableReq(c, wall)
            Partner.send(c, "تغيير ساعة الهاتف", "غُيّرت ساعة الهاتف (حوالي ${Math.abs(drift) / 60000} دقيقة). استُنفدت ميزانيات اليوم وأُعيد الانتظار.", "clock", 4, 30)
            p(c).edit().putLong("cwWall", wall).putLong("cwEl", el).apply()
        } else if (el - ae > 60_000L) p(c).edit().putLong("cwWall", wall).putLong("cwEl", el).apply()
    }
}
