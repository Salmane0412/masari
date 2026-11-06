const assert = require('node:assert/strict');
const G = require('../gym.js'); let n = 0; const T = (m, f) => { f(); n++; console.log('✓', m); };
const log = (d, ex, ...ws) => ({ d, r: 'x', sets: ws.map(([w, r]) => ({ ex, w, r })) });
const rex = { id: 'dbbench', sets: 3, min: 8, max: 12, rest: 90 };
T('مكتبة التمارين: معرّفات فريدة وعضلات صحيحة', () => { const ids = new Set(G.L.map(e => e.id)); assert.equal(ids.size, G.L.length); G.L.forEach(e => assert.ok(G.MU[e.mu] && G.EQ[e.eq], e.id)); assert.ok(G.L.length >= 40); });
T('الخطط الجاهزة تشير إلى تمارين موجودة', () => { Object.values(G.PLANS).forEach(p => p.routines.forEach(r => r.ex.forEach(x => assert.ok(G.BY[x.id], x.id)))); });
T('e1RM (إبلي)', () => { assert.equal(G.e1rm(100, 10), 133.3); assert.equal(G.e1rm(0, 10), 0); });
T('أول مرة: لا وزن مقترح', () => { const t = G.nextTarget([], rex); assert.equal(t.w, 0); assert.equal(t.r, 8); });
T('لم تبلغ الحد الأعلى: ثبّت الوزن وزد تكرارًا', () => { const t = G.nextTarget([log('2026-11-01', 'dbbench', [20, 8], [20, 8], [20, 9])], rex); assert.equal(t.w, 20); assert.equal(t.r, 9); });
T('بلغت 12 في كل المجموعات: ارفع الوزن وابدأ من 8', () => { const t = G.nextTarget([log('2026-11-01', 'dbbench', [20, 12], [20, 12], [20, 12])], rex); assert.equal(t.w, 22); assert.equal(t.r, 8); });
T('ركود 3 جلسات: تخفيف 10٪', () => {
  const h = [log('2026-11-01', 'dbbench', [20, 9], [20, 9], [20, 9]), log('2026-11-04', 'dbbench', [20, 9], [20, 9], [20, 9]), log('2026-11-08', 'dbbench', [20, 9], [20, 9], [20, 9])];
  const t = G.nextTarget(h, rex); assert.equal(t.deload, true); assert.equal(t.w, 18);
});
T('رقم قياسي: فقط إن تفوّق على السابق', () => { const h = [log('2026-11-01', 'dbbench', [20, 10])]; assert.equal(G.isPR(h, { ex: 'dbbench', w: 22, r: 10 }), true); assert.equal(G.isPR(h, { ex: 'dbbench', w: 18, r: 10 }), false); assert.equal(G.isPR([], { ex: 'dbbench', w: 50, r: 10 }), false); });
T('الحجم الأسبوعي لكل عضلة', () => { const v = G.volume([log('2026-11-02', 'dbbench', [20, 10], [20, 10]), log('2026-11-03', 'curl', [10, 12])], '2026-11-01', '2026-11-07'); assert.equal(v.chest.sets, 2); assert.equal(v.chest.ton, 400); assert.equal(v.bi.sets, 1); });
T('وقت (بلانك): زيادة المدّة', () => { const t = G.nextTarget([log('2026-11-01', 'plank', [0, 30], [0, 30], [0, 30])], { id: 'plank', sets: 3, min: 30, max: 60 }); assert.equal(t.r, 35); });
T('الخطة تُنسخ ولا تُعدّل الأصل', () => { const a = G.applyPlan('fb'); a.routines[0].ex.pop(); assert.equal(G.PLANS.fb.routines[0].ex.length, 6); });
console.log(`\n${n} tests OK`);
