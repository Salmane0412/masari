/* مساري — المال: منطق الحسابات والميزانية والزكاة (بلا واجهة، قابل للاختبار في Node) */
(function (root) {
  'use strict';
  const r2 = x => Math.round((+x || 0) * 100) / 100;
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
  let seq = 0;
  const uid = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5);

  const OUT_CATS = ['السكن', 'الفواتير', 'الطعام', 'المواصلات', 'الصحة', 'الاتصالات والاشتراكات', 'العلم والكتب', 'الملابس', 'البيت', 'العائلة', 'الصدقة', 'الزكاة', 'السفر والعمرة', 'الترفيه', 'أخرى'];
  const IN_CATS = ['الراتب', 'مكافأة', 'استرداد', 'هدية', 'أخرى'];
  const ACC_T = { cash: 'نقد', bank: 'حساب جارٍ', save: 'ادخار', invest: 'استثمار', other: 'أخرى (لا زكاة)' };
  const NISAB_GOLD_G = 85, NISAB_SILVER_G = 595, RATE = 0.025;

  function blank() {
    return { cur: 'EUR', accounts: [], tx: [], cats: { out: OUT_CATS.slice(), in: IN_CATS.slice() }, budget: {}, recur: [], goals: [], debts: [], rules: [],
      zakat: { base: '', gold: 0, silver: 0, goldG: 0, goldK: 24, silverG: 0, extra: [], deductDebts: true, hawlStart: '', paid: [] } };
  }
  function ensure(F) {
    const b = blank(); F = F || b;
    for (const k of Object.keys(b)) if (F[k] === undefined) F[k] = b[k];
    for (const k of Object.keys(b.zakat)) if (F.zakat[k] === undefined) F.zakat[k] = b.zakat[k];
    F.cats.out = F.cats.out || OUT_CATS.slice(); F.cats.in = F.cats.in || IN_CATS.slice();
    return F;
  }

  /* ---------- الحسابات ---------- */
  function balances(F) {
    const b = {}; F.accounts.forEach(a => { b[a.id] = r2(a.bal0); });
    F.tx.forEach(t => {
      if (t.kind === 'in' && b[t.acc] !== undefined) b[t.acc] = r2(b[t.acc] + t.amt);
      else if (t.kind === 'out' && b[t.acc] !== undefined) b[t.acc] = r2(b[t.acc] - t.amt);
      else if (t.kind === 'move') { if (b[t.acc] !== undefined) b[t.acc] = r2(b[t.acc] - t.amt); if (b[t.to] !== undefined) b[t.to] = r2(b[t.to] + t.amt); }
    });
    return b;
  }
  const total = F => { const b = balances(F); return r2(Object.values(b).reduce((s, x) => s + x, 0)); };
  function addTx(F, o) {
    const t = { id: uid(), d: o.d, kind: o.kind || 'out', amt: r2(Math.abs(o.amt)), cat: o.cat || '', acc: o.acc || '', to: o.to || '', note: o.note || '', src: o.src || '' };
    if (!(t.amt > 0)) throw new Error('المبلغ غير صالح');
    F.tx.push(t); F.tx.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0); return t;
  }

  /* ---------- الشهر والميزانية ---------- */
  function month(F, ym) {
    const out = { inc: 0, out: 0, byCat: {}, inCat: {}, n: 0 };
    F.tx.forEach(t => {
      if (t.d.slice(0, 7) !== ym) return;
      if (t.kind === 'in') { out.inc = r2(out.inc + t.amt); out.inCat[t.cat] = r2((out.inCat[t.cat] || 0) + t.amt); out.n++; }
      else if (t.kind === 'out') { out.out = r2(out.out + t.amt); out.byCat[t.cat] = r2((out.byCat[t.cat] || 0) + t.amt); out.n++; }
    });
    out.net = r2(out.inc - out.out); out.save = out.inc > 0 ? Math.round(out.net / out.inc * 100) : null;
    return out;
  }
  function budget(F, ym) {
    const m = month(F, ym), cats = new Set([...Object.keys(F.budget), ...Object.keys(m.byCat)]);
    return [...cats].map(c => { const lim = r2(F.budget[c] || 0), sp = m.byCat[c] || 0; return { cat: c, lim, spent: sp, left: r2(lim - sp), pct: lim ? Math.round(sp / lim * 100) : null }; })
      .sort((a, b) => (b.lim ? 1 : 0) - (a.lim ? 1 : 0) || b.spent - a.spent);
  }
  // توقع آخر الشهر بالمعدّل اليومي للمصاريف المتغيرة (بدون المتكررة)
  function forecast(F, t) {
    const ym = t.slice(0, 7), day = +t.slice(8), dim = new Date(+t.slice(0, 4), +t.slice(5, 7), 0).getDate();
    const m = month(F, ym), fixed = F.tx.filter(x => x.d.slice(0, 7) === ym && x.kind === 'out' && x.src === 'recur').reduce((s, x) => s + x.amt, 0);
    const pending = F.recur.filter(r => r.on !== false && r.kind !== 'in' && r.next.slice(0, 7) === ym && r.next > t).reduce((s, r) => s + r.amt, 0);
    const variable = m.out - fixed;
    return { out: r2(m.out + variable / day * (dim - day) + pending), pending: r2(pending), dim, day };
  }

  /* ---------- المتكرر ---------- */
  function advance(s, f) {
    const d = parseD(s);
    if (f === 'w') d.setDate(d.getDate() + 7);
    else if (f === 'y') d.setFullYear(d.getFullYear() + 1);
    else { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
    return ymd(d);
  }
  function upcoming(F, t, days) {
    const lim = addDays(t, days || 30), out = [];
    F.recur.filter(r => r.on !== false).forEach(r => { let n = r.next, k = 0; while (n <= lim && k++ < 60) { out.push({ r, d: n, late: n < t }); n = advance(n, r.freq); } });
    return out.sort((a, b) => a.d < b.d ? -1 : 1);
  }
  function payRecur(F, id, d) {
    const r = F.recur.find(x => x.id === id); if (!r) return null;
    const t = addTx(F, { d: d || r.next, kind: r.kind || 'out', amt: r.amt, cat: r.cat, acc: r.acc, note: r.name, src: 'recur' });
    r.next = advance(r.next, r.freq); return t;
  }
  const skipRecur = (F, id) => { const r = F.recur.find(x => x.id === id); if (r) r.next = advance(r.next, r.freq); };

  /* ---------- الديون والأهداف ---------- */
  const debtLeft = d => r2(d.amt - (d.paid || []).reduce((s, p) => s + p.amt, 0));
  const debtsTotal = (F, dir) => r2(F.debts.filter(d => d.dir === dir).reduce((s, d) => s + Math.max(0, debtLeft(d)), 0));
  function goalSaved(F, g) { if (g.acc) { const b = balances(F)[g.acc]; return r2(b === undefined ? 0 : b); } return r2(g.saved || 0); }
  function goalPlan(F, g, t) {
    const saved = goalSaved(F, g), left = r2(Math.max(0, g.target - saved));
    const months = g.due ? Math.max(1, Math.ceil(diffDays(t, g.due) / 30.44)) : null;
    return { saved, left, pct: g.target ? Math.min(100, Math.round(saved / g.target * 100)) : 0, perMonth: months ? r2(left / months) : null, months };
  }

  /* ---------- التاريخ الهجري (أم القرى) ---------- */
  const HM = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  let fmtH = null;
  function hijri(s) {
    try {
      fmtH = fmtH || new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
      const p = {}; fmtH.formatToParts(parseD(s)).forEach(x => { p[x.type] = x.value; });
      const y = parseInt(p.year, 10), m = +p.month, d = +p.day;
      return { y, m, d, text: `${d} ${HM[m - 1]} ${y}هـ` };
    } catch (e) { return null; }
  }
  // نهاية الحول: اليوم الموافق لنفس التاريخ الهجري في السنة التالية
  function hawlEnd(start) {
    const h = hijri(start); if (!h) return addDays(start, 354);
    let s = addDays(start, 350);
    for (let k = 0; k < 10; k++) { const x = hijri(s); if (x.y > h.y && (x.m > h.m || (x.m === h.m && x.d >= h.d))) return s; s = addDays(s, 1); }
    return addDays(start, 354);
  }

  /* ---------- الزكاة ---------- */
  function zakat(F, t) {
    const Z = F.zakat, bal = balances(F), parts = [];
    F.accounts.forEach(a => {
      if (a.type === 'other' || a.zak === false) return;
      const ratio = a.type === 'invest' ? (a.zr === undefined ? 1 : +a.zr) : 1, v = r2(Math.max(0, bal[a.id] || 0) * ratio);
      if (v) parts.push({ k: 'acc', name: a.name + (ratio !== 1 ? ` (${Math.round(ratio * 100)}%)` : ''), v });
    });
    const goldPure = (+Z.goldG || 0) * (+Z.goldK || 24) / 24;
    if (goldPure && Z.gold) parts.push({ k: 'gold', name: `ذهب ${r2(goldPure)} غ صافٍ`, v: r2(goldPure * Z.gold) });
    if (+Z.silverG && Z.silver) parts.push({ k: 'silver', name: `فضة ${+Z.silverG} غ`, v: r2(Z.silverG * Z.silver) });
    F.debts.filter(d => d.dir === 'owed' && d.sure !== false).forEach(d => { const v = debtLeft(d); if (v > 0) parts.push({ k: 'rec', name: 'دين مرجوّ عند ' + d.who, v }); });
    (Z.extra || []).forEach(x => { if (+x.v) parts.push({ k: 'extra', name: x.name, v: r2(x.v) }); });
    const gross = r2(parts.reduce((s, p) => s + p.v, 0));
    const debts = Z.deductDebts ? r2(F.debts.filter(d => d.dir === 'owe' && (!d.due || d.due <= addDays(t, 365))).reduce((s, d) => s + Math.max(0, debtLeft(d)), 0)) : 0;
    const net = r2(Math.max(0, gross - debts));
    const nG = Z.gold ? r2(NISAB_GOLD_G * Z.gold) : null, nS = Z.silver ? r2(NISAB_SILVER_G * Z.silver) : null;
    const nisab = Z.base === 'gold' ? nG : Z.base === 'silver' ? nS : Z.base === 'min' ? (nG && nS ? Math.min(nG, nS) : null) : null;
    const above = nisab != null ? net >= nisab : null;
    let hawl = null;
    if (Z.hawlStart) {
      const end = hawlEnd(Z.hawlStart);
      hawl = { start: Z.hawlStart, startH: hijri(Z.hawlStart), end, endH: hijri(end), left: diffDays(t, end), reached: t >= end };
    }
    return { parts, gross, debts, net, nG, nS, nisab, above, due: above ? r2(net * RATE) : 0, hawl };
  }
  function payZakat(F, t, amt, acc) {
    const z = zakat(F, t), h = hijri(t);
    F.zakat.paid.push({ d: t, amt: r2(amt), base: z.net, hy: h ? h.y : null });
    if (acc) addTx(F, { d: t, kind: 'out', amt, cat: 'الزكاة', acc, note: 'زكاة المال' + (h ? ' ' + h.y + 'هـ' : '') });
    if (F.zakat.hawlStart && z.hawl && z.hawl.reached) F.zakat.hawlStart = z.hawl.end; // يبدأ حول جديد من تاريخ الوجوب
  }

  /* ---------- استيراد كشف بنكي (CSV) ---------- */
  function splitCSV(line, sep) { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === sep && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()); }
  function num(s) { s = String(s || '').replace(/[\s €]/g, ''); if (!s) return NaN; if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); return parseFloat(s); }
  function date(s) { s = String(s || '').trim(); let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${pad(+m[2])}-${pad(+m[1])}`; } m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; }
  function parseCSV(text) {
    const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return [];
    const sep = [';', ',', '\t'].map(s => [s, lines.slice(0, 5).reduce((n, l) => n + splitCSV(l, s).length, 0)]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = lines.map(l => splitCSV(l, sep));
    const norm = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hi = rows.findIndex(c => !c.some(x => date(x)) && c.some(x => /date|libelle|montant|debit|credit|amount|label/.test(norm(x))));
    const H = hi >= 0 ? rows[hi].map(norm) : null, find = re => H ? H.findIndex(x => re.test(x)) : -1;
    const iD = find(/date/), iL = [/libelle|label/, /description|intitule|detail/, /operation/].map(find).find(i => i >= 0 && !/date/.test(H[i])) ?? -1, iA = find(/montant|amount|somme/), iDeb = find(/debit/), iCr = find(/credit/);
    const out = [];
    rows.forEach((c, k) => {
      if (k <= hi) return;
      const di = iD >= 0 && date(c[iD]) ? iD : c.findIndex(x => date(x)); if (di < 0) return;
      let amt = NaN;
      if (iDeb >= 0 || iCr >= 0) { const d = num(c[iDeb]), cr = num(c[iCr]); amt = !isNaN(d) && d !== 0 ? -Math.abs(d) : !isNaN(cr) ? Math.abs(cr) : NaN; }
      if (isNaN(amt) && iA >= 0) amt = num(c[iA]);
      if (isNaN(amt)) { const nums = c.map((x, i) => i !== di && !date(x) && /\d/.test(x) ? num(x) : NaN).filter(v => !isNaN(v)); amt = nums.length ? nums[nums.length - 1] : NaN; }
      if (isNaN(amt) || !amt) return;
      const label = iL >= 0 ? c[iL] : (c.filter((x, i) => i !== di && x && !date(x) && isNaN(num(x))).sort((a, b) => b.length - a.length)[0] || '');
      out.push({ d: date(c[di]), label: String(label).replace(/\s+/g, ' ').trim(), amt });
    });
    return out;
  }
  function categorize(F, label) {
    const L = String(label || '').toLowerCase();
    const r = (F.rules || []).find(x => x.k && L.includes(x.k.toLowerCase()));
    return r ? r.cat : '';
  }
  function importRows(F, rows, acc) {
    let added = 0, dup = 0;
    const have = new Set(F.tx.map(t => `${t.acc}|${t.d}|${t.kind === 'in' ? '+' : '-'}${t.amt}|${(t.note || '').slice(0, 30)}`));
    rows.forEach(x => {
      const kind = x.amt < 0 ? 'out' : 'in', amt = r2(Math.abs(x.amt)), key = `${acc}|${x.d}|${kind === 'in' ? '+' : '-'}${amt}|${String(x.label).slice(0, 30)}`;
      if (have.has(key)) { dup++; return; }
      have.add(key); addTx(F, { d: x.d, kind, amt, acc, cat: categorize(F, x.label) || (kind === 'in' ? 'أخرى' : 'أخرى'), note: String(x.label).slice(0, 80), src: 'csv' }); added++;
    });
    return { added, dup };
  }

  const api = { OUT_CATS, IN_CATS, ACC_T, NISAB_GOLD_G, NISAB_SILVER_G, RATE, r2, uid, blank, ensure, balances, total, addTx, month, budget, forecast, advance, upcoming, payRecur, skipRecur, debtLeft, debtsTotal, goalSaved, goalPlan, hijri, hawlEnd, zakat, payZakat, parseCSV, categorize, importRows };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FIN = api;
})(typeof window !== 'undefined' ? window : globalThis);
