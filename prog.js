/* مساري — منطق البرنامج الرسمي + الإضافي (دوال نقيّة، قابلة للاختبار في Node)
 *
 * النموذج:
 *   P = { start, end, perDay: 2, cap: 14, days: { 'YYYY-MM-DD': {a,b,r,t} }, extra: [{id,d,n,note}] }
 *   - a,b  : الربعان المحفوظان في اليوم (الأحد–الخميس فقط)
 *   - r    : مراجعة الجمعة (لا تُحسب ربعًا جديدًا)
 *   - t    : تثبيت/تقييم السبت (لا يُحسب ربعًا جديدًا)
 *   - extra: أرباع إضافية خارج البرنامج، كل سجل مستقل ويمكن حذفه/تصحيحه
 * القواعد:
 *   الرسمي = عدد الخانات a,b المؤشَّرة في أيام الحفظ ≥ تاريخ البداية.
 *   الإجمالي = الرسمي + الإضافي (لا يتجاوز 240 أبدًا؛ لا عدّ مزدوج).
 *   المحفوظات السابقة للبرنامج لا تدخل هنا إطلاقًا.
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

  function blank(start, end) { return { start, end, perDay: 2, cap: 14, days: {}, extra: [], seq: 1 }; }

  function dayDone(P, d) { // عدد أرباع الرسمي المنجزة في يوم
    if (d < P.start || kind(d) !== 'mem') return 0;
    const r = P.days[d]; return r ? (r.a ? 1 : 0) + (r.b ? 1 : 0) : 0;
  }
  function officialDone(P) { return Object.keys(P.days).reduce((n, d) => n + dayDone(P, d), 0); }
  function extraDone(P) { return P.extra.reduce((n, e) => n + e.n, 0); }
  function totals(P) {
    const o = officialDone(P), e = extraDone(P), total = Math.min(NQ, o + e);
    return { official: o, extra: e, total, remaining: NQ - total };
  }

  // أرباع الرسمي المتوقَّع إنجازها من «اليوم» حتى قبل تاريخ الحد (ناقص ما أُنجز فعلًا)
  function futureOfficial(P, today) {
    let n = 0;
    for (let d = today < P.start ? P.start : today; d < P.end; d = add(d, 1)) {
      if (kind(d) === 'mem') n += Math.max(0, P.perDay - dayDone(P, d));
    }
    return n;
  }

  function extraInRange(P, a, b) { return P.extra.filter(e => e.d >= a && e.d <= b).reduce((n, e) => n + e.n, 0); }

  // وتيرة الإضافي الفعلية (ربع/أسبوع) في آخر 14 يومًا (أو منذ البداية إن كانت أقل)
  function extraRate(P, today) {
    const span = Math.min(14, Math.max(7, diff(P.start, today) + 1));
    return extraInRange(P, add(today, -(span - 1)), today) * 7 / span;
  }

  // محاكاة يومًا بيوم: متى يبلغ الإجمالي 240 لو تابعتَ الرسمي كاملًا + وتيرة إضافية ثابتة؟
  function simulate(P, today, extraPerWeek) {
    let have = totals(P).total; if (have >= NQ) return today;
    let acc = 0;
    for (let d = today < P.start ? P.start : today, i = 0; i < 900; d = add(d, 1), i++) {
      if (kind(d) === 'mem') have += Math.max(0, P.perDay - dayDone(P, d));
      acc += extraPerWeek / 7; const whole = Math.floor(acc); acc -= whole; have += whole;
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
    const rate = extraRate(P, today);
    const projected = simulate(P, today, rate);
    const wk0 = weekStart(today), wk1 = add(wk0, 6);
    const extraThisWeek = extraInRange(P, wk0, wk1);
    return Object.assign({}, t, {
      futureOfficial: fut, daysLeft, weeksLeft, needExtra, perWeek, feasible, cap: P.cap,
      rate, projected, late: projected === null || projected >= P.end,
      extraThisWeek, leftThisWeek: Math.max(0, perWeek - extraThisWeek),
    });
  }

  // الجمل التي تُعرض عند الضغط على «لديّ وقت فراغ»
  function freeTimeText(c) {
    if (c.remaining === 0) return 'ما شاء الله! أتممتَ الأرباع الـ240.';
    if (c.needExtra === 0) return 'البرنامج الرسمي وحده كافٍ لتنهي قبل رمضان إن التزمتَ به كاملًا. ما تضيفه الآن تقدّمٌ مكسوب.';
    if (c.daysLeft === 0) return `انتهى الوقت ولم يكتمل الحفظ: بقي ${c.needExtra} ربعًا فوق الرسمي.`;
    if (!c.feasible) return `للانتهاء قبل رمضان يلزمك ${c.perWeek} ربعًا إضافيًا في الأسبوع (فوق الرسمي)، وهذا أعلى من الحد الذي حددتَه (${c.cap}). إجمالي المطلوب ${c.needExtra} ربعًا إضافيًا، أو مراجعة الموعد.`;
    return `للانتهاء قبل رمضان يلزمك الآن ${c.perWeek} ${c.perWeek === 1 ? 'ربع' : 'أرباع'} إضافية في الأسبوع، فوق برنامجك الرسمي (إجمالي ${c.needExtra} ربعًا في ${Math.ceil(c.weeksLeft)} أسبوعًا).`;
  }

  // إضافة ربع/أرباع إضافية؛ لا تتجاوز الإجمالي 240 (لا عدّ مزدوج)
  function addExtra(P, d, n, note) {
    n = Math.floor(+n); if (!(n > 0)) return { ok: false, n: 0 };
    const room = NQ - totals(P).total; if (room <= 0) return { ok: false, n: 0, full: true };
    const k = Math.min(n, room); P.extra.push({ id: 'x' + (P.seq++), d, n: k, note: note || '' });
    return { ok: true, n: k, clipped: k < n };
  }
  function removeExtra(P, id) { const i = P.extra.findIndex(e => e.id === id); if (i >= 0) P.extra.splice(i, 1); return i >= 0; }
  function setExtraN(P, id, n) { // تصحيح العدد دون كسر القاعدة
    const e = P.extra.find(x => x.id === id); n = Math.floor(+n); if (!e || !(n > 0)) return false;
    const room = NQ - (totals(P).total - e.n); e.n = Math.min(n, room); return true;
  }
  // تأشير خانة رسمية؛ يُرفض خارج أيام الحفظ أو قبل البداية، ويُرفض إن تجاوز الإجمالي 240
  function setSlot(P, d, slot, val) {
    if (d < P.start) return false;
    const k = kind(d);
    if ((slot === 'a' || slot === 'b') && k !== 'mem') return false;
    if (slot === 'r' && k !== 'rev') return false;
    if (slot === 't' && k !== 'tath') return false;
    const r = P.days[d] = P.days[d] || {};
    if (val && (slot === 'a' || slot === 'b') && !r[slot] && totals(P).total >= NQ) return false;
    r[slot] = !!val; if (!r.a && !r.b && !r.r && !r.t) delete P.days[d];
    return true;
  }

  function missedDays(P, today) { // أيام حفظ فائتة (قبل اليوم) لم يكتمل ربعاها
    const out = []; for (let d = P.start; d < today; d = add(d, 1)) if (kind(d) === 'mem') { const m = P.perDay - dayDone(P, d); if (m > 0) out.push({ d, missing: m }); }
    return out;
  }
  function weekSummary(P, ws, today) {
    let planned = 0, off = 0, rev = false, tath = false, missed = 0;
    for (let i = 0; i < 7; i++) {
      const d = add(ws, i); if (d < P.start) continue;
      if (kind(d) === 'mem') { planned += P.perDay; off += dayDone(P, d); if (d < today) missed += P.perDay - dayDone(P, d); }
      if (kind(d) === 'rev' && P.days[d] && P.days[d].r) rev = true;
      if (kind(d) === 'tath' && P.days[d] && P.days[d].t) tath = true;
    }
    return { ws, planned, off, extra: extraInRange(P, ws, add(ws, 6)), rev, tath, missed };
  }
  function weeks(P, today, max) { // من أحدث أسبوع إلى الأقدم (حتى البداية)
    const out = []; let ws = weekStart(today);
    for (let i = 0; i < (max || 12) && add(ws, 6) >= P.start; i++, ws = add(ws, -7)) out.push(weekSummary(P, ws, today));
    return out;
  }

  const api = { NQ, parse, add, diff, dow, kind, weekStart, blank, dayDone, officialDone, extraDone, totals, futureOfficial, extraRate, simulate, calc, freeTimeText, addExtra, removeExtra, setExtraN, setSlot, missedDays, weekSummary, weeks };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PROG = api;
})(typeof window !== 'undefined' ? window : globalThis);
