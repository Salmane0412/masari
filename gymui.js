/* مساري — واجهة التمارين (تعتمد على gym.js وعلى دوال app.js العامة) */
(function () {
  const X = window.GYM, DAY = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const gy = () => { S.gym = S.gym || { routines: [], week: {}, logs: [], cur: null }; S.gym.logs = S.gym.logs || []; return S.gym; };
  const dowOf = d => parseD(d).getDay();
  const exName = id => (X.BY[id] ? X.BY[id].ar : id);
  const rOf = id => gy().routines.find(r => r.id === id);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  let rest = { end: 0, h: null };

  function restTick() {
    let el = document.getElementById('gymrest'); const left = Math.round((rest.end - Date.now()) / 1000);
    if (left <= 0) { clearInterval(rest.h); rest.h = null; if (el) el.remove(); if (rest.end) { try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) { } toast('انتهت الراحة: المجموعة التالية'); } rest.end = 0; return; }
    if (!el) { el = document.createElement('div'); el.id = 'gymrest'; document.body.appendChild(el); }
    el.innerHTML = `الراحة <b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b> <button class="btn sm" data-gy="skiprest">تخطّي</button>`;
  }
  function startRest(sec) { if (!(sec > 0)) return; rest.end = Date.now() + sec * 1000; clearInterval(rest.h); rest.h = setInterval(restTick, 1000); restTick(); }

  function buildCur(rid) {
    const r = rOf(rid), g = gy(), sets = [];
    r.ex.forEach(rex => { const tg = X.nextTarget(g.logs, rex); for (let k = 0; k < rex.sets; k++) sets.push({ ex: rex.id, w: tg.w || '', r: '', done: false, tr: tg.r, why: k === 0 ? tg.why : '' }); });
    g.cur = { rid, n: r.name, d: todayStr(), start: Date.now(), sets }; save();
  }

  views.gym = () => {
    const g = gy(), t = todayStr(), rid = g.week[dowOf(t)], rt = rid && rOf(rid);
    const logs = g.logs.slice().sort((a, b) => a.d < b.d ? 1 : -1), ws = X.weekStart(t, 0), we = addDays(ws, 6), vol = X.volume(g.logs, ws, we);
    const todayDone = g.logs.some(l => l.d === t);
    const hero = !g.routines.length
      ? `<div class="note">لا برنامج بعد. اختر برنامجًا جاهزًا (يُنسخ كروتين قابل للتعديل):</div><div class="btns">${Object.entries(X.PLANS).map(([k, p]) => `<button class="btn pri" data-gy="plan" data-k="${k}">${p.name}</button>`).join('')}</div>`
      : g.cur ? `<div class="note">جلسة قيد التنفيذ: ${esc(g.cur.n)} <button class="btn pri sm" data-gy="resume">استئناف</button> <button class="btn sm" data-gy="discard">إلغاء</button></div>`
      : rt ? `<div class="note"><b>اليوم:</b> ${esc(rt.name)} · ${rt.ex.length} تمارين ${todayDone ? '· ✓ أُنجزت اليوم' : ''}</div><button class="btn pri block big" data-gy="start" data-r="${rt.id}">${todayDone ? 'جلسة أخرى' : 'ابدأ الجلسة'}</button>`
      : `<div class="note">يوم راحة في برنامجك. المشي ٨–١٠ آلاف خطوة يكفي، أو اختر جلسة: ${g.routines.map(r => `<button class="btn sm" data-gy="start" data-r="${r.id}">${esc(r.name)}</button>`).join(' ')}</div>`;
    const weekRows = DAY.map((n, i) => `<div class="row"><span class="main"><span class="t">${n}${i === dowOf(t) ? ' · اليوم' : ''}</span></span><select data-gyf="week" data-i="${i}"><option value="">راحة</option>${g.routines.map(r => `<option value="${r.id}" ${g.week[i] === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>`).join('');
    const volRows = Object.entries(vol).sort((a, b) => b[1].sets - a[1].sets).map(([m, v]) => `<div class="row"><span class="main"><span class="t">${X.MU[m]}</span><span class="m">${v.sets} مجموعة · حمل ${Math.round(v.ton)} كغ</span></span></div>`).join('');
    const top = {}; g.logs.forEach(l => l.sets.forEach(s => { const e = X.e1rm(s.w, s.r); if (e > (top[s.ex] || 0)) top[s.ex] = e; }));
    const topRows = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, e]) => `<div class="row"><span class="main"><span class="t">${esc(exName(id))}</span><span class="m">أفضل ١RM تقديري ${e} كغ</span></span></div>`).join('');
    return `<div class="hero-title">التمارين</div><div class="sub">روتين أسبوعي وجلسة موجَّهة: الأوزان تُقترح من آخر مرة، ومؤقّت راحة، وتدرّج بالتكرارات، وأرقام قياسية. بياناتك على جهازك وتدخل في النسخة الاحتياطية.</div>
    ${hero}
    <h2>الأسبوع</h2><div class="rows">${g.routines.length ? weekRows : '<div class="empty">ابدأ ببرنامج جاهز.</div>'}</div>
    <h2>الروتينات</h2><div class="rows">${g.routines.map(r => `<div class="row"><span class="main"><span class="t">${esc(r.name)}</span><span class="m">${r.ex.map(x => esc(exName(x.id))).join(' · ')}</span></span><button class="btn sm" data-gy="edit" data-r="${r.id}">تعديل</button></div>`).join('') || '<div class="empty">لا روتين.</div>'}</div>
    <div class="btns">${Object.entries(X.PLANS).map(([k, p]) => `<button class="btn sm" data-gy="plan" data-k="${k}">+ ${p.name}</button>`).join('')}<button class="btn sm" data-gy="newr">+ روتين فارغ</button></div>
    <h2>هذا الأسبوع حسب العضلة</h2><div class="rows">${volRows || '<div class="empty">لا مجموعات مسجّلة هذا الأسبوع.</div>'}</div>
    <h2>أفضل الأرقام</h2><div class="rows">${topRows || '<div class="empty">تظهر بعد أول جلسة.</div>'}</div>
    <h2>آخر الجلسات <span class="count">· ${logs.length}</span></h2>
    <div class="rows">${logs.slice(0, 12).map(l => `<div class="row"><span class="main"><span class="t">${esc(l.n || '')} · ${fmtD(l.d)}</span><span class="m">${l.sets.length} مجموعة · حمل ${Math.round(X.tonnage(l))} كغ${l.pr ? ' · ★ ' + l.pr + ' رقم قياسي' : ''}</span></span><button class="btn sm" data-gy="dellog" data-i="${g.logs.indexOf(l)}">حذف</button></div>`).join('') || '<div class="empty">لا جلسات بعد.</div>'}</div>`;
  };

  views.gymsess = () => {
    const g = gy(), c = g.cur; if (!c) return '<div class="empty">لا جلسة جارية.</div><a class="btn block" href="#/gym">رجوع</a>';
    const r = rOf(c.rid) || { ex: [] }, byEx = [];
    c.sets.forEach((s, i) => { let b = byEx.find(x => x.id === s.ex); if (!b) byEx.push(b = { id: s.ex, ix: [] }); b.ix.push(i); });
    const done = c.sets.filter(s => s.done).length;
    return `<div class="hero-title">${esc(c.n)}</div><div class="sub">${done}/${c.sets.length} مجموعة · ${Math.round((Date.now() - c.start) / 60000)} د</div>
    ${byEx.map(b => { const ex = X.BY[b.id] || { ar: b.id, eq: 'machine' }, rex = r.ex.find(x => x.id === b.id) || { min: 8, max: 12 }, first = c.sets[b.ix[0]], tm = ex.eq === 'time';
      return `<div class="gx"><div class="t">${esc(ex.ar)} <span class="m">· ${X.EQ[ex.eq]} · ${b.ix.length}×${rex.min}–${rex.max}${tm ? ' ث' : ''}</span></div>${first.why ? `<div class="sub">${esc(first.why)}</div>` : ''}
      ${b.ix.map((i, k) => { const s = c.sets[i]; return `<div class="gset${s.done ? ' done' : ''}"><span class="gn">${k + 1}</span>${tm ? '' : `<input inputmode="decimal" placeholder="كغ" value="${s.w}" data-gyf="w" data-i="${i}" ${s.done ? 'disabled' : ''}>`}<input inputmode="numeric" placeholder="${tm ? 'ثانية' : 'تكرار'}${s.tr ? ' ' + s.tr : ''}" value="${s.r}" data-gyf="r" data-i="${i}" ${s.done ? 'disabled' : ''}>${s.done ? `<button class="btn sm" data-gy="undo" data-i="${i}">${s.pr ? '★ ' : ''}تراجع</button>` : `<button class="btn pri sm" data-gy="done" data-i="${i}">✓</button>`}</div>`; }).join('')}</div>`; }).join('')}
    <div class="btns" style="margin-top:14px"><button class="btn pri" data-gy="finish">إنهاء الجلسة</button><button class="btn" data-gy="discard">إلغاء</button><a class="btn" href="#/gym" style="text-decoration:none">رجوع</a></div><div style="height:150px"></div>`;
  };

  function editSheet(rid) {
    const r = rOf(rid), opts = X.L.map(e => `<option value="${e.id}">${esc(e.ar)} — ${X.MU[e.mu]}</option>`).join('');
    openSheet(`<h3>تعديل الروتين</h3><label class="field"><span>الاسم</span><input id="gy-name" value="${esc(r.name)}"></label>
    ${r.ex.map((x, i) => `<div class="gx"><div class="t">${esc(exName(x.id))}</div><div class="two"><label class="field"><span>مجموعات</span><input type="number" data-gyx="sets" data-i="${i}" value="${x.sets}" min="1" max="10"></label><label class="field"><span>راحة (ث)</span><input type="number" data-gyx="rest" data-i="${i}" value="${x.rest || 90}" min="0" max="900"></label></div><div class="two"><label class="field"><span>أدنى تكرار</span><input type="number" data-gyx="min" data-i="${i}" value="${x.min}"></label><label class="field"><span>أعلى تكرار</span><input type="number" data-gyx="max" data-i="${i}" value="${x.max}"></label></div><button class="btn sm" data-gy="rmex" data-r="${rid}" data-i="${i}">حذف التمرين</button></div>`).join('')}
    <label class="field"><span>إضافة تمرين</span><select id="gy-add">${opts}</select></label>
    <div class="btns"><button class="btn pri" data-gy="addex" data-r="${rid}">إضافة</button><button class="btn" data-gy="delr" data-r="${rid}">حذف الروتين</button><button class="btn" data-act="close">تم</button></div>`);
    sheetRid = rid;
  }
  let sheetRid = null;

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-gy]'); if (!el) return; const d = el.dataset, g = gy(), t = todayStr();
    switch (d.gy) {
      case 'plan': { const p = X.applyPlan(d.k); const ids = new Set(g.routines.map(r => r.id)); p.routines.forEach(r => { if (!ids.has(r.id)) g.routines.push(r); }); Object.entries(p.week).forEach(([k, v]) => { if (!g.week[k]) g.week[k] = v; }); save(); route(); toast('أُضيف البرنامج'); break; }
      case 'newr': g.routines.push({ id: 'r' + Date.now().toString(36), name: 'روتين جديد', ex: [] }); save(); route(); break;
      case 'edit': editSheet(d.r); break;
      case 'addex': { const id = $('#gy-add').value, r = rOf(d.r); if (r && id) { const ex = X.BY[id]; r.ex.push({ id, sets: 3, min: ex.eq === 'time' ? 30 : 8, max: ex.eq === 'time' ? 60 : 12, rest: 90 }); save(); editSheet(d.r); route(); } break; }
      case 'rmex': { const r = rOf(d.r); r.ex.splice(+d.i, 1); save(); editSheet(d.r); break; }
      case 'delr': if (confirm('حذف هذا الروتين؟')) { g.routines = g.routines.filter(r => r.id !== d.r); Object.keys(g.week).forEach(k => { if (g.week[k] === d.r) delete g.week[k]; }); save(); closeSheet(); route(); } break;
      case 'start': if (!rOf(d.r).ex.length) return toast('الروتين فارغ'); buildCur(d.r); go('#/gymsess'); break;
      case 'resume': go('#/gymsess'); break;
      case 'discard': if (confirm('إلغاء الجلسة الجارية؟')) { g.cur = null; save(); clearInterval(rest.h); rest.end = 0; const x = document.getElementById('gymrest'); if (x) x.remove(); go('#/gym'); } break;
      case 'skiprest': rest.end = Date.now(); restTick(); break;
      case 'done': {
        const c = g.cur, s = c.sets[+d.i], ex = X.BY[s.ex] || {}, w = ex.eq === 'time' ? 0 : num(s.w), r = Math.floor(num(s.r));
        if (!(r > 0)) return toast('اكتب التكرارات');
        s.w = w; s.r = r; s.done = true; s.pr = w > 0 && X.isPR(g.logs.concat([{ d: t, sets: c.sets.filter(x => x.done && x !== s && x.ex === s.ex) }]), { ex: s.ex, w, r });
        save(); const rex = (rOf(c.rid) || { ex: [] }).ex.find(x => x.id === s.ex); startRest(rex && rex.rest != null ? rex.rest : 90); if (s.pr) toast('★ رقم قياسي جديد'); route(); break;
      }
      case 'undo': { const s = g.cur.sets[+d.i]; s.done = false; s.pr = false; save(); route(); break; }
      case 'finish': {
        const c = g.cur, sets = c.sets.filter(s => s.done).map(s => ({ ex: s.ex, w: s.w, r: s.r }));
        if (!sets.length) return toast('لم تسجّل أي مجموعة');
        const pr = c.sets.filter(s => s.done && s.pr).length, log = { d: c.d, r: c.rid, n: c.n, sets, dur: Math.round((Date.now() - c.start) / 60000), pr };
        g.logs.push(log); g.cur = null; if (S.health && S.health.done) S.health.done[c.d] = true; save();
        clearInterval(rest.h); rest.end = 0; const x = document.getElementById('gymrest'); if (x) x.remove();
        toast(`أحسنت: ${sets.length} مجموعة · حمل ${Math.round(X.tonnage(log))} كغ${pr ? ' · ★ ' + pr : ''}`); go('#/gym'); break;
      }
      case 'dellog': if (confirm('حذف هذه الجلسة؟')) { g.logs.splice(+d.i, 1); save(); route(); } break;
    }
  });
  document.addEventListener('change', e => {
    const el = e.target, g = gy();
    if (el.dataset.gyf === 'week') { if (el.value) g.week[el.dataset.i] = el.value; else delete g.week[el.dataset.i]; save(); return; }
    if (el.dataset.gyf === 'w' || el.dataset.gyf === 'r') { g.cur.sets[+el.dataset.i][el.dataset.gyf] = el.value; save(true); return; }
    if (el.dataset.gyx && sheetRid) { const r = rOf(sheetRid), x = r.ex[+el.dataset.i]; x[el.dataset.gyx] = Math.max(0, Math.floor(+el.value || 0)); if (x.max < x.min) x.max = x.min; save(); return; }
    if (el.id === 'gy-name' && sheetRid) { rOf(sheetRid).name = el.value || 'روتين'; save(); route(); }
  });
  if (location.hash.startsWith('#/gym')) route();
})();
