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

class MainActivity : Activity() {
    private lateinit var web: WebView

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        Store.markFirstRun(this)
        web = WebView(this)
        val s: WebSettings = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        web.webViewClient = WebViewClient()
        val frame = FrameLayout(this)
        frame.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        val gear = Button(this)
        gear.text = "⚙"
        gear.alpha = 0.6f
        gear.setOnClickListener { startActivity(Intent(this, SettingsActivity::class.java)) }
        val lp = FrameLayout.LayoutParams(150, 150, Gravity.BOTTOM or Gravity.START)
        lp.bottomMargin = 220; lp.leftMargin = 12
        frame.addView(gear, lp)
        setContentView(frame)
        web.loadUrl("https://salmane0412.github.io/masari/")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }
}
