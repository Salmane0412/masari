/* مساري — واجهة المهام: إدخال سريع، اليوم/القادمة/المشاريع/المنجزة، مهام فرعية وتكرار */
(function () {
  'use strict';
  const K = window.TASKS;
  const D = () => { S.tasks = K.ensure(S.tasks); return S.tasks; };
  let tab = 'today', proj = '';
  const REP_IC = '↻';
  const dueTxt = (it, t) => {
    if (!it.due) return '';
    const d = diffDays(t, it.due), w = d === 0 ? 'اليوم' : d === 1 ? 'غدًا' : d === -1 ? 'أمس' : d < 0 ? `متأخرة ${-d} يومًا` : d < 7 ? fmtD(it.due, { weekday: 'long' }) : fmtD(it.due, { day: 'numeric', month: 'short' });
    return w + (it.time ? ' ' + it.time : '');
  };
  function row(it, t) {
    const late = it.due && it.due < t && !it.done, subs = it.sub.length ? ` · ${it.sub.filter(s => s.d).length}/${it.sub.length}` : '';
    return `<div class="trow p${it.pr}${it.done ? ' done' : ''}${late ? ' late' : ''}">
      <button class="tchk" data-tk="toggle" data-id="${it.id}" aria-label="${it.done ? 'إلغاء الإنجاز' : 'إنجاز'}" aria-pressed="${!!it.done}"><i></i></button>
      <button class="tbody" data-tk="edit" data-id="${it.id}"><span class="tt">${esc(it.t)}</span><span class="m">${[it.p && esc(it.p), dueTxt(it, t), it.rep && REP_IC + ' ' + K.REP[it.rep]].filter(Boolean).join(' · ')}${subs}${it.n ? ' · ✎' : ''}</span></button></div>`;
  }
  function gcal(it) {
    const d = it.due.replace(/-/g, ''); let dates;
    if (it.time) { const [h, m] = it.time.split(':').map(Number), e = new Date(2000, 0, 1, h, m + 30); dates = `${d}T${it.time.replace(':', '')}00/${d}T${String(e.getHours()).padStart(2, '0')}${String(e.getMinutes()).padStart(2, '0')}00`; }
    else dates = `${d}/${addDays(it.due, 1).replace(/-/g, '')}`;
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(it.t) + '&dates=' + dates + '&ctz=Europe/Paris&details=' + encodeURIComponent((it.n || '') + (it.p ? '\n#' + it.p : ''));
  }
  function ics(items) {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Masari//Taches//AR'], z = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    items.forEach(it => { const d = it.due.replace(/-/g, ''); L.push('BEGIN:VEVENT', 'UID:' + it.id + '@masari', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'SUMMARY:' + z(it.t));
      if (it.time) { L.push('DTSTART;TZID=Europe/Paris:' + d + 'T' + it.time.replace(':', '') + '00', 'DURATION:PT30M'); } else L.push('DTSTART;VALUE=DATE:' + d);
      if (it.n) L.push('DESCRIPTION:' + z(it.n)); L.push('BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:' + z(it.t), 'END:VALARM', 'END:VEVENT'); });
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }
  const list = (L, t, empty) => L.length ? `<div class="tlist">${L.map(x => row(x, t)).join('')}</div>` : (empty ? `<div class="empty">${empty}</div>` : '');

  views.tasks = () => {
    const T = D(), t = todayStr(), b = K.buckets(T, t, proj), st = K.stats(T, t);
    const tabs = [['today', 'اليوم', b.late.length + b.today.length], ['soon', 'القادمة', b.soon.length + b.later.length], ['all', 'المشاريع', 0], ['done', 'المنجزة', 0]];
    let body = '';
    if (tab === 'today') body = (b.late.length ? `<h2 class="neg">متأخرة · ${b.late.length}</h2>${list(b.late, t)}` : '') + `<h2>اليوم · ${fmtD(t, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>${list(b.today, t, b.late.length ? '' : 'لا مهام لليوم. أضف واحدة بالأعلى أو استمتع بيومك.')}` + (b.nodate.length ? `<details class="more"><summary>بلا تاريخ · ${b.nodate.length}</summary>${list(b.nodate, t)}</details>` : '');
    else if (tab === 'soon') { const days = {}; b.soon.forEach(x => { (days[x.due] = days[x.due] || []).push(x); }); body = Object.keys(days).map(d => `<h2>${fmtD(d, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>${list(days[d], t)}`).join('') + (b.later.length ? `<h2>لاحقًا</h2>${list(b.later, t)}` : '') || '<div class="empty">لا شيء في الأيام القادمة.</div>'; }
    else if (tab === 'all') body = T.projects.map(p => { const L = T.items.filter(x => !x.done && x.p === p).sort((a, c) => a.pr - c.pr || (a.due || '9') < (c.due || '9') ? -1 : 1); return L.length ? `<h2>${esc(p)} · ${L.length}</h2>${list(L, t)}` : ''; }).join('') + (() => { const L = T.items.filter(x => !x.done && !x.p); return L.length ? `<h2>بلا مشروع · ${L.length}</h2>${list(L, t)}` : ''; })() || '<div class="empty">لا مهام مفتوحة.</div>';
    else body = list(b.done.slice(0, 60), t, 'لا مهام منجزة بعد.') + (b.done.length ? `<div class="btns" style="margin-top:10px"><button class="btn sm" data-tk="purge">حذف المنجز الأقدم من 30 يومًا</button></div>` : '');
    return `<div class="hero-title">المهام</div>
      <div class="sub">${st.open} مفتوحة · ${st.doneWeek} أُنجزت هذا الأسبوع${st.late ? ` · <b class="neg">${st.late} متأخرة</b>` : ''}</div>
      <form class="tadd" data-tk-form="1"><input type="text" id="tk-quick" placeholder="مهمة جديدة… مثال: اتصل بالقنصلية غدًا 10:00 #البيت !1" autocomplete="off" enterkeyhint="done"><button class="btn pri" type="submit" aria-label="أضف">+</button></form>
      <div class="sub tk-help">#مشروع · !1 عاجل · !2 مهم · اليوم/غدًا/الجمعة/16/11 · 10:00 · كل يوم/أسبوع/شهر</div>
      <div class="seg full" role="tablist">${tabs.map(([k, l, n]) => `<button data-tk="tab" data-k="${k}" aria-pressed="${tab === k}">${l}${n ? ` <small>${n}</small>` : ''}</button>`).join('')}</div>
      <div class="chips scroll">${['', ...T.projects].map(p => `<button class="chip${proj === p ? ' on' : ''}" data-tk="proj" data-p="${esc(p)}">${p ? esc(p) : 'الكل'}</button>`).join('')}<button class="chip" data-tk="proj-add">+ مشروع</button></div>
      ${body}
      <details class="more"><summary>استيراد أو تصدير</summary><div class="sub">استورد قائمة مهام بصيغة JSON (يعدّها لك Claude من رسالتك)، أو صدّر مهامك.</div>
      <div class="btns" style="margin:8px 0"><label class="btn" style="display:inline-flex;align-items:center">استيراد ملف<input type="file" id="tk-imp" accept=".json,application/json" hidden></label><button class="btn" data-tk="export">تصدير</button><button class="btn" data-tk="ics">المهام المؤرّخة إلى التقويم (.ics)</button></div></details>`;
  };

  function sheet(it) {
    const T = D();
    openSheet(`<h3>${it ? 'المهمة' : 'مهمة جديدة'}</h3>
      <label class="field"><span>العنوان</span><input type="text" id="tk-t" value="${esc(it ? it.t : '')}"></label>
      <div class="two"><label class="field"><span>المشروع</span><select id="tk-p"><option value="">بلا مشروع</option>${T.projects.map(p => `<option${it && it.p === p ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
      <label class="field"><span>التكرار</span><select id="tk-rep">${Object.entries(K.REP).map(([k, l]) => `<option value="${k}"${(it ? it.rep : '') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="two"><label class="field"><span>التاريخ</span><input type="date" id="tk-due" value="${it ? it.due : ''}"></label><label class="field"><span>الوقت</span><input type="time" id="tk-time" value="${it ? it.time : ''}"></label></div>
      <div class="field"><span class="flabel">الأولوية</span><div class="seg full" role="group">${[1, 2, 3].map(p => `<button data-tk="pr" data-p="${p}" aria-pressed="${(it ? it.pr : 3) === p}">${K.PR[p]}</button>`).join('')}</div><input type="hidden" id="tk-pr" value="${it ? it.pr : 3}"></div>
      <label class="field"><span>ملاحظات</span><textarea id="tk-n" rows="3" style="min-height:80px">${esc(it ? it.n : '')}</textarea></label>
      ${it ? `<div class="field"><span class="flabel">خطوات</span><div class="tlist">${it.sub.map((s, i) => `<div class="trow sub${s.d ? ' done' : ''}"><button class="tchk" data-tk="sub" data-id="${it.id}" data-i="${i}" aria-pressed="${s.d}"><i></i></button><span class="tbody"><span class="tt">${esc(s.t)}</span></span><button class="btn sm" data-tk="subdel" data-id="${it.id}" data-i="${i}" aria-label="حذف">✕</button></div>`).join('')}</div>
        <div class="tadd"><input type="text" id="tk-sub" placeholder="خطوة جديدة"><button class="btn" data-tk="subadd" data-id="${it.id}">+</button></div></div>
        ${it.rep && it.cnt ? `<div class="sub">أُنجزت ${it.cnt} مرة${it.lastDone ? ' · آخرها ' + fmtD(it.lastDone) : ''}</div>` : ''}` : ''}
      <div class="btns" style="margin-top:12px"><button class="btn pri" data-tk="save" data-id="${it ? it.id : ''}">حفظ</button>${it ? `<button class="btn" data-tk="tomorrow" data-id="${it.id}">إلى الغد</button>${it.due ? `<a class="btn" href="${gcal(it)}" target="_blank" rel="noopener" style="text-decoration:none">＋ تقويم Google</a>` : ''}<button class="btn warn" data-tk="del" data-id="${it.id}">حذف</button>` : ''}<button class="btn" data-act="close">إغلاق</button></div>`);
  }
  const rerender = () => { if (!location.hash.startsWith('#/tasks')) return route(); const y = scrollY; $('#view').innerHTML = views.tasks(); scrollTo(0, y); };

  document.addEventListener('submit', e => {
    if (!e.target.dataset || !e.target.dataset.tkForm) return; e.preventDefault();
    const inp = $('#tk-quick'), v = inp.value.trim(); if (!v) return;
    const T = D(), q = K.parseQuick(v, todayStr(), T.projects);
    if (!q.p && proj) q.p = proj;
    try { K.add(T, q, todayStr()); } catch (x) { return toast(x.message); }
    save(); rerender(); const i = $('#tk-quick'); if (i) i.focus();
    toast(q.due ? 'أُضيفت · ' + dueTxt(q, todayStr()) : 'أُضيفت');
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-tk]'); if (!b) return;
    const T = D(), id = b.dataset.id, it = id ? T.items.find(x => x.id === id) : null, t = todayStr();
    switch (b.dataset.tk) {
      case 'tab': tab = b.dataset.k; rerender(); break;
      case 'proj': proj = b.dataset.p; rerender(); break;
      case 'proj-add': { const n = prompt('اسم المشروع'); if (n && n.trim() && !T.projects.includes(n.trim())) { T.projects.push(n.trim()); save(); proj = n.trim(); rerender(); } break; }
      case 'toggle': {
        K.toggle(T, id, t); save();
        const el = b.closest('.trow'); if (el && !it.rep) { el.classList.add('pop'); setTimeout(rerender, 260); } else rerender();
        if (it.rep && !it.done) toast('أُنجزت · الموعد القادم ' + fmtD(it.due)); else if (it.done) toast('أحسنت ✓');
        break;
      }
      case 'edit': sheet(it); break;
      case 'pr': document.querySelectorAll('[data-tk="pr"]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#tk-pr').value = b.dataset.p; break;
      case 'save': {
        const o = { t: $('#tk-t').value.trim(), p: $('#tk-p').value, rep: $('#tk-rep').value, due: $('#tk-due').value, time: $('#tk-time').value, pr: +$('#tk-pr').value, n: $('#tk-n').value.trim() };
        if (!o.t) return toast('اكتب العنوان');
        if (o.rep && !o.due) o.due = t;
        if (it) Object.assign(it, o); else K.add(T, o, t);
        save(); closeSheet(); rerender(); toast('حُفظت'); break;
      }
      case 'tomorrow': it.due = addDays(t, 1); save(); closeSheet(); rerender(); toast('أُجّلت إلى الغد'); break;
      case 'del': if (confirm('حذف المهمة؟')) { T.items = T.items.filter(x => x.id !== id); save(); closeSheet(); rerender(); } break;
      case 'sub': it.sub[+b.dataset.i].d = !it.sub[+b.dataset.i].d; save(); sheet(it); rerender(); break;
      case 'subdel': it.sub.splice(+b.dataset.i, 1); save(); sheet(it); rerender(); break;
      case 'subadd': { const v = $('#tk-sub').value.trim(); if (!v) return; it.sub.push({ t: v, d: false }); save(); sheet(it); rerender(); setTimeout(() => { const i = $('#tk-sub'); if (i) i.focus(); }, 30); break; }
      case 'purge': { const n = K.purgeDone(T, addDays(t, -30)); save(); rerender(); toast(n ? `حُذفت ${n}` : 'لا شيء أقدم من 30 يومًا'); break; }
      case 'ics': { const L = T.items.filter(x => !x.done && x.due && x.due >= t); if (!L.length) return toast('لا مهام مؤرّخة قادمة'); download('masari-taches.ics', ics(L), 'text/calendar'); toast('افتح الملف ليُضاف إلى تقويمك'); break; }
      case 'export': download(`masari-taches-${t}.json`, JSON.stringify({ projects: T.projects, items: T.items }, null, 1), 'application/json'); break;
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'tk-sub') { e.preventDefault(); const b = document.querySelector('[data-tk="subadd"]'); if (b) b.click(); } });
  document.addEventListener('change', e => {
    if (e.target.id !== 'tk-imp') return; const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => {
      try {
        const o = JSON.parse(r.result), T = D(), arr = Array.isArray(o) ? o : o.items || o.tasks; if (!Array.isArray(arr)) throw 0;
        (o.projects || []).forEach(p => { if (!T.projects.includes(p)) T.projects.push(p); });
        const have = new Set(T.items.map(x => x.t + '|' + x.due)); let n = 0;
        arr.forEach(x => { const it = typeof x === 'string' ? K.parseQuick(x, todayStr(), T.projects) : x; if (!it.t || have.has(it.t + '|' + (it.due || ''))) return; K.add(T, { t: it.t, n: it.n || it.notes || '', p: it.p || it.project || '', due: it.due || (it.rep ? todayStr() : ''), time: it.time || '', pr: +it.pr || 3, rep: it.rep || '', sub: (it.sub || []).map(s => typeof s === 'string' ? { t: s, d: false } : s) }, todayStr()); n++; });
        save(); rerender(); toast(`استوردت ${n} مهمة`);
      } catch (x) { toast('ملف غير صالح'); }
    };
    r.readAsText(f);
  });

  // في صفحة «اليوم»: المهام المتأخرة ومهام اليوم
  window.TODAY_HOOKS = window.TODAY_HOOKS || [];
  window.TODAY_HOOKS.push(() => {
    if (!S.tasks || !S.tasks.items.length) return `<h2>المهام</h2><div class="rows"><a class="row" href="#/tasks" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat">نظّم مهامك</span><span class="m">المقرأة، العمل، البيت، الإدارة… بإدخال سريع</span></span><span class="go">‹</span></a></div>`;
    const t = todayStr(), b = K.buckets(S.tasks, t), L = b.late.concat(b.today);
    return `<h2>المهام <span class="count">· ${L.length ? L.length + ' لليوم' : 'لا شيء لليوم'}</span> <a class="hlink" href="#/tasks">الكل</a></h2>${L.length ? `<div class="tlist">${L.slice(0, 6).map(x => row(x, t)).join('')}</div>${L.length > 6 ? `<a class="sub" href="#/tasks">و${L.length - 6} أخرى…</a>` : ''}` : '<div class="empty">لا مهام لليوم.</div>'}`;
  });
  window.TODAY_HOOKS.push(() => {
    const f = window.finSummary && window.finSummary(); if (!f) return '';
    const items = f.up.map(u => `<div class="row${u.late ? ' late' : ''}"><span class="main"><span class="t lat">${esc(u.r.name)}</span><span class="m">${u.late ? 'متأخر · ' : ''}${fmtD(u.d, { weekday: 'long' })}</span></span><button class="btn sm" data-fn="recur-pay" data-id="${u.r.id}">${u.r.kind === 'in' ? 'وصل' : 'دُفع'}</button></div>`);
    if (f.z.hawl && f.z.hawl.reached && f.z.above) items.unshift(`<a class="row" href="#/fin/zakat" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat">حال حول الزكاة</span><span class="m">المحسوب ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(f.z.due)}</span></span><span class="go">‹</span></a>`);
    return items.length ? `<h2>المال <a class="hlink" href="#/fin">المزيد</a></h2><div class="rows">${items.join('')}</div>` : '';
  });
})();
