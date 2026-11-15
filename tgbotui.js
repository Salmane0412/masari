/* مساري — واجهة مساعد تيليغرام: ملخّص وإشعارات وردود تلقائية. الإعدادات فقط؛ الربط بالحساب يأتي لاحقًا بموافقتك الصريحة. */
(function () {
  'use strict';
  const DEF = () => ({
    on: false, digest: ['13:00', '21:00'], watch: [], keywords: [], courses: [],
    busyText: 'السلام عليكم، أنا مشغول جدًّا في الأيام الأخيرة ولا تصلني الإشعارات دائمًا. إن كان الأمر مهمًّا فاتصل بي مباشرة وسأردّ عليك.',
    callText: 'السلام عليكم، لم أرَ رسالتك بعد. اتصل بي مباشرة من فضلك لأتمكّن من تلبية طلبك.',
    cooldownH: 12, vip: []   // vip: [{ n: الاسم, mode: 'call' | 'busy' | 'none', t: نص خاص }]
  });
  const T = () => { S.tgbot = Object.assign(DEF(), S.tgbot || {}); return S.tgbot; };
  const lines = id => ($('#' + id).value || '').split('\n').map(s => s.trim()).filter(Boolean);
  const MODES = [['call', 'ردّ: «اتصل بي»'], ['busy', 'ردّ: «مشغول»'], ['none', 'لا ردّ تلقائي']];
  views.tgbot = () => {
    const t = T();
    const row = (v, i) => `<div class="card rule"><div class="two"><label class="field"><span>الاسم كما يظهر في تيليغرام</span><input type="text" data-vn="${i}" value="${esc(v.n)}"></label>
      <label class="field"><span>ماذا أفعل إن لم تردّ؟</span><select data-vm="${i}">${MODES.map(([k, l]) => `<option value="${k}" ${v.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label class="field"><span>نص خاص بهذا الشخص (اختياري)</span><input type="text" data-vt="${i}" value="${esc(v.t || '')}"></label>
      <button class="btn sm" data-act="tgb-rm" data-i="${i}">حذف</button></div>`;
    return `<div class="hero-title">مساعد تيليغرام</div><div class="sub">ملخّص ما فاتك حتى لا تفتح تيليغرام كثيرًا، وردود تلقائية بصياغتك أنت.</div>
    <div class="note warnb">⚠ هذه الشاشة للإعدادات فقط. المساعد لا يقرأ حسابك ولا يرسل شيئًا بعد: الربط بحساب تيليغرام يحتاج موافقتك الصريحة وخطوتين لا يقوم بهما غيرك، وسنفعله لاحقًا.</div>
    <label class="check"><input type="checkbox" id="tg-on" ${t.on ? 'checked' : ''}> فعّل المساعد (عند اكتمال الربط)</label>
    <label class="field"><span>أوقات الملخّص (ساعات مفصولة بفاصلة)</span><input type="text" id="tg-dig" dir="ltr" value="${esc(t.digest.join(', '))}"></label>
    <label class="field"><span>المجموعات والقنوات التي يتابعها (واحدة في كل سطر)</span><textarea id="tg-watch" rows="4">${esc(t.watch.join('\n'))}</textarea></label>
    <label class="field"><span>كلمات تنبّهك دائمًا (اسمك، «عاجل»، …) واحدة في كل سطر</span><textarea id="tg-kw" rows="3">${esc(t.keywords.join('\n'))}</textarea></label>
    <label class="field"><span>قنوات الدروس: أذكّرك بموعد الدرس (اسم القناة، واحدة في كل سطر)</span><textarea id="tg-courses" rows="3">${esc(t.courses.join('\n'))}</textarea></label>
    <h2>الردود التلقائية</h2>
    <label class="field"><span>رسالة «مشغول» (الافتراضية)</span><textarea id="tg-busy" rows="3">${esc(t.busyText)}</textarea></label>
    <label class="field"><span>رسالة «اتصل بي مباشرة»</span><textarea id="tg-call" rows="3">${esc(t.callText)}</textarea></label>
    <label class="field"><span>لا يُرسَل ردّ للشخص نفسه قبل مرور (ساعات)</span><input type="number" id="tg-cool" min="1" max="72" value="${t.cooldownH}"></label>
    <h2>أشخاص لهم معاملة خاصة</h2>
    ${t.vip.map(row).join('') || '<div class="sub">لم تضف أحدًا بعد.</div>'}
    <div class="btns" style="margin:10px 0"><button class="btn" data-act="tgb-add">+ شخص</button><button class="btn pri" data-act="tgb-save">حفظ</button></div>`;
  };
  function collect() {
    const t = T(); t.on = !!$('#tg-on').checked;
    t.digest = ($('#tg-dig').value || '').split(/[,،\s]+/).filter(x => /^\d{1,2}:\d{2}$/.test(x));
    t.watch = lines('tg-watch'); t.keywords = lines('tg-kw'); t.courses = lines('tg-courses');
    t.busyText = $('#tg-busy').value.trim() || DEF().busyText; t.callText = $('#tg-call').value.trim() || DEF().callText;
    t.cooldownH = Math.min(72, Math.max(1, +$('#tg-cool').value || 12));
    t.vip = [...document.querySelectorAll('[data-vn]')].map(el => { const i = el.dataset.vn; return { n: el.value.trim(), mode: (document.querySelector(`[data-vm="${i}"]`) || {}).value || 'call', t: (document.querySelector(`[data-vt="${i}"]`) || {}).value.trim() }; }).filter(v => v.n);
    return t;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-act^="tgb-"]'); if (!b || !location.hash.startsWith('#/tgbot')) return;
    const a = b.dataset.act;
    if (a === 'tgb-save') { collect(); save(); toast('تم الحفظ'); }
    else if (a === 'tgb-add') { const t = collect(); t.vip.push({ n: '', mode: 'call', t: '' }); route(); }
    else if (a === 'tgb-rm') { const t = collect(); t.vip.splice(+b.dataset.i, 1); save(); route(); }
  });
})();
