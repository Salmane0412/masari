package app.masari.lock

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

class SettingsActivity : Activity() {
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(r: Int, res: Int, d: Intent?) {
        super.onActivityResult(r, res, d)
        if (r == 42 && res == RESULT_OK) { startService(Intent(this, DnsVpnService::class.java)); Toast.makeText(this, "حظر المواقع يعمل", Toast.LENGTH_SHORT).show() }
    }
    private val boxes = ArrayList<Pair<CheckBox, String>>()

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val sv = ScrollView(this)
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.setPadding(32, 48, 32, 48)
        root.layoutDirection = View.LAYOUT_DIRECTION_RTL
        sv.addView(root)

        fun text(t: String, size: Float = 16f): TextView { val v = TextView(this); v.text = t; v.textSize = size; v.setPadding(0, 14, 0, 6); return v }
        fun btn(t: String, click: () -> Unit): Button { val v = Button(this); v.text = t; v.setOnClickListener { click() }; return v }

        root.addView(text("إعدادات القفل", 24f))
        root.addView(text("١) فعّل خدمة مساري في «إمكانية الوصول» (لا يمكن تفعيلها آليًا عمدًا)."))
        root.addView(btn("فتح إعدادات إمكانية الوصول") { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) })

        root.addView(text("٢) طريقة الرمز"))
        val rg = RadioGroup(this)
        val self = RadioButton(this); self.text = "ذاتي: الرمز يظهر في مساري (الويب) بعد إنهاء اليوم"; self.id = 1
        val partner = RadioButton(this); partner.text = "شريك: الرمز عند شخص آخر (Google Authenticator)"; partner.id = 2
        rg.addView(self); rg.addView(partner)
        rg.check(if (Store.mode(this) == "partner") 2 else 1)
        root.addView(rg)
        val secret = EditText(this)
        secret.hint = "المفتاح السري (Base32)"; secret.setText(Store.secret(this)); secret.layoutDirection = View.LAYOUT_DIRECTION_LTR
        root.addView(secret)
        root.addView(text("في الوضع الذاتي: انسخ المفتاح من صفحة «رمز اليوم» في مساري. في وضع الشريك: اضغط توليد، ثم أعطِ المفتاح لشريكك ليضيفه في تطبيق المصادقة عنده (إدخال مفتاح الإعداد)، ولا تحتفظ بنسخة."))
        root.addView(btn("توليد مفتاح جديد (لوضع الشريك)") { secret.setText(Codes.randomSecret()) })

        root.addView(text("٣) حظر المواقع (خاص بمساري، لا يقرأ تصفحك)"))
        root.addView(text("يحجب الدومينات أدناه ما دام حفظ اليوم لم يُنجز، ويحجب المواقع الإباحية دائمًا. لا يعمل مع NordVPN مفتوحًا: سيُرسل لك إشعارًا لتعطيله. المتصفحات التي تفعّل «DNS الآمن/DoH» قد تتجاوزه: عطّل ذلك في إعدادات المتصفح."))
        val dom = EditText(this); dom.hint = "دومين في كل سطر، مثل: youtube.com"; dom.setText(Store.domains(this).joinToString("\n")); dom.layoutDirection = View.LAYOUT_DIRECTION_LTR; dom.minLines = 3
        root.addView(dom)
        root.addView(btn("إضافة مواقع التواصل والفيديو") { val base = dom.text.toString().trim(); dom.setText((base + "\nyoutube.com\ninstagram.com\nfacebook.com\nx.com\ntwitter.com\ntiktok.com\nreddit.com\nsnapchat.com\ntwitch.tv\nnetflix.com").trim()) })
        root.addView(btn("تفعيل حظر المواقع") {
            Store.setDomains(this, dom.text.toString()); Store.setWebBlock(this, true)
            if (android.os.Build.VERSION.SDK_INT >= 33) requestPermissions(arrayOf("android.permission.POST_NOTIFICATIONS"), 1)
            val i = android.net.VpnService.prepare(this)
            if (i != null) startActivityForResult(i, 42) else { startService(Intent(this, DnsVpnService::class.java)); Toast.makeText(this, "حظر المواقع يعمل", Toast.LENGTH_SHORT).show() }
        })
        root.addView(text("٤) التطبيقات"))
        val all = CheckBox(this); all.text = "احظر كل التطبيقات (عدا الاتصال والكيبورد ومساري)"; all.isChecked = Store.blockAll(this)
        root.addView(all)
        root.addView(text("أو اختر ما تريد حظره:"))
        val blocked = Store.blocked(this)
        val pm = packageManager
        val i = Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_LAUNCHER)
        val apps = pm.queryIntentActivities(i, 0).map { Pair(it.loadLabel(pm).toString(), it.activityInfo.packageName) }
            .filter { it.second != packageName }.distinctBy { it.second }.sortedBy { it.first }
        for ((label, pkg) in apps) {
            val c = CheckBox(this); c.text = label; c.isChecked = pkg in blocked
            boxes.add(Pair(c, pkg)); root.addView(c)
        }
        val presets = listOf(
            Triple("تحديد: التواصل الاجتماعي", "", setOf("com.instagram.android", "com.facebook.katana", "com.facebook.lite", "com.twitter.android", "com.snapchat.android", "com.zhiliaoapp.musically", "com.ss.android.ugc.trill", "com.reddit.frontpage", "com.pinterest", "com.tumblr", "com.linkedin.android", "org.telegram.messenger", "com.whatsapp", "com.discord", "com.threads")),
            Triple("تحديد: الفيديو والبث", "", setOf("com.google.android.youtube", "com.netflix.mediaclient", "tv.twitch.android.app", "com.amazon.avod.thirdpartyclient", "com.disney.disneyplus", "com.spotify.music", "com.google.android.apps.youtube.music")),
            Triple("تحديد: المتصفحات", "", setOf("com.android.chrome", "org.mozilla.firefox", "com.microsoft.emmx", "com.opera.browser", "com.brave.browser", "com.sec.android.app.sbrowser", "com.duckduckgo.mobile.android"))
        )
        for ((name, _, pk) in presets) root.addView(btn(name) {
            var n = 0; for ((c, pkg) in boxes) if (pkg in pk) { c.isChecked = true; n++ }
            Toast.makeText(this, "حُدّد $n تطبيقًا", Toast.LENGTH_SHORT).show()
        })
        root.addView(btn("حفظ") {
            Store.setMode(this, if (rg.checkedRadioButtonId == 2) "partner" else "self")
            Store.setSecret(this, secret.text.toString())
            Store.setBlockAll(this, all.isChecked)
            Store.setBlocked(this, boxes.filter { it.first.isChecked }.map { it.second }.toSet())
            Toast.makeText(this, "تم الحفظ", Toast.LENGTH_SHORT).show()
        })
        setContentView(sv)
    }
}
