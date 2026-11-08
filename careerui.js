/* مساري — المهنة والتقنية: نشرة أسبوعية من خلاصات RSS، أدوات المحلل، الذكاء الاصطناعي وأثره، أهداف مهنية */
(function () {
  const car = () => { S.career = S.career || { goals: [{ t: 'BTL1', d: 0 }, { t: 'BTL2', d: 0 }, { t: 'تحسين الإنجليزية (TOEIC)', d: 0 }] }; return S.career; };
  const CATS = [['alertes', '⚠ تنبيهات رسمية'], ['actus', '📰 أخبار'], ['soc', '🛡 SOC'], ['ia_secu', '🤖 الذكاء الاصطناعي والأمن'], ['ia', '🧠 أخبار الذكاء الاصطناعي']];
  let cat = 'alertes', feed = null, loading = false;

  const TOOLS = [
    ['التحليل والترميز', [['CyberChef', 'https://gchq.github.io/CyberChef/', 'تحويل وفك ترميز وتحليل'], ['regex101', 'https://regex101.com/', 'تجربة التعابير النمطية'], ['jwt.io', 'https://jwt.io/', 'فحص رموز JWT']]],
    ['سمعة وفحص IOC', [['VirusTotal', 'https://www.virustotal.com/', 'ملفات ونطاقات وروابط'], ['URLScan', 'https://urlscan.io/', 'فحص رابط'], ['AbuseIPDB', 'https://www.abuseipdb.com/', 'سمعة عنوان IP'], ['GreyNoise', 'https://viz.greynoise.io/', 'ضجيج الإنترنت'], ['Shodan', 'https://www.shodan.io/', 'أجهزة مكشوفة'], ['MalwareBazaar', 'https://bazaar.abuse.ch/', 'عينات برمجيات خبيثة'], ['Cisco Talos', 'https://talosintelligence.com/reputation_center', 'سمعة']]],
    ['محاكاة ومعرفة', [['MITRE ATT&CK', 'https://attack.mitre.org/', 'التكتيكات والتقنيات'], ['NVD', 'https://nvd.nist.gov/', 'الثغرات CVE'], ['CISA KEV', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', 'ثغرات مستغَلة فعلًا'], ['EPSS', 'https://www.first.org/epss/', 'احتمال الاستغلال'], ['SigmaHQ', 'https://github.com/SigmaHQ/sigma', 'قواعد كشف'], ['Any.run', 'https://any.run/', 'تحليل ديناميكي (حساب)']]]
  ];
  const NOTES = [
    ['ما يتغيّر في عمل المحلل بسبب الذكاء الاصطناعي', [
      'الفرز الأولي (L1) والإثراء وتلخيص التنبيهات تُؤتمت بسرعة؛ ما يبقى لك: الحكم والسياق والتحقيق العميق.',
      'قيمة المحلل تنتقل إلى: هندسة الكشف (Detection Engineering)، الصيد (Threat Hunting)، الاستجابة للحوادث، وكتابة الأتمتة بالبرمجة.',
      'مخاطر جديدة: حقن التعليمات (prompt injection)، تسرّب بيانات العملاء إلى أدوات ذكاء اصطناعي غير مصرّح بها (Shadow AI)، ومحتوى مزيَّف (Deepfake) في الهندسة الاجتماعية.',
      'قاعدة العمل الآمن: لا تُدخل بيانات عميل في أداة غير معتمدة؛ تحقّق دائمًا من مخرجات النموذج قبل اتخاذ إجراء.']],
    ['مهارات تستحق الاستثمار', [
      'Python وأتمتة SOAR، وكتابة استعلامات SIEM/XDR (KQL وغيرها) وقواعد Sigma.',
      'فهم MITRE ATT&CK وسلاسل الهجوم، وأساسيات التحقيق الجنائي الرقمي.',
      'حوكمة الذكاء الاصطناعي وأمنه (OWASP LLM Top 10، NIST AI RMF).',
      'الإنجليزية التقنية والتواصل: كتابة تقارير حوادث واضحة.']]
  ];

  async function loadFeed() {
    if (feed || loading) return; loading = true;
    try { const r = await fetch('veille/latest.json', { cache: 'no-cache' }); if (r.ok) feed = await r.json(); else feed = { none: true }; } catch (e) { feed = { none: true }; }
    loading = false; if (location.hash === '#/career') route();
  }
  const list = () => { if (!feed) return '<div class="empty">جارٍ التحميل…</div>'; if (feed.none) return '<div class="empty">لا نشرة بعد. تُنشأ تلقائيًا كل اثنين وخميس (أو شغّلها يدويًا من GitHub Actions).</div>'; const a = cat === 'ia_secu' ? feed.ia_secu : (feed.cats || {})[cat]; return (a && a.length) ? `<div class="rows">${a.map(i => `<a class="row" href="${esc(i.u)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat" dir="auto" style="font-size:16px">${esc(i.t)}</span><span class="m">${esc(i.src)} · ${esc(i.d)}</span></span></a>`).join('')}</div>` : '<div class="empty">لا عناصر هذا الأسبوع في هذا القسم.</div>'; };

  views.career = () => {
    loadFeed(); const c = car(), gen = feed && feed.generated ? feed.generated.slice(0, 10) : '';
    return `<div class="hero-title">المهنة والتقنية</div>
    <h2>نشرة الأسبوع ${gen ? `<span class="count">· ${esc(gen)}</span>` : ''}</h2>
    <div class="chips">${CATS.map(([k, n]) => `<button class="chip${cat === k ? ' on' : ''}" data-cr="cat" data-k="${k}">${n}</button>`).join('')}</div>
    ${list()}${feed && feed.errors && feed.errors.length ? `<p class="sub">مصادر تعذّر جلبها: ${esc(feed.errors.join('، '))}</p>` : ''}
    <h2>مختبر الترميز السريع</h2>
    <label class="field"><span>النص</span><textarea id="cr-in" dir="ltr" rows="3" placeholder="aHR0cHM6Ly9leGFtcGxlLmNvbQ=="></textarea></label>
    <div class="btns"><button class="btn sm" data-cr="b64d">Base64 ←</button><button class="btn sm" data-cr="b64e">→ Base64</button><button class="btn sm" data-cr="hexd">Hex ←</button><button class="btn sm" data-cr="urld">URL ←</button><button class="btn sm" data-cr="rot13">ROT13</button><button class="btn sm" data-cr="sha">SHA-256</button><button class="btn sm" data-cr="defang">Defang</button><button class="btn sm" data-cr="refang">Refang</button></div>
    <label class="field"><span>النتيجة</span><textarea id="cr-out" dir="ltr" rows="3" readonly></textarea></label>
    <h2>أدواتي</h2>
    ${TOOLS.map(([h, a]) => `<h3 class="sub" style="margin:10px 0 4px">${h}</h3><div class="rows">${a.map(([n, u, m]) => `<a class="row" href="${u}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat" style="font-size:16px">${n}</span><span class="m">${m}</span></span></a>`).join('')}</div>`).join('')}
    ${NOTES.map(([h, a]) => `<h2>${h}</h2><div class="note ar" dir="rtl"><ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}
    <h2>أهدافي المهنية</h2>
    <div class="rows">${c.goals.map((g, i) => `<div class="row"><span class="main"><span class="t" style="${g.d ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(g.t)}</span></span><button class="btn sm" data-cr="tick" data-i="${i}">${g.d ? '↩' : '✓'}</button><button class="btn sm" data-cr="rm" data-i="${i}">×</button></div>`).join('')}</div>
    <div class="btns" style="margin-top:8px"><input type="text" id="cr-goal" placeholder="هدف جديد (شهادة، مشروع، تعلّم…)" style="flex:1"><button class="btn pri" data-cr="add">إضافة</button></div>`;
  };

  const out = v => { const o = document.getElementById('cr-out'); if (o) o.value = v; };
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-cr]'); if (!b) return; const a = b.dataset.cr, c = car(), inp = (document.getElementById('cr-in') || {}).value || '';
    try {
      if (a === 'cat') { cat = b.dataset.k; route(); }
      else if (a === 'b64d') out(new TextDecoder().decode(Uint8Array.from(atob(inp.trim().replace(/-/g, '+').replace(/_/g, '/')), x => x.charCodeAt(0))));
      else if (a === 'b64e') out(btoa(String.fromCharCode(...new TextEncoder().encode(inp))));
      else if (a === 'hexd') out(new TextDecoder().decode(Uint8Array.from(inp.replace(/[^0-9a-f]/gi, '').match(/../g) || [], h => parseInt(h, 16))));
      else if (a === 'urld') out(decodeURIComponent(inp));
      else if (a === 'rot13') out(inp.replace(/[a-z]/gi, ch => String.fromCharCode((ch <= 'Z' ? 90 : 122) >= (ch = ch.charCodeAt(0) + 13) ? ch : ch - 26)));
      else if (a === 'sha') out([...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inp)))].map(x => x.toString(16).padStart(2, '0')).join(''));
      else if (a === 'defang') out(inp.replace(/http/gi, m => m === 'HTTP' ? 'hXXP' : 'hxxp').replace(/\./g, '[.]'));
      else if (a === 'refang') out(inp.replace(/hxxp/gi, m => m === 'HXXP' ? 'HTTP' : 'http').replace(/\[\.\]|\(\.\)/g, '.'));
      else if (a === 'tick') { c.goals[+b.dataset.i].d ^= 1; save(); route(); }
      else if (a === 'rm') { c.goals.splice(+b.dataset.i, 1); save(); route(); }
      else if (a === 'add') { const t = (document.getElementById('cr-goal').value || '').trim(); if (t) { c.goals.push({ t, d: 0 }); save(); route(); } }
    } catch (x) { out('خطأ: المدخل غير صالح لهذه العملية'); }
  });
})();
