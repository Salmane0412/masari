/* مساري — المهام: منطق المهام والمشاريع والتكرار والإدخال السريع (بلا واجهة، قابل للاختبار) */
(function (root) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
  let seq = 0;
  const uid = () => 't' + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 4);
  const PROJECTS = ['شخصي', 'العمل', 'العلم', 'المقرأة', 'البيت والإدارة', 'الصحة'];
  const REP = { '': 'بلا تكرار', d: 'كل يوم', wd: 'أيام العمل', w: 'كل أسبوع', m: 'كل شهر', y: 'كل سنة' };
  const PR = { 1: 'عاجل ومهم', 2: 'مهم', 3: 'عادي' };
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const blank = () => ({ items: [], projects: PROJECTS.slice() });
  function ensure(T) { T = T || blank(); T.items = T.items || []; T.projects = T.projects || PROJECTS.slice(); return T; }

  function nextDue(due, rep, from) {
    let s = due || from;
    const step = x => {
      const d = parseD(x);
      if (rep === 'd') d.setDate(d.getDate() + 1);
      else if (rep === 'wd') { do d.setDate(d.getDate() + 1); while (d.getDay() === 0 || d.getDay() === 6); }
      else if (rep === 'w') d.setDate(d.getDate() + 7);
      else if (rep === 'y') d.setFullYear(d.getFullYear() + 1);
      else { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
      return ymd(d);
    };
    s = step(s);
    while (from && s <= from && rep !== 'm' && rep !== 'y') s = step(s); // مهمة متأخرة متكررة: لا تُراكم أيامًا فائتة
    return s;
  }

  /* الإدخال السريع: «اتصل بالقنصلية غدًا 10:00 #البيت !1 كل شهر» */
  function parseQuick(txt, today, projects) {
    let s = ' ' + String(txt || '').replace(/\s+/g, ' ') + ' ', due = '', time = '', pr = 3, rep = '', p = '';
    const take = (re, f) => { s = s.replace(re, (...m) => { f(...m); return ' '; }); };
    take(/\s#([^\s#!]+)/, (m, x) => { const k = (projects || []).find(q => q.replace(/\s/g, '') === x || q.startsWith(x)); p = k || x.replace(/_/g, ' '); });
    take(/\s!([123])(?=\s)/, (m, x) => { pr = +x; });
    take(/\s(كل يوم|يوميًا|يوميا)(?=\s)/, () => { rep = 'd'; });
    take(/\s(أيام العمل)(?=\s)/, () => { rep = 'wd'; });
    take(/\s(كل أسبوع|كل اسبوع|أسبوعيًا|اسبوعيا)(?=\s)/, () => { rep = 'w'; });
    take(/\s(كل شهر|شهريًا|شهريا)(?=\s)/, () => { rep = 'm'; });
    take(/\s(كل سنة|سنويًا|سنويا)(?=\s)/, () => { rep = 'y'; });
    take(/\s(\d{1,2}):(\d{2})(?=\s)/, (m, h, mi) => { time = pad(+h) + ':' + mi; });
    take(/\s(بعد غد|après-demain)(?=\s)/i, () => { due = addDays(today, 2); });
    take(/\s(غدًا|غداً|غدا|demain)(?=\s)/i, () => { due = addDays(today, 1); });
    take(/\s(اليوم|aujourd'hui)(?=\s)/i, () => { due = today; });
    take(/\s(?:يوم\s)?(الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)(?=\s)/, (m, x) => { const w = DAYS.indexOf(x.replace('الإثنين', 'الاثنين')); let d = addDays(today, 1); while (parseD(d).getDay() !== w) d = addDays(d, 1); due = d; });
    take(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/, (m, d, mo, y) => { let yy = y ? (y.length === 2 ? 2000 + +y : +y) : +today.slice(0, 4); let c = `${yy}-${pad(+mo)}-${pad(+d)}`; if (!y && c < addDays(today, -60)) c = `${yy + 1}-${pad(+mo)}-${pad(+d)}`; due = c; });
    if (rep && !due) due = today;
    return { t: s.trim().replace(/\s+/g, ' '), due, time, pr, rep, p };
  }

  function add(T, o, today) {
    const it = { id: uid(), t: String(o.t || '').trim(), n: o.n || '', p: o.p || '', due: o.due || '', time: o.time || '', pr: o.pr || 3, rep: o.rep || '', sub: o.sub || [], done: null, made: today, cnt: 0 };
    if (!it.t) throw new Error('اكتب عنوان المهمة');
    if (it.p && !T.projects.includes(it.p)) T.projects.push(it.p);
    T.items.push(it); return it;
  }
  // إنجاز: المتكررة تنتقل إلى موعدها التالي، والعادية تُعلَّم منجزة
  function toggle(T, id, today) {
    const it = T.items.find(x => x.id === id); if (!it) return null;
    if (it.done) { it.done = null; return it; }
    if (it.rep) { it.cnt = (it.cnt || 0) + 1; it.lastDone = today; it.due = nextDue(it.due || today, it.rep, today); it.sub.forEach(s => { s.d = false; }); return it; }
    it.done = today; return it;
  }
  const key = x => (x.due || '9999-99-99') + ' ' + (x.time || '99:99');
  const cmp = (a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : a.pr - b.pr;
  function buckets(T, today, proj) {
    const open = T.items.filter(x => !x.done && (!proj || x.p === proj)), wk = addDays(today, 7);
    const by = f => open.filter(f).sort((a, b) => a.pr - b.pr || cmp(a, b));
    return {
      late: by(x => x.due && x.due < today),
      today: by(x => x.due === today),
      soon: open.filter(x => x.due > today && x.due <= wk).sort(cmp),
      later: open.filter(x => x.due > wk).sort(cmp),
      nodate: by(x => !x.due),
      done: T.items.filter(x => x.done && (!proj || x.p === proj)).sort((a, b) => a.done < b.done ? 1 : -1),
    };
  }
  const todayCount = (T, today) => T.items.filter(x => !x.done && x.due && x.due <= today).length;
  function stats(T, today) {
    const wk = addDays(today, -6);
    return { open: T.items.filter(x => !x.done).length, doneWeek: T.items.filter(x => x.done && x.done >= wk).length + T.items.filter(x => x.rep && x.lastDone && x.lastDone >= wk).length, late: T.items.filter(x => !x.done && x.due && x.due < today).length };
  }
  function purgeDone(T, before) { const n = T.items.length; T.items = T.items.filter(x => !x.done || x.done >= before); return n - T.items.length; }

  const api = { PROJECTS, REP, PR, DAYS, blank, ensure, nextDue, parseQuick, add, toggle, buckets, todayCount, stats, purgeDone, uid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TASKS = api;
})(typeof window !== 'undefined' ? window : globalThis);
