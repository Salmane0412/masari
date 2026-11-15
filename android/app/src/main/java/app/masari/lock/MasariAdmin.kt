package app.masari.lock

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/** Administrateur de l'appareil : tant qu'il est actif, Android refuse de désinstaller Masari. Le retirer passe par les réglages (protégés). */
class MasariAdmin : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence =
        "تعطيل هذه الحماية يسمح بحذف مساري. إن كنتَ متأكدًا فاتبع مسار الانتظار في التطبيق."
    override fun onDisabled(context: Context, intent: Intent) {
        try { Events.add(context, "protect"); Partner.send(context, "تعطيل حماية الحذف", "أُلغي تفعيل مدير الجهاز لمساري.", "admin-off", 4, 30) } catch (e: Exception) { }
    }
}
