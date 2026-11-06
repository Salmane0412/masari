const assert = require('node:assert/strict');
const G = require('../prog.js');
global.window = {}; require('../data.js'); const Q = window.QDATA;
let n = 0; const T = (name, f) => { f(); n++; console.log('✓', name); };
const mk = () => G.blank('2026-11-08', '2027-02-08'); // الأحد 8 نوفمبر 2026

T('بداية البرنامج الأحد', () => { assert.equal(G.dow('2026-11-08'), 0); assert.equal(G.kind('2026-11-08'), 'mem'); assert.equal(G.kind('2026-11-13'), 'rev'); assert.equal(G.kind('2026-11-14'), 'tath'); });
T('اليوم 1 = الربعان 0 و1؛ اليوم 6 (الأحد التالي) = 10 و11', () => { const P = mk(); assert.deepEqual(G.unitsOfDay(P, '2026-11-08'), [0, 1]); assert.deepEqual(G.unitsOfDay(P, '2026-11-12'), [8, 9]); assert.deepEqual(G.unitsOfDay(P, '2026-11-15'), [10, 11]); assert.deepEqual(G.unitsOfDay(P, '2026-11-13'), []); });
T('الجدول يطابق ورقة الأسبوع 1–4 (بداية كل يوم من نص الجدول)', () => {
  const P = mk(), start = (i) => { const [s, a] = Q.quarters[i]; return `${s}:${a}`; };
  const expect = { '2026-11-08': ['1:1', '2:26'], '2026-11-09': ['2:44', '2:60'], '2026-11-10': ['2:75', '2:92'], '2026-11-11': ['2:106', '2:124'], '2026-11-12': ['2:142', '2:158'],  // أتأمرون 2:44، أفتطمعون 2:75، ما ننسخ 2:106، سيقول السفهاء 2:142
    '2026-11-15': ['2:177', '2:189'], '2026-11-16': ['2:203', '2:219'], '2026-11-17': ['2:233', '2:243'], '2026-11-18': ['2:253', '2:263'], '2026-11-19': ['2:272', '2:283'], // ليس البر، واذكروا الله، والوالدات، تلك الرسل، ليس عليك
    '2026-11-22': ['3:15', '3:33'], '2026-11-23': ['3:52', '3:75'], '2026-11-24': ['3:93', '3:113'], '2026-11-25': ['3:133', '3:153'], '2026-11-26': ['3:171', '3:186'], // قل أؤنبئكم، فلما أحس، كل الطعام، وسارعوا، يستبشرون
    '2026-11-29': ['4:1', '4:12'], '2026-11-30': ['4:24', '4:36'] };
  for (const [d, e] of Object.entries(expect)) assert.deepEqual(G.unitsOfDay(P, d).map(start), e, d);
});
T('المراجعة المقررة الأسبوع 1 والجدول', () => {
  const P = mk(); assert.deepEqual(G.reviewOf(P, '2026-11-08').u, []);
  assert.deepEqual(G.reviewOf(P, '2026-11-09').u, [0, 1]); assert.deepEqual(G.reviewOf(P, '2026-11-12').u, [2, 3, 4, 5, 6, 7]);
  assert.equal(G.reviewOf(P, '2026-11-21').test, 1); assert.deepEqual(G.reviewOf(P, '2026-11-21').u.length, 20); assert.equal(G.reviewOf(P, '2026-11-14').t, 'تثبيت: الجزء 1 من البقرة');
  assert.equal(G.reviewOf(P, '2026-12-06').est, true); // بعد الأسبوع 4: تقدير
});
T('قبل البداية لا شيء يُحتسب رسميًا', () => { const P = mk(); assert.equal(G.credit(P, 150, '2026-11-06'), 'x'); const c = G.calc(P, '2026-11-06'); assert.equal(c.official, 0); assert.equal(c.extra, 1); });
T('حفظ ربع مقرر اليوم = رسمي، وقبل يومه = إضافي، والاستدراك رسمي', () => {
  const P = mk(); assert.equal(G.credit(P, 0, '2026-11-08'), 'o'); assert.equal(G.credit(P, 10, '2026-11-08'), 'x'); assert.equal(G.credit(P, 2, '2026-11-12'), 'o');
  const c = G.calc(P, '2026-11-12'); assert.equal(c.official, 2); assert.equal(c.extra, 1); assert.equal(c.total, 3);
});
T('لا عدّ مزدوج: ربع مسجَّل مرة واحدة', () => { const P = mk(); assert.equal(G.credit(P, 0, '2026-11-08'), 'o'); assert.equal(G.credit(P, 0, '2026-11-08'), null); assert.equal(G.totals(P).total, 1); });
T('ربع محفوظ مبكرًا يخرج من المقرر المستقبلي', () => {
  const P = mk(), before = G.futureOfficial(P, '2026-11-08'); G.credit(P, 10, '2026-11-08'); assert.equal(G.futureOfficial(P, '2026-11-08'), before - 1);
  assert.deepEqual(G.pending(P, '2026-11-15').today, [11]); // الربع 10 سبق حفظه
});
T('الرسمي المستقبلي حتى قبل 8 فبراير 2027', () => {
  // 92 يومًا من الأحد 8/11 حتى الأحد 7/2 = 13 أسبوعًا + يوم: 65 + 1 = 66 يوم حفظ = 132 ربعًا
  let k = 0; for (let d = '2026-11-08'; d < '2027-02-08'; d = G.add(d, 1)) if (G.kind(d) === 'mem') k++;
  assert.equal(k, 66); assert.equal(G.futureOfficial(mk(), '2026-11-08'), 132);
});
T('الإضافي المطلوب أسبوعيًا بالتقريب للأعلى', () => {
  const c = G.calc(mk(), '2026-11-08'); assert.equal(c.needExtra, 108); assert.equal(c.perWeek, Math.ceil(108 / (92 / 7))); assert.equal(c.perWeek, 9);
});
T('كل ربع إضافي يخفّض الحاجة المستقبلية', () => { const P = mk(), a = G.calc(P, '2026-11-08').needExtra; G.credit(P, 150, '2026-11-08'); assert.equal(G.calc(P, '2026-11-08').needExtra, a - 1); G.addExtra(P, '2026-11-08', 3); assert.equal(G.calc(P, '2026-11-08').needExtra, a - 4); });
T('لا يتجاوز 240 أبدًا', () => { const P = mk(); const r = G.addExtra(P, '2026-11-08', 500); assert.equal(r.n, 240); assert.equal(G.totals(P).total, 240); assert.equal(G.addExtra(P, '2026-11-08', 1).ok, false); assert.equal(G.credit(P, 3, '2026-11-08'), null); });
T('تصحيح وحذف الإدخال بالعدد', () => { const P = mk(); G.addExtra(P, '2026-11-08', 5); const id = P.extra[0].id; G.setExtraN(P, id, 2); assert.equal(G.totals(P).total, 2); G.removeExtra(P, id); assert.equal(G.totals(P).total, 0); });
T('الفائت يُكتشف ويُستدرك رسميًا', () => {
  const P = mk(); assert.deepEqual(G.missedUnits(P, '2026-11-10'), [0, 1, 2, 3]);
  assert.equal(G.credit(P, 0, '2026-11-10'), 'o'); assert.deepEqual(G.missedUnits(P, '2026-11-10'), [1, 2, 3]);
  assert.deepEqual(G.pending(P, '2026-11-10').today, [4, 5]);
});
T('هدف غير واقعي: رسالة بالعدد المطلوب', () => { const P = mk(); P.cap = 3; const c = G.calc(P, '2026-11-08'); assert.equal(c.feasible, false); assert.ok(G.freeTimeText(c).includes(String(c.perWeek))); });
T('تاريخ الانتهاء: الرسمي وحده لا يكفي → التاريخ بعد الموعد', () => { const c = G.calc(mk(), '2026-11-08'); assert.equal(c.late, true); assert.ok(c.projected > '2027-02-08'); });
T('بوتيرة إضافية كافية يصبح التاريخ قبل الموعد', () => {
  const P = mk(); const today = '2026-12-06';
  for (let d = '2026-11-08'; d < today; d = G.add(d, 1)) { G.unitsOfDay(P, d).forEach(u => G.credit(P, u, d)); G.addExtra(P, d, 2); }
  const c = G.calc(P, today); assert.ok(c.rate > 0); assert.ok(c.projected < '2027-02-08', c.projected);
});
T('ملخص الأسبوع', () => { const P = mk(); G.credit(P, 0, '2026-11-08'); G.credit(P, 100, '2026-11-09'); const w = G.weekSummary(P, '2026-11-08', '2026-11-12'); assert.equal(w.planned, 10); assert.equal(w.off, 1); assert.equal(w.extra, 1); assert.equal(w.missed, 7); });
T('اكتمال الحفظ', () => { const P = mk(); G.addExtra(P, '2026-11-08', 240); assert.ok(G.freeTimeText(G.calc(P, '2026-11-09')).includes('240')); });
T('الفائت يُستدرك في أول جمعة في تقدير تاريخ الانتهاء (لا يضيع)', () => {
  const P = mk(); const c = G.calc(P, '2026-11-10'); assert.ok(c.projected, 'projected'); assert.ok(c.projected > '2027-02-08');
  const P2 = mk(); G.unitsOfDay(P2, '2026-11-08').concat(G.unitsOfDay(P2, '2026-11-09')).forEach(u => G.credit(P2, u, '2026-11-09'));
  assert.ok(G.calc(P2, '2026-11-10').projected <= c.projected); // بلا فائت لا يتأخر التاريخ
});
console.log(`\n${n} tests OK`);
