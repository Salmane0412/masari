package app.masari.lock

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.Manifest
import android.app.AlertDialog
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.JsResult
import android.webkit.JsPromptResult
import android.webkit.ValueCallback
import android.webkit.DownloadListener
import android.widget.EditText
import android.graphics.Color

class MainActivity : Activity() {
    private lateinit var web: WebView
    private var bridge: SpeechBridge? = null
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private var micCb: ((Boolean) -> Unit)? = null
    private val HOST = "salmane0412.github.io"

    fun hasMic() = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    /** يشرح سبب الإذن قبل طلبه: الميكروفون يُستعمل فقط أثناء متابعة التلاوة، ولا يُحفظ أي صوت. */
    fun askMic(cb: (Boolean) -> Unit) {
        if (hasMic()) { cb(true); return }
        AlertDialog.Builder(this)
            .setTitle("إذن الميكروفون")
            .setMessage("يستعمل مساري الميكروفون فقط عندما تضغط «تلاوة بمتابعة مباشرة»، ليتحقق من قراءتك كلمةً كلمة. لا يُسجَّل الصوت ولا يُحفظ في مساري. التعرّف الصوتي تؤديه خدمة Google على هاتفك.")
            .setPositiveButton("متابعة") { _, _ -> micCb = cb; requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 77) }
            .setNegativeButton("لاحقًا") { _, _ -> cb(false) }
            .setOnCancelListener { cb(false) }
            .show()
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(rc: Int, p: Array<out String>, g: IntArray) {
        super.onRequestPermissionsResult(rc, p, g)
        if (rc == 77) { val ok = g.isNotEmpty() && g[0] == PackageManager.PERMISSION_GRANTED; val cb = micCb; micCb = null; cb?.invoke(ok) }
    }

    override fun onDestroy() { bridge?.release(); super.onDestroy() }

    fun startVpn() {
        val i = android.net.VpnService.prepare(this)
        if (i != null) startActivityForResult(i, 42) else startService(Intent(this, DnsVpnService::class.java))
    }
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(r: Int, res: Int, d: Intent?) {
        super.onActivityResult(r, res, d)
        if (r == 43) { fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, d)); fileCb = null }
        if (r == 42 && res == RESULT_OK) startService(Intent(this, DnsVpnService::class.java))
    }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        Store.markFirstRun(this)
        Policy.checkPending(this)
        Alarms.scheduleAll(this)
        web = WebView(this)
        val s: WebSettings = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        bridge = SpeechBridge(this, web)
        web.addJavascriptInterface(bridge!!, "AndroidSpeech")
        web.addJavascriptInterface(NativeBridge(this), "MasariNative")
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
                if (r.url.host == HOST) return false
                try { startActivity(Intent(Intent.ACTION_VIEW, r.url)) } catch (e: Exception) {}
                return true
            }
            override fun onPageFinished(v: WebView, url: String?) {
                if (Uri.parse(url ?: "").host == HOST) v.evaluateJavascript(SpeechBridge.POLYFILL, null)
            }
        }
        web.setBackgroundColor(Color.parseColor("#0e1a24"))
        window.statusBarColor = Color.parseColor("#0e1a24"); window.navigationBarColor = Color.parseColor("#0e1a24")
        web.setDownloadListener(DownloadListener { url, _, _, _, _ -> try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (e: Exception) {} })
        web.webChromeClient = object : WebChromeClient() {
            // Sans ces trois méthodes, WebView ignore silencieusement alert/confirm/prompt : les boutons « ne répondent pas ».
            override fun onJsAlert(v: WebView, url: String?, m: String?, r: JsResult): Boolean {
                AlertDialog.Builder(this@MainActivity).setMessage(m).setPositiveButton("حسنًا") { _, _ -> r.confirm() }.setOnCancelListener { r.cancel() }.show(); return true
            }
            override fun onJsConfirm(v: WebView, url: String?, m: String?, r: JsResult): Boolean {
                AlertDialog.Builder(this@MainActivity).setMessage(m).setPositiveButton("نعم") { _, _ -> r.confirm() }
                    .setNegativeButton("لا") { _, _ -> r.cancel() }.setOnCancelListener { r.cancel() }.show(); return true
            }
            override fun onJsPrompt(v: WebView, url: String?, m: String?, def: String?, r: JsPromptResult): Boolean {
                val et = EditText(this@MainActivity); et.setText(def ?: ""); et.textDirection = android.view.View.TEXT_DIRECTION_LOCALE
                AlertDialog.Builder(this@MainActivity).setMessage(m).setView(et).setPositiveButton("موافق") { _, _ -> r.confirm(et.text.toString()) }
                    .setNegativeButton("إلغاء") { _, _ -> r.cancel() }.setOnCancelListener { r.cancel() }.show(); return true
            }
            override fun onShowFileChooser(w: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                fileCb?.onReceiveValue(null); fileCb = cb
                try { startActivityForResult(p.createIntent(), 43) } catch (e: Exception) { fileCb = null; return false }
                return true
            }
            override fun onPermissionRequest(req: PermissionRequest) {
                runOnUiThread {
                    if (req.origin.host != HOST) { req.deny(); return@runOnUiThread }
                    askMic { ok -> if (ok) req.grant(req.resources) else req.deny() }
                }
            }
        }
        val frame = FrameLayout(this)
        frame.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(frame)
        web.loadUrl("https://salmane0412.github.io/masari/")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }
}
