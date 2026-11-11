/* مساري — «الهاتف والحجب»: إعدادات تطبيق أندرويد من داخل مساري (حالة الأذونات، القواعد، الشريك، التذكيرات) */
(function () {
  'use strict';
  const N = () => window.MasariNative;
  const J = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
  let apps = null, draft = null, picking = null, pickQ = '';
  const PRESET = {
    banned: ['com.zhiliaoapp.musically', 'com.ss.android.ugc.trill', 'com.twitter.android', 'com.reddit.frontpage', 'com.instagram.android', 'com.snapchat.android', 'com.facebook.katana', 'com.facebook.lite', 'com.instagram.barcelona'],
    bannedNames: ['TikTok', 'Instagram', 'Reddit', 'Snapchat', 'Facebook', 'Twitter', 'Threads'],
    until: ['com.google.android.youtube', 'com.google.android.gm', 'com.android.chrome', 'org.mozilla.firefox', 'com.sec.android.app.sbrowser', 'com.microsoft.emmx', 'com.opera.browser', 'com.brave.browser', 'com.duckduckgo.mobile.android', 'com.microsoft.office.outlook', 'com.netflix.mediaclient', 'com.google.android.apps.youtube.music'],
    budgets: { 'org.telegram.messenger': 20 },
    domains: ['tiktok.com', 'instagram.com', 'reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'snapchat.com', 'youtube.com', 'youtu.be', 'netflix.com', 'twitch.tv'],
  };
  const KNOWN = { 'com.zhiliaoapp.musically': 'TikTok', 'com.ss.android.ugc.trill': 'TikTok Lite', 'com.twitter.android': 'X (Twitter)', 'com.reddit.frontpage': 'Reddit', 'com.instagram.android': 'Instagram', 'com.snapchat.android': 'Snapchat', 'com.facebook.katana': 'Facebook', 'com.facebook.lite': 'Facebook Lite', 'com.instagram.barcelona': 'Threads', 'com.google.android.youtube': 'YouTube', 'com.google.android.gm': 'Gmail', 'com.android.chrome': 'Chrome', 'org.mozilla.firefox': 'Firefox', 'com.sec.android.app.sbrowser': 'Samsung Internet', 'com.microsoft.emmx': 'Edge', 'com.opera.browser': 'Opera', 'com.brave.browser': 'Brave', 'com.duckduckgo.mobile.android': 'DuckDuckGo', 'com.microsoft.office.outlook': 'Outlook', 'com.netflix.mediaclient': 'Netflix', 'com.google.android.apps.youtube.music': 'YouTube Music', 'org.telegram.messenger': 'Telegram', 'com.whatsapp': 'WhatsApp' };
  const label = p => { const a = (apps || []).find(x => x.p === p); return a ? a.l : KNOWN[p] || p.split('.').slice(-2).join('.'); };
  const chips = (k, list) => `<div class="chips">${list.map(p => `<span class="chip on">${esc(label(p))} <button class="xb" data-ph="rm" data-k="${k}" data-p="${esc(p)}" aria-label="إزالة">✕</button></span>`).join('') || '<span class="sub">لا شيء</span>'}<button class="chip" data-ph="pick" data-k="${k}">+ إضافة</button></div>`;

  function noNative() {
    return `<div class="hero-title">الهاتف والحجب</div>
    <div class="card"><b>هذه الصفحة تعمل داخل تطبيق مساري على أندرويد.</b>
      <p class="sub">التطبيق يحجب ما يضيّع وقتك حتى تُنهي مهام يومك، ويحظر نهائيًا ما اخترت حظره، ويحدّ وقت تيليغرام، ويُسكت إشعارات واتساب إلا من تختار، ويُنبّه بالأذان، ويُبلّغ شريكك.</p>
      <a class="btn pri block" href="https://github.com/Salmane0412/masari/releases/download/apk/Masari.apk" style="text-decoration:none;text-align:center;display:block">تنزيل التطبيق (APK)</a></div>
    <h2>بعد التثبيت</h2><ol class="steps"><li>افتح مساري: لديك 30 دقيقة للإعداد دون قيود.</li><li>ادخل «أنا ← الهاتف والحجب» واتبع قائمة الأذونات.</li><li>اضغط «اقتراح مساري» ثم عدّل وحفظ.</li><li>اربط شريكك (تطبيق المصادقة + تطبيق ntfy).</li></ol>
    <div class="note">على الحاسوب: إضافة <a href="masari-guard.zip">Masari Guard</a> تحجب المواقع نفسها برمز اليوم نفسه (طريقة التثبيت في الدليل).</div>`;
  }

  views.lock = () => views.phone();
  views.phone = () => {
    if (!N()) return noNative();
    const st = J(N().status(), {});
    if (!apps) apps = J(N().apps(), []);
    if (!draft) draft = J(N().config(), {});
    const d = draft, use = st.usage || {}, ev = st.events || {};
    const checks = [
      ['accessibility', 'خدمة الحجب (إمكانية الوصول)', st.accessibility, 'أساس الحجب كله'],
      ['notifperm', 'الإشعارات', st.notifPerm, 'للأذان والتذكيرات'],
      ['exact', 'المنبّهات الدقيقة', st.exactAlarm, 'ليأتي الأذان في وقته بالضبط'],
      ['battery', 'استثناء من توفير البطارية', st.battery, 'حتى لا يوقف أندرويد مساري'],
      ...(d.waFilter ? [['notif', 'قراءة الإشعارات (فلتر واتساب)', st.notifListener, 'لإسكات واتساب إلا من تختار']] : []),
      ...(d.webBlock ? [['vpn', 'حجب المواقع', st.vpn, st.otherVpn ? 'أوقف NordVPN أو أي VPN آخر' : 'فلتر محلي لا يقرأ تصفحك']] : []),
    ];
    const bad = checks.filter(c => !c[2]).length;
    const tgUsed = Math.round((use['org.telegram.messenger'] || 0) / 60), tgB = (d.budgets || {})['org.telegram.messenger'];
    const pend = st.pendingAt ? Math.max(0, Math.ceil((st.pendingAt - Date.now()) / 3600000)) : 0;
    return `<div class="hero-title">الهاتف والحجب</div>
    <div class="sub">${st.setupWindow ? '🟢 نافذة الإعداد مفتوحة: كل التعديلات تُطبَّق فورًا' : 'التشديد يُطبَّق فورًا، والتخفيف بعد 24 ساعة أو برمز شريكك'}</div>
    ${pend ? `<div class="note warnb">تعديل لتخفيف القيود ينتظر: يُطبَّق بعد ${pend} ساعة. <button class="btn sm" data-ph="cancel">إلغاؤه</button></div>` : ''}
    <div class="card kpi3 phk"><div><span>اليوم</span><b>${st.dayDone ? '✅ أُنجز' : st.unlocked ? 'مفتوح' : '🔒 محجوب'}</b></div><div><span>تيليغرام</span><b>${tgUsed}${tgB !== undefined ? '/' + tgB : ''} د</b></div><div><span>محاولات محظورة</span><b>${ev.banned || 0}</b></div></div>
    <h2>الأذونات ${bad ? `<span class="count neg">· ${bad} ناقص</span>` : '<span class="count">· كلها جاهزة</span>'}</h2>
    <div class="rows">${checks.map(([k, t, ok, m]) => `<div class="row"><span class="main"><span class="t lat">${ok ? '✅' : '⚠️'} ${t}</span><span class="m">${m}</span></span>${ok ? '' : `<button class="btn sm pri" data-ph="open" data-k="${k}">تفعيل</button>`}</div>`).join('')}</div>
    <div class="sub">إن كان زر «إمكانية الوصول» رماديًا: الإعدادات ← التطبيقات ← مساري ← ⋮ ← السماح بالإعدادات المقيدة (أثناء نافذة الإعداد).</div>

    <h2>القواعد <button class="btn sm" data-ph="preset" style="margin-inline-start:auto">اقتراح مساري</button></h2>
    <div class="card rule"><b>⛔ محظورة نهائيًا</b><span class="sub">لا تُفتح أبدًا، وتُمنع صفحتها في متجر Play.</span>${chips('banned', d.banned || [])}
      <label class="field"><span>أسماء تُمنع في متجر Play (مفصولة بفاصلة)</span><input type="text" id="ph-bnames" dir="ltr" value="${esc((d.bannedNames || []).join(', '))}"></label></div>
    <div class="card rule"><b>📖 محجوبة حتى إنهاء مهام اليوم</b><span class="sub">تُفتح تلقائيًا حين تُنهي حفظ اليوم واختباره في مساري.</span>${chips('until', d.until || [])}
      <label class="check"><input type="checkbox" id="ph-all" ${d.blockAll ? 'checked' : ''}> احجب كل التطبيقات الأخرى أيضًا</label></div>
    <div class="card rule"><b>⏱ وقت محدود يوميًا</b><span class="sub">مثل تيليغرام: دقائق في اليوم ثم يُغلق حتى الغد.</span>
      ${Object.entries(d.budgets || {}).map(([p, m]) => `<div class="row"><span class="main"><span class="t lat">${esc(label(p))}</span><span class="m">اليوم: ${Math.round((use[p] || 0) / 60)} د</span></span><input type="number" class="mini" min="0" max="600" data-phb="${esc(p)}" value="${m}"> <small>د</small><button class="xb" data-ph="rmb" data-p="${esc(p)}" aria-label="إزالة">✕</button></div>`).join('')}
      <button class="chip" data-ph="pick" data-k="budgets">+ تطبيق بوقت محدود</button></div>
    <div class="card rule"><b>✅ مسموحة دائمًا</b><span class="sub">الاتصال والرسائل والخرائط وتطبيقات المصادقة مسموحة تلقائيًا. أضف البنك والنادي…</span>${chips('allowed', d.allowed || [])}</div>
    <div class="card rule"><b>💬 إشعارات واتساب</b><label class="check"><input type="checkbox" id="ph-wa" ${d.waFilter ? 'checked' : ''}> أسكت إشعارات واتساب إلا من هؤلاء (المكالمات تمرّ دائمًا)</label>
      <label class="field"><span>الأسماء كما تظهر في واتساب (مفصولة بفاصلة)</span><input type="text" id="ph-waallow" value="${esc((d.waAllow || []).join('، '))}"></label>
      <button class="btn sm" data-ph="open" data-k="dnd">أو استعمل «عدم الإزعاج» في أندرويد مع جهات الاتصال المهمة</button></div>
    <div class="card rule"><b>🌐 حجب المواقع</b><label class="check"><input type="checkbox" id="ph-web" ${d.webBlock ? 'checked' : ''}> احجب هذه المواقع حتى إنهاء مهام اليوم (والإباحية دائمًا)</label>
      <textarea id="ph-domains" dir="ltr" rows="3" style="min-height:80px">${esc((d.domains || []).join('\n'))}</textarea></div>
    <label class="field"><span>رمز الشريك (فقط لتطبيق التخفيف فورًا)</span><input type="text" inputmode="numeric" id="ph-code" dir="ltr" placeholder="اختياري"></label>
    <button class="btn pri block" data-ph="save">حفظ القواعد</button>

    <h2>الشريك (زوجتك)</h2>
    ${st.partner ? `<div class="card"><b>✅ مربوط</b><div class="sub">رمزها يفتح التطبيقات أو يخفّف القواعد فورًا، وتصلها التنبيهات عبر تطبيق ntfy على الموضوع:</div><div class="codebox" dir="ltr">${esc(st.topic || '')}</div>
      <div class="btns"><button class="btn" data-ph="test">إرسال تنبيه تجريبي</button>${st.setupWindow ? '<button class="btn warn" data-ph="pair" data-force="1">إعادة الربط</button>' : ''}</div></div>`
      : `<div class="card"><p class="sub">تحصل زوجتك على: رمز متجدد كل 30 ثانية في تطبيق المصادقة (لفتح الحجب أو تخفيفه)، وتنبيهات فورية (طلب تخفيف، رسالة طويلة، محاولة حذف، تطبيق محظور) وتقرير كل مساء 22:00.</p><button class="btn pri" data-ph="pair">ربط شريكي الآن</button></div>`}
    <div id="ph-pair"></div>`;
  };

  function pairHtml(o) {
    const g = s => s.replace(/(.{4})/g, '$1 ').trim();
    return `<div class="card"><b>أعطِ هاتفك لزوجتك لهاتين الخطوتين، ثم أغلق الصفحة: هذا المفتاح لا يظهر مرة ثانية.</b>
      <h2>1. تطبيق المصادقة (Google Authenticator)</h2><ol class="steps"><li>«+» ← «إدخال مفتاح الإعداد».</li><li>الاسم: مساري سلمان.</li><li>المفتاح:</li></ol><div class="codebox" dir="ltr">${g(o.secret)}</div><div class="sub">النوع: «حسب الوقت».</div>
      <h2>2. تطبيق ntfy (مجاني، من متجر Play)</h2><ol class="steps"><li>«+» ← «Subscribe to topic».</li><li>الموضوع:</li></ol><div class="codebox" dir="ltr">${esc(o.topic)}</div>
      <button class="btn" data-ph="test">إرسال تنبيه تجريبي</button></div>`;
  }

  function pickSheet(k) {
    picking = k;
    const cur = new Set(k === 'budgets' ? Object.keys(draft.budgets || {}) : (draft[k] || []));
    const L = (apps || []).filter(a => !pickQ || a.l.toLowerCase().includes(pickQ.toLowerCase()) || a.p.includes(pickQ.toLowerCase()));
    openSheet(`<h3>اختر التطبيقات</h3><input type="text" id="ph-q" placeholder="بحث" value="${esc(pickQ)}">
      <div class="picklist">${L.map(a => `<label class="check"><input type="checkbox" data-php="${esc(a.p)}" ${cur.has(a.p) ? 'checked' : ''}> ${esc(a.l)}</label>`).join('')}</div>
      <div class="btns" style="position:sticky;bottom:0;background:var(--surface);padding-top:8px"><button class="btn pri" data-ph="pickok">تم</button><button class="btn" data-act="close">إلغاء</button></div>`);
  }
  const rer = () => { if (location.hash !== '#/phone') return; const y = scrollY; $('#view').innerHTML = views.phone(); scrollTo(0, y); };
  function collect() {
    const v = id => ($('#' + id) || {}).value || '';
    draft.bannedNames = v('ph-bnames').split(/[,،]/).map(s => s.trim()).filter(Boolean);
    draft.blockAll = !!($('#ph-all') || {}).checked; draft.waFilter = !!($('#ph-wa') || {}).checked; draft.webBlock = !!($('#ph-web') || {}).checked;
    draft.waAllow = v('ph-waallow').split(/[,،]/).map(s => s.trim()).filter(Boolean);
    draft.domains = v('ph-domains').split(/\s+/).map(s => s.trim().toLowerCase()).filter(s => s.includes('.'));
    document.querySelectorAll('[data-phb]').forEach(i => { draft.budgets[i.dataset.phb] = Math.max(0, +i.value || 0); });
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ph]'); if (!b || !N()) return;
    const k = b.dataset.k;
    switch (b.dataset.ph) {
      case 'open': N().open(k); setTimeout(rer, 1500); break;
      case 'rm': collect(); draft[k] = (draft[k] || []).filter(p => p !== b.dataset.p); rer(); break;
      case 'rmb': collect(); delete draft.budgets[b.dataset.p]; rer(); break;
      case 'pick': collect(); pickQ = ''; pickSheet(k); break;
      case 'pickok': {
        const sel = [...document.querySelectorAll('[data-php]')].filter(i => i.checked).map(i => i.dataset.php);
        const shown = new Set([...document.querySelectorAll('[data-php]')].map(i => i.dataset.php));
        if (picking === 'budgets') { draft.budgets = draft.budgets || {}; for (const p of shown) { if (sel.includes(p)) { if (draft.budgets[p] === undefined) draft.budgets[p] = 20; } else delete draft.budgets[p]; } }
        else { const keep = (draft[picking] || []).filter(p => !shown.has(p)); draft[picking] = [...new Set([...keep, ...sel])]; }
        closeSheet(); rer(); break;
      }
      case 'preset': collect(); for (const key of ['banned', 'bannedNames', 'until', 'domains']) draft[key] = [...new Set([...(draft[key] || []), ...PRESET[key]])]; draft.budgets = { ...PRESET.budgets, ...(draft.budgets || {}) }; draft.webBlock = true; rer(); toast('أُضيف الاقتراح: راجعه ثم احفظ'); break;
      case 'save': {
        collect(); const r = N().setConfig(JSON.stringify(draft), ($('#ph-code') || {}).value || '');
        draft = null; rer();
        toast(r === 'applied' ? 'حُفظت القواعد وطُبّقت' : r === 'pending' ? 'طُبّق التشديد فورًا، والتخفيف بعد 24 ساعة' : r === 'bad-code' ? 'رمز الشريك غير صحيح' : 'تعذّر الحفظ');
        break;
      }
      case 'cancel': N().cancelPending(); rer(); toast('أُلغي التعديل المنتظر'); break;
      case 'pair': { const o = J(N().partnerPair(!!b.dataset.force), {}); if (o.error) return toast('الشريك مربوط مسبقًا'); rer(); $('#ph-pair').innerHTML = pairHtml(o); $('#ph-pair').scrollIntoView({ behavior: 'smooth' }); break; }
      case 'test': N().partnerTest(); toast('أُرسل التنبيه التجريبي'); break;
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 'ph-q') { pickQ = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(() => { pickSheet(picking); const i = $('#ph-q'); if (i) { i.focus(); i.setSelectionRange(pickQ.length, pickQ.length); } }, 250); } });

  /* ---------- مزامنة تلقائية مع الهاتف: مفتاح رمز اليوم، إنهاء اليوم، التذكيرات ---------- */
  async function extSync() { // إضافة المتصفح Masari Guard (إن كانت مثبّتة)
    try { if (!S || !S.lock) return; window.postMessage({ masari: 'secret', s: S.lock.secret }, '*'); const st = dayState(); if (st.left === 0 && st.quizzes >= 1) window.postMessage({ masari: 'daydone', code: await dailyCode() }, '*'); } catch (e) { }
  }
  window.addEventListener('message', e => { if (e.source === window && e.data && e.data.masariGuard) extSync(); });
  window.addEventListener('hashchange', () => setTimeout(extSync, 400));
  async function sync() {
    if (!N() || !S) return;
    try {
      if (S.lock && S.lock.secret) N().setSelfSecret(S.lock.secret);
      const st = dayState();
      if (st.left === 0 && st.quizzes >= 1) { const code = await dailyCode(); N().dayDone(code); }
      const R = [], now = Date.now();
      for (let d = 0; d < 3; d++) {
        const day = addDays(todayStr(), d);
        (S.settings.times || []).forEach((tm, k) => { const t = parseD(day); const [h, m] = tm.split(':').map(Number); t.setHours(h, m, 0, 0); if (t > now) R.push({ at: t.getTime(), title: k === 0 ? 'مساري: وقت الحفظ' : 'مساري: وقت المراجعة', text: k === 0 ? 'افتح ورد اليوم الجديد' : 'راجع ما حفظت قبل أن يتفلّت' }); });
      }
      ((S.tasks && S.tasks.items) || []).filter(x => !x.done && x.due && x.time).forEach(x => { const t = parseD(x.due); const [h, m] = x.time.split(':').map(Number); t.setHours(h, m, 0, 0); if (t > now && t - now < 3 * 864e5) R.push({ at: t.getTime() - 15 * 60000, title: 'مهمة بعد 15 دقيقة', text: x.t }); });
      R.sort((a, b) => a.at - b.at); N().setReminders(JSON.stringify(R.slice(0, 50)));
    } catch (e) { }
  }
  window.addEventListener('hashchange', () => setTimeout(sync, 300));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { draft = null; setTimeout(sync, 300); } });
  setTimeout(sync, 2000);
})();
