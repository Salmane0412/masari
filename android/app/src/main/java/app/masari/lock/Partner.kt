package app.masari.lock

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.SecureRandom

/**
 * Alertes au partenaire (ton épouse) via ntfy.sh : application libre et gratuite, sans compte.
 * Elle s'abonne au « sujet » secret affiché lors du jumelage. Aucun jeton n'est nécessaire.
 */
object Partner {
    private fun p(c: Context) = c.getSharedPreferences("masari", Context.MODE_PRIVATE)
    fun topic(c: Context): String = p(c).getString("ntfyTopic", "") ?: ""
    fun ensureTopic(c: Context): String {
        var t = topic(c)
        if (t.isEmpty()) {
            val b = ByteArray(12); SecureRandom().nextBytes(b)
            t = "masari-" + b.joinToString("") { "%02x".format(it) }
            p(c).edit().putString("ntfyTopic", t).apply()
        }
        return t
    }
    fun clearTopic(c: Context) { p(c).edit().remove("ntfyTopic").apply() }

    /** Envoie une alerte (au plus une par type toutes les 30 min pour les événements répétitifs). */
    fun send(c: Context, title: String, msg: String, kind: String, priority: Int = 4, throttleMin: Int = 0) {
        val t = topic(c); if (t.isEmpty()) return
        if (throttleMin > 0) {
            val k = "ntfy_last_$kind"; val now = System.currentTimeMillis()
            if (now - p(c).getLong(k, 0L) < throttleMin * 60_000L) return
            p(c).edit().putLong(k, now).apply()
        }
        Thread {
            try {
                val body = JSONObject().put("topic", t).put("title", "مساري · $title").put("message", msg).put("priority", priority).put("tags", org.json.JSONArray().put("lock")).toString()
                val con = URL("https://ntfy.sh/").openConnection() as HttpURLConnection
                con.requestMethod = "POST"; con.doOutput = true; con.connectTimeout = 8000; con.readTimeout = 8000
                con.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                con.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                con.responseCode; con.disconnect()
            } catch (e: Exception) { }
        }.start()
    }

    /** Rapport du soir. */
    fun report(c: Context) {
        val ev = Events.today(c); val use = Policy.usageToday(c)
        val done = Store.unlocked(c) && !Store.emergencyActive(c)
        val lines = ArrayList<String>()
        lines.add(if (Store.dayDoneToday(c)) "✅ أنهى مهام اليوم" else "⏳ لم يُنهِ مهام اليوم")
        if (ev.optInt("long_text") > 0) lines.add("✍️ فتح بالرسالة الطويلة: ${ev.optInt("long_text")} مرة")
        if (ev.optInt("banned") > 0) lines.add("⛔ محاولات فتح تطبيق محظور: ${ev.optInt("banned")}")
        if (ev.optInt("weaken") > 0) lines.add("⚠️ طلبات تخفيف القيود: ${ev.optInt("weaken")}")
        if (ev.optInt("protect") > 0) lines.add("🛡 محاولات تعطيل الحماية أو الحذف: ${ev.optInt("protect")}")
        val tg = use.optLong("org.telegram.messenger", 0L) / 60
        if (tg > 0) lines.add("تيليغرام: $tg دقيقة")
        if (!done && ev.length() == 0 && tg == 0L) lines.add("لا أحداث أخرى")
        send(c, "تقرير اليوم", lines.joinToString("\n"), "report", 3)
    }
}
