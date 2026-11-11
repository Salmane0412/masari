/* مساري — الصلاة: المواقيت، الصلاة القادمة، الفرائض والسنن، الأذكار، القبلة، والتنبيه بالأذان (في تطبيق أندرويد) */
(function () {
  'use strict';
  const P = window.PRAYER;
  const ST = () => { S.salat = S.salat || {}; const s = S.salat; s.cfg = s.cfg || { lat: 48.8566, lng: 2.3522, place: 'باريس', method: 'MWL', asr: 1, adhan: { fajr: 1, dhuhr: 1, asr: 1, maghrib: 1, isha: 1 }, pre: 10 }; s.log = s.log || {}; s.dk = s.dk || {}; return s; };
  const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const SUNAN = [['qf', 'سنة الفجر', 2], ['qd', 'قبل الظهر', 4], ['bd', 'بعد الظهر', 2], ['bm', 'بعد المغرب', 2], ['bi', 'بعد العشاء', 2], ['duha', 'الضحى', 2], ['witr', 'الوتر', 1], ['qiyam', 'قيام الليل', 2]];
  const mins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const todayTimes = d => P.day(d || todayStr(), ST().cfg);
  function next() {
    const n = new Date(), cur = n.getHours() * 60 + n.getMinutes(), t = todayTimes();
    for (const k of FARD) if (mins(t[k]) > cur) return { k, at: t[k], left: mins(t[k]) - cur, t };
    const tm = todayTimes(addDays(todayStr(), 1)); return { k: 'fajr', at: tm.fajr, left: 1440 - cur + mins(tm.fajr), t, tomorrow: true };
  }
  const left = m => m >= 60 ? `${Math.floor(m / 60)} س ${m % 60} د` : `${m} د`;
  window.salatNext = next;

  // الأذكار (نصوص القرآن من مصحف مساري نفسه)
  const qv = (s, a) => Q.ayas[gi(s, a)][2];
  const sura = c => { const out = []; for (let a = 1; a <= CH[c].n; a++) out.push(qv(c, a) + ` ﴿${a}﴾`); return out.join(' '); };
  const QK = () => qv(2, 255), MU = c => sura(c);
  const ADHKAR = {
    m: [
      ['آية الكرسي', QK, 1, 'من قالها حين يصبح أُجير من الجن حتى يمسي (النسائي في الكبرى)'],
      ['سورة الإخلاص', () => MU(112), 3, 'الإخلاص والمعوذتان ثلاثًا تكفيك من كل شيء (أبو داود والترمذي)'], ['سورة الفلق', () => MU(113), 3, ''], ['سورة الناس', () => MU(114), 3, ''],
      ['', () => 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ', 1, 'مسلم'],
      ['', () => 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', 1, 'الترمذي'],
      ['سيد الاستغفار', () => 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ', 1, 'البخاري'],
      ['', () => 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', 3, 'أبو داود والترمذي'],
      ['', () => 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا', 3, 'أبو داود'],
      ['', () => 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ', 1, 'النسائي في الكبرى والحاكم'],
      ['', () => 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', 10, 'وفي الصحيحين: مائة مرة في اليوم'],
      ['', () => 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 100, 'مسلم'],
    ],
    e: [
      ['آية الكرسي', QK, 1, 'النسائي في الكبرى'], ['سورة الإخلاص', () => MU(112), 3, 'أبو داود والترمذي'], ['سورة الفلق', () => MU(113), 3, ''], ['سورة الناس', () => MU(114), 3, ''],
      ['', () => 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ', 1, 'مسلم'],
      ['', () => 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ', 1, 'الترمذي'],
      ['سيد الاستغفار', () => ADHKAR.m[6][1](), 1, 'البخاري'],
      ['', () => 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 3, 'مسلم'],
      ['', () => ADHKAR.m[7][1](), 3, 'أبو داود والترمذي'], ['', () => ADHKAR.m[8][1](), 3, 'أبو داود'], ['', () => ADHKAR.m[9][1](), 1, ''],
      ['', () => 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 100, 'مسلم'],
    ],
    p: [
      ['', () => 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ. اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', 1, 'مسلم'],
      ['', () => 'سُبْحَانَ اللَّهِ', 33, 'مسلم'], ['', () => 'الْحَمْدُ لِلَّهِ', 33, ''], ['', () => 'اللَّهُ أَكْبَرُ', 33, ''],
      ['تمام المائة', () => ADHKAR.m[10][1](), 1, 'مسلم'],
      ['آية الكرسي', QK, 1, 'النسائي في الكبرى'], ['المعوذات', () => [MU(112), MU(113), MU(114)].join(' — '), 1, 'أبو داود (وثلاثًا بعد الفجر والمغرب)'],
    ],
  };
  let dkTab = new Date().getHours() < 14 ? 'm' : 'e';

  function adhkarHtml() {
    const s = ST(), key = todayStr() + dkTab, done = s.dk[key] || {};
    const L = ADHKAR[dkTab], n = L.filter((x, i) => (done[i] || 0) >= x[2]).length;
    return `<div class="seg full" role="tablist">${[['m', 'الصباح'], ['e', 'المساء'], ['p', 'بعد الصلاة']].map(([k, l]) => `<button data-sl="dk" data-k="${k}" aria-pressed="${dkTab === k}">${l}</button>`).join('')}</div>
      <div class="sub">${n} / ${L.length} · المس البطاقة لتعدّ</div>
      <div class="dks">${L.map((x, i) => { const c = done[i] || 0, full = c >= x[2]; return `<button class="dk${full ? ' done' : ''}" data-sl="dk-tap" data-i="${i}">${x[0] ? `<b>${x[0]}</b>` : ''}<span class="ar dkt">${x[1]()}</span><span class="dkm">${x[3] ? `<small>${x[3]}</small>` : '<small></small>'}<span class="dkc">${full ? '✓' : (x[2] - c) + ' ×'}</span></span></button>`; }).join('')}</div>
      <p class="sub">النصوص من حصن المسلم ومصادره المذكورة، والآيات من مصحف مساري.</p>`;
  }

  views.salat = () => {
    const s = ST(), c = s.cfg, t = todayStr(), nx = next(), tt = nx.t, log = s.log[t] || {}, h = window.FIN && FIN.hijri(t);
    const nf = FARD.filter(k => log[k]).length, ns = SUNAN.filter(([k]) => log[k]).length;
    const q = Math.round(P.qibla(c.lat, c.lng));
    let streak = 0; for (let d = addDays(t, log && FARD.every(k => log[k]) ? 0 : -1), i = 0; i < 400; i++, d = addDays(d, -1)) { const L = s.log[d]; if (L && FARD.every(k => L[k])) streak++; else break; }
    return `<div class="hero-title">الصلاة</div><div class="sub">${h ? h.text + ' · ' : ''}${esc(c.place || '')}</div>
    <div class="card nextp"><span class="sub">${nx.tomorrow ? 'فجر الغد' : 'الصلاة القادمة'}</span><b>${P.NAMES[nx.k]} <span dir="ltr">${nx.at}</span></b><span class="cd">بعد ${left(nx.left)}</span></div>
    <div class="rows ptimes">${['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k => `<div class="row${nx.k === k && !nx.tomorrow ? ' cur' : ''}"><span class="main"><span class="t lat">${P.NAMES[k]}</span></span><span class="pt" dir="ltr">${tt[k]}</span>${k === 'sunrise' ? '<span class="pchk0"></span>' : `<button class="pchk${log[k] ? ' on' : ''}" data-sl="fard" data-k="${k}" aria-pressed="${!!log[k]}" aria-label="صلّيتها">${log[k] ? '✓' : ''}</button>`}</div>`).join('')}
      <div class="row"><span class="main"><span class="t lat">منتصف الليل · الثلث الأخير</span></span><span class="pt" dir="ltr">${tt.midnight} · ${tt.lastThird}</span></div></div>
    <div class="sub" style="margin-top:6px">الفرائض اليوم ${nf}/5 · ${streak ? `${streak} يومًا متتالية كاملة` : ''}</div>
    <h2>السنن والنوافل <span class="count">· ${ns}/${SUNAN.length}</span></h2>
    <div class="chips">${SUNAN.map(([k, l, r]) => `<button class="chip${log[k] ? ' on' : ''}" data-sl="sunna" data-k="${k}">${l} <small>${r}</small></button>`).join('')}</div>
    <div class="sub">السنن الرواتب ثنتا عشرة ركعة: «من صلّى اثنتي عشرة ركعة في يوم وليلة بُني له بهن بيت في الجنة» (مسلم).</div>
    <h2>الأذكار</h2>${adhkarHtml()}
    <h2>القبلة</h2><div class="card qib"><div class="qarrow" style="transform:rotate(${q}deg)">↑</div><div><b>${q}°</b> من الشمال باتجاه عقارب الساعة<div class="sub">ضع الهاتف أفقيًا ووجّه أعلاه إلى الشمال (بالبوصلة)، ثم اتجه بالزاوية المذكورة.</div></div></div>
    <details class="more"><summary>الإعدادات: المكان وطريقة الحساب والأذان</summary>
      <div class="btns" style="margin:8px 0"><button class="btn pri" data-sl="geo">استعمل موقعي الحالي</button></div>
      <div class="two"><label class="field"><span>خط العرض</span><input type="text" inputmode="decimal" dir="ltr" id="sl-lat" value="${c.lat}"></label><label class="field"><span>خط الطول</span><input type="text" inputmode="decimal" dir="ltr" id="sl-lng" value="${c.lng}"></label></div>
      <label class="field"><span>اسم المكان</span><input type="text" id="sl-place" value="${esc(c.place || '')}"></label>
      <label class="field"><span>طريقة الحساب</span><select id="sl-method">${Object.entries(P.METHODS).map(([k, m]) => `<option value="${k}"${c.method === k ? ' selected' : ''}>${m.name}</option>`).join('')}</select></label>
      <label class="field"><span>العصر</span><select id="sl-asr"><option value="1"${c.asr == 1 ? ' selected' : ''}>الجمهور (ظل المثل)</option><option value="2"${c.asr == 2 ? ' selected' : ''}>الحنفية (ظل المثلين)</option></select></label>
      <div class="sub">في فرنسا تختلف المساجد في زاوية الفجر والعشاء (12° أو 15° أو 18°). اختر ما يوافق مسجدك، وقارن بتقويمه أول مرة.</div>
      ${window.MasariNative ? `<h2>الأذان والتنبيه (في الهاتف)</h2><div class="chips">${FARD.map(k => `<button class="chip${c.adhan[k] ? ' on' : ''}" data-sl="adhan" data-k="${k}">${P.NAMES[k]}</button>`).join('')}</div>
        <label class="field"><span>تنبيه قبل الصلاة بـ</span><select id="sl-pre">${[0, 5, 10, 15, 20, 30].map(v => `<option value="${v}"${(c.pre || 0) == v ? ' selected' : ''}>${v ? v + ' دقائق' : 'لا'}</option>`).join('')}</select></label>` : `<div class="note">التنبيه بالأذان يعمل في تطبيق مساري على أندرويد حتى والتطبيق مغلق.</div>`}
    </details>`;
  };

  const rer = () => { if (!location.hash.startsWith('#/salat')) return route(); const y = scrollY; $('#view').innerHTML = views.salat(); scrollTo(0, y); };
  function pushNative() { try { if (window.MasariNative && MasariNative.setPrayer) MasariNative.setPrayer(JSON.stringify(ST().cfg)); } catch (e) { } }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-sl]'); if (!b) return;
    const s = ST(), t = todayStr(), k = b.dataset.k; s.log[t] = s.log[t] || {};
    switch (b.dataset.sl) {
      case 'fard': case 'sunna': s.log[t][k] = s.log[t][k] ? 0 : 1; save(); rer(); break;
      case 'dk': dkTab = k; rer(); break;
      case 'dk-tap': { const key = t + dkTab, i = +b.dataset.i; s.dk[key] = s.dk[key] || {}; const max = ADHKAR[dkTab][i][2]; s.dk[key][i] = Math.min(max, (s.dk[key][i] || 0) + 1); try { navigator.vibrate && navigator.vibrate(s.dk[key][i] >= max ? [30, 40, 30] : 12); } catch (x) { } save(); rer(); break; }
      case 'adhan': s.cfg.adhan[k] = s.cfg.adhan[k] ? 0 : 1; save(); pushNative(); rer(); break;
      case 'geo': if (!navigator.geolocation) return toast('الموقع غير متاح'); navigator.geolocation.getCurrentPosition(p => { s.cfg.lat = +p.coords.latitude.toFixed(4); s.cfg.lng = +p.coords.longitude.toFixed(4); s.cfg.place = 'موقعي'; save(); pushNative(); rer(); toast('حُدّث الموقع'); }, () => toast('لم يُسمح بالموقع')); break;
    }
  });
  document.addEventListener('change', e => {
    const id = e.target.id; if (!id || !id.startsWith('sl-')) return; const c = ST().cfg, v = e.target.value;
    if (id === 'sl-lat' || id === 'sl-lng') { const x = parseFloat(v.replace(',', '.')); if (isNaN(x)) return toast('رقم غير صالح'); c[id === 'sl-lat' ? 'lat' : 'lng'] = x; }
    else if (id === 'sl-place') c.place = v; else if (id === 'sl-method') c.method = v; else if (id === 'sl-asr') c.asr = +v; else if (id === 'sl-pre') c.pre = +v;
    save(); pushNative(); rer();
  });
  // صفحة «اليوم»: الصلاة القادمة
  window.TODAY_HOOKS = window.TODAY_HOOKS || [];
  window.TODAY_HOOKS.unshift(() => { const nx = next(), log = (ST().log[todayStr()] || {}), nf = FARD.filter(k => log[k]).length;
    return `<a class="card nextp mini" href="#/salat"><span class="sub">${nx.tomorrow ? 'فجر الغد' : 'الصلاة القادمة'}</span><b>${P.NAMES[nx.k]} <span dir="ltr">${nx.at}</span></b><span class="cd">بعد ${left(nx.left)} · الفرائض ${nf}/5</span></a>`; });
  setTimeout(pushNative, 1500);
})();
