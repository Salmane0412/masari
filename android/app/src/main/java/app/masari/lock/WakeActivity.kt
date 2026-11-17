package app.masari.lock

import android.app.Activity
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.util.Locale

/** Réveil Masari : la sonnerie ne s'arrête qu'après avoir écrit une phrase à la main (sans coller), puis voix « Bonjour <prénom> » + tâches du jour. */
class WakeActivity : Activity(), TextToSpeech.OnInitListener {
    private var ring: android.media.Ringtone? = null
    private var tts: TextToSpeech? = null
    private var greeting = ""
    private var last = ""

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        if (android.os.Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true) }
        else window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val cfg = try { JSONObject(getSharedPreferences("masari", MODE_PRIVATE).getString("wake", "{}")!!) } catch (e: Exception) { JSONObject() }
        val name = cfg.optString("name", "Salman")
        val tasks = cfg.optJSONArray("tasks")
        val list = (0 until (tasks?.length() ?: 0)).map { tasks!!.optString(it) }.filter { it.isNotBlank() }.take(8)
        greeting = "Bonjour $name." + if (list.isEmpty()) " Pas de tâche prévue aujourd'hui." else " Aujourd'hui : " + list.joinToString(". ")
        val phrases = cfg.optJSONArray("phrases")?.let { a -> (0 until a.length()).map { a.optString(it) }.filter { it.length >= 12 } } ?: emptyList()
        val target = (if (phrases.isEmpty()) DEFAULT_PHRASES else phrases).let { it[(System.currentTimeMillis() / 86_400_000L % it.size).toInt()] }

        try {
            ring = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)).also {
                if (android.os.Build.VERSION.SDK_INT >= 28) it.isLooping = true
                it.audioAttributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build(); it.play() }
        } catch (e: Exception) { }

        val col = LinearLayout(this); col.orientation = LinearLayout.VERTICAL
        col.setPadding(40, 100, 40, 40); col.setBackgroundColor(Color.parseColor("#0E1A24")); col.layoutDirection = View.LAYOUT_DIRECTION_RTL
        fun tv(t: String, s: Float) = TextView(this).apply { text = t; textSize = s; setTextColor(Color.parseColor("#E6EFF0")); setPadding(0, 12, 0, 12) }
        col.addView(tv("⏰ حان وقت الاستيقاظ", 24f))
        col.addView(tv("اكتب الجملة بيدك حرفًا بحرف لإيقاف المنبّه. اللصق ممنوع.", 15f))
        col.addView(tv(target, 19f).apply { setBackgroundColor(Color.parseColor("#16293a")); setPadding(24, 24, 24, 24) })
        val counter = tv("0 / ${norm(target).length}", 16f); col.addView(counter)
        val input = EditText(this)
        input.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        input.minLines = 3; input.textSize = 18f; input.setTextColor(Color.WHITE)
        input.isLongClickable = false; input.setTextIsSelectable(false)
        val deny = object : ActionMode.Callback {
            override fun onCreateActionMode(m: ActionMode?, menu: Menu?) = false
            override fun onPrepareActionMode(m: ActionMode?, menu: Menu?) = false
            override fun onActionItemClicked(m: ActionMode?, i: MenuItem?) = false
            override fun onDestroyActionMode(m: ActionMode?) {}
        }
        input.customSelectionActionModeCallback = deny
        if (android.os.Build.VERSION.SDK_INT >= 23) input.customInsertionActionModeCallback = deny
        input.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, st: Int, c: Int, a: Int) {}
            override fun onTextChanged(s: CharSequence?, st: Int, bf: Int, c: Int) {}
            override fun afterTextChanged(e: Editable?) {
                val t = e?.toString() ?: ""
                if (t.length - last.length > 3) { input.setText(last); input.setSelection(last.length)
                    Toast.makeText(this@WakeActivity, "اللصق ممنوع: اكتب بيدك.", Toast.LENGTH_SHORT).show(); return }
                last = t
                val typed = norm(t); val tn = norm(target)
                counter.text = if (tn.startsWith(typed)) "${typed.length} / ${tn.length}" else "❌ خطأ: صحّح آخر ما كتبت"
                if (typed == tn) done()
            }
        })
        col.addView(input); setContentView(col)
    }

    private fun done() {
        ring?.stop(); ring = null
        Events.add(this, "wake_ok")
        tts = TextToSpeech(this, this)
        findViewById<View>(android.R.id.content).let { (it as? android.view.ViewGroup)?.removeAllViews() }
        setContentView(TextView(this).apply { text = "☀️ صباح الخير"; textSize = 26f; setTextColor(Color.WHITE); setBackgroundColor(Color.parseColor("#0E1A24")); setPadding(40, 200, 40, 40) })
    }

    override fun onInit(st: Int) {
        if (st != TextToSpeech.SUCCESS) return
        tts?.language = Locale.FRENCH
        tts?.setOnUtteranceProgressListener(object : android.speech.tts.UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onError(id: String?) { runOnUiThread { finishAndRemoveTask() } }
            override fun onDone(id: String?) { runOnUiThread { finishAndRemoveTask() } }
        })
        tts?.speak(greeting, TextToSpeech.QUEUE_FLUSH, null, "wake")
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* le retour ne coupe pas la sonnerie */ }
    override fun onDestroy() { ring?.stop(); tts?.shutdown(); super.onDestroy() }

    private fun norm(t: String) = t.replace(Regex("[\\u064B-\\u065F\\u0670\\u0640]"), "").replace(Regex("\\s+"), " ").trim()
    companion object {
        val DEFAULT_PHRASES = listOf(
            "أستيقظ الآن لأنني أريد أن أبدأ يومي بالصلاة والعمل النافع",
            "ربّ اجعلني مقيم الصلاة ومن ذريتي وتقبّل دعاء",
            "من جدّ وجد ومن زرع حصد فأنهض الآن ولا أؤجّل")
    }
}
