/* مساري — منطق التمارين (دوال نقيّة قابلة للاختبار). فكرة الميزات مستوحاة من تطبيقات تتبّع التمرين
 * المفتوحة (تخطيط أسبوعي، جلسة موجَّهة، تدرّج بالتكرارات، أرقام قياسية)، والكود والمكتبة كتبتُهما من الصفر.
 *
 * سجل: { d:'YYYY-MM-DD', r:'معرّف الروتين', n:'اسم', sets:[{ex, w, r, t?}], dur? }
 * تمرين في روتين: { id, sets, min, max, rest, inc? }
 */
(function (root) {
  const MU = { chest: 'الصدر', back: 'الظهر', sh: 'الأكتاف', bi: 'البايسبس', tri: 'الترايسبس', quad: 'الفخذ الأمامي', ham: 'الفخذ الخلفي', glute: 'الأرداف', calf: 'السمانة', core: 'البطن والجذع', cardio: 'تحمّل' };
  const EQ = { bar: 'بار', db: 'دمبل', machine: 'جهاز', cable: 'كيبل', body: 'وزن الجسم', time: 'وقت', cardio: 'تحمّل' };
  // [id, الاسم, العضلة, المعدّات, مركّب؟]
  const L = [
    ['bench', 'ضغط الصدر بالبار', 'chest', 'bar', 1], ['dbbench', 'ضغط الصدر بالدمبل', 'chest', 'db', 1], ['chestpress', 'ضغط الصدر بالجهاز', 'chest', 'machine', 1], ['incdb', 'ضغط مائل بالدمبل', 'chest', 'db', 1], ['pushup', 'تمرين الضغط (بوش أب)', 'chest', 'body', 1], ['fly', 'تفتيح الصدر بالجهاز', 'chest', 'machine', 0],
    ['pulldown', 'سحب أمامي (لات)', 'back', 'cable', 1], ['barrow', 'تجديف بالبار', 'back', 'bar', 1], ['dbrow', 'تجديف بالدمبل بيد واحدة', 'back', 'db', 1], ['mrow', 'تجديف بالجهاز جالسًا', 'back', 'machine', 1], ['pullup', 'عقلة', 'back', 'body', 1], ['facepull', 'سحب الحبل للوجه', 'sh', 'cable', 0],
    ['squat', 'سكوات بالبار', 'quad', 'bar', 1], ['goblet', 'سكوات الكأس بدمبل', 'quad', 'db', 1], ['legpress', 'ضغط الأرجل بالجهاز', 'quad', 'machine', 1], ['lunge', 'اندفاع بالدمبل', 'quad', 'db', 1], ['legext', 'فرد الأرجل بالجهاز', 'quad', 'machine', 0], ['bsquat', 'سكوات بوزن الجسم', 'quad', 'body', 1],
    ['rdl', 'رفعة رومانية بالبار', 'ham', 'bar', 1], ['dbrdl', 'رفعة رومانية بالدمبل', 'ham', 'db', 1], ['legcurl', 'ثني الأرجل بالجهاز', 'ham', 'machine', 0], ['hipthrust', 'رفع الورك (هيب ثرست)', 'glute', 'bar', 1], ['glutebr', 'جسر الأرداف بوزن الجسم', 'glute', 'body', 0], ['calf', 'رفع السمانة بالجهاز', 'calf', 'machine', 0],
    ['ohp', 'ضغط الكتف بالبار', 'sh', 'bar', 1], ['dbohp', 'ضغط الكتف بالدمبل', 'sh', 'db', 1], ['shpress', 'ضغط الكتف بالجهاز', 'sh', 'machine', 1], ['lateral', 'رفرفة جانبية بالدمبل', 'sh', 'db', 0], ['reardelt', 'رفرفة خلفية بالجهاز', 'sh', 'machine', 0],
    ['curl', 'ثني البايسبس بالدمبل', 'bi', 'db', 0], ['ezcurl', 'ثني بالبار المنحني', 'bi', 'bar', 0], ['hammer', 'ثني المطرقة', 'bi', 'db', 0],
    ['pushdown', 'دفع الترايسبس بالكيبل', 'tri', 'cable', 0], ['skull', 'ترايسبس فرنسي بالدمبل', 'tri', 'db', 0], ['dips', 'متوازي (ديبس)', 'tri', 'body', 1],
    ['plank', 'بلانك', 'core', 'time', 0], ['crunch', 'كرنش', 'core', 'body', 0], ['legraise', 'رفع الساقين', 'core', 'body', 0], ['sideplank', 'بلانك جانبي', 'core', 'time', 0],
    ['walk', 'مشي سريع', 'cardio', 'cardio', 0], ['bike', 'دراجة', 'cardio', 'cardio', 0],
  ].map(([id, ar, mu, eq, comp]) => ({ id, ar, mu, eq, comp: !!comp }));
  const BY = Object.fromEntries(L.map(e => [e.id, e]));

  const E = (id, sets, min, max, rest) => ({ id, sets, min, max, rest: rest || 90 });
  const PLANS = {
    fb: { name: 'جسم كامل (أ / ب)', routines: [
      { id: 'fba', name: 'جسم كامل أ', ex: [E('goblet', 3, 8, 12, 90), E('dbbench', 3, 8, 12, 90), E('pulldown', 3, 8, 12, 90), E('dbohp', 2, 10, 12, 75), E('legcurl', 2, 10, 15, 60), E('plank', 3, 30, 60, 45)] },
      { id: 'fbb', name: 'جسم كامل ب', ex: [E('legpress', 3, 10, 15, 90), E('chestpress', 3, 8, 12, 90), E('mrow', 3, 10, 12, 90), E('dbrdl', 3, 8, 12, 90), E('facepull', 2, 12, 15, 60), E('crunch', 3, 12, 20, 45)] }],
      week: { 6: 'fba', 1: 'fbb', 3: 'fba' } },                       // السبت أ، الإثنين ب، الأربعاء أ
    ul: { name: 'علوي / سفلي', routines: [
      { id: 'ula', name: 'علوي', ex: [E('dbbench', 3, 6, 10, 120), E('mrow', 3, 8, 12, 90), E('dbohp', 3, 8, 12, 90), E('pulldown', 3, 8, 12, 90), E('curl', 2, 10, 12, 60), E('pushdown', 2, 10, 12, 60)] },
      { id: 'ulb', name: 'سفلي', ex: [E('squat', 3, 6, 10, 150), E('dbrdl', 3, 8, 12, 120), E('legpress', 3, 10, 15, 90), E('legcurl', 3, 10, 15, 60), E('calf', 3, 12, 20, 45), E('plank', 3, 30, 60, 45)] }],
      week: { 6: 'ula', 1: 'ulb', 3: 'ula', 4: 'ulb' } },
    ppl: { name: 'دفع / سحب / أرجل', routines: [
      { id: 'pushd', name: 'دفع', ex: [E('dbbench', 3, 6, 10, 120), E('incdb', 3, 8, 12, 90), E('dbohp', 3, 8, 12, 90), E('lateral', 3, 12, 15, 60), E('pushdown', 3, 10, 12, 60)] },
      { id: 'pulld', name: 'سحب', ex: [E('pulldown', 3, 8, 12, 90), E('dbrow', 3, 8, 12, 90), E('facepull', 3, 12, 15, 60), E('curl', 3, 10, 12, 60), E('hammer', 2, 10, 12, 60)] },
      { id: 'legsd', name: 'أرجل', ex: [E('squat', 3, 6, 10, 150), E('dbrdl', 3, 8, 12, 120), E('legpress', 3, 10, 15, 90), E('legcurl', 3, 10, 15, 60), E('calf', 3, 12, 20, 45)] }],
      week: { 6: 'pushd', 0: 'pulld', 1: 'legsd', 3: 'pushd', 4: 'pulld', 5: 'legsd' } },
  };

  const INC = { bar: 2.5, db: 2, machine: 5, cable: 2.5, body: 0, time: 5, cardio: 0 };
  const incOf = (rex) => rex.inc != null ? rex.inc : (INC[(BY[rex.id] || {}).eq] ?? 2.5);
  const round = (x, step) => step > 0 ? Math.round(x / step) * step : Math.round(x * 10) / 10;

  const e1rm = (w, r) => (w > 0 && r > 0) ? Math.round(w * (1 + Math.min(r, 12) / 30) * 10) / 10 : 0;

  function lastSessions(logs, exId, n) { // أحدث الجلسات التي تضمّنت التمرين
    return logs.slice().sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0).map(l => ({ d: l.d, sets: l.sets.filter(s => s.ex === exId && s.r > 0) })).filter(x => x.sets.length).slice(0, n || 3);
  }

  // تدرّج مزدوج: حين تبلغ كل المجموعات أعلى التكرارات يزداد الوزن؛ وإلا يزداد التكرار؛ وعند الركود 3 جلسات يُخفَّض الحمل
  function nextTarget(logs, rex) {
    const ex = BY[rex.id] || { eq: 'machine' }, inc = incOf(rex), h = lastSessions(logs, rex.id, 3);
    if (!h.length) return { w: 0, r: rex.min, why: ex.eq === 'time' ? 'أول مرة: ابدأ بمدّة تتحمّلها بجودة.' : ex.eq === 'body' ? 'أول مرة: اعمل أقصى تكرارات نظيفة.' : `أول مرة: اختر وزنًا تؤدّي به ${rex.max} تكرارًا بسهولة واترك 2–3 تكرارات في المخزون.` };
    const last = h[0].sets, w = Math.max(...last.map(s => s.w)), rs = last.filter(s => s.w === w).map(s => s.r), minR = Math.min(...rs), full = last.length >= Math.min(rex.sets, last.length) && rs.every(r => r >= rex.max);
    const stalled = h.length >= 3 && h.every(x => Math.max(...x.sets.map(s => s.w)) === w && Math.max(...x.sets.map(s => s.r)) <= Math.max(...h[h.length - 1].sets.map(s => s.r)));
    if (ex.eq === 'time') return { w: 0, r: Math.min(rex.max, minR + inc), why: `زِد المدّة قليلًا (${minR} ← ${Math.min(rex.max, minR + inc)} ثانية).` };
    if (stalled && w > 0) { const nw = Math.max(0, round(w * 0.9, inc || 1)); return { w: nw, r: rex.min, why: `ركود ٣ جلسات: خفّف الحمل ١٠٪ (${w} ← ${nw}) ثم ارجع تصعد.`, deload: true }; }
    if (full) return { w: w > 0 ? round(w + inc, inc) : 0, r: rex.min, why: w > 0 ? `بلغتَ ${rex.max} في كل المجموعات: ارفع الوزن (${w} ← ${round(w + inc, inc)}) وابدأ من ${rex.min}.` : `أتممتَ ${rex.max}: أضف تكرارًا أو ثقلًا.` };
    return { w, r: Math.min(rex.max, Math.max(rex.min, minR + 1)), why: `ثبّت الوزن ${w} وحاول ${Math.min(rex.max, Math.max(rex.min, minR + 1))} تكرارًا في كل المجموعات.` };
  }

  function bestE1rm(logs, exId) { let b = 0; logs.forEach(l => l.sets.forEach(s => { if (s.ex === exId) b = Math.max(b, e1rm(s.w, s.r)); })); return b; }
  function isPR(logs, set) { // رقم قياسي: e1RM أعلى من أي سابق (لا يُعدّ الأول)
    const prior = bestE1rm(logs, set.ex); return prior > 0 && e1rm(set.w, set.r) > prior;
  }

  const weekStart = (s, startDay) => { const d = new Date(s + 'T12:00:00'); const k = (d.getDay() - (startDay || 0) + 7) % 7; d.setDate(d.getDate() - k); return d.toISOString ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : s; };
  function volume(logs, a, b) { // مجموعات وحمل لكل عضلة في المدى
    const out = {}; logs.filter(l => l.d >= a && l.d <= b).forEach(l => l.sets.forEach(s => { const mu = (BY[s.ex] || {}).mu; if (!mu) return; const o = out[mu] = out[mu] || { sets: 0, ton: 0 }; o.sets++; o.ton += (s.w || 0) * (s.r || 0); }));
    return out;
  }
  const tonnage = l => l.sets.reduce((n, s) => n + (s.w || 0) * (s.r || 0), 0);
  function applyPlan(key) { const p = PLANS[key]; return { routines: JSON.parse(JSON.stringify(p.routines)), week: Object.assign({}, p.week) }; }

  const api = { MU, EQ, L, BY, PLANS, incOf, e1rm, lastSessions, nextTarget, bestE1rm, isPR, volume, tonnage, applyPlan, weekStart };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GYM = api;
})(typeof window !== 'undefined' ? window : globalThis);
