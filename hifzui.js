/* مساري — الحفظ المتدرّج: آية آية (استماع ← قراءة نظرًا ← غيبًا ← ربط بما قبلها) ثم الربع كاملًا */
(function () {
  'use strict';
  const H = { on: false };
  const cfg = () => ({ look: S.settings.hzLook || 5, mem: S.settings.hzMem || 3, all: 3 });
  const STEPS = [['look', 'اقرأ الآية نظرًا', 'انظر إلى الآية واقرأها بتأنٍّ مع التجويد'], ['mem', 'اقرأها غيبًا', 'الآية مخفية: اقرأها من حفظك، واضغط «إظهار مؤقت» إن احتجت'], ['link', 'اربطها بما قبلها', 'اقرأ من أول المقطع إلى هذه الآية غيبًا مرة واحدة'], ['all', 'المقطع كاملًا', 'اقرأ الربع كاملًا غيبًا']];
  function ayas() { const u = UI[H.unit]; const L = []; for (let g = u.a; g <= u.b; g++) L.push(g); return L; }
  function need() { const c = cfg(); return H.step === 'look' ? c.look : H.step === 'mem' ? c.mem : H.step === 'link' ? 1 : c.all; }
  function paint() {
    const L = ayas(), g = L[H.k], box = document.getElementById('hz-panel'); if (!box) return;
    document.querySelectorAll('.verse').forEach(el => { const v = +el.dataset.v, i = L.indexOf(v); el.classList.remove('hz-cur', 'vh', 'hz-dim');
      if (!H.on) return;
      if (H.step === 'all') { el.classList.add('vh'); return; }
      if (v === g) el.classList.add('hz-cur');
      if ((H.step === 'mem' && v === g) || (H.step === 'link' && i <= H.k)) el.classList.add('vh');
      if (i > H.k) el.classList.add('hz-dim');
    });
    if (!H.on) { box.innerHTML = ''; return; }
    const st = STEPS.find(s => s[0] === H.step), n = need(), pct = Math.round(((H.step === 'all' ? L.length : H.k) / L.length) * 100);
    box.innerHTML = `<div class="hz card">
      <div class="hz-h"><b>${H.step === 'all' ? 'الخطوة الأخيرة' : `الآية ${H.k + 1} من ${L.length}`} · ${st[1]}</b><button class="btn sm" data-hz="stop">إنهاء</button></div>
      <div class="bb sm"><i style="width:${pct}%"></i></div>
      <div class="sub">${st[2]}</div>
      <div class="hz-steps">${STEPS.map(s => `<span class="${s[0] === H.step ? 'on' : ''}">${s[1]}</span>`).join('')}</div>
      <div class="hz-c"><button class="btn" data-hz="listen">▶ استمع</button><div class="big">${H.n}<small> / ${n}</small></div><button class="btn pri" data-hz="plus">+1</button></div>
      <div class="btns"><button class="btn sm" data-hz="reveal">${H.peek ? 'إخفاء' : 'إظهار مؤقت'}</button>${H.step !== 'look' ? '<button class="btn sm" data-hz="again">أخطأت: عُد إلى النظر</button>' : ''}<button class="btn sm" data-hz="next">تخطَّ الخطوة</button></div></div>`;
    if (H.peek) document.querySelectorAll('.verse.vh').forEach(el => el.classList.remove('vh'));
    const cur = document.querySelector('.verse.hz-cur'); if (cur && H.scroll) { cur.scrollIntoView({ block: 'center', behavior: 'smooth' }); H.scroll = false; }
  }
  function advance() {
    const L = ayas(); H.n = 0; H.peek = false; H.scroll = true;
    if (H.step === 'look') H.step = 'mem';
    else if (H.step === 'mem') H.step = H.k > 0 ? 'link' : 'next';
    else if (H.step === 'link') H.step = 'next';
    else if (H.step === 'all') { H.on = false; paint(); toast('أتممت المقطع بالطريقة المتدرّجة. سجّله «حفظته» إن أتقنته.'); say && say('أحسنت'); return; }
    if (H.step === 'next') { H.k++; H.step = H.k >= L.length ? 'all' : 'look'; }
    paint();
  }
  function listen() {
    try { if (H.a) H.a.pause(); const L = ayas(), list = H.step === 'all' ? L : H.step === 'link' ? L.slice(0, H.k + 1) : [L[H.k]]; let i = 0;
      const play = () => { if (i >= list.length || !H.on) return; H.a = new Audio(audioUrl(list[i++])); H.a.onended = play; H.a.play().catch(() => toast('تعذّر تشغيل الصوت')); };
      play(); } catch (e) { toast('تعذّر تشغيل الصوت'); }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hz]'); if (!b) return;
    const a = b.dataset.hz;
    if (a === 'start') { const [, , kind, id] = location.hash.split('/'); if (kind !== 'q') return; Object.assign(H, { on: true, unit: +id, k: 0, step: 'look', n: 0, peek: false, scroll: true }); paint(); return; }
    if (!H.on) return;
    if (a === 'stop') { H.on = false; if (H.a) H.a.pause(); paint(); }
    else if (a === 'plus') { H.n++; try { navigator.vibrate && navigator.vibrate(15); } catch (x) { } if (H.n >= need()) advance(); else paint(); }
    else if (a === 'next') advance();
    else if (a === 'again') { H.step = 'look'; H.n = Math.max(0, cfg().look - 2); H.peek = false; paint(); }
    else if (a === 'reveal') { H.peek = !H.peek; paint(); }
    else if (a === 'listen') listen();
  });
  new MutationObserver(() => { if (H.on && document.getElementById('hz-panel') && !document.querySelector('.hz')) paint(); }).observe(document.getElementById('view'), { childList: true });
  window.addEventListener('hashchange', () => { if (H.on) { H.on = false; if (H.a) H.a.pause(); } });
})();
