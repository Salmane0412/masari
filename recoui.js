/* مساري — واجهة التعافي: عدّاد، تسجيل يومي، زر «أشعر برغبة»، انتكاس بلا جلد للذات */
(function () {
  const R = window.RECO;
  const rc = () => { S.rec = S.rec || R.blank(); return S.rec; };
  const MOODS = ['😞', '😕', '😐', '🙂', '😊'];
  let urgeT = { end: 0, h: null };

  views.reco = () => {
    const r = rc(), t = todayStr();
    if (!R.started(r)) return `<div class="hero-title">التعافي</div><div class="sub">مساحة خاصة تساعدك على التحرّر من عادة تريد تركها: عدّاد أيام، تسجيل يومي، وخطة جاهزة لحظة الرغبة. بياناتك على جهازك وفي نسختك الاحتياطية فقط.</div>
    <label class="field"><span>لماذا تريد التغيير؟ (ستراها في أصعب لحظة)</span><textarea id="rc-why" rows="3" placeholder="اكتب بكلماتك"></textarea></label>
    <label class="field"><span>بداية العدّ</span><input type="date" id="rc-start" value="${t}" max="${t}"></label>
    <button class="btn pri block big" data-rc="begin">ابدأ</button>`;
    const d = R.days(r, t), m = R.nextMilestone(r, t), done = R.checkedToday(r, t), tops = R.topTriggers(r), hrs = R.riskHours(r), strip = R.strip(r, t, 14);
    return `<div class="hero-title">التعافي</div>
    ${ringHtml(m.frac, d === 0 ? 'اليوم الأول' : d + ' يومًا', m.next ? `التالي: ${m.next} (بعد ${m.left})` : 'بلغتَ أعلى علامة')}
    <div class="kpis"><div class="kpi"><b>${R.best(r, t)}</b><span>أفضل سلسلة</span></div><div class="kpi"><b>${R.total(r, t)}</b><span>مجموع الأيام</span></div><div class="kpi"><b>${r.urges.filter(u => u.won).length}</b><span>رغبة تجاوزتَها</span></div></div>
    <button class="btn pri block big" data-rc="urge">أشعر برغبة الآن</button>
    <div class="btns"><button class="btn${done ? '' : ' pri'}" data-rc="check">${done ? 'سُجّل اليوم ✓' : 'سجّل يومك'}</button><button class="btn" data-rc="relapse">انتكست</button></div>
    <div class="strip">${strip.map(x => `<i class="${x.reset ? 'rs' : x.ok === true ? 'ok' : ''}" title="${x.d}"></i>`).join('')}</div>
    ${r.why ? `<div class="note"><b>لماذا؟</b> ${esc(r.why)} <button class="btn sm" data-rc="why">تعديل</button></div>` : `<button class="btn sm" data-rc="why">أضف سببك</button>`}
    ${tops.length ? `<h2>محفزاتك الأكثر</h2><div class="chips">${tops.map(([k, n]) => `<span class="chip">${esc(k)} · ${n}</span>`).join('')}</div>` : ''}
    ${hrs.length ? `<h2>ساعات الخطر</h2><div class="chips">${hrs.map(x => `<span class="chip">${x.h}:00 · ${x.n}</span>`).join('')}</div><p class="sub">في هذه الساعات احرص على ألا تكون وحدك أمام شاشة.</p>` : ''}
    <h2>علامات فارقة</h2><div class="chips">${R.MILES.map(x => `<span class="chip${d >= x ? ' on' : ''}">${x}${d >= x ? ' ✓' : ''}</span>`).join('')}</div>
    <h2>سياج الحماية</h2><div class="rows">
      <a class="row" href="#/lock" style="text-decoration:none;color:inherit"><span class="main"><span class="t">قفل التطبيقات ورمز الشريك</span><span class="m">أبعد المثيرات خطوةً عنك</span></span><span class="go">‹</span></a>
      <button class="row" data-rc="partner"><span class="main"><span class="t">رسالة طلب مساندة</span><span class="m">انسخها وأرسلها لمن تثق به</span></span><span class="go">نسخ</span></button></div>
    <p class="sub">إن وقعتَ فهذا لا يمحو ما بنيتَ: أيامك تبقى، وتبدأ من جديد بتوبة صادقة.</p>`;
  };

  views.urge = () => {
    const r = rc(), left = Math.max(0, Math.round((urgeT.end - Date.now()) / 1000));
    return `<div class="urgebox"><div class="sub">الرغبة موجة تعلو ثم تنزل خلال ١٥–٢٠ دقيقة. لا تحاربها ولا تنفّذها، راقبها حتى تمرّ.</div>
    <div class="ftime" id="urge-time">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</div>
    ${r.why ? `<div class="note"><b>لماذا؟</b> ${esc(r.why)}</div>` : ''}
    <ol class="steps"><li>قم الآن من مكانك واخرج من الغرفة.</li><li>توضّأ، وصلِّ ركعتين إن استطعت.</li><li>امشِ عشر دقائق بلا هاتف.</li><li>اتصل بمن تثق به أو أرسل له رسالة المساندة.</li><li>استغفر وادعُ، أو اقرأ صفحة من المصحف.</li></ol>
    <div id="breath" class="breath">تنفّس: شهيق ٤ · حبس ٧ · زفير ٨</div>
    <div class="btns"><button class="btn pri" data-rc="won">نجوتُ ✓</button><button class="btn" data-rc="partner">رسالة مساندة</button><button class="btn" data-rc="relapse">انتكست</button></div></div>`;
  };

  function urgeTick() { const el = document.getElementById('urge-time'); if (!el) { clearInterval(urgeT.h); return; } const left = Math.max(0, Math.round((urgeT.end - Date.now()) / 1000)); el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (!left) { clearInterval(urgeT.h); try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { } toast('مرّت الموجة. أحسنت'); } }

  function checkSheet() {
    openSheet(`<h3>كيف كان يومك؟</h3><div class="btns" id="rc-mood">${MOODS.map((m, i) => `<button class="btn" data-rc="mood" data-v="${i + 1}">${m}</button>`).join('')}</div>
    <div class="sub" style="margin:12px 0 6px">ما الذي أتعبك؟ (اختياري)</div><div class="chips" id="rc-trig">${R.TRIG.map(k => `<button class="chip" data-rc="trig" data-k="${k}">${k}</button>`).join('')}</div>
    <button class="btn pri block" style="margin-top:14px" data-rc="saveCheck">حفظ: ثبتّ اليوم</button><button class="btn block" data-act="close">إغلاق</button>`);
  }
  function relapseSheet() {
    openSheet(`<h3>لا بأس، ابدأ من جديد</h3><p class="sub">ما مضى من أيامك محفوظ، ولا تيأس من رحمة الله. دوّن ما حدث لتتعلّم منه.</p>
    <div class="chips" id="rc-trig">${R.TRIG.map(k => `<button class="chip" data-rc="trig" data-k="${k}">${k}</button>`).join('')}</div>
    <label class="field"><span>ماذا ستفعل مختلفًا المرة القادمة؟</span><textarea id="rc-note" rows="2"></textarea></label>
    <button class="btn pri block" data-rc="saveRelapse">سجّل وابدأ من جديد</button><button class="btn block" data-act="close">إغلاق</button>`);
  }
  const sel = { mood: 0, trig: new Set() };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-rc]'); if (!el) return; const d = el.dataset, r = rc(), t = todayStr();
    switch (d.rc) {
      case 'begin': R.begin(r, $('#rc-start').value || t, $('#rc-why').value.trim()); save(); route(); break;
      case 'why': { const v = prompt('لماذا تريد التغيير؟', r.why || ''); if (v !== null) { r.why = v.trim(); save(); route(); } break; }
      case 'urge': urgeT.end = Date.now() + 15 * 60000; clearInterval(urgeT.h); urgeT.h = setInterval(urgeTick, 1000); go('#/urge'); break;
      case 'won': R.urge(r, t, new Date().getHours(), true); R.checkin(r, t, Object.assign({ ok: true }, r.checks[t] || {})); save(); clearInterval(urgeT.h); toast('الحمد لله. تجاوزتَ الموجة'); go('#/reco'); break;
      case 'check': sel.mood = 0; sel.trig = new Set(); checkSheet(); break;
      case 'mood': sel.mood = +d.v; document.querySelectorAll('#rc-mood .btn').forEach(b => b.classList.toggle('pri', +b.dataset.v === sel.mood)); break;
      case 'trig': if (sel.trig.has(d.k)) sel.trig.delete(d.k); else sel.trig.add(d.k); el.classList.toggle('on'); break;
      case 'saveCheck': R.checkin(r, t, { ok: true, mood: sel.mood, trig: [...sel.trig] }); save(); closeSheet(); route(); toast('سُجّل يومك'); break;
      case 'relapse': sel.trig = new Set(); relapseSheet(); break;
      case 'saveRelapse': { const len = R.relapse(r, t, [...sel.trig], ($('#rc-note') || {}).value || ''); save(); closeSheet(); clearInterval(urgeT.h); toast(`حُفظت ${len} يومًا. ابدأ من جديد`); go('#/reco'); break; }
      case 'partner': { const msg = 'أخي، أمرّ بلحظة صعبة وأحتاج دعمك الآن. ادعُ لي وكلّمني إن استطعت.'; (navigator.share ? navigator.share({ text: msg }).catch(() => { }) : (navigator.clipboard && navigator.clipboard.writeText(msg))); toast('جاهزة للإرسال'); break; }
    }
  });
  if (location.hash === '#/reco' || location.hash === '#/urge') route();
})();
