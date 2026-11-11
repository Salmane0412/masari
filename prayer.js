/* مساري — حساب مواقيت الصلاة محليًا (خوارزمية فلكية معروفة، مثل PrayTimes)، بلا إنترنت ولا مكتبات */
(function (root) {
  'use strict';
  const dtr = d => d * Math.PI / 180, rtd = r => r * 180 / Math.PI;
  const sin = d => Math.sin(dtr(d)), cos = d => Math.cos(dtr(d)), tan = d => Math.tan(dtr(d));
  const asin = x => rtd(Math.asin(x)), acos = x => rtd(Math.acos(x)), atan2 = (y, x) => rtd(Math.atan2(y, x)), acot = x => rtd(Math.atan(1 / x));
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const fixA = a => fix(a, 360), fixH = a => fix(a, 24);

  // الطرق: زاوية الفجر، والعشاء زاوية أو دقائق بعد المغرب
  const METHODS = {
    MWL: { name: 'رابطة العالم الإسلامي (18° / 17°)', fajr: 18, isha: 17 },
    UOIF: { name: 'اتحاد المنظمات الإسلامية في فرنسا (12° / 12°)', fajr: 12, isha: 12 },
    F15: { name: 'فرنسا 15° / 15°', fajr: 15, isha: 15 },
    PARIS: { name: 'مسجد باريس الكبير (18° / 17°)', fajr: 18, isha: 17 },
    UQ: { name: 'أم القرى (18.5° / 90 دقيقة)', fajr: 18.5, ishaMin: 90 },
    EG: { name: 'الهيئة المصرية (19.5° / 17.5°)', fajr: 19.5, isha: 17.5 },
    MA: { name: 'وزارة الأوقاف المغربية (19° / 17°)', fajr: 19, isha: 17 },
    ISNA: { name: 'أمريكا الشمالية ISNA (15° / 15°)', fajr: 15, isha: 15 },
  };
  const NAMES = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

  function julian(y, m, d) { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
  function sunPos(jd) {
    const D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
    const L = fixA(q + 1.915 * sin(g) + 0.020 * sin(2 * g)), e = 23.439 - 0.00000036 * D;
    const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fixH(RA) };
  }

  /* opts: { lat, lng, method, asr: 1|2 (شافعي/حنفي), tz (ساعات), elev } → أوقات بالساعات العشرية المحلية */
  function times(y, m, d, o) {
    const M = METHODS[o.method] || METHODS.MWL, lat = o.lat, jd = julian(y, m, d) - o.lng / (15 * 24);
    const mid = t => fixH(12 - sunPos(jd + t).eqt);
    const angleT = (a, t, ccw) => { const dec = sunPos(jd + t).decl, n = mid(t); const x = (-sin(a) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat)); const h = acos(x) / 15; return n + (ccw ? -h : h); };
    const asrT = (f, t) => { const dec = sunPos(jd + t).decl; return angleT(-acot(f + tan(Math.abs(lat - dec))), t); };
    const rise = 0.833 + 0.0347 * Math.sqrt(o.elev || 0);
    let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (let i = 0; i < 2; i++) {
      const p = k => T[k] / 24;
      T = { fajr: angleT(M.fajr, p('fajr'), true), sunrise: angleT(rise, p('sunrise'), true), dhuhr: mid(p('dhuhr')), asr: asrT(o.asr || 1, p('asr')),
        sunset: angleT(rise, p('sunset')), isha: M.ishaMin ? 0 : angleT(M.isha, p('isha')) };
    }
    // خطوط العرض العليا: إن تعذّر الحساب أو تجاوز حدّه، يؤخذ جزء من الليل بنسبة الزاوية (angle-based)
    const night = 24 - (T.sunset - T.sunrise);
    const fajrMax = night * M.fajr / 60;
    if (isNaN(T.fajr) || T.sunrise - T.fajr > fajrMax) T.fajr = T.sunrise - fajrMax;
    if (M.ishaMin) T.isha = T.sunset + M.ishaMin / 60;
    else { const ishaMax = night * M.isha / 60; if (isNaN(T.isha) || T.isha - T.sunset > ishaMax) T.isha = T.sunset + ishaMax; }
    const adj = o.tz - o.lng / 15, out = {};
    for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'isha']) out[k] = T[k] + adj;
    out.maghrib = T.sunset + adj;
    out.dhuhr += 1 / 60; // دقيقة احتياط بعد الزوال
    return out;
  }
  const hm = h => { h = fixH(h + 0.5 / 60); const H = Math.floor(h), Mi = Math.floor((h - H) * 60); return String(H).padStart(2, '0') + ':' + String(Mi).padStart(2, '0'); };
  function day(dateStr, o) {
    const [y, m, d] = dateStr.split('-').map(Number), tz = o.tz !== undefined ? o.tz : -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
    const t = times(y, m, d, { ...o, tz }), out = {};
    for (const k of Object.keys(NAMES)) out[k] = hm(t[k]);
    // منتصف الليل (بين المغرب والفجر) والثلث الأخير
    const nightLen = 24 - t.maghrib + t.fajr;
    out.midnight = hm(t.maghrib + nightLen / 2); out.lastThird = hm(t.maghrib + nightLen * 2 / 3);
    return out;
  }
  // اتجاه القبلة بالدرجات من الشمال
  const qibla = (lat, lng) => fixA(atan2(sin(39.8262 - lng), cos(lat) * tan(21.4225) - sin(lat) * cos(39.8262 - lng)));

  const api = { METHODS, NAMES, times, day, qibla, hm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PRAYER = api;
})(typeof window !== 'undefined' ? window : globalThis);
