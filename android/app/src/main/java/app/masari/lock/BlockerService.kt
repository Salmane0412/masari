package app.masari.lock

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Le gardien. Ordre des règles :
 * 1) appli bannie → toujours bloquée (et sa page dans le Play Store) ;
 * 2) toujours autorisée / système / clavier / écran d'accueil → libre ;
 * 3) budget de temps (ex. Telegram 20 min/jour) → bloquée quand il est épuisé ;
 * 4) « jusqu'à la fin des tâches » → bloquée tant que la journée n'est pas validée.
 */
class BlockerService : AccessibilityService() {
    private var lastBlock = 0L
    private val main = Handler(Looper.getMainLooper())
    private var fgPkg = ""; private var fgSince = 0L
    private val protectedPkgs = setOf(
        "com.android.settings", "com.google.android.packageinstaller", "com.android.packageinstaller", "com.samsung.android.packageinstaller"
    )
    private val alwaysAllowed = setOf(
        "com.android.systemui", "android", "com.google.android.inputmethod.latin", "com.samsung.android.honeyboard",
        "com.touchtype.swiftkey", "com.android.dialer", "com.google.android.dialer", "com.samsung.android.dialer",
        "com.android.phone", "com.android.incallui", "com.google.android.apps.messaging", "com.samsung.android.messaging",
        "com.android.mms", "com.google.android.apps.maps", "com.google.android.apps.authenticator2", "com.azure.authenticator"
    )
    private var launchers: Set<String> = emptySet()

    override fun onServiceConnected() {
        super.onServiceConnected()
        val i = Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_HOME)
        launchers = packageManager.queryIntentActivities(i, 0).map { it.activityInfo.packageName }.toSet()
        Alarms.scheduleAll(this)
    }

    private fun account(now: Long) {
        if (fgPkg.isNotEmpty() && fgSince > 0) Policy.addUsage(this, fgPkg, (now - fgSince) / 1000)
        fgSince = now
    }

    override fun onAccessibilityEvent(e: AccessibilityEvent?) {
        if (e == null) return
        val pkg = e.packageName?.toString() ?: return
        VpnGuard.check(this)
        val cfg = Policy.current(this)

        if (pkg in protectedPkgs) {
            if (Store.disableAllowed(this) || Store.settingsPass(this)) return
            val root = rootInActiveWindow ?: return
            if (root.packageName?.toString() != pkg) return
            if (mentions(root, 0, listOf("مساري", "Masari"))) {
                Events.add(this, "protect")
                Partner.send(this, "محاولة تعطيل الحماية", "فُتحت إعدادات تخصّ مساري (حذف أو إيقاف الحماية).", "protect", 4, 30)
                block("protect")
            }
            return
        }
        if (pkg == "com.android.vending" && cfg.bannedNames.isNotEmpty()) {
            val root = rootInActiveWindow
            if (root != null && root.packageName?.toString() == pkg && mentions(root, 0, cfg.bannedNames.toList())) { Events.add(this, "banned"); block("banned"); return }
        }
        if (e.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val now = System.currentTimeMillis()
        if (pkg == packageName || pkg in alwaysAllowed || pkg in launchers) { if (pkg != fgPkg) { account(now); fgPkg = pkg }; return }
        if (pkg != fgPkg) { account(now); fgPkg = pkg }

        if (pkg in cfg.banned) { Events.add(this, "banned"); Partner.send(this, "محاولة فتح تطبيق محظور", label(pkg), "banned", 3, 60); block("banned"); return }
        if (pkg in cfg.allowed) return
        val budget = cfg.budgets[pkg]
        if (budget != null) {
            val left = budget * 60L - Policy.usedSec(this, pkg)
            if (left <= 0) { block("budget", pkg); return }
            main.postDelayed({
                if (fgPkg == pkg) { account(System.currentTimeMillis()); if (budget * 60L - Policy.usedSec(this, pkg) <= 0) block("budget", pkg) }
            }, left * 1000 + 500)
            return
        }
        if (Store.unlocked(this)) return
        if (cfg.blockAll || pkg in cfg.until) block("until", pkg)
    }

    private fun label(pkg: String): String = try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }

    private fun mentions(n: AccessibilityNodeInfo?, depth: Int, words: List<String>): Boolean {
        if (n == null || depth > 25) return false
        val t = (n.text?.toString() ?: "") + " " + (n.contentDescription?.toString() ?: "")
        if (words.any { it.isNotBlank() && t.contains(it, ignoreCase = true) }) return true
        for (i in 0 until n.childCount) { if (mentions(n.getChild(i), depth + 1, words)) return true }
        return false
    }

    private fun block(reason: String, pkg: String = "") {
        val now = System.currentTimeMillis()
        if (now - lastBlock < 1200) return
        lastBlock = now
        account(now); fgPkg = ""
        performGlobalAction(GLOBAL_ACTION_HOME)
        val i = Intent(this, LockActivity::class.java)
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
        i.putExtra("protect", reason == "protect").putExtra("reason", reason).putExtra("pkg", pkg)
        startActivity(i)
    }

    override fun onInterrupt() {}
}
