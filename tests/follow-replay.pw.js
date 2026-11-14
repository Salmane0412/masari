// Rejoue les cas du rapport de test du 14/11 (serveur local: python3 -m http.server 8765). Non inclus dans la boucle *.test.js (nécessite Playwright).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const ex = expectedOf(224); Object.assign(fol, { exp: ex.exp, owner: ex.owner, p: 0, from: 0 });
    const run = (name, chunks) => { const hw = chunks.flatMap(c => stripIntro(cleanHeard(c))); const r = followEval(ex.exp, hw, 0, ex.owner);
      const bad = []; r.st.forEach((s, k) => { if (s === 'bad') bad.push(ex.exp[k] + '@' + ex.owner[k]); });
      const ok = r.st.filter(s => s === 'ok').length; return { name, ok, bad, p: r.p, reps: r.reps, firstOk: r.st.indexOf('ok') }; };
    const A = 'تبارك الذي بيده الملك وهو على كل شيء قدير', B = 'الذي خلق الموت والحياة ليبلوكم أيكم أحسن عملا وهو العزيز الغفور', C = 'الذي خلق سبع سماوات طباقا ما ترى في خلق الرحمن من تفاوت';
    return [
      run('A basmala+1-3 une phrase', ['بسم الله الرحمن الرحيم ' + A + ' ' + B + ' ' + C]),
      run('B sans basmala 1-2', [A + ' ' + B]),
      run('C basmala seule puis 1', ['بسم الله الرحمن الرحيم', A]),
      run('D repetition begaye 67:2', [A, 'الذي خلق الذي خلق الموت والحياة ليبلوكم أيكم أحسن عملا وهو العزيز الغفور']),
      run('D2 repetition aya entiere', [A, B, B]),
      run('E milieu 67:3', [C]),
      run('F milieu 67:5', ['ولقد زينا السماء الدنيا بمصابيح وجعلناها رجوما للشياطين واعتدنا لهم عذاب السعير']),
      run('G substitution', [A + ' الذي خلق الموت والدنيا ليبلوكم أيكم أكثر مالا وهو العزيز الغفور']),
      run('H lecture parfaite 1-3', [A, B, C]),
      run('K insertion 67:2 (rapport voix)', [A + ' الذي خلق الموت والحياة والعيش ليبلوكم أيكم أحسن عملا وهو العزيز الغفور']),
      run('L reprise 67:3 (rapport voix)', [A + ' ' + B + ' الذي خلق سبع سماوات فترى ما ترى سماوات طباقا ما ترى في خلق الرحمن من تفاوت فارجع البصر هل ترى من فطور']),
      run('M lecture parfaite 67:1-4', [A + ' ' + B + ' ' + C + ' ثم ارجع البصر كرتين ينقلب إليك البصر خاسئا وهو حسير']),
      run('I aya 2 non entendue (saut de reconnaissance)', [A + ' ' + C]),
      run('J ayas 2-4 non entendues puis 5', [A + ' ولقد زينا السماء الدنيا بمصابيح وجعلناها رجوما للشياطين'])
    ];
  });
  r.forEach(x => console.log(JSON.stringify(x))); console.log(errs);
  await b.close();
})();
