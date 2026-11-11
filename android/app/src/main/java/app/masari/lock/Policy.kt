package app.masari.lock

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate

/**
 * Règles de blocage. Principe: tout ce qui RENFORCE s'applique tout de suite;
 * tout ce qui ASSOUPLIT attend 24 h (ou le code du partenaire, ou la fenêtre d'installation),
 * et le partenaire est prévenu.
 */
data class Cfg(
    val banned: Set<String> = emptySet(),        // bannies à vie (+ Play Store)
    val bannedNames: Set<String> = emptySet(),   // noms à refuser dans le Play Store
    val until: Set<String> = emptySet(),         // bloquées jusqu'à la fin des tâches du jour
    val allowed: Set<String> = emptySet(),       // toujours autorisées
    val blockAll: Boolean = false,
    val budgets: Map<String, Int> = emptyMap(),  // minutes par jour (ex. Telegram 20)
    val waFilter: Boolean = false,               // filtrer les notifications WhatsApp
    val waAllow: Set<String> = emptySet(),       // noms dont les notifications passent
    val webBlock: Boolean = false,
    val domains: Set<String> = emptySet()
)

object Policy {
    private fun p(c: Context) = c.getSharedPreferences("masari", Context.MODE_PRIVATE)
    private fun set(a: JSONArray?): Set<String> { val s = HashSet<String>(); if (a != null) for (i in 0 until a.length()) { val v = a.optString(i).trim(); if (v.isNotEmpty()) s.add(v) }; return s }

    fun fromJson(o: JSONObject): Cfg {
        val b = HashMap<String, Int>(); val bo = o.optJSONObject("budgets")
        if (bo != null) for (k in bo.keys()) { val v = bo.optInt(k, -1); if (v >= 0) b[k] = v }
        return Cfg(set(o.optJSONArray("banned")), set(o.optJSONArray("bannedNames")), set(o.optJSONArray("until")), set(o.optJSONArray("allowed")),
            o.optBoolean("blockAll"), b, o.optBoolean("waFilter"), set(o.optJSONArray("waAllow")), o.optBoolean("webBlock"),
            set(o.optJSONArray("domains")).map { it.lowercase().removePrefix("www.") }.filter { it.contains('.') }.toSet())
    }
    fun toJson(c: Cfg): JSONObject = JSONObject()
        .put("banned", JSONArray(c.banned.toList())).put("bannedNames", JSONArray(c.bannedNames.toList()))
        .put("until", JSONArray(c.until.toList())).put("allowed", JSONArray(c.allowed.toList())).put("blockAll", c.blockAll)
        .put("budgets", JSONObject(c.budgets as Map<*, *>)).put("waFilter", c.waFilter).put("waAllow", JSONArray(c.waAllow.toList()))
        .put("webBlock", c.webBlock).put("domains", JSONArray(c.domains.toList()))

    /** Configuration en vigueur (reprend les anciens réglages de la v1 au premier lancement). */
    fun current(c: Context): Cfg {
        val s = p(c).getString("cfg", null)
        if (s != null) return try { fromJson(JSONObject(s)) } catch (e: Exception) { Cfg() }
        return Cfg(until = Store.blocked(c), allowed = Store.allowed(c), blockAll = Store.blockAll(c), webBlock = Store.webBlock(c), domains = Store.domains(c))
    }
    private fun save(c: Context, cfg: Cfg) {
        p(c).edit().putString("cfg", toJson(cfg).toString()).apply()
        Store.setBlocked(c, cfg.until); Store.setAllowed(c, cfg.allowed); Store.setBlockAll(c, cfg.blockAll)
        Store.setWebBlock(c, cfg.webBlock); Store.setDomains(c, cfg.domains.joinToString("\n"))
    }

    /** La version la plus stricte des deux : ce qui peut s'appliquer sans délai. */
    fun strengthen(cur: Cfg, nw: Cfg): Cfg {
        val budgets = HashMap<String, Int>()
        for (k in cur.budgets.keys + nw.budgets.keys) {
            val a = cur.budgets[k]; val b = nw.budgets[k]
            budgets[k] = if (a == null) b!! else if (b == null) a else minOf(a, b)
        }
        val waAllow = if (!cur.waFilter) nw.waAllow else cur.waAllow intersect nw.waAllow
        return Cfg(cur.banned union nw.banned, cur.bannedNames union nw.bannedNames, cur.until union nw.until, cur.allowed intersect nw.allowed,
            cur.blockAll || nw.blockAll, budgets, cur.waFilter || nw.waFilter, waAllow, cur.webBlock || nw.webBlock, cur.domains union nw.domains)
    }

    /** Retourne "applied", "pending" ou "bad-code". */
    fun request(c: Context, nw: Cfg, partnerCode: String?): String {
        val cur = current(c)
        val strong = strengthen(cur, nw)
        val free = Store.setupWindow(c) || Store.disableAllowed(c)
        if (strong == nw || free) { save(c, nw); p(c).edit().remove("pending").apply(); return "applied" }
        if (!partnerCode.isNullOrBlank()) {
            if (Codes.verifyPartner(c, partnerCode)) { save(c, nw); p(c).edit().remove("pending").apply(); Partner.send(c, "تخفيف القيود", "أُدخل رمزك لتخفيف قواعد الحجب.", "partner-ok"); return "applied" }
            return "bad-code"
        }
        save(c, strong)
        val at = System.currentTimeMillis() + 24L * 3600_000L
        p(c).edit().putString("pending", JSONObject().put("cfg", toJson(nw)).put("at", at).toString()).apply()
        Partner.send(c, "طلب تخفيف القيود", "طلب تخفيف قواعد الحجب، يُطبَّق بعد 24 ساعة إن لم يُلغَ.", "weaken")
        Events.add(c, "weaken")
        return "pending"
    }
    fun pendingAt(c: Context): Long = try { JSONObject(p(c).getString("pending", "{}")!!).optLong("at", 0L) } catch (e: Exception) { 0L }
    fun cancelPending(c: Context) { p(c).edit().remove("pending").apply() }
    fun checkPending(c: Context) {
        val s = p(c).getString("pending", null) ?: return
        try { val o = JSONObject(s); if (System.currentTimeMillis() >= o.optLong("at")) { save(c, fromJson(o.getJSONObject("cfg"))); p(c).edit().remove("pending").apply() } } catch (e: Exception) { p(c).edit().remove("pending").apply() }
    }

    /* ---------- budget de temps par application ---------- */
    private fun ukey() = "usage_" + LocalDate.now()
    fun usedSec(c: Context, pkg: String): Long = try { JSONObject(p(c).getString(ukey(), "{}")!!).optLong(pkg, 0L) } catch (e: Exception) { 0L }
    fun addUsage(c: Context, pkg: String, sec: Long) {
        if (sec == 0L) return
        val o = try { JSONObject(p(c).getString(ukey(), "{}")!!) } catch (e: Exception) { JSONObject() }
        o.put(pkg, o.optLong(pkg, 0L) + sec)
        p(c).edit().putString(ukey(), o.toString()).apply()
    }
    fun usageToday(c: Context): JSONObject = try { JSONObject(p(c).getString(ukey(), "{}")!!) } catch (e: Exception) { JSONObject() }
}

/** Journal du jour (pour le rapport au partenaire). */
object Events {
    private fun p(c: Context) = c.getSharedPreferences("masari", Context.MODE_PRIVATE)
    private fun key() = "ev_" + LocalDate.now()
    fun add(c: Context, what: String) {
        val o = today(c); o.put(what, o.optInt(what, 0) + 1)
        p(c).edit().putString(key(), o.toString()).apply()
    }
    fun today(c: Context): JSONObject = try { JSONObject(p(c).getString(key(), "{}")!!) } catch (e: Exception) { JSONObject() }
}
