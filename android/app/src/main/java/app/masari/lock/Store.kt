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
    fun webBlock(c: Context): Boolean = p(c).getBoolean("webBlock", false)
    fun setWebBlock(c: Context, v: Boolean) { p(c).edit().putBoolean("webBlock", v).apply() }
    fun domains(c: Context): Set<String> = (p(c).getString("domains", "") ?: "").split(Regex("[\\s,]+")).map { it.trim().lowercase().removePrefix("www.") }.filter { it.contains('.') }.toSet()
    fun setDomains(c: Context, t: String) { p(c).edit().putString("domains", t).apply() }
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
}
