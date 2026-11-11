package app.masari.lock

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class LockActivity : Activity() {
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        if (Build.VERSION.SDK_INT >= 27) setShowWhenLocked(true)
        val protect = intent.getBooleanExtra("protect", false)
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.setPadding(48, 120, 48, 48)
        root.setBackgroundColor(Color.parseColor("#0E1A24"))
        root.layoutDirection = View.LAYOUT_DIRECTION_RTL

        fun label(t: String, size: Float): TextView {
            val v = TextView(this); v.text = t; v.textSize = size
            v.setTextColor(Color.parseColor("#E6EFF0")); v.gravity = Gravity.CENTER; v.setPadding(0, 16, 0, 16)
            return v
        }
        fun button(t: String, click: () -> Unit): Button {
            val v = Button(this); v.text = t; v.setOnClickListener { click() }; return v
        }

        if (protect) {
            root.addView(label("🔒 حماية مساري", 26f))
            val req = Store.disableReq(this)
            if (req == 0L) {
                root.addView(label("هذه الشاشة قد تُستعمل لحذف مساري أو إيقاف حمايته. إن كنت متأكدًا فاطلب الإلغاء: ينتظر ٢٤ ساعة ثم تُفتح لك نافذة ٣٠ دقيقة.", 17f))
                root.addView(button("اطلب إلغاء الحماية") {
                    Store.setDisableReq(this, System.currentTimeMillis()); Events.add(this, "protect"); Partner.send(this, "طلب إلغاء الحماية", "طلب إلغاء حماية مساري (تُفتح بعد 24 ساعة).", "disable"); Toast.makeText(this, "سُجّل الطلب. عُد بعد ٢٤ ساعة.", Toast.LENGTH_LONG).show(); goHome()
                })
            } else {
                val h = Store.disableRemainingMs(this) / 3600_000L
                root.addView(label("طلبك قيد الانتظار: بقي حوالي $h ساعة. استفد من الوقت في حفظك.", 18f))
                root.addView(button("إلغاء الطلب") { Store.setDisableReq(this, 0L); goHome() })
            }
            root.addView(button("✍️ اكتب الرسالة الطويلة لإلغاء الحماية الآن") {
                startActivity(Intent(this, WhyActivity::class.java).putExtra(WhyActivity.KIND, WhyActivity.PROTECT)); finish() })
            root.addView(button("رجوع") { goHome() })
            setContentView(root); return
        }

        val reason = intent.getStringExtra("reason") ?: "until"
        if (reason == "banned") {
            root.addView(label("⛔ تطبيق محظور نهائيًا", 26f))
            root.addView(label("اخترتَ حظر هذا التطبيق بلا استثناء. وقتك أثمن منه.", 17f))
            root.addView(button("رجوع للشاشة الرئيسية") { goHome() })
            setContentView(root); return
        }
        if (reason == "budget") {
            root.addView(label("⏱ انتهى وقتك اليوم لهذا التطبيق", 24f))
            root.addView(label("استعمله على الحاسوب في وقته، أو اطلب من شريكك رمزًا ليمنحك 15 دقيقة.", 17f))
        } else {
            root.addView(label("📖 هذا التطبيق مقفل", 26f))
            root.addView(label("أنهِ مهام اليوم في مساري فيُفتح تلقائيًا، أو أدخل رمز اليوم أو رمز شريكك.", 17f))
        }
        val input = EditText(this)
        input.inputType = InputType.TYPE_CLASS_NUMBER; input.hint = "رمز من 6 أرقام"; input.textSize = 28f
        input.setTextColor(Color.WHITE); input.setHintTextColor(Color.GRAY); input.gravity = Gravity.CENTER
        root.addView(input)
        root.addView(button("فتح") {
            val wait = Store.lockedUntil(this) - System.currentTimeMillis()
            if (wait > 0) { Toast.makeText(this, "محاولات كثيرة. انتظر ${wait / 60000 + 1} دقيقة.", Toast.LENGTH_LONG).show(); return@button }
            val code = input.text.toString()
            if (reason == "budget") {
                if (Codes.verifyPartner(this, code)) {
                    val pkg = intent.getStringExtra("pkg") ?: ""
                    if (pkg.isNotEmpty()) Policy.addUsage(this, pkg, -15 * 60L)
                    Store.clearFails(this); Events.add(this, "extra_time"); Partner.send(this, "وقت إضافي", "منحتَه 15 دقيقة إضافية.", "extra")
                    Toast.makeText(this, "15 دقيقة إضافية", Toast.LENGTH_LONG).show(); finish()
                } else { Store.recordFail(this); input.setText(""); Toast.makeText(this, "رمز الشريك غير صحيح", Toast.LENGTH_SHORT).show() }
                return@button
            }
            if (Codes.verify(this, code)) {
                Store.clearFails(this); Store.setUnlocked(this)
                if (Codes.verifySelf(this, code)) Store.setDayDone(this) else Events.add(this, "partner_unlock")
                Toast.makeText(this, "فُتحت التطبيقات لهذا اليوم. بارك الله فيك.", Toast.LENGTH_LONG).show(); finish()
            } else { Store.recordFail(this); input.setText(""); Toast.makeText(this, "رمز خاطئ", Toast.LENGTH_SHORT).show() }
        })
        root.addView(button("افتح مساري لأنهي مهامي") { startActivity(Intent(this, MainActivity::class.java)); finish() })
        if (reason != "budget") root.addView(button("✍️ فتح بالكتابة (يُبلَّغ شريكك)") {
            startActivity(Intent(this, WhyActivity::class.java).putExtra(WhyActivity.KIND, WhyActivity.APP)); finish() })
        root.addView(button("رجوع للشاشة الرئيسية") { goHome() })
        setContentView(root)
    }

    private fun goHome() {
        val i = Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_HOME); i.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(i); finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { goHome() }
}
