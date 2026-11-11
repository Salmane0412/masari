package app.masari.lock

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId

/** Rappels natifs (fonctionnent application fermée) : adhan, rappels de Masari, rapport du soir, mise à jour à minuit. */
object Alarms {
    const val CH_SALAT = "masari_salat"; const val CH_REM = "masari_remind"
    private fun p(c: Context) = c.getSharedPreferences("masari", Context.MODE_PRIVATE)

    fun channels(c: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = c.getSystemService(NotificationManager::class.java)
        val s = NotificationChannel(CH_SALAT, "الأذان", NotificationManager.IMPORTANCE_HIGH)
        s.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build())
        nm.createNotificationChannel(s)
        nm.createNotificationChannel(NotificationChannel(CH_REM, "تذكيرات مساري", NotificationManager.IMPORTANCE_DEFAULT))
    }

    fun setPrayer(c: Context, json: String) { p(c).edit().putString("prayer", json).apply(); scheduleAll(c) }
    fun setReminders(c: Context, json: String) { p(c).edit().putString("reminders", json).apply(); scheduleAll(c) }

    private fun pi(c: Context, code: Int, extras: Map<String, String>): PendingIntent {
        val i = Intent(c, AlarmReceiver::class.java).setAction("masari.alarm.$code")
        for ((k, v) in extras) i.putExtra(k, v)
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
    private fun at(c: Context, ms: Long, code: Int, extras: Map<String, String>) {
        if (ms <= System.currentTimeMillis()) return
        val am = c.getSystemService(AlarmManager::class.java)
        val op = pi(c, code, extras)
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ms, op)
            else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ms, op)
        } catch (e: SecurityException) { am.set(AlarmManager.RTC_WAKEUP, ms, op) }
    }
    private fun ms(d: LocalDate, minutes: Int): Long = LocalDateTime.of(d, java.time.LocalTime.of((minutes / 60) % 24, minutes % 60)).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

    fun scheduleAll(c: Context) {
        channels(c)
        val am = c.getSystemService(AlarmManager::class.java)
        for (code in 100..140) am.cancel(pi(c, code, emptyMap()))
        for (code in 200..260) am.cancel(pi(c, code, emptyMap()))
        // 1) الصلوات: اليوم وغدًا
        try {
            val o = JSONObject(p(c).getString("prayer", "{}")!!)
            if (o.has("lat")) {
                val ad = o.optJSONObject("adhan") ?: JSONObject(); val pre = o.optInt("pre", 0)
                var k = 0
                for (d in listOf(LocalDate.now(), LocalDate.now().plusDays(1))) {
                    val t = Prayer.times(d, o.getDouble("lat"), o.getDouble("lng"), o.optString("method", "MWL"), o.optInt("asr", 1))
                    for (name in listOf("fajr", "dhuhr", "asr", "maghrib", "isha")) {
                        if (ad.optInt(name, 1) == 1) {
                            at(c, ms(d, t[name]!!), 100 + k, mapOf("kind" to "salat", "title" to "حان وقت صلاة ${Prayer.NAMES[name]}", "text" to "حيّ على الصلاة"))
                            if (pre > 0) at(c, ms(d, t[name]!!) - pre * 60_000L, 120 + k, mapOf("kind" to "pre", "title" to "${Prayer.NAMES[name]} بعد $pre دقائق", "text" to "تهيّأ للصلاة"))
                        }
                        k++
                    }
                }
            }
        } catch (e: Exception) { }
        // 2) تذكيرات مساري (يرسلها الموقع: [{at, title, text}])
        try {
            val a = JSONArray(p(c).getString("reminders", "[]")!!)
            for (i in 0 until minOf(a.length(), 60)) { val r = a.getJSONObject(i); at(c, r.getLong("at"), 200 + i, mapOf("kind" to "remind", "title" to r.optString("title"), "text" to r.optString("text"))) }
        } catch (e: Exception) { }
        // 3) تقرير المساء للشريك 22:00، و4) إعادة الجدولة بعد منتصف الليل
        val today = LocalDate.now()
        val rep = ms(today, 22 * 60).let { if (it < System.currentTimeMillis()) ms(today.plusDays(1), 22 * 60) else it }
        at(c, rep, 300, mapOf("kind" to "report"))
        at(c, ms(today.plusDays(1), 5), 301, mapOf("kind" to "resched"))
    }

    fun notify(c: Context, ch: String, id: Int, title: String, text: String) {
        channels(c)
        val open = PendingIntent.getActivity(c, 0, Intent(c, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(c, ch) else Notification.Builder(c)
        b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(text).setAutoCancel(true).setContentIntent(open)
        try { c.getSystemService(NotificationManager::class.java).notify(id, b.build()) } catch (e: SecurityException) { }
    }
}

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        Policy.checkPending(c)
        when (i.getStringExtra("kind")) {
            "salat" -> Alarms.notify(c, Alarms.CH_SALAT, 1, i.getStringExtra("title") ?: "", i.getStringExtra("text") ?: "")
            "pre", "remind" -> Alarms.notify(c, Alarms.CH_REM, (System.currentTimeMillis() % 100000).toInt() + 10, i.getStringExtra("title") ?: "", i.getStringExtra("text") ?: "")
            "report" -> { Partner.report(c); Alarms.scheduleAll(c) }
            "resched" -> Alarms.scheduleAll(c)
        }
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) { Alarms.scheduleAll(c) }
}
