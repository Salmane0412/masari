package app.masari.lock

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.ActionMode
import android.view.Gravity
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/** Déblocage « par l'effort »: écrire à la main (sans coller) pourquoi tu as lancé ce projet. */
class WhyActivity : Activity() {
    companion object { const val KIND = "kind"; const val APP = "app"; const val PROTECT = "protect"
}

    private var last = ""
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val kind = intent.getStringExtra(KIND) ?: APP
        val col = LinearLayout(this); col.orientation = LinearLayout.VERTICAL
        col.setPadding(40, 100, 40, 40); col.setBackgroundColor(Color.parseColor("#0E1A24"))
        col.layoutDirection = View.LAYOUT_DIRECTION_RTL

        fun tv(t: String, s: Float): TextView { val v = TextView(this); v.text = t; v.textSize = s
            v.setTextColor(Color.parseColor("#E6EFF0")); v.setPadding(0, 12, 0, 12); return v }

        col.addView(tv(if (kind == PROTECT) "✍️ انسخ بيدك هذه الرسالة لإلغاء الحماية" else "✍️ انسخ بيدك هذه الرسالة لفتح التطبيقات", 22f))
        col.addView(tv("اقرأ ثم اكتب النص نفسه حرفًا بحرف. اللصق ممنوع، وأي خطأ يوقف التقدّم حتى تصحّحه.", 15f))
        val target = if (kind == PROTECT) MANIFESTO + " " + MANIFESTO_LONG else MANIFESTO
        val shown = tv(target, 17f); shown.setBackgroundColor(Color.parseColor("#16293a")); shown.setPadding(24, 24, 24, 24)
        col.addView(shown)
        val need = norm(target).length
        val counter = tv("0 / $need", 16f)
        val input = EditText(this)
        input.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        input.minLines = 8; input.gravity = Gravity.TOP or Gravity.START; input.textSize = 17f
        input.setTextColor(Color.WHITE); input.setHintTextColor(Color.GRAY); input.hint = "اكتب الرسالة هنا…"
        input.isLongClickable = false; input.setTextIsSelectable(false)
        val deny = object : ActionMode.Callback {
            override fun onCreateActionMode(m: ActionMode?, menu: Menu?) = false
            override fun onPrepareActionMode(m: ActionMode?, menu: Menu?) = false
            override fun onActionItemClicked(m: ActionMode?, i: MenuItem?) = false
            override fun onDestroyActionMode(m: ActionMode?) {}
        }
        input.customSelectionActionModeCallback = deny
        if (android.os.Build.VERSION.SDK_INT >= 23) input.customInsertionActionModeCallback = deny
        val ok = Button(this); ok.text = "تأكيد"; ok.isEnabled = false

        input.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, bf: Int, c: Int) {}
            override fun afterTextChanged(e: Editable?) {
                val t = e?.toString() ?: ""
                if (t.length - last.length > 12) { // لصق أو إدراج كتلة
                    input.setText(last); input.setSelection(last.length)
                    Toast.makeText(this@WhyActivity, "اللصق ممنوع: اكتب بيدك.", Toast.LENGTH_SHORT).show(); return
                }
                last = t
                val typed = norm(t); val tn = norm(target)
                val good = tn.startsWith(typed)
                counter.text = if (good) "${typed.length} / $need" else "❌ خطأ: صحّح آخر ما كتبت (${typed.length} / $need)"
                ok.isEnabled = good && typed.length == tn.length
            }
        })
        ok.setOnClickListener {
            if (norm(last) != norm(target)) return@setOnClickListener
            Events.add(this, "long_text")
            Partner.send(this, if (kind == PROTECT) "فتح الحماية بالرسالة الطويلة" else "فتح التطبيقات بالرسالة الطويلة", "كتب الرسالة الطويلة ففُتحت 30 دقيقة.", "long_text")
            if (kind == PROTECT) { Store.setDisableReq(this, System.currentTimeMillis() - 24L * 3600_000L)
                Toast.makeText(this, "فُتحت نافذة ٣٠ دقيقة لتعديل مساري.", Toast.LENGTH_LONG).show()
            } else { Store.setEmergency(this)
                Toast.makeText(this, "فُتحت التطبيقات ٣٠ دقيقة.", Toast.LENGTH_LONG).show() }
            finish()
        }
        col.addView(counter); col.addView(input); col.addView(ok)
        val back = Button(this); back.text = "رجوع"; back.setOnClickListener { finish() }; col.addView(back)
        val sv = ScrollView(this); sv.addView(col); setContentView(sv)
    }

    /** توحيد الكتابة: بلا تشكيل ولا اختلاف في الهمزات ولا في المسافات. */
    private fun norm(t: String): String = t.replace(Regex("[\\u064B-\\u065F\\u0670\\u0640]"), "")
        .replace(Regex("[أإآٱ]"), "ا").replace('ى', 'ي').replace('ة', 'ه').replace(Regex("[\\s\\p{Punct}،؛؟…«»]+"), " ").trim()

    private val MANIFESTO = "لقد اخترت أن آخذ نفسي بيدي، وأن أترك ما يضرّني من العادات والإدمانات، وأن أعيش حياة إنسان حقيقي لا تقوده شهواته. غايتي الكبرى أن أكون عبدًا صالحًا وعالمًا، وأن أغيّر في العالم ما استطعتُ، وأن أبلغ أعلى درجات الجنة بإذن الله. وإن لم ألتزم بهذا فقد أصل إلى آخر عمري ولم أفعل شيئًا."
    private val MANIFESTO_LONG = "أنا متأخّر أصلًا في طلب العلم وفي حفظ القرآن، وعندي مشكلات وعادات سيّئة يجب أن أعالجها. إن لم أركّز وأعالجها فستضرّني في صحتي ووزني ورياضتي وفي ديني ودنياي. أعلم أن الطريق ليس سهلًا وقد أتعثّر وأسقط، لكنني لن أتوقف. فليس في الحياة فرصة ثانية، وإن لم أعمل على هذه الفرصة فقد ضاعت. فلأكن صادقًا مع نفسي ومع ربي، ولأواصل."
}
