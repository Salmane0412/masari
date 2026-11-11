package app.masari.lock

import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.*

/** Même calcul que prayer.js (site) pour programmer le adhan même quand l'app est fermée. */
object Prayer {
    data class Method(val fajr: Double, val isha: Double, val ishaMin: Int = 0)
    val METHODS = mapOf(
        "MWL" to Method(18.0, 17.0), "UOIF" to Method(12.0, 12.0), "F15" to Method(15.0, 15.0), "PARIS" to Method(18.0, 17.0),
        "UQ" to Method(18.5, 0.0, 90), "EG" to Method(19.5, 17.5), "MA" to Method(19.0, 17.0), "ISNA" to Method(15.0, 15.0)
    )
    val NAMES = mapOf("fajr" to "الفجر", "dhuhr" to "الظهر", "asr" to "العصر", "maghrib" to "المغرب", "isha" to "العشاء")
    private fun d2r(d: Double) = d * PI / 180; private fun r2d(r: Double) = r * 180 / PI
    private fun dsin(d: Double) = sin(d2r(d)); private fun dcos(d: Double) = cos(d2r(d)); private fun dtan(d: Double) = tan(d2r(d))
    private fun fix(a: Double, b: Double): Double { val x = a - b * floor(a / b); return if (x < 0) x + b else x }
    private fun julian(y0: Int, m0: Int, d: Int): Double { var y = y0; var m = m0; if (m <= 2) { y -= 1; m += 12 }; val a = floor(y / 100.0); val b = 2 - a + floor(a / 4); return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + d + b - 1524.5 }
    private fun sun(jd: Double): Pair<Double, Double> {
        val dd = jd - 2451545.0; val g = fix(357.529 + 0.98560028 * dd, 360.0); val q = fix(280.459 + 0.98564736 * dd, 360.0)
        val l = fix(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g), 360.0); val e = 23.439 - 0.00000036 * dd
        val ra = r2d(atan2(dcos(e) * dsin(l), dcos(l))) / 15
        return Pair(r2d(asin(dsin(e) * dsin(l))), q / 15 - fix(ra, 24.0))
    }

    /** Heures (minutes depuis minuit, heure locale) des 5 prières pour une date. */
    fun times(date: LocalDate, lat: Double, lng: Double, method: String, asrF: Int): Map<String, Int> {
        val m = METHODS[method] ?: METHODS["MWL"]!!
        val jd = julian(date.year, date.monthValue, date.dayOfMonth) - lng / (15 * 24)
        fun mid(t: Double) = fix(12 - sun(jd + t).second, 24.0)
        fun angleT(a: Double, t: Double, ccw: Boolean): Double { val dec = sun(jd + t).first; val x = (-dsin(a) - dsin(dec) * dsin(lat)) / (dcos(dec) * dcos(lat)); val h = r2d(acos(x)) / 15; return mid(t) + if (ccw) -h else h }
        fun asrT(f: Int, t: Double): Double { val dec = sun(jd + t).first; return angleT(-r2d(atan(1 / (f + dtan(abs(lat - dec))))), t, false) }
        var fajr = 5.0; var rise = 6.0; var dhuhr = 12.0; var asr = 13.0; var set = 18.0; var isha = 18.0
        repeat(2) {
            fajr = angleT(m.fajr, fajr / 24, true); rise = angleT(0.833, rise / 24, true); dhuhr = mid(dhuhr / 24); asr = asrT(asrF, asr / 24)
            set = angleT(0.833, set / 24, false); isha = if (m.ishaMin > 0) 0.0 else angleT(m.isha, isha / 24, false)
        }
        val night = 24 - (set - rise)
        if (fajr.isNaN() || rise - fajr > night * m.fajr / 60) fajr = rise - night * m.fajr / 60
        if (m.ishaMin > 0) isha = set + m.ishaMin / 60.0 else if (isha.isNaN() || isha - set > night * m.isha / 60) isha = set + night * m.isha / 60
        val tz = ZoneId.systemDefault().rules.getOffset(date.atTime(12, 0)).totalSeconds / 3600.0
        val adj = tz - lng / 15
        fun mn(h: Double) = (fix(h + adj, 24.0) * 60 + 0.5).toInt()
        return mapOf("fajr" to mn(fajr), "dhuhr" to mn(dhuhr + 1.0 / 60), "asr" to mn(asr), "maghrib" to mn(set), "isha" to mn(isha))
    }
}
