/* مساري — الدروس: يضيف المستخدم «حزمة درس» (ملخص + نقاط + أسئلة QCM) فتصبح مراجعة متباعدة */
(function () {
  const LAD = [1, 3, 7, 14, 30, 60, 120];
  const st = () => { S.study = S.study || { courses: [] }; return S.study; };
  const cid = () => location.hash.split('/')[2];
  const byId = id => st().courses.find(c => c.id === id);
  let run = null; // { id, list, i, pick, score, wrong }

  function dueOf(c, t) { return c.mcq.map((q, i) => i).filter(i => { const s = (c.st || {})[i]; return !s || s.due <= t; }); }
  window.studyDueCount = () => st().courses.reduce((n, c) => n + dueOf(c, todayStr()).length, 0);

  function parsePack(txt) {
    const o = JSON.parse(txt);
    if (!o || !o.title || !Array.isArray(o.mcq) || !o.mcq.length) throw new Error('الملف لا يحتوي عنوانًا وأسئلة (title, mcq).');
    o.mcq.forEach(q => { if (!q.q || !Array.isArray(q.o) || q.o.length < 2 || typeof q.a !== 'number' || q.a < 0 || q.a >= q.o.length) throw new Error('سؤال غير صالح: ' + (q.q || '؟')); });
    return { id: 'c_' + Date.now().toString(36), title: String(o.title), src: o.src || '', summary: o.summary || '', points: (o.points || []).map(String), mcq: o.mcq, st: {}, log: [], added: todayStr() };
  }

  views.study = () => {
    const t = todayStr(), cs = st().courses;
    loadLib();
    return `<div class="hero-title">الدروس</div>
    <div class="sub">أرسل لي في المحادثة نص الدرس أو صورة الصفحة أو تفريغ الصوت، فأعيد لك «حزمة درس»: ملخص ونقاط وأسئلة. استوردها هنا فتُراجَع بالتباعد تلقائيًا.</div>
    <div class="rows">${cs.map(c => { const d = dueOf(c, t).length; return `<a class="row" href="#/course/${c.id}" style="text-decoration:none;color:inherit"><span class="main"><span class="t ar" dir="rtl">${esc(c.title)}</span><span class="m">${c.mcq.length} سؤالًا · ${d ? d + ' مستحق اليوم' : 'لا مستحق اليوم'}</span></span></a>`; }).join('') || '<div class="empty">لا دروس بعد. استورد أول حزمة.</div>'}</div>
    <h2>حزم جاهزة</h2><div id="st-lib" class="rows"><div class="sub">جارٍ التحميل…</div></div>
    <h2>استيراد حزمة</h2>
    <div class="btns"><label class="btn pri" style="display:inline-flex;align-items:center">اختيار ملف (.json)<input type="file" id="st-file" accept="application/json,.json" hidden></label></div>
    <label class="field"><span>أو الصق محتوى الحزمة</span><textarea id="st-paste" dir="ltr" rows="4" placeholder='{"title": "...", "mcq": [...]}'></textarea></label>
    <button class="btn" data-st="paste">استيراد النص الملصوق</button>`;
  };

  async function loadLib() {
    setTimeout(async () => {
      const el = document.getElementById('st-lib'); if (!el) return;
      try {
        const r = await fetch('library/courses.json?' + Date.now()); const L = await r.json(); const have = st().courses.map(c => c.title);
        el.innerHTML = L.map(x => `<button class="row" data-st="lib" data-f="${esc(x.file)}"><span class="main"><span class="t ar" dir="rtl">${esc(x.title)}</span><span class="m">${x.n} سؤالًا ${have.includes(x.title) ? '· مُضافة' : '· اضغط للإضافة'}</span></span></button>`).join('') || '<div class="sub">لا حزم.</div>';
      } catch (e) { el.innerHTML = '<div class="sub">تعذّر تحميل القائمة (يلزم اتصال).</div>'; }
    }, 0);
  }

  views.course = () => {
    const c = byId(cid()); if (!c) return '<div class="empty">الدرس غير موجود.</div><a class="btn" href="#/study">رجوع</a>';
    if (run && run.id === c.id) return runHtml(c);
    const t = todayStr(), d = dueOf(c, t).length, last = c.log[c.log.length - 1];
    return `<div class="hero-title ar" dir="rtl">${esc(c.title)}</div>
    ${c.src ? `<div class="sub">${esc(c.src)}</div>` : ''}
    <div class="btns"><button class="btn pri" data-st="start" data-m="due" ${d ? '' : 'disabled'}>اختبار المستحق (${d})</button><button class="btn" data-st="start" data-m="all">كل الأسئلة</button></div>
    ${last ? `<div class="sub">آخر اختبار: ${last.s}/${last.n} في ${esc(last.d)}</div>` : ''}
    ${c.summary ? `<h2>الملخص</h2><div class="note ar" dir="rtl" style="font-size:18px;line-height:2">${esc(c.summary).replace(/\n/g, '<br>')}</div>` : ''}
    ${c.points.length ? `<h2>النقاط</h2><div class="rows">${c.points.map(p => `<div class="row"><span class="main"><span class="t ar" dir="rtl" style="font-size:18px;line-height:2">${esc(p)}</span></span></div>`).join('')}</div>` : ''}
    <div class="btns" style="margin-top:14px"><a class="btn" href="#/study">رجوع</a><button class="btn warn" data-st="del" data-id="${c.id}">حذف الدرس</button></div>`;
  };

  function runHtml(c) {
    if (run.i >= run.list.length) {
      return `<div class="hero-title">النتيجة</div>${ringHtml(run.score / run.list.length, run.score + ' / ' + run.list.length, '')}
      ${run.wrong.length ? `<h2>ما أخطأت فيه</h2><div class="rows">${run.wrong.map(i => `<div class="row"><span class="main"><span class="t ar" dir="rtl">${esc(c.mcq[i].q)}</span><span class="m ar" dir="rtl">${esc(c.mcq[i].o[c.mcq[i].a])}${c.mcq[i].why ? ' — ' + esc(c.mcq[i].why) : ''}</span></span></div>`).join('')}</div>` : '<div class="note">ما شاء الله، لا أخطاء.</div>'}
      <button class="btn pri block" data-st="end">انتهى</button>`;
    }
    const q = c.mcq[run.list[run.i]], a = run.pick;
    return `<div class="sub">${run.i + 1} / ${run.list.length}</div><div class="hero-title ar" dir="rtl" style="font-size:22px;line-height:1.9">${esc(q.q)}</div>
    <div class="rows">${q.o.map((o, k) => `<button class="row ar" dir="rtl" data-st="pick" data-k="${k}" ${a !== undefined ? 'disabled' : ''} style="${a !== undefined && k === q.a ? 'outline:2px solid var(--mem)' : a === k ? 'outline:2px solid var(--bad,#c44)' : ''}"><span class="main"><span class="t">${esc(o)}</span></span></button>`).join('')}</div>
    ${a !== undefined ? `<div class="note ar" dir="rtl">${a === q.a ? '✓ صحيح' : '✗ الصواب: ' + esc(q.o[q.a])}${q.why ? '<br>' + esc(q.why) : ''}</div><button class="btn pri block" data-st="next">التالي</button>` : ''}`;
  }

  function grade(c, i, ok) {
    c.st = c.st || {}; const s = c.st[i] || { idx: 0, fails: 0 }, t = todayStr();
    if (ok) { s.idx = Math.min(LAD.length - 1, (s.idx || 0) + 1); s.due = addDays(t, LAD[s.idx]); } else { s.idx = 0; s.fails = (s.fails || 0) + 1; s.due = addDays(t, 1); }
    c.st[i] = s;
  }

  async function doImport(txt) {
    try { const c = parsePack(txt); st().courses.push(c); save(); toast('أُضيف الدرس: ' + c.title); go('#/course/' + c.id); }
    catch (e) { toast('تعذّر الاستيراد: ' + e.message); }
  }

  document.addEventListener('change', e => {
    if (e.target.id !== 'st-file') return; const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => doImport(r.result); r.readAsText(f);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return; const a = b.dataset.st, c = byId(cid());
    if (a === 'lib') { fetch('library/' + b.dataset.f).then(r => r.text()).then(doImport).catch(() => toast('تعذّر التحميل')); return; }
    if (a === 'paste') return doImport(($('#st-paste') || {}).value || '');
    if (a === 'del') { if (confirm('حذف هذا الدرس؟')) { st().courses = st().courses.filter(x => x.id !== b.dataset.id); save(); go('#/study'); } return; }
    if (!c) return;
    if (a === 'start') {
      const t = todayStr(); let l = b.dataset.m === 'due' ? dueOf(c, t) : c.mcq.map((q, i) => i);
      l = l.sort(() => Math.random() - 0.5).slice(0, 15); run = { id: c.id, list: l, i: 0, pick: undefined, score: 0, wrong: [] }; route(); return;
    }
    if (!run) return;
    if (a === 'pick') { const k = +b.dataset.k, qi = run.list[run.i], ok = k === c.mcq[qi].a; run.pick = k; if (ok) run.score++; else run.wrong.push(qi); grade(c, qi, ok); save(); route(); }
    else if (a === 'next') { run.i++; run.pick = undefined; if (run.i >= run.list.length) { c.log.push({ d: todayStr(), s: run.score, n: run.list.length }); save(); } route(); }
    else if (a === 'end') { run = null; route(); }
  });
  route(); /* آخر سكربت: أعد التوجيه بعد تسجيل كل الواجهات */
})();
