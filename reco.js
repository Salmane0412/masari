/* مساري — منطق التعافي (عدّاد أيام، سجل يومي، رغبات، انتكاسات بلا جلد للذات). دوال نقيّة. */
(function (root) {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const MILES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 270, 365];
  const TRIG = ['وحدة', 'تعب', 'ضيق', 'ملل', 'جوع', 'سهر', 'الهاتف', 'غضب'];

  const blank = () => ({ start: null, why: '', resets: [], checks: {}, urges: [], best: 0 });
  const started = R => !!R.start;
  const days = (R, t) => R.start ? Math.max(0, diff(R.start, t)) : 0;
  const best = (R, t) => Math.max(R.best || 0, days(R, t), ...R.resets.map(r => r.len || 0));
  const total = (R, t) => days(R, t) + R.resets.reduce((n, r) => n + (r.len || 0), 0);
  function nextMilestone(R, t) { const d = days(R, t), m = MILES.find(x => x > d) || null, prev = [...MILES].reverse().find(x => x <= d) || 0; return { next: m, prev, left: m ? m - d : 0, frac: m ? (d - prev) / (m - prev) : 1 }; }
  function begin(R, t, why) { R.start = t; if (why != null) R.why = why; return R; }
  function relapse(R, t, trig, note) { const len = days(R, t); R.resets.push({ d: t, len, trig: trig || [], note: note || '' }); R.best = Math.max(R.best || 0, len); R.start = t; return len; }
  function checkin(R, t, o) { R.checks[t] = { ok: o.ok !== false, mood: o.mood || 0, trig: o.trig || [] }; return R.checks[t]; }
  const checkedToday = (R, t) => !!R.checks[t];
  function urge(R, t, hour, won) { R.urges.push({ d: t, h: hour, won: !!won }); return R.urges.length; }
  function topTriggers(R) { const c = {}; Object.values(R.checks).forEach(x => (x.trig || []).forEach(k => { c[k] = (c[k] || 0) + 1; })); R.resets.forEach(r => (r.trig || []).forEach(k => { c[k] = (c[k] || 0) + 2; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3); }
  function riskHours(R) { const c = {}; R.urges.forEach(u => { c[u.h] = (c[u.h] || 0) + 1; }); R.resets.forEach(() => { }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => ({ h: +h, n })); }
  function strip(R, t, n) { return Array.from({ length: n }, (_, i) => { const d = add(t, i - n + 1); return { d, ok: R.checks[d] ? R.checks[d].ok : null, reset: R.resets.some(r => r.d === d) }; }); }

  const api = { MILES, TRIG, blank, started, days, best, total, nextMilestone, begin, relapse, checkin, checkedToday, urge, topTriggers, riskHours, strip };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RECO = api;
})(typeof window !== 'undefined' ? window : globalThis);
