package app.masari.lock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class BlockerService : AccessibilityService() {
    private var lastBlock = 0L
    private val protectedPkgs = setOf(
        "com.android.settings", "com.google.android.packageinstaller", "com.android.packageinstaller",
        "com.android.vending", "com.samsung.android.packageinstaller"
    )
    private val alwaysAllowed = setOf(
        "com.android.systemui", "android", "com.google.android.inputmethod.latin", "com.samsung.android.honeyboard",
        "com.touchtype.swiftkey", "com.android.dialer", "com.google.android.dialer", "com.samsung.android.dialer",
        "com.android.phone", "com.android.incallui", "com.google.android.apps.messaging"
    )
    private var launchers: Set<String> = emptySet()

    override fun onServiceConnected() {
        super.onServiceConnected()
        val i = Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_HOME)
        launchers = packageManager.queryIntentActivities(i, 0).map { it.activityInfo.packageName }.toSet()
    }

    override fun onAccessibilityEvent(e: AccessibilityEvent?) {
        if (e == null) return
        val pkg = e.packageName?.toString() ?: return
        if (pkg == packageName) return
        VpnGuard.check(this)

        if (pkg in protectedPkgs) {
            if (Store.disableAllowed(this)) return
            val root = rootInActiveWindow ?: return
            // لا نحتسب إلا نافذة النظام نفسها، وليس نافذة مساري إذا كانت هي النشطة
            if (root.packageName?.toString() != pkg) return
            if (mentionsApp(root, 0)) block(true)
            return
        }
        if (e.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (Store.unlocked(this)) return
        if (pkg in alwaysAllowed || pkg in launchers || pkg in Store.allowed(this)) return
        val shouldBlock = if (Store.blockAll(this)) true else pkg in Store.blocked(this)
        if (shouldBlock) block(false)
    }

    private fun mentionsApp(n: AccessibilityNodeInfo?, depth: Int): Boolean {
        if (n == null || depth > 25) return false
        val t = (n.text?.toString() ?: "") + " " + (n.contentDescription?.toString() ?: "")
        if (t.contains("مساري") || t.contains("Masari", ignoreCase = true)) return true
        for (i in 0 until n.childCount) { if (mentionsApp(n.getChild(i), depth + 1)) return true }
        return false
    }

    private fun block(protect: Boolean) {
        val now = System.currentTimeMillis()
        if (now - lastBlock < 1200) return
        lastBlock = now
        performGlobalAction(GLOBAL_ACTION_HOME)
        val i = Intent(this, LockActivity::class.java)
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
        i.putExtra("protect", protect)
        startActivity(i)
    }

    override fun onInterrupt() {}
}
