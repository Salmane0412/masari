global.window = {}; new Function('window', require('fs').readFileSync(__dirname + '/../data.js', 'utf8'))(global.window);
const L = require('../locate.js'), Q = window.QDATA; L.build(Q.ayas);
const wordsOf = g => Q.ayas[g][2].split(' ').filter(Boolean);
let seed = 7; const rnd = n => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
// السلسلة الكاملة لأخذ مقاطع متصلة
const stream = []; Q.ayas.forEach((a, g) => { let ws = wordsOf(g); if (a[1] === 1 && a[0] !== 1 && a[0] !== 9) ws = ws.slice(4); ws.forEach(w => stream.push([w, g])); });
const noisy = w => { const r = rnd(10); if (r === 0) return null; if (r === 1) return w.replace(/ق/g, 'ك'); if (r === 2) return w.replace(/[ذ]/g, 'ز'); if (r === 3) return w + 'ن'; return w; };
let ok = 0, near = 0, N = 300, wrong = 0, pend = 0;
for (let t = 0; t < N; t++) {
  const st = rnd(stream.length - 10), len = 5 + rnd(4);
  const heard = stream.slice(st, st + len).map(x => noisy(x[0])).filter(x => x);
  const r = L.find(heard); const truth = stream[Math.min(st + len - 1, stream.length - 1)][1];
  if (!r || r.pending) { pend++; continue; }
  const eq = (a, b) => { for (let d = 0; d < 4; d++) { if (!stream[a - d] || !stream[b - d] || L.skel(L.clean(stream[a - d][0])) !== L.skel(L.clean(stream[b - d][0]))) return false; } return true; };
  if (r.ayah === truth || eq(r.pos, st + len - 1)) ok++; else if (Math.abs(r.ayah - truth) <= 1) near++; else wrong++;
}
console.log(`exact ${ok}/${N}, ±1 ${near}, wrong ${wrong}, no-answer ${pend}`);
// البسملة وحدها لا تعطي موضعًا
const b = L.find('بسم الله الرحمن الرحيم'.split(' ')); console.log('bismillah only:', JSON.stringify(b));
// بسملة ثم بداية آية
const g = 2 + 0; const h2 = 'بسم الله الرحمن الرحيم'.split(' ').concat(wordsOf(1000).slice(0, 5)); const r2 = L.find(h2); console.log('bism+ayah1000 ->', r2.ayah, 'expected', 1000);
console.log('(prototype: mesure informative, non bloquante)');
