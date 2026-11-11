package app.masari.lock

import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/** Pont entre la page Masari (« الهاتف والحجب ») et le téléphone. Ne donne jamais le moyen d'assouplir sans délai. */
class NativeBridge(private val act: MainActivity) {
    private val c get() = act.applicationContext

    private fun accOn(): Boolean = (Settings.Secure.getString(c.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: "").contains(c.packageName + "/")
    private fun notifOn(): Boolean = (Settings.Secure.getString(c.contentResolver, "enabled_notification_listeners") ?: "").contains(c.packageName)

    @JavascriptInterface fun version(): String = "2.1"

    /** Enregistre un fichier texte (export, .ics…) dans Téléchargements. */
    @JavascriptInterface fun saveFile(name: String, mime: String, text: String): String = try {
        val safe = name.replace(Regex("[^A-Za-z0-9._-]"), "_")
        if (Build.VERSION.SDK_INT >= 29) {
            val v = android.content.ContentValues().apply {
                put(android.provider.MediaStore.Downloads.DISPLAY_NAME, safe); put(android.provider.MediaStore.Downloads.MIME_TYPE, mime)
                put(android.provider.MediaStore.Downloads.RELATIVE_PATH, "Download/")
            }
            val u = c.contentResolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, v)!!
            c.contentResolver.openOutputStream(u)!!.use { it.write(text.toByteArray()) }
        } else {
            val f = java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS), safe)
            f.writeText(text)
        }
        "ok"
    } catch (e: Exception) { "error" }

    @JavascriptInterface fun status(): String {
        val am = c.getSystemService(AlarmManager::class.java)
        val pm = c.getSystemService(PowerManager::class.java)
        return JSONObject()
            .put("accessibility", accOn()).put("notifListener", notifOn()).put("vpn", DnsVpnService.running)
            .put("otherVpn", VpnGuard.otherVpnActive(c))
            .put("notifPerm", Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)
            .put("exactAlarm", Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms())
            .put("battery", pm.isIgnoringBatteryOptimizations(c.packageName))
            .put("setupWindow", Store.setupWindow(c)).put("pendingAt", Policy.pendingAt(c))
            .put("unlocked", Store.unlocked(c)).put("dayDone", Store.dayDoneToday(c))
            .put("partner", Store.partnerSecret(c).isNotEmpty()).put("topic", Partner.topic(c))
            .put("usage", Policy.usageToday(c)).put("events", Events.today(c)).toString()
    }

    @JavascriptInterface fun apps(): String {
        val pm = c.packageManager
        val i = Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_LAUNCHER)
        val arr = JSONArray()
        pm.queryIntentActivities(i, 0).map { Pair(it.activityInfo.packageName, it.loadLabel(pm).toString()) }
            .filter { it.first != c.packageName }.distinctBy { it.first }.sortedBy { it.second.lowercase() }
            .forEach { arr.put(JSONObject().put("p", it.first).put("l", it.second)) }
        return arr.toString()
    }

    @JavascriptInterface fun config(): String = Policy.toJson(Policy.current(c)).toString()

    /** Renvoie "applied", "pending" ou "bad-code". */
    @JavascriptInterface fun setConfig(json: String, partnerCode: String?): String =
        try { Policy.request(c, Policy.fromJson(JSONObject(json)), partnerCode) } catch (e: Exception) { "error" }

    @JavascriptInterface fun cancelPending() { Policy.cancelPending(c) }

    /** Le site signale la fin des tâches du jour, avec le code du jour calculé par lui. */
    @JavascriptInterface fun dayDone(code: String): Boolean {
        if (!Codes.verifySelf(c, code)) return false
        if (!Store.dayDoneToday(c)) Partner.send(c, "أنهى مهام اليوم", "أنهى حفظ اليوم واختباره ✅", "daydone", 3)
        Store.setDayDone(c); return true
    }
    /** La clé du code du jour vient du site (synchronisée avec tes appareils). Changement libre seulement si absente ou pendant l'installation. */
    @JavascriptInterface fun setSelfSecret(s: String): Boolean {
        val cur = Store.selfSecret(c)
        if (cur.isNotEmpty() && cur != s && !Store.setupWindow(c) && !Store.disableAllowed(c)) return false
        Store.setSelfSecret(c, s); return true
    }

    /** Jumelage du partenaire : clé Google Authenticator + sujet ntfy. Une seule fois (ou pendant une fenêtre libre). */
    @JavascriptInterface fun partnerPair(force: Boolean): String {
        val free = Store.setupWindow(c) || Store.disableAllowed(c)
        if (Store.partnerSecret(c).isNotEmpty() && !(force && free)) return JSONObject().put("error", "already").toString()
        val sec = Codes.randomSecret(); Store.setPartnerSecret(c, sec)
        val topic = if (force) { Partner.clearTopic(c); Partner.ensureTopic(c) } else Partner.ensureTopic(c)
        val uri = "otpauth://totp/Masari:Salmane?secret=$sec&issuer=Masari&period=30&digits=6"
        return JSONObject().put("secret", sec).put("topic", topic).put("otpauth", uri).toString()
    }
    @JavascriptInterface fun partnerTest() { Partner.send(c, "تجربة", "إن وصلتك هذه الرسالة فالتنبيهات تعمل بإذن الله.", "test", 3) }

    @JavascriptInterface fun setPrayer(json: String) { Alarms.setPrayer(c, json) }
    @JavascriptInterface fun setReminders(json: String) { Alarms.setReminders(c, json) }

    /** Ouvre un réglage. Les écrans protégés (ils permettraient d'enlever la protection) demandent la fenêtre libre ou le code du partenaire. */
    @JavascriptInterface fun open(what: String, code: String?): String {
        val guarded = what in setOf("accessibility", "notif", "exact", "battery", "dnd")
        if (guarded && !(Store.setupWindow(c) || Store.disableAllowed(c))) {
            if (code.isNullOrBlank()) return "need-code"
            if (!Codes.verifyPartner(c, code)) return "bad-code"
            Store.setSettingsPass(c); Partner.send(c, "فتح الإعدادات", "استُعمل رمزك لفتح إعدادات الهاتف 3 دقائق.", "pass", 3)
        }
        act.runOnUiThread {
            try {
                when (what) {
                    "accessibility" -> act.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                    "notif" -> act.startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"))
                    "notifperm" -> if (Build.VERSION.SDK_INT >= 33) act.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9)
                    "exact" -> if (Build.VERSION.SDK_INT >= 31) act.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + c.packageName)))
                    "battery" -> act.startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + c.packageName)))
                    "vpn" -> act.startVpn()
                    "dnd" -> act.startActivity(Intent(Settings.ACTION_ZEN_MODE_PRIORITY_SETTINGS))
                }
            } catch (e: Exception) { }
        }
        return "ok"
    }
}
