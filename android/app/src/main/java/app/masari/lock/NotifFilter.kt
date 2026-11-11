package app.masari.lock

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/** Coupe les notifications WhatsApp, sauf celles des personnes autorisées et les appels. */
class NotifFilter : NotificationListenerService() {
    private val WA = setOf("com.whatsapp", "com.whatsapp.w4b")

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null || sbn.packageName !in WA) return
        val cfg = Policy.current(this)
        if (!cfg.waFilter) return
        val n = sbn.notification ?: return
        if (n.category == Notification.CATEGORY_CALL) return
        if ((n.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return
        val ex = n.extras
        val title = (ex.getCharSequence(Notification.EXTRA_TITLE) ?: "").toString()
        val conv = (ex.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE) ?: "").toString()
        val ok = cfg.waAllow.any { name -> name.isNotBlank() && (title.contains(name, true) || conv.contains(name, true)) }
        if (!ok) try { cancelNotification(sbn.key) } catch (e: Exception) { }
    }
}
