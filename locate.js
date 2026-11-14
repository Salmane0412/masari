/* تحديد موضع القارئ في المصحف كله من كلماته المسموعة (دون أن يختار السورة أو الآية).
   النص فقط: فهرس هيكلي للحروف (يتسامح مع أخطاء التعرّف الصوتي) + تصويت على الإزاحة في سلسلة كلمات القرآن. البسملة لا تُعدّ موضعًا. */
(function (root) {
  const normAr = t => t.replace(/[ـً-ٰٟۖ-ۭ࣓-ࣿ]/g, '').replace(/[ٱآأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const clean = t => normAr(t).replace(/[^ء-ي]/g, '');
  // هيكل الكلمة: توحيد الحروف المتشابهة صوتيًا وحذف حروف المدّ فلا يضرّ إسقاطها أو إبدالها
  const skel = w => w.replace(/[ؤئء]/g, 'ا').replace(/ذ/g, 'ز').replace(/ث/g, 'س').replace(/ظ/g, 'ض').replace(/ط/g, 'ت').replace(/ص/g, 'س').replace(/ق/g, 'ك').replace(/ح/g, 'ه').replace(/ع/g, 'ا').replace(/[اوي]/g, '');
  let W = null, A = null, IDX = null;       // W: هياكل الكلمات، A: رقم الآية العام لكل كلمة
  function build(ayas) {
    W = []; A = []; IDX = new Map();
    ayas.forEach((a, g) => {
      let ws = a[2].split(' ').filter(Boolean);
      if (a[1] === 1 && a[0] !== 1 && a[0] !== 9) ws = ws.slice(4);
      ws.forEach(w => { const c = clean(w); if (!c) return; const s = skel(c) || c; W.push(s); A.push(g); });
    });
    W.forEach((s, i) => { let l = IDX.get(s); if (!l) IDX.set(s, l = []); l.push(i); });
  }
  const isBism = ws => ws.length >= 2 && /^(بسم|بسمه)$/.test(skel(ws[0]) === 'بسم' ? 'بسم' : ws[0]);
  function find(heardRaw, opt) {
    if (!W) return null; opt = opt || {};
    let h = heardRaw.map(clean).filter(Boolean);
    // أسقِط البسملة والاستعاذة من أول المسموع: لا تدلّ على موضع
    const B = ['بسم', 'الله', 'الرحمن', 'الرحيم'].map(skel); let i = 0; while (i < h.length && i < 4 && skel(h[i]) === B[i]) i++;
    if (i === 0) { const t = ['اعوذ', 'بالله', 'من', 'الشيطان', 'الرجيم']; if (/^(اعوذ|عوذ)/.test(h[0] || '')) { i = 1; while (i < h.length && i < 5 && /^(بالله|من|الشيطان|الرجيم|الشيتان)$/.test(h[i])) i++; } }
    h = h.slice(i);
    const q = h.map(x => skel(x) || x);
    if (q.length < 3) return { pending: true, reason: 'قليل من الكلمات (بسملة أو بداية)' };
    const votes = new Map(); let used = 0;
    q.forEach((s, k) => { const l = IDX.get(s); if (!l || l.length > 350) return; used++; const wgt = 1 / Math.sqrt(l.length); l.forEach(p => { const o = p - k; votes.set(o, (votes.get(o) || 0) + wgt); }); });
    if (!used) return null;
    let best = -1, bs = 0, second = 0, so = 0;
    const sc = o => (votes.get(o - 2) || 0) + (votes.get(o - 1) || 0) + (votes.get(o) || 0) + (votes.get(o + 1) || 0) + (votes.get(o + 2) || 0);
    const seen = new Set();
    for (const [o] of votes) { const b = Math.round(o / 3); if (seen.has(b)) continue; seen.add(b); const s = sc(o); if (s > bs) { second = bs; so = best; bs = s; best = o; } else if (s > second && Math.abs(o - best) > 6) { second = s; so = o; } }
    const conf = bs / q.length; /* ثقة نسبية */
    if (best < -2) return null;
    const pos = Math.min(Math.max(best + q.length, 0), W.length - 1);   // موضع آخر كلمة مسموعة
    const pos0 = Math.min(Math.max(best, 0), W.length - 1);
    return { pos, ayah: A[pos], ayah0: A[pos0], conf, ambiguous: second >= bs * 0.85, second: so, used: q.length };
  }
  const api = { build, find, skel, clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QLOC = api;
})(typeof window !== 'undefined' ? window : globalThis);
