const assert = require('node:assert/strict');
const G = require('../prog.js');
let n = 0; const T = (name, f) => { f(); n++; console.log('✓', name); };
const mk = () => G.blank('2026-11-04', '2027-02-08');

T('jours: 2026-11-04 = mercredi (mem), vendredi = rev, samedi = tath', () => {
  assert.equal(G.kind('2026-11-04'), 'mem'); assert.equal(G.kind('2026-11-06'), 'rev'); assert.equal(G.kind('2026-11-07'), 'tath');
});
T('la semaine commence le dimanche', () => assert.equal(G.weekStart('2026-11-06'), '2026-11-01'));
T('officiel: 2 par jour mem; vendredi/samedi ne comptent pas comme nouveaux', () => {
  const P = mk();
  assert.ok(G.setSlot(P, '2026-11-04', 'a', true)); assert.ok(G.setSlot(P, '2026-11-04', 'b', true));
  assert.ok(G.setSlot(P, '2026-11-06', 'r', true)); assert.ok(G.setSlot(P, '2026-11-07', 't', true));
  assert.equal(G.officialDone(P), 2);
  assert.equal(G.setSlot(P, '2026-11-06', 'a', true), false);   // pas de ربع جديد le vendredi
  assert.equal(G.setSlot(P, '2026-11-01', 'a', true), false);   // avant le début
});
T('anciennes mémorisations: rien de compté au départ', () => { const c = G.calc(mk(), '2026-11-04'); assert.equal(c.official, 0); assert.equal(c.total, 0); assert.equal(c.remaining, 240); });
T('officiel futur depuis le 2026-11-04 jusqu’avant le 2027-02-08', () => {
  // mercredi 4/11/2026 → dimanche 7/2/2027 inclus: 96 jours; jours dim–jeu
  let k = 0; for (let d = '2026-11-04'; d < '2027-02-08'; d = G.add(d, 1)) if (G.kind(d) === 'mem') k++;
  assert.equal(G.futureOfficial(mk(), '2026-11-04'), k * 2);
  assert.equal(k, 68); // 96 jours = 13 semaines (13×5 = 65) + mer, jeu, dim = 3
});
T('suppléments nécessaires par semaine, arrondi supérieur', () => {
  const c = G.calc(mk(), '2026-11-04');
  const need = 240 - 0 - c.futureOfficial; assert.equal(c.needExtra, need);
  assert.equal(c.perWeek, Math.ceil(need / (c.daysLeft / 7)));
  assert.ok(c.perWeek >= 1);
});
T('chaque supplément réduit le besoin futur, sans double compte', () => {
  const P = mk(), a = G.calc(P, '2026-11-04').needExtra;
  G.addExtra(P, '2026-11-04', 3); const b = G.calc(P, '2026-11-04');
  assert.equal(b.needExtra, a - 3); assert.equal(b.total, 3); assert.equal(b.official, 0);
});
T('officiel et supplément restent séparés', () => {
  const P = mk(); G.setSlot(P, '2026-11-04', 'a', true); G.addExtra(P, '2026-11-04', 2);
  const c = G.calc(P, '2026-11-04'); assert.equal(c.official, 1); assert.equal(c.extra, 2); assert.equal(c.total, 3);
});
T('ne dépasse jamais 240', () => {
  const P = mk(); const r = G.addExtra(P, '2026-11-04', 500); assert.equal(r.n, 240); assert.equal(G.totals(P).total, 240);
  assert.equal(G.addExtra(P, '2026-11-04', 1).ok, false); assert.equal(G.setSlot(P, '2026-11-04', 'a', true), false);
});
T('correction / suppression recalculent tout', () => {
  const P = mk(); G.addExtra(P, '2026-11-04', 5); const id = P.extra[0].id;
  G.setExtraN(P, id, 2); assert.equal(G.totals(P).total, 2); G.removeExtra(P, id); assert.equal(G.totals(P).total, 0);
});
T('jours manqués détectés, rattrapables rétroactivement', () => {
  const P = mk(); assert.deepEqual(G.missedDays(P, '2026-11-06').map(x => x.d), ['2026-11-04', '2026-11-05']);
  G.setSlot(P, '2026-11-04', 'a', true); G.setSlot(P, '2026-11-04', 'b', true);
  assert.deepEqual(G.missedDays(P, '2026-11-06').map(x => x.d), ['2026-11-05']);
});
T('objectif irréaliste: message clair avec le nombre nécessaire', () => {
  const P = mk(); P.cap = 3; const c = G.calc(P, '2026-11-04');
  assert.equal(c.feasible, false); assert.ok(G.freeTimeText(c).includes(String(c.perWeek)));
});
T('date de fin: officiel seul ne tient pas 240 avant Ramadan → date annoncée après la limite', () => {
  const c = G.calc(mk(), '2026-11-04'); assert.equal(c.late, true); assert.ok(c.projected > '2027-02-08');
});
T('avec assez de suppléments, la date de fin passe avant la limite', () => {
  const P = mk(); const today = '2026-12-01';
  for (let d = '2026-11-04'; d < today; d = G.add(d, 1)) { if (G.kind(d) === 'mem') { G.setSlot(P, d, 'a', true); G.setSlot(P, d, 'b', true); } G.addExtra(P, d, 2); }
  const c = G.calc(P, today); assert.ok(c.rate > 0); assert.ok(c.projected, 'date'); 
  assert.ok(c.projected < '2027-02-08', c.projected + ' devrait être < 2027-02-08');
});
T('semaine: récap hebdo et jours manqués', () => {
  const P = mk(); G.setSlot(P, '2026-11-04', 'a', true); G.addExtra(P, '2026-11-05', 2);
  const w = G.weekSummary(P, '2026-11-01', '2026-11-07'); assert.equal(w.planned, 4); assert.equal(w.off, 1); assert.equal(w.extra, 2); assert.equal(w.missed, 3);
});
T('terminé: message de fin', () => { const P = mk(); G.addExtra(P, '2026-11-04', 240); assert.ok(G.freeTimeText(G.calc(P, '2026-11-05')).includes('240')); });
console.log(`\n${n} tests OK`);
