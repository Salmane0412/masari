package app.masari.lock

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/** يجعل التعرّف الصوتي الأصلي في أندرويد متاحًا لصفحة مساري (WebView لا يدعم SpeechRecognition). */
class SpeechBridge(private val act: MainActivity, private val web: WebView) {
    private var sr: SpeechRecognizer? = null
    private var active = false

    private fun emit(type: String, data: String = "", fin: Boolean = false) {
        val js = "window.__nsr_ev&&window.__nsr_ev('$type'," + JSONObject.quote(data) + ",$fin)"
        web.post { web.evaluateJavascript(js, null) }
    }

    private fun finish() { if (active) { active = false; emit("end") } }

    @JavascriptInterface fun start(lang: String) {
        act.runOnUiThread {
            if (act.hasMic()) begin(lang)
            else act.askMic { ok -> if (ok) begin(lang) else { active = true; emit("error", "not-allowed"); finish() } }
        }
    }

    private fun begin(lang: String) {
        sr?.destroy(); sr = null
        if (!SpeechRecognizer.isRecognitionAvailable(act)) { active = true; emit("error", "service-not-allowed"); finish(); return }
        active = true
        val r = SpeechRecognizer.createSpeechRecognizer(act); sr = r
        r.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(p: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onEvent(t: Int, p: Bundle?) {}
            override fun onPartialResults(b: Bundle?) {
                val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
                if (t.isNotBlank()) emit("result", t, false)
            }
            override fun onResults(b: Bundle?) {
                val t = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
                if (!t.isNullOrBlank()) emit("result", t, true)
                finish()
            }
            override fun onError(code: Int) {
                val e = when (code) {
                    SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed"
                    SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network"
                    SpeechRecognizer.ERROR_AUDIO -> "audio-capture"
                    else -> "aborted"
                }
                emit("error", e); finish()
            }
        })
        val i = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, act.packageName)
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
        r.startListening(i)
    }

    @JavascriptInterface fun stop() { act.runOnUiThread { try { sr?.stopListening() } catch (e: Exception) {} } }
    @JavascriptInterface fun abort() { act.runOnUiThread { try { sr?.cancel() } catch (e: Exception) {}; finish() } }
    fun release() { try { sr?.destroy() } catch (e: Exception) {}; sr = null }

    companion object {
        const val POLYFILL = """(function(){if(window.__nsrInit)return;window.__nsrInit=1;
function SR(){this.lang='ar-SA';this.continuous=false;this.interimResults=false;}
SR.prototype.start=function(){window.__nsr_cur=this;AndroidSpeech.start(this.lang);};
SR.prototype.stop=function(){AndroidSpeech.stop();};
SR.prototype.abort=function(){AndroidSpeech.abort();};
window.__nsr_ev=function(t,d,f){var r=window.__nsr_cur;if(!r)return;
if(t==='result'){if(r.onresult){var x={isFinal:!!f,length:1};x[0]={transcript:d};r.onresult({resultIndex:0,results:[x]});}}
else if(t==='error'){if(r.onerror)r.onerror({error:d});}
else if(t==='end'){if(r.onend)r.onend();}};
window.SpeechRecognition=SR;window.webkitSpeechRecognition=SR;window.__nativeApp=true;})();"""
    }
}
