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

        root.addView(text("٣) التطبيقات"))
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
