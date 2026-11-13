package app.masari.lock

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Build
import android.provider.Settings

/** Vérifie que le blocage des sites est actif; sinon relance le VPN local ou prévient qu'un autre VPN le gêne. */
object VpnGuard {
    private var last = 0L
    fun otherVpnActive(c: Context): Boolean {
        return try {
            val cm = c.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            cm.allNetworks.any { cm.getNetworkCapabilities(it)?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true }
        } catch (e: Exception) { false }
    }
    fun check(c: Context) {
        if (!Store.webBlock(c) || DnsVpnService.running) return
        val now = System.currentTimeMillis(); if (now - last < 20_000) return; last = now
        if (otherVpnActive(c)) { notify(c, "🔒 حظر المواقع متوقف: VPN آخر مفتوح", "عطّل NordVPN (أو أي VPN آخر) ليعمل حظر مساري. اضغط لفتح إعدادات VPN."); return }
        if (VpnService.prepare(c) == null) c.startService(Intent(c, DnsVpnService::class.java))
        else notify(c, "مساري يحتاج إذن VPN", "افتح إعدادات مساري واضغط «تفعيل حظر المواقع».")
    }
    private fun notify(c: Context, title: String, text: String) {
        val nm = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel("masari_vpn", "حظر المواقع", NotificationManager.IMPORTANCE_HIGH))
        val pi = PendingIntent.getActivity(c, 0, Intent(Settings.ACTION_VPN_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK), PendingIntent.FLAG_IMMUTABLE)
        val b = if (Build.VERSION.SDK_INT >= 26) android.app.Notification.Builder(c, "masari_vpn") else android.app.Notification.Builder(c)
        nm.notify(77, b.setSmallIcon(android.R.drawable.ic_lock_lock).setContentTitle(title).setContentText(text).setContentIntent(pi).setAutoCancel(true).build())
    }
}
