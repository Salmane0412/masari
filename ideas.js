/* صندوق الأفكار + سجلّ التشخيص العام — لا يخرج شيء من الجهاز إلا بتصدير يدوي */
(function () {
  const $ = s => document.querySelector(s);
  /* ---- سجلّ التشخيص: أخطاء الصفحة، التنقل، الضغطات (بلا نصوص مكتوبة) ---- */
  const DK = 'masari.diag', MAX = 400;
  const rd = () => { try { return JSON.parse(localStorage.getItem(DK)) || []; } catch (e) { return []; } };
  function log(type, msg) { try { const a = rd(); a.push({ t: new Date().toISOString(), type, msg: String(msg).slice(0, 300) }); localStorage.setItem(DK, JSON.stringify(a.slice(-MAX))); } catch (e) { } }
  window.DIAG = { log, get: rd, clear: () => localStorage.removeItem(DK) };
  addEventListener('error', e => log('error', (e.message || '') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => log('promise', e.reason && e.reason.message || e.reason));
  addEventListener('hashchange', () => log('nav', location.hash));
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-act],[data-hz],[data-pl]'); if (b) log('tap', b.dataset.act || b.dataset.hz || 'pl'); }, true);
  log('start', navigator.userAgent + (window.__nativeApp ? ' [app]' : ' [web]'));

  /* ---- صندوق الأفكار ---- */
  const ideas = () => { const S = window.S_get && window.S_get(); return S; };
  window.IDEAS = {
    list() { try { return JSON.parse(localStorage.getItem('masari.ideas')) || []; } catch (e) { return []; } },
    save(a) { localStorage.setItem('masari.ideas', JSON.stringify(a)); }
  };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TAGS = ['تطبيق', 'حفظ', 'علم', 'صحة', 'عمل', 'أخرى'];
  views.ideas = () => {
    const L = IDEAS.list();
    return `<h1>💡 صندوق الأفكار</h1><p class="sub">اكتب الفكرة فور خطورها ولا تحكم عليها الآن. تُراجَع لاحقًا وتُحوَّل إلى مهمة أو تُحذف.</p>
    <label class="field"><span>فكرة جديدة</span><textarea id="idea-t" rows="3"></textarea></label>
    <label class="field"><span>التصنيف</span><select id="idea-c">${TAGS.map(t => `<option>${t}</option>`).join('')}</select></label>
    <div class="btns"><button class="btn pri" data-act="idea-add">حفظ الفكرة</button><button class="btn" data-act="idea-export">تصدير</button></div>
    <div class="rows">${L.length ? L.map(i => `<div class="row"><span class="main"><span class="t">${esc(i.t)}</span><span class="m">${esc(i.c)} · ${i.d}${i.done ? ' · ✔ مُنجزة' : ''}</span></span><button class="btn sm" data-act="idea-done" data-id="${i.id}">${i.done ? 'إعادة' : 'تمّ'}</button><button class="btn sm warn" data-act="idea-del" data-id="${i.id}">حذف</button></div>`).join('') : '<div class="empty">لا أفكار بعد.</div>'}</div>
    <h2>🩺 سجلّ التشخيص</h2><p class="sub">يسجّل أخطاء التطبيق والتنقّل والضغطات (دون ما تكتبه). صدّره وأرسله لي حين يحدث خلل.</p>
    <div class="btns"><button class="btn" data-act="diag-export">تصدير السجلّ</button><button class="btn" data-act="diag-clear">مسح</button></div>`;
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
    if (!/^(idea-|diag-)/.test(a)) return; e.stopImmediatePropagation(); e.preventDefault();
    const L = IDEAS.list();
    if (a === 'idea-add') { const t = ($('#idea-t').value || '').trim(); if (!t) return; L.unshift({ id: Date.now().toString(36), t, c: $('#idea-c').value, d: new Date().toISOString().slice(0, 10) }); IDEAS.save(L); route(); }
    else if (a === 'idea-done') { const i = L.find(x => x.id === b.dataset.id); if (i) i.done = !i.done; IDEAS.save(L); route(); }
    else if (a === 'idea-del') { if (confirm('حذف هذه الفكرة؟')) { IDEAS.save(L.filter(x => x.id !== b.dataset.id)); route(); } }
    else if (a === 'idea-export') download('masari-ideas.json', JSON.stringify(L, null, 1), 'application/json');
    else if (a === 'diag-export') download('masari-diag.json', JSON.stringify({ at: new Date().toISOString(), ua: navigator.userAgent, native: !!window.__nativeApp, hash: location.hash, log: DIAG.get() }, null, 1), 'application/json');
    else if (a === 'diag-clear') { DIAG.clear(); toast('مُسح'); }
  }, true);
})();
