/* مساري — منطق البرنامج الرسمي + الإضافي (دوال نقيّة، قابلة للاختبار في Node)
 *
 * البرنامج: ربعان يوميًا من الأحد إلى الخميس بترتيب المصحف (الربع i = الفهرس 0..239)،
 *   الجمعة: استدراك وتثبيت، السبت: تثبيت أو اختبار. اليوم n (1، 2، …) يحفظ الربعين 2(n-1) و 2(n-1)+1.
 * النموذج:
 *   P = { v:2, start, end, cap, done:{ [ربع]:{d,k} }, extra:[{id,d,n,note}], rv:{ 'YYYY-MM-DD':true } }
 *   k = 'o' (رسمي: حُفظ في يومه أو بعده) أو 'x' (إضافي: حُفظ قبل يومه المقرَّر)
 *   extra = أرباع إضافية يدخلها المستخدم بالعدد فقط
 * القواعد: لا عدّ مزدوج (كل ربع يُحتسب مرة واحدة)، المحفوظات السابقة للبرنامج لا تدخل،
 *   المراجعة والتثبيت والاختبار لا تُحسب أرباعًا جديدة، الإجمالي لا يتجاوز 240.
 */
(function (root) {
  const NQ = 240;
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const dow = s => parse(s).getDay();                       // 0=الأحد … 6=السبت
  const kind = s => { const w = dow(s); return w <= 4 ? 'mem' : w === 5 ? 'rev' : 'tath'; };
  const weekStart = s => add(s, -dow(s));                   // الأسبوع يبدأ الأحد
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  function blank(start, end) { return { v: 2, start, end, cap: 14, done: {}, extra: [], rv: {}, seq: 1 }; }

  // ---- الجدول الرسمي ----
  function memDayNo(P, d) { // رقم يوم الحفظ (1…) أو 0
    if (d < P.start || kind(d) !== 'mem') return 0;
    const n = diff(P.start, d), w = Math.floor(n / 7); let k = w * 5;
    for (let x = add(P.start, w * 7); x <= d; x = add(x, 1)) if (kind(x) === 'mem') k++;
    return k;
  }
  function unitsOfDay(P, d) { const n = memDayNo(P, d); return n ? [2 * (n - 1), 2 * (n - 1) + 1].filter(i => i < NQ) : []; }
  function dateOfUnit(P, i) { // تاريخ يوم الربع في الجدول
    const n = Math.floor(i / 2) + 1; let k = 0;
    for (let d = P.start; k < 1000; d = add(d, 1)) if (kind(d) === 'mem' && ++k === n) return d;
    return null;
  }
  const isDone = (P, i) => !!P.done[i];
  const kindOf = (P, i) => P.done[i] ? P.done[i].k : null;

  function totals(P) {
    let o = 0, x = 0; Object.keys(P.done).forEach(i => { if (P.done[i].k === 'o') o++; else x++; });
    x += P.extra.reduce((n, e) => n + e.n, 0);
    const total = Math.min(NQ, o + x); return { official: o, extra: Math.max(0, total - o), total, remaining: NQ - total };
  }

  // أعمدة التسجيل: يُحتسب الربع «رسميًا» إن بلغ يومه المقرر، وإلا «إضافيًا». يُرفض إن تكرر أو بلغ الإجمالي 240.
  function credit(P, i, today) {
    if (i < 0 || i >= NQ || P.done[i] || totals(P).total >= NQ) return null;
    const k = (today >= P.start && dateOfUnit(P, i) <= today) ? 'o' : 'x';
    P.done[i] = { d: today, k }; return k;
  }
  function uncredit(P, i) { const had = !!P.done[i]; delete P.done[i]; return had; }

  // أرباع مقررة لم تُحفظ بعد: اليوم + ما فات (استدراك)
  function pending(P, today) {
    const todayU = [], catchup = [];
    for (let n = 1; n <= NQ / 2; n++) {
      const d = dateOfUnit(P, 2 * (n - 1)); if (d > today) break;
      [2 * (n - 1), 2 * (n - 1) + 1].forEach(i => { if (!P.done[i]) (d === today ? todayU : catchup).push(i); });
    }
    return { today: todayU, catchup };
  }
  function futureOfficial(P, today) { // مقرر من اليوم (شاملًا) حتى قبل الموعد ولم يُحفظ
    let n = 0;
    for (let k = 1; k <= NQ / 2; k++) {
      const d = dateOfUnit(P, 2 * (k - 1)); if (d >= P.end) break; if (d < today) continue;
      [2 * (k - 1), 2 * (k - 1) + 1].forEach(i => { if (i < NQ && !P.done[i]) n++; });
    }
    return n;
  }
  function missedUnits(P, today) { return pending(P, today).catchup; }

  function manualInRange(P, a, b) { return P.extra.filter(e => e.d >= a && e.d <= b).reduce((n, e) => n + e.n, 0); }
  function extraInRange(P, a, b) { // إضافي مُسجَّل في المدى (أرباع 'x' + إدخال بالعدد)
    let n = manualInRange(P, a, b); Object.keys(P.done).forEach(i => { const r = P.done[i]; if (r.k === 'x' && r.d >= a && r.d <= b) n++; }); return n;
  }
  function extraRate(P, today) { // وتيرة الإضافي الفعلية (ربع/أسبوع) في آخر 14 يومًا
    const span = Math.min(14, Math.max(7, diff(P.start, today) + 1));
    return extraInRange(P, add(today, -(span - 1)), today) * 7 / span;
  }
  function simulate(P, today, extraPerWeek) { // متى يبلغ الإجمالي 240 لو أُتمّ المقرر وتابعتَ الوتيرة الإضافية؟
    let have = totals(P).total; if (have >= NQ) return today;
    let acc = 0, caught = false;
    for (let d = today < P.start ? P.start : today, i = 0; i < 900; d = add(d, 1), i++) {
      if (!caught && kind(d) === 'rev') { have += missedUnits(P, today).length; caught = true; } // الاستدراك في أول جمعة
      if (kind(d) === 'mem') unitsOfDay(P, d).forEach(u => { if (!P.done[u] && dateOfUnit(P, u) >= today) have++; });
      acc += extraPerWeek / 7; const w = Math.floor(acc); acc -= w; have += w;
      if (have >= NQ) return d;
    }
    return null;
  }

  function calc(P, today) {
    const t = totals(P), fut = futureOfficial(P, today);
    const from = today < P.start ? P.start : today;
    const daysLeft = Math.max(0, diff(from, P.end));
    const weeksLeft = daysLeft / 7;
    const needExtra = Math.max(0, NQ - t.total - fut);
    const perWeek = needExtra === 0 ? 0 : daysLeft > 0 ? Math.ceil(needExtra / weeksLeft) : needExtra;
    const feasible = daysLeft > 0 && perWeek <= P.cap;
    const rate = extraRate(P, today), projected = simulate(P, today, rate);
    const wk0 = weekStart(today), wk1 = add(wk0, 6), extraThisWeek = extraInRange(P, wk0, wk1);
    return Object.assign({}, t, {
      futureOfficial: fut, daysLeft, weeksLeft, needExtra, perWeek, feasible, cap: P.cap, rate, projected,
      late: projected === null || projected >= P.end, extraThisWeek, leftThisWeek: Math.max(0, perWeek - extraThisWeek),
      perDayExtra: perWeek ? Math.ceil(perWeek / 7) : 0, missed: missedUnits(P, today).length,
    });
  }

  function freeTimeText(c) {
    if (c.remaining === 0) return 'ما شاء الله! أتممتَ الأرباع الـ240.';
    if (c.needExtra === 0) return 'البرنامج الرسمي وحده كافٍ لتنهي قبل رمضان إن التزمتَ به كاملًا. ما تضيفه الآن تقدّمٌ مكسوب.';
    if (c.daysLeft === 0) return `انتهى الوقت ولم يكتمل الحفظ: بقي ${c.needExtra} ربعًا فوق الرسمي.`;
    if (!c.feasible) return `للانتهاء قبل رمضان يلزمك ${c.perWeek} ربعًا إضافيًا في الأسبوع (فوق الرسمي)، وهذا أعلى من الحد الذي حددتَه (${c.cap}). إجمالي المطلوب ${c.needExtra} ربعًا إضافيًا، أو مراجعة الموعد.`;
    return `للانتهاء قبل رمضان يلزمك الآن ${c.perWeek} ${c.perWeek === 1 ? 'ربع' : 'أرباع'} إضافية في الأسبوع، فوق برنامجك الرسمي (إجمالي ${c.needExtra} ربعًا في ${Math.ceil(c.weeksLeft)} أسبوعًا).`;
  }

  // إدخال بالعدد (دون تعيين الربع)؛ لا يتجاوز الإجمالي 240
  function addExtra(P, d, n, note) {
    n = Math.floor(+n); if (!(n > 0)) return { ok: false, n: 0 };
    const room = NQ - totals(P).total; if (room <= 0) return { ok: false, n: 0, full: true };
    const k = Math.min(n, room); P.extra.push({ id: 'x' + (P.seq++), d, n: k, note: note || '' });
    return { ok: true, n: k, clipped: k < n };
  }
  function removeExtra(P, id) { const i = P.extra.findIndex(e => e.id === id); if (i >= 0) P.extra.splice(i, 1); return i >= 0; }
  function setExtraN(P, id, n) {
    const e = P.extra.find(x => x.id === id); n = Math.floor(+n); if (!e || !(n > 0)) return false;
    e.n = Math.min(n, NQ - (totals(P).total - e.n)); return true;
  }

  // ---- المراجعة المقررة (الأسابيع 1–4 من الجدول، ثم قاعدة تقريبية) ----
  const A = (a, b) => range(a, b);
  const REV = {
    1: [{ t: '—', u: [] }, { t: 'الربعان 1–2 من البقرة', u: A(0, 1) }, { t: 'الأرباع 1–4 من البقرة', u: A(0, 3) }, { t: 'الأرباع 1–6 من البقرة', u: A(0, 5) }, { t: 'الأرباع 3–8 من البقرة', u: A(2, 7) }, { t: 'استدراك وتثبيت', u: A(0, 9), rec: 1 }, { t: 'تثبيت: الجزء 1 من البقرة', u: A(0, 7) }],
    2: [{ t: 'الحزب 1 من البقرة', u: A(0, 3) }, { t: 'الحزب 2 من البقرة', u: A(4, 7) }, { t: 'الجزء 1 من البقرة', u: A(0, 7) }, { t: 'الحزب 3 من البقرة', u: A(8, 11) }, { t: 'الجزء 2 من البقرة', u: A(8, 15) }, { t: 'استدراك وتثبيت', u: A(10, 19), rec: 1 }, { t: 'اختبار: سورة البقرة', u: A(0, 19), test: 1 }],
    3: [{ t: 'الحزب 5 (من البقرة إلى آل عمران)', u: A(16, 19) }, { t: 'نصف البقرة الأول إلى «يا أيها الذين آمنوا كتب عليكم الصيام»', u: A(0, 10) }, { t: 'الحزب الأول من آل عمران إلى «كل الطعام»', u: A(20, 23) }, { t: 'نصف البقرة الثاني من «يا أيها الذين آمنوا كتب» إلى نهاية السورة', u: A(10, 19) }, { t: 'الحزب الثاني من آل عمران من «كل الطعام» إلى «يستبشرون»', u: A(24, 27) }, { t: 'استدراك وتثبيت', u: A(20, 29), rec: 1 }, { t: 'تثبيت: الجزءان 1 و3', u: A(0, 7).concat(A(16, 23)) }],
    4: [{ t: 'نصف آل عمران الأول إلى «قد خلت»', u: A(20, 26) }, { t: 'نصف آل عمران الثاني من «قد خلت» إلى نهاية السورة', u: A(26, 29) }, { t: 'الحزب الأول من النساء', u: A(30, 33) }, { t: 'نصف البقرة الأول إلى «يا أيها الذين آمنوا كتب عليكم الصيام»', u: A(0, 10) }, { t: 'الحزب الثاني من النساء', u: A(34, 37) }, { t: 'استدراك وتثبيت', u: A(30, 39), rec: 1 }, { t: 'اختبار: البقرة وآل عمران', u: A(0, 29), test: 1 }],
  };
  function reviewOf(P, d) { // {t: نص, u: [أرباع], test?, rec?, est?}
    if (d < P.start) return { t: '', u: [] };
    const w = Math.floor(diff(P.start, d) / 7) + 1, i = diff(weekStart(d), d);
    if (REV[w] && P.start === weekStart(P.start)) return Object.assign({ est: false }, REV[w][i]);
    // ما بعد الأسبوع 4 (أو بداية غير الأحد): قاعدة تقريبية حتى يصلك بقية الجدول
    const ws = weekStart(d), prev = add(ws, -7), mem = x => unitsOfDay(P, x);
    if (kind(d) === 'mem') { const u = []; for (let x = ws; x < d; x = add(x, 1)) u.push(...mem(x)); if (!u.length) for (let x = add(prev, 3); x <= add(prev, 4); x = add(x, 1)) u.push(...mem(x)); return { t: 'مراجعة ما حفظتَه في الأيام الأخيرة', u, est: true }; }
    const u = []; for (let x = ws; x < add(ws, 5); x = add(x, 1)) u.push(...mem(x));
    if (kind(d) === 'rev') return { t: 'استدراك وتثبيت', u, rec: 1, est: true };
    for (let x = prev; x < ws; x = add(x, 1)) u.push(...mem(x)); return { t: 'تثبيت وتقييم', u, est: true };
  }

  function weekSummary(P, ws, today) {
    let planned = 0, schedDone = 0, missed = 0;
    for (let i = 0; i < 7; i++) { const d = add(ws, i); if (d < P.start) continue; unitsOfDay(P, d).forEach(u => { planned++; if (P.done[u]) schedDone++; else if (d < today) missed++; }); }
    const we = add(ws, 6); let off = 0; Object.keys(P.done).forEach(i => { const r = P.done[i]; if (r.k === 'o' && r.d >= ws && r.d <= we) off++; });
    return { ws, planned, schedDone, off, extra: extraInRange(P, ws, we), missed, rev: !!P.rv[add(ws, 5)], tath: !!P.rv[add(ws, 6)] };
  }
  function weeks(P, today, max) {
    const out = []; let ws = weekStart(today);
    for (let i = 0; i < (max || 12) && add(ws, 6) >= P.start; i++, ws = add(ws, -7)) out.push(weekSummary(P, ws, today));
    return out;
  }

  const api = { NQ, parse, add, diff, dow, kind, weekStart, blank, memDayNo, unitsOfDay, dateOfUnit, isDone, kindOf, totals, credit, uncredit, pending, futureOfficial, missedUnits, extraInRange, extraRate, simulate, calc, freeTimeText, addExtra, removeExtra, setExtraN, reviewOf, weekSummary, weeks };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PROG = api;
})(typeof window !== 'undefined' ? window : globalThis);
