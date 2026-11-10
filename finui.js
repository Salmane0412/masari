/* مساري — واجهة المال: نظرة عامة، عمليات، ميزانية، متكرر، أهداف، ديون، زكاة، استيراد كشف */
(function () {
  'use strict';
  const X = window.FIN;
  const F = () => { S.fin = X.ensure(S.fin); return S.fin; };
  const nf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const nf0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const money = (v, round) => `<bdi class="amt" dir="ltr">${(round ? nf0 : nf).format(+v || 0)}</bdi>`;
  const sub = () => location.hash.split('/')[2] || '';
  const accName = id => { const a = F().accounts.find(x => x.id === id); return a ? a.name : '—'; };
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const ymLabel = ym => `${MONTHS[+ym.slice(5) - 1]} ${ym.slice(0, 4)}`;
  const shiftYm = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5) - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  let ym = todayStr().slice(0, 7), q = '', fCat = '', fAcc = '', csvRows = null;
  const back = (h = '#/fin') => `<a class="btn sm iconbtn" href="${h}" aria-label="رجوع">${ic('back', 20)}</a>`;
  const head = (title, s, h) => `<div class="sess-h">${back(h)}<div class="tt"><b style="font-size:20px">${title}</b>${s ? `<span class="sub">${s}</span>` : ''}</div></div>`;
  const opt = (v, l, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`;
  const num = id => { const v = String(($('#' + id) || {}).value || '').replace(/\s/g, '').replace(',', '.'); return v === '' ? NaN : +v; };
  const val = id => String(($('#' + id) || {}).value || '').trim();
  const NAV = [['tx', 'العمليات'], ['budget', 'الميزانية'], ['recur', 'المتكرر'], ['goals', 'الأهداف'], ['debts', 'الديون'], ['zakat', 'الزكاة'], ['acc', 'الحسابات'], ['import', 'استيراد كشف']];

  /* ---------- النظرة العامة ---------- */
  function overview() {
    const D = F(), t = todayStr();
    if (!D.accounts.length) return `<div class="hero-title">المال</div>
      <div class="sub">ميزانيتك ومصاريفك وأهدافك وزكاتك، كلها على جهازك وفي مستودعك الخاص. لا ربط بالبنك.</div>
      <div class="card fin-start"><b>ابدأ بحساباتك</b><p class="sub">أضف الحسابات التي تملكها برصيدها الحالي. يمكنك تعديلها في أي وقت.</p>
      <div class="btns"><button class="btn pri" data-fn="starter">إنشاء: نقد + حساب جارٍ + ادخار</button><button class="btn" data-fn="acc-edit">حساب مخصّص</button></div></div>
      <div class="note">ستجد هنا: ميزانية شهرية لكل فئة، المصاريف المتكررة وتذكير بها، أهداف الادخار (العمرة مثلًا)، الديون، وحاسبة الزكاة بالحول الهجري.</div>`;
    const m = X.month(D, ym), cur = ym === t.slice(0, 7), fc = cur ? X.forecast(D, t) : null, bal = X.total(D);
    const owe = X.debtsTotal(D, 'owe'), owed = X.debtsTotal(D, 'owed');
    const bud = X.budget(D, ym).filter(b => b.lim).slice(0, 6), up = X.upcoming(D, t, 14).slice(0, 5), z = X.zakat(D, t);
    const recent = D.tx.filter(x => x.d.slice(0, 7) === ym).slice(0, 8);
    const sadaqa = (m.byCat['الصدقة'] || 0);
    return `<div class="fin-top"><div class="hero-title">المال</div>
      <div class="mswitch"><button class="btn sm" data-fn="ym" data-n="-1" aria-label="الشهر السابق">›</button><b>${ymLabel(ym)}</b><button class="btn sm" data-fn="ym" data-n="1" aria-label="الشهر التالي"${cur ? ' disabled' : ''}>‹</button></div></div>
    <div class="card fin-hero">
      <span class="sub">الرصيد في كل الحسابات</span><div class="big">${money(bal)}</div>
      ${owe || owed ? `<span class="sub">${owe ? 'عليك ' + money(owe, 1) : ''}${owe && owed ? ' · ' : ''}${owed ? 'لك ' + money(owed, 1) : ''}</span>` : ''}
      <div class="kpi3"><div><span>الدخل</span><b class="pos">${money(m.inc, 1)}</b></div><div><span>المصاريف</span><b class="neg">${money(m.out, 1)}</b></div><div><span>الادخار</span><b>${m.save === null ? '—' : m.save + '%'}</b></div></div>
      ${fc && m.out ? `<div class="sub fc">المتوقع حتى آخر الشهر: ${money(fc.out, 1)}${fc.pending ? ` (منها ${money(fc.pending, 1)} متكررة لم تُدفع)` : ''}</div>` : ''}
    </div>
    <div class="btns fin-quick"><button class="btn pri" data-fn="tx-new" data-k="out">− مصروف</button><button class="btn" data-fn="tx-new" data-k="in">+ دخل</button><button class="btn" data-fn="tx-new" data-k="move">⇄ تحويل</button></div>
    ${up.length ? `<h2>قادم خلال أسبوعين</h2><div class="rows">${up.map(recurRow).join('')}</div>` : ''}
    <h2>الميزانية <a class="hlink" href="#/fin/budget">تعديل</a></h2>
    ${bud.length ? `<div class="buds">${bud.map(budRow).join('')}</div>` : `<div class="empty">لم تضع حدودًا بعد. <a href="#/fin/budget">ضع ميزانية للفئات</a></div>`}
    ${sadaqa ? `<div class="note good">صدقاتك هذا الشهر: ${money(sadaqa)}. «ما نقصت صدقة من مال».</div>` : ''}
    <h2>الزكاة <a class="hlink" href="#/fin/zakat">التفاصيل</a></h2>${zakatMini(z)}
    ${D.goals.length ? `<h2>الأهداف <a class="hlink" href="#/fin/goals">الكل</a></h2><div class="rows">${D.goals.slice(0, 3).map(goalRow).join('')}</div>` : ''}
    <h2>عمليات ${ymLabel(ym)} <a class="hlink" href="#/fin/tx">الكل</a></h2>
    <div class="rows">${recent.map(txRow).join('') || '<div class="empty">لا عمليات هذا الشهر.</div>'}</div>
    <h2>الأقسام</h2><div class="fin-nav">${NAV.map(([k, l]) => `<a href="#/fin/${k}">${l}</a>`).join('')}</div>`;
  }
  function budRow(b) {
    const p = b.pct || 0, cls = p > 100 ? 'over' : p >= 85 ? 'warn' : '';
    return `<div class="bud ${cls}"><div class="bh"><span>${esc(b.cat)}</span><span>${money(b.spent, 1)} / ${money(b.lim, 1)}</span></div><div class="bb"><i style="width:${Math.min(100, p)}%"></i></div>${p > 100 ? `<span class="m">تجاوزت بـ ${money(-b.left, 1)}</span>` : b.lim ? `<span class="m">بقي ${money(b.left, 1)}</span>` : ''}</div>`;
  }
  function txRow(x) {
    const sign = x.kind === 'in' ? '+' : x.kind === 'out' ? '−' : '⇄', cls = x.kind === 'in' ? 'pos' : x.kind === 'out' ? '' : 'mv';
    const meta = x.kind === 'move' ? `${esc(accName(x.acc))} ← ${esc(accName(x.to))}` : `${esc(x.cat || 'بلا فئة')} · ${esc(accName(x.acc))}`;
    return `<button class="row" data-fn="tx-edit" data-id="${x.id}"><span class="main"><span class="t lat">${esc(x.note || x.cat || 'عملية')}</span><span class="m">${fmtD(x.d)} · ${meta}</span></span><span class="txa ${cls}">${sign} ${money(x.amt)}</span></button>`;
  }
  function recurRow(u) {
    const r = u.r;
    return `<div class="row${u.late ? ' late' : ''}"><span class="main"><span class="t lat">${esc(r.name)}</span><span class="m">${u.late ? 'متأخر · ' : ''}${fmtD(u.d, { weekday: 'short', day: 'numeric', month: 'short' })} · ${esc(accName(r.acc))}</span></span><span class="txa ${r.kind === 'in' ? 'pos' : ''}">${money(r.amt)}</span>${u.d === r.next ? `<button class="btn sm" data-fn="recur-pay" data-id="${r.id}">${r.kind === 'in' ? 'وصل' : 'دُفع'}</button>` : ''}</div>`;
  }
  function goalRow(g) {
    const p = X.goalPlan(F(), g, todayStr());
    return `<button class="row" data-fn="goal-edit" data-id="${g.id}"><span class="main"><span class="t lat">${esc(g.name)}</span><span class="m">${money(p.saved, 1)} من ${money(g.target, 1)}${p.perMonth ? ` · ${money(p.perMonth, 1)} شهريًا حتى ${fmtD(g.due, { month: 'short', year: 'numeric' })}` : ''}</span><span class="bb sm"><i style="width:${p.pct}%"></i></span></span><span class="go">${p.pct}%</span></button>`;
  }
  function zakatMini(z) {
    const Z = F().zakat;
    if (!Z.base || (!Z.gold && !Z.silver)) return `<a class="row" href="#/fin/zakat" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat">اضبط حاسبة الزكاة</span><span class="m">اختر أساس النصاب وأدخل سعر غرام الذهب أو الفضة وتاريخ بداية الحول</span></span><span class="go">‹</span></a>`;
    const h = z.hawl;
    return `<a class="card zmini" href="#/fin/zakat"><div><span class="sub">الوعاء الزكوي</span><b>${money(z.net, 1)}</b></div><div><span class="sub">${z.above ? 'الزكاة (2.5%)' : 'دون النصاب'}</span><b class="${z.above ? 'gold' : ''}">${z.above ? money(z.due) : money(z.nisab, 1)}</b></div>
      <div class="zh">${h ? (h.reached ? '<b class="gold">حال الحول: حان وقت الإخراج</b>' : `يحول الحول بعد ${h.left} يومًا (${h.endH ? h.endH.text : fmtD(h.end)})`) : 'لم تحدّد بداية الحول'}</div></a>`;
  }

  /* ---------- العمليات ---------- */
  function txPage() {
    const D = F();
    let L = D.tx.filter(x => x.d.slice(0, 7) === ym);
    if (fCat) L = L.filter(x => x.cat === fCat);
    if (fAcc) L = L.filter(x => x.acc === fAcc || x.to === fAcc);
    if (q) { const s = q.toLowerCase(); L = L.filter(x => (x.note + ' ' + x.cat).toLowerCase().includes(s)); }
    const days = {}; L.forEach(x => { (days[x.d] = days[x.d] || []).push(x); });
    const sum = L.reduce((s, x) => s + (x.kind === 'in' ? x.amt : x.kind === 'out' ? -x.amt : 0), 0);
    const cats = [...new Set(D.tx.map(x => x.cat).filter(Boolean))];
    return head('العمليات', `${ymLabel(ym)} · ${L.length} عملية · الصافي ${money(sum, 1)}`) + `
      <div class="mswitch wide"><button class="btn sm" data-fn="ym" data-n="-1">›</button><b>${ymLabel(ym)}</b><button class="btn sm" data-fn="ym" data-n="1">‹</button></div>
      <div class="two"><select id="fn-fcat"><option value="">كل الفئات</option>${cats.map(c => opt(c, c, fCat)).join('')}</select><select id="fn-facc"><option value="">كل الحسابات</option>${D.accounts.map(a => opt(a.id, a.name, fAcc)).join('')}</select></div>
      <input type="text" id="fn-q" placeholder="بحث في الوصف أو الفئة" value="${esc(q)}" style="margin:8px 0">
      <button class="btn pri block" data-fn="tx-new" data-k="out">+ عملية جديدة</button>
      ${Object.keys(days).map(d => `<h2>${fmtD(d, { weekday: 'long', day: 'numeric', month: 'long' })}</h2><div class="rows">${days[d].map(txRow).join('')}</div>`).join('') || '<div class="empty">لا عمليات مطابقة.</div>'}`;
  }
  function txSheet(x, kind) {
    const D = F(), k = x ? x.kind : kind || 'out', cats = k === 'in' ? D.cats.in : D.cats.out;
    const acc0 = x ? x.acc : (D.accounts.find(a => a.type === 'bank') || D.accounts[0] || {}).id;
    openSheet(`<h3>${x ? 'تعديل عملية' : 'عملية جديدة'}</h3>
      <div class="seg full" role="group">${[['out', 'مصروف'], ['in', 'دخل'], ['move', 'تحويل']].map(([v, l]) => `<button data-fn="tx-kind" data-k="${v}" data-id="${x ? x.id : ''}" aria-pressed="${k === v}">${l}</button>`).join('')}</div>
      <label class="field"><span>المبلغ (€)</span><input type="text" inputmode="decimal" id="fn-amt" class="bignum" dir="ltr" value="${x ? String(x.amt).replace('.', ',') : ''}" placeholder="0,00" autocomplete="off"></label>
      ${k !== 'move' ? `<div class="field"><span class="flabel">الفئة</span><div class="chips" id="fn-cats">${cats.map(c => `<button class="chip${(x ? x.cat : '') === c ? ' on' : ''}" data-fn="pick-cat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}<button class="chip" data-fn="cat-add" data-k="${k}">+ فئة</button></div><input type="hidden" id="fn-cat" value="${esc(x ? x.cat : '')}"></div>` : ''}
      <div class="two"><label class="field"><span>${k === 'move' ? 'من حساب' : 'الحساب'}</span><select id="fn-acc">${D.accounts.map(a => opt(a.id, a.name, acc0)).join('')}</select></label>
      ${k === 'move' ? `<label class="field"><span>إلى حساب</span><select id="fn-to">${D.accounts.map(a => opt(a.id, a.name, x ? x.to : (D.accounts.find(b => b.type === 'save') || {}).id)).join('')}</select></label>` : `<label class="field"><span>التاريخ</span><input type="date" id="fn-d" value="${x ? x.d : todayStr()}"></label>`}</div>
      ${k === 'move' ? `<label class="field"><span>التاريخ</span><input type="date" id="fn-d" value="${x ? x.d : todayStr()}"></label>` : ''}
      <label class="field"><span>الوصف (اختياري)</span><input type="text" id="fn-note" value="${esc(x ? x.note : '')}" placeholder="مثال: كارفور، فاتورة الكهرباء…"></label>
      <div class="btns"><button class="btn pri" data-fn="tx-save" data-id="${x ? x.id : ''}" data-k="${k}">حفظ</button>${x ? `<button class="btn warn" data-fn="tx-del" data-id="${x.id}">حذف</button>` : ''}<button class="btn" data-act="close">إلغاء</button></div>`);
    setTimeout(() => { const a = $('#fn-amt'); if (a && !x) a.focus(); }, 60);
  }

  /* ---------- الميزانية ---------- */
  function budgetPage() {
    const D = F(), m = X.month(D, ym), t = todayStr(), tot = Object.values(D.budget).reduce((s, v) => s + (+v || 0), 0);
    const inc = X.month(D, shiftYm(t.slice(0, 7), -1)).inc || m.inc;
    return head('الميزانية الشهرية', `مجموع الحدود ${money(tot, 1)}${inc ? ` · ${Math.round(tot / inc * 100)}% من دخلك` : ''}`) + `
      <div class="note">ضع حدًّا شهريًا لكل فئة تريد ضبطها، واترك الباقي فارغًا. تظهر الحدود في الصفحة الرئيسية بألوان: أخضر، ثم برتقالي عند 85%، ثم أحمر عند التجاوز.</div>
      <div class="rows">${D.cats.out.map(c => `<div class="row"><span class="main"><span class="t lat">${esc(c)}</span><span class="m">${ymLabel(ym)}: ${money(m.byCat[c] || 0, 1)}</span></span><input type="text" inputmode="decimal" class="mini" dir="ltr" data-fnb="${esc(c)}" value="${D.budget[c] || ''}" placeholder="—"></div>`).join('')}</div>
      <h2>الفئات</h2><div class="btns"><button class="btn sm" data-fn="cat-add" data-k="out">+ فئة مصاريف</button><button class="btn sm" data-fn="cat-add" data-k="in">+ فئة دخل</button></div>`;
  }

  /* ---------- المتكرر ---------- */
  const FREQ = { m: 'شهريًا', w: 'أسبوعيًا', y: 'سنويًا' };
  function recurPage() {
    const D = F(), mo = D.recur.filter(r => r.on !== false && r.kind !== 'in').reduce((s, r) => s + r.amt * (r.freq === 'w' ? 52 / 12 : r.freq === 'y' ? 1 / 12 : 1), 0);
    return head('المتكرر', `الاشتراكات والفواتير الثابتة · ≈ ${money(mo, 1)} شهريًا`) + `
      <button class="btn pri block" data-fn="recur-edit">+ إضافة (إيجار، كهرباء، هاتف، اشتراك…)</button>
      <div class="rows" style="margin-top:10px">${D.recur.map(r => `<button class="row${r.on === false ? ' done' : ''}" data-fn="recur-edit" data-id="${r.id}"><span class="main"><span class="t lat">${esc(r.name)}</span><span class="m">${FREQ[r.freq] || ''} · القادم ${fmtD(r.next)} · ${esc(r.cat)} · ${esc(accName(r.acc))}</span></span><span class="txa ${r.kind === 'in' ? 'pos' : ''}">${money(r.amt)}</span></button>`).join('') || '<div class="empty">لا شيء بعد.</div>'}</div>
      <div class="note">مساري لا يدفع شيئًا: يذكّرك في الصفحة الرئيسية، وعند ضغط «دُفع» تُسجَّل العملية وينتقل الموعد. تتبّع اشتراكاتك يساعدك على مراجعة الفواتير وإلغاء ما لا تحتاجه.</div>`;
  }
  function recurSheet(r) {
    const D = F(); r = r || { name: '', amt: '', kind: 'out', cat: 'الفواتير', acc: (D.accounts.find(a => a.type === 'bank') || D.accounts[0] || {}).id, freq: 'm', next: todayStr(), on: true };
    openSheet(`<h3>${r.id ? 'تعديل' : 'مصروف أو دخل متكرر'}</h3>
      <label class="field"><span>الاسم</span><input type="text" id="fn-rn" value="${esc(r.name)}" placeholder="الإيجار"></label>
      <div class="two"><label class="field"><span>المبلغ (€)</span><input type="text" inputmode="decimal" dir="ltr" id="fn-ra" value="${r.amt}"></label><label class="field"><span>النوع</span><select id="fn-rk">${opt('out', 'مصروف', r.kind)}${opt('in', 'دخل', r.kind)}</select></label></div>
      <div class="two"><label class="field"><span>الفئة</span><select id="fn-rc">${[...D.cats.out, ...D.cats.in.filter(c => !D.cats.out.includes(c))].map(c => opt(c, c, r.cat)).join('')}</select></label><label class="field"><span>الحساب</span><select id="fn-racc">${D.accounts.map(a => opt(a.id, a.name, r.acc)).join('')}</select></label></div>
      <div class="two"><label class="field"><span>التكرار</span><select id="fn-rf">${Object.entries(FREQ).map(([k, l]) => opt(k, l, r.freq)).join('')}</select></label><label class="field"><span>الموعد القادم</span><input type="date" id="fn-rd" value="${r.next}"></label></div>
      ${r.id ? `<label class="check"><input type="checkbox" id="fn-ron" ${r.on !== false ? 'checked' : ''}> مفعّل</label>` : ''}
      <div class="btns"><button class="btn pri" data-fn="recur-save" data-id="${r.id || ''}">حفظ</button>${r.id ? `<button class="btn" data-fn="recur-skip" data-id="${r.id}">تخطّي هذه المرة</button><button class="btn warn" data-fn="recur-del" data-id="${r.id}">حذف</button>` : ''}<button class="btn" data-act="close">إلغاء</button></div>`);
  }

  /* ---------- الأهداف ---------- */
  function goalsPage() {
    const D = F();
    return head('أهداف الادخار', 'العمرة، صندوق الطوارئ، حاسوب جديد…') + `
      <button class="btn pri block" data-fn="goal-edit">+ هدف جديد</button>
      <div class="rows" style="margin-top:10px">${D.goals.map(goalRow).join('') || '<div class="empty">لا أهداف بعد.</div>'}</div>
      <div class="note">صندوق الطوارئ: يُنصح عادةً بما يغطي 3 إلى 6 أشهر من مصاريفك الثابتة. اربط الهدف بحساب ادخار ليتابَع تلقائيًا، أو سجّل المبلغ يدويًا.</div>`;
  }
  function goalSheet(g) {
    const D = F(); g = g || { name: '', target: '', due: '', acc: '', saved: 0 };
    openSheet(`<h3>${g.id ? 'تعديل الهدف' : 'هدف جديد'}</h3>
      <label class="field"><span>الاسم</span><input type="text" id="fn-gn" value="${esc(g.name)}" placeholder="العمرة"></label>
      <div class="two"><label class="field"><span>المبلغ المستهدف (€)</span><input type="text" inputmode="decimal" dir="ltr" id="fn-gt" value="${g.target}"></label><label class="field"><span>قبل تاريخ (اختياري)</span><input type="date" id="fn-gd" value="${g.due || ''}"></label></div>
      <label class="field"><span>المتابعة</span><select id="fn-gacc"><option value="">يدويًا</option>${D.accounts.map(a => opt(a.id, 'رصيد حساب: ' + a.name, g.acc)).join('')}</select></label>
      <label class="field"><span>المدّخر حتى الآن (إن كانت المتابعة يدوية)</span><input type="text" inputmode="decimal" dir="ltr" id="fn-gs" value="${g.saved || ''}"></label>
      <div class="btns"><button class="btn pri" data-fn="goal-save" data-id="${g.id || ''}">حفظ</button>${g.id ? `<button class="btn warn" data-fn="goal-del" data-id="${g.id}">حذف</button>` : ''}<button class="btn" data-act="close">إلغاء</button></div>`);
  }

  /* ---------- الديون ---------- */
  function debtsPage() {
    const D = F(), L = dir => D.debts.filter(d => d.dir === dir).map(d => { const left = X.debtLeft(d); return `<button class="row${left <= 0 ? ' done' : ''}" data-fn="debt-edit" data-id="${d.id}"><span class="main"><span class="t lat">${esc(d.who)}${d.note ? ' · ' + esc(d.note) : ''}</span><span class="m">${left <= 0 ? 'سُدّد' : 'المتبقي ' + money(left)}${d.due ? ' · الأجل ' + fmtD(d.due) : ''}</span></span><span class="txa">${money(d.amt, 1)}</span></button>`; }).join('');
    return head('الديون', `عليك ${money(X.debtsTotal(D, 'owe'), 1)} · لك ${money(X.debtsTotal(D, 'owed'), 1)}`) + `
      <div class="btns"><button class="btn pri" data-fn="debt-edit" data-dir="owe">+ دين عليّ</button><button class="btn" data-fn="debt-edit" data-dir="owed">+ دين لي</button></div>
      <h2>عليّ</h2><div class="rows">${L('owe') || '<div class="empty">لا شيء.</div>'}</div>
      <h2>لي عند الناس</h2><div class="rows">${L('owed') || '<div class="empty">لا شيء.</div>'}</div>
      <div class="note">«يا أيها الذين آمنوا إذا تداينتم بدين إلى أجل مسمى فاكتبوه». تدخل الديون في حساب الزكاة حسب اختياراتك في صفحة الزكاة.</div>`;
  }
  function debtSheet(d, dir) {
    d = d || { dir: dir || 'owe', who: '', amt: '', due: '', note: '', paid: [], sure: true };
    const left = d.id ? X.debtLeft(d) : null;
    openSheet(`<h3>${d.dir === 'owe' ? 'دين عليّ' : 'دين لي'}</h3>
      <div class="two"><label class="field"><span>${d.dir === 'owe' ? 'الدائن' : 'المدين'}</span><input type="text" id="fn-dw" value="${esc(d.who)}"></label><label class="field"><span>المبلغ (€)</span><input type="text" inputmode="decimal" dir="ltr" id="fn-da" value="${d.amt}"></label></div>
      <div class="two"><label class="field"><span>الأجل (اختياري)</span><input type="date" id="fn-dd" value="${d.due || ''}"></label><label class="field"><span>ملاحظة</span><input type="text" id="fn-dn" value="${esc(d.note || '')}"></label></div>
      ${d.dir === 'owed' ? `<label class="check"><input type="checkbox" id="fn-dsure" ${d.sure !== false ? 'checked' : ''}> مرجوّ السداد (يدخل في الزكاة)</label>` : ''}
      ${d.id ? `<h2>الأقساط · المتبقي ${money(left)}</h2><div class="rows">${(d.paid || []).map(p => `<div class="row"><span class="main"><span class="m">${fmtD(p.d)}</span></span><span class="txa">${money(p.amt)}</span></div>`).join('') || '<div class="empty">لا أقساط بعد.</div>'}</div>
      <div class="two" style="margin-top:8px"><input type="text" inputmode="decimal" dir="ltr" id="fn-dp" placeholder="مبلغ القسط"><button class="btn" data-fn="debt-pay" data-id="${d.id}">تسجيل قسط</button></div>` : ''}
      <div class="btns" style="margin-top:12px"><button class="btn pri" data-fn="debt-save" data-id="${d.id || ''}" data-dir="${d.dir}">حفظ</button>${d.id ? `<button class="btn warn" data-fn="debt-del" data-id="${d.id}">حذف</button>` : ''}<button class="btn" data-act="close">إلغاء</button></div>`);
  }

  /* ---------- الحسابات ---------- */
  function accPage() {
    const D = F(), b = X.balances(D);
    return head('الحسابات', 'المجموع ' + nf.format(X.total(D))) + `
      <button class="btn pri block" data-fn="acc-edit">+ حساب</button>
      <div class="rows" style="margin-top:10px">${D.accounts.map(a => `<button class="row" data-fn="acc-edit" data-id="${a.id}"><span class="main"><span class="t lat">${esc(a.name)}</span><span class="m">${X.ACC_T[a.type] || ''}${a.type === 'other' || a.zak === false ? ' · خارج الزكاة' : a.type === 'invest' && a.zr !== undefined && +a.zr !== 1 ? ` · يزكّى ${Math.round(a.zr * 100)}%` : ''}</span></span><span class="txa">${money(b[a.id])}</span></button>`).join('')}</div>`;
  }
  function accSheet(a) {
    a = a || { name: '', type: 'bank', bal0: '', zak: true, zr: 1 };
    const bal = a.id ? X.balances(F())[a.id] : null;
    openSheet(`<h3>${a.id ? 'تعديل الحساب' : 'حساب جديد'}</h3>
      <div class="two"><label class="field"><span>الاسم</span><input type="text" id="fn-an" value="${esc(a.name)}" placeholder="الحساب الجاري"></label><label class="field"><span>النوع</span><select id="fn-at">${Object.entries(X.ACC_T).map(([k, l]) => opt(k, l, a.type)).join('')}</select></label></div>
      <label class="field"><span>${a.id ? 'الرصيد الحالي (يُعدَّل الرصيد الافتتاحي ليطابقه)' : 'الرصيد الحالي (€)'}</span><input type="text" inputmode="decimal" dir="ltr" id="fn-ab" value="${a.id ? bal : a.bal0}"></label>
      <label class="check"><input type="checkbox" id="fn-az" ${a.zak !== false ? 'checked' : ''}> يدخل في الوعاء الزكوي</label>
      <label class="field"><span>للاستثمار: نسبة ما يزكّى من القيمة (100% افتراضيًا)</span><input type="text" inputmode="decimal" dir="ltr" id="fn-azr" value="${Math.round((a.zr === undefined ? 1 : a.zr) * 100)}"></label>
      <div class="btns"><button class="btn pri" data-fn="acc-save" data-id="${a.id || ''}">حفظ</button>${a.id ? `<button class="btn warn" data-fn="acc-del" data-id="${a.id}">حذف</button>` : ''}<button class="btn" data-act="close">إلغاء</button></div>`);
  }

  /* ---------- الزكاة ---------- */
  function zakatPage() {
    const D = F(), Z = D.zakat, t = todayStr(), z = X.zakat(D, t), h = z.hawl, th = X.hijri(t);
    const bases = [['gold', 'نصاب الذهب', `85 غ ذهب = ${z.nG ? nf0.format(z.nG) : 'أدخل السعر'}`], ['silver', 'نصاب الفضة', `595 غ فضة = ${z.nS ? nf0.format(z.nS) : 'أدخل السعر'}`], ['min', 'الأقل منهما', 'أحظّ للفقراء عند من يرى ذلك']];
    return head('الزكاة', th ? 'اليوم ' + th.text : '') + `
    <div class="card zres ${z.above ? 'yes' : ''}">
      ${!Z.base ? '<b>اختر أساس النصاب أولًا</b><span class="sub">ثم أدخل سعر الغرام. الحساب يظهر هنا.</span>' : z.nisab == null ? '<b>أدخل سعر غرام ' + (Z.base === 'silver' ? 'الفضة' : Z.base === 'gold' ? 'الذهب' : 'الذهب والفضة') + '</b>' :
        `<span class="sub">الوعاء الزكوي الصافي</span><div class="big">${money(z.net)}</div>
         <span class="sub">النصاب ${money(z.nisab, 1)} · ${z.above ? 'بلغ النصاب' : 'لم يبلغ النصاب: لا زكاة في هذا المال الآن'}</span>
         ${z.above ? `<div class="zdue"><span>الزكاة الواجبة (ربع العشر)</span><b>${money(z.due)}</b></div>` : ''}
         <div class="zh">${h ? (h.reached ? '<b>حال الحول: حان وقت الإخراج.</b>' : `بداية الحول ${h.startH ? h.startH.text : fmtD(h.start)} · يحول في ${h.endH ? h.endH.text : ''} (${fmtD(h.end, { day: 'numeric', month: 'long', year: 'numeric' })}) · بعد ${h.left} يومًا`) : 'حدّد تاريخ بلوغ المال النصاب لمعرفة موعد الحول.'}</div>
         ${z.above && (!h || h.reached) ? `<div class="btns" style="margin-top:10px"><button class="btn pri" data-fn="zk-pay">سجّلت إخراج الزكاة</button></div>` : ''}`}
    </div>
    <h2>1. أساس النصاب</h2>
    <div class="zbase">${bases.map(([k, l, s]) => `<button class="chip${Z.base === k ? ' on' : ''}" data-fn="zk-base" data-b="${k}"><b>${l}</b><small>${s}</small></button>`).join('')}</div>
    <div class="note">اختلف العلماء المعاصرون في نصاب الأوراق النقدية: هل يُقدَّر بالذهب أم بالفضة. اعتمد ما ترجّح لك أو ما أفتاك به من تثق بعلمه.</div>
    <h2>2. سعر الغرام اليوم (يورو)</h2>
    <div class="two"><label class="field"><span>الذهب عيار 24</span><input type="text" inputmode="decimal" dir="ltr" id="zk-gold" value="${Z.gold || ''}" placeholder="مثال: 110"></label><label class="field"><span>الفضة</span><input type="text" inputmode="decimal" dir="ltr" id="zk-silver" value="${Z.silver || ''}" placeholder="مثال: 1.30"></label></div>
    <div class="sub">ابحث عن «prix or gramme 24 carats» و«prix argent gramme» يوم الحساب. ${Z.priceDate ? 'آخر تحديث: ' + fmtD(Z.priceDate, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
    <h2>3. ما تملكه</h2>
    <div class="rows">${z.parts.map(p => `<div class="row"><span class="main"><span class="t lat">${esc(p.name)}</span></span><span class="txa">${money(p.v)}</span></div>`).join('') || '<div class="empty">أضف حساباتك في قسم «الحسابات».</div>'}
      ${z.debts ? `<div class="row"><span class="main"><span class="t lat">ناقص: ديون حالّة عليك</span></span><span class="txa neg">− ${money(z.debts)}</span></div>` : ''}</div>
    <div class="two" style="margin-top:10px"><label class="field"><span>ذهب تملكه (غرام)</span><input type="text" inputmode="decimal" dir="ltr" id="zk-goldG" value="${Z.goldG || ''}"></label><label class="field"><span>عياره</span><select id="zk-goldK">${[24, 22, 21, 18, 14].map(k => opt(String(k), k + ' قيراط', String(Z.goldK || 24))).join('')}</select></label></div>
    <label class="field"><span>فضة تملكها (غرام)</span><input type="text" inputmode="decimal" dir="ltr" id="zk-silverG" value="${Z.silverG || ''}"></label>
    <div class="sub">حلي الزوجة ملكها هي، والحلي المعدّ للاستعمال فيه خلاف معروف بين العلماء.</div>
    <h2>أموال أخرى زكوية</h2>
    ${(Z.extra || []).length ? `<div class="rows">` : ''}${(Z.extra || []).map((x, i) => `<div class="row"><span class="main"><span class="t lat">${esc(x.name)}</span></span><span class="txa">${money(x.v)}</span><button class="btn sm" data-fn="zk-xdel" data-i="${i}" aria-label="حذف">✕</button></div>`).join('')}${(Z.extra || []).length ? '</div>' : ''}
    <div class="two" style="margin-top:8px"><input type="text" id="zk-xn" placeholder="مثال: عروض تجارة، نقد في البيت"><div class="btns" style="flex-wrap:nowrap"><input type="text" inputmode="decimal" dir="ltr" id="zk-xv" placeholder="€"><button class="btn" data-fn="zk-xadd">أضف</button></div></div>
    <label class="check"><input type="checkbox" id="zk-dd" ${Z.deductDebts ? 'checked' : ''}> خصم الديون الحالّة عليّ (خلال سنة) من الوعاء</label>
    <div class="sub">مسألة خصم الدين من الوعاء الزكوي فيها خلاف بين العلماء.</div>
    <h2>4. الحول</h2>
    <label class="field"><span>تاريخ بلوغ مالك النصاب (أو تاريخ آخر إخراج)</span><input type="date" id="zk-hawl" value="${Z.hawlStart || ''}"></label>
    ${Z.hawlStart ? `<div class="sub">يوافق ${(X.hijri(Z.hawlStart) || {}).text || ''}. يحول الحول بمرور سنة هجرية كاملة (≈ 354 يومًا). عند جمهور العلماء، إذا نقص المال عن النصاب أثناء الحول انقطع الحول.</div>` : ''}
    ${Z.paid.length ? `<h2>سجلّ الإخراج</h2><div class="rows">${Z.paid.slice().reverse().map(p => `<div class="row"><span class="main"><span class="t lat">${p.hy ? p.hy + 'هـ' : ''}</span><span class="m">${fmtD(p.d, { day: 'numeric', month: 'long', year: 'numeric' })} · الوعاء ${money(p.base, 1)}</span></span><span class="txa gold">${money(p.amt)}</span></div>`).join('')}</div>` : ''}
    <div class="note">هذه الحاسبة أداة تنظيم تعتمد على اختياراتك، وليست فتوى. للحالات الخاصة (أسهم الشركات، التقاعد، العقار المعدّ للتجارة) استشر أهل العلم.</div>`;
  }

  /* ---------- استيراد كشف بنكي ---------- */
  function importPage() {
    const D = F();
    return head('استيراد كشف بنكي', 'ملف CSV من موقع بنكك') + `
      <div class="note">من موقع بنكك: الحسابات ← تنزيل العمليات ← صيغة CSV أو Excel (CSV). يُقرأ الملف هنا على جهازك فقط، ولا يُرسل إلى أي مكان. العمليات المكررة لا تُضاف مرتين.</div>
      <label class="field"><span>إلى أي حساب؟</span><select id="fn-imacc">${D.accounts.map(a => opt(a.id, a.name, (D.accounts.find(x => x.type === 'bank') || {}).id)).join('')}</select></label>
      <label class="btn pri" style="display:inline-flex;align-items:center">اختيار ملف CSV<input type="file" id="fn-csv" accept=".csv,text/csv,text/plain" hidden></label>
      <div id="fn-impv">${csvRows ? previewHtml() : ''}</div>
      <h2>قواعد التصنيف التلقائي</h2>
      <div class="sub">إذا احتوى وصف العملية على الكلمة، صُنّفت تلقائيًا. مثال: carrefour ← الطعام، sncf ← المواصلات.</div>
      <div class="rows">${D.rules.map((r, i) => `<div class="row"><span class="main"><span class="t lat" dir="ltr">${esc(r.k)}</span><span class="m">${esc(r.cat)}</span></span><button class="btn sm" data-fn="rule-del" data-i="${i}">✕</button></div>`).join('') || '<div class="empty">لا قواعد بعد.</div>'}</div>
      <div class="two" style="margin-top:8px"><input type="text" id="fn-rk2" dir="ltr" placeholder="كلمة (carrefour)"><div class="btns" style="flex-wrap:nowrap"><select id="fn-rc2">${D.cats.out.concat(D.cats.in).map(c => opt(c, c, '')).join('')}</select><button class="btn" data-fn="rule-add">أضف</button></div></div>`;
  }
  function previewHtml() {
    const D = F(), out = csvRows.filter(r => r.amt < 0).reduce((s, r) => s - r.amt, 0), inc = csvRows.filter(r => r.amt > 0).reduce((s, r) => s + r.amt, 0);
    return `<div class="card"><b>${csvRows.length} عملية مقروءة</b><div class="sub">مصاريف ${money(out, 1)} · دخل ${money(inc, 1)}</div>
      <div class="rows" style="margin:8px 0">${csvRows.slice(0, 6).map(r => `<div class="row"><span class="main"><span class="t lat" dir="ltr" style="font-size:14px">${esc(r.label)}</span><span class="m">${fmtD(r.d)} · ${esc(X.categorize(D, r.label) || 'أخرى')}</span></span><span class="txa ${r.amt > 0 ? 'pos' : ''}">${money(r.amt)}</span></div>`).join('')}</div>
      <button class="btn pri" data-fn="csv-go">استيراد إلى الحساب المختار</button></div>`;
  }

  /* ---------- التوجيه ---------- */
  views.fin = () => ({ tx: txPage, budget: budgetPage, recur: recurPage, goals: goalsPage, debts: debtsPage, acc: accPage, zakat: zakatPage, import: importPage }[sub()] || overview)();
  const rerender = () => { if (!location.hash.startsWith('#/fin')) return route(); const y = scrollY; $('#view').innerHTML = views.fin(); scrollTo(0, y); };
  const commit = (msg, keepSheet) => { save(); if (!keepSheet) closeSheet(); rerender(); if (msg) toast(msg); };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fn]'); if (!b) return;
    const D = F(), a = b.dataset.fn, id = b.dataset.id, t = todayStr();
    switch (a) {
      case 'ym': ym = shiftYm(ym, +b.dataset.n); if (ym > t.slice(0, 7)) ym = t.slice(0, 7); rerender(); break;
      case 'starter':
        [['نقد', 'cash'], ['الحساب الجاري', 'bank'], ['الادخار', 'save']].forEach(([name, type]) => D.accounts.push({ id: X.uid(), name, type, bal0: 0, zak: true }));
        commit('أُنشئت الحسابات: عدّل أرصدتها في «الحسابات»'); location.hash = '#/fin/acc'; break;
      case 'tx-new': txSheet(null, b.dataset.k); break;
      case 'tx-edit': txSheet(D.tx.find(x => x.id === id)); break;
      case 'tx-kind': { const x = id ? D.tx.find(y => y.id === id) : null; if (x) { const c = { ...x, kind: b.dataset.k }; txSheet(c); } else txSheet(null, b.dataset.k); break; }
      case 'pick-cat': document.querySelectorAll('#fn-cats .chip').forEach(c => c.classList.toggle('on', c === b)); $('#fn-cat').value = b.dataset.c; break;
      case 'cat-add': { const n = prompt('اسم الفئة الجديدة'); if (!n || !n.trim()) return; const L = D.cats[b.dataset.k === 'in' ? 'in' : 'out']; if (!L.includes(n.trim())) L.push(n.trim()); save(); if ($('#sheet').hidden) rerender(); else { const k = b.dataset.k; txSheet(null, k); } toast('أُضيفت الفئة'); break; }
      case 'tx-save': {
        const amt = num('fn-amt'), k = b.dataset.k; if (!(amt > 0)) return toast('اكتب مبلغًا صحيحًا');
        if (!D.accounts.length) return toast('أضف حسابًا أولًا');
        const o = { d: val('fn-d') || t, kind: k, amt, acc: val('fn-acc'), to: k === 'move' ? val('fn-to') : '', cat: k === 'move' ? '' : val('fn-cat') || 'أخرى', note: val('fn-note') };
        if (k === 'move' && o.acc === o.to) return toast('اختر حسابين مختلفين');
        if (id) { const x = D.tx.find(y => y.id === id); Object.assign(x, o, { amt: X.r2(amt) }); D.tx.sort((p, q2) => p.d < q2.d ? 1 : p.d > q2.d ? -1 : 0); } else X.addTx(D, o);
        if (o.d.slice(0, 7) !== ym && !sub()) ym = o.d.slice(0, 7);
        commit(id ? 'عُدّلت العملية' : 'سُجّلت العملية'); break;
      }
      case 'tx-del': if (confirm('حذف هذه العملية؟')) { D.tx = D.tx.filter(x => x.id !== id); commit('حُذفت'); } break;
      case 'recur-edit': recurSheet(id ? D.recur.find(r => r.id === id) : null); break;
      case 'recur-save': {
        const amt = num('fn-ra'), name = val('fn-rn'); if (!name || !(amt > 0)) return toast('اكتب الاسم والمبلغ');
        const o = { name, amt: X.r2(amt), kind: val('fn-rk'), cat: val('fn-rc'), acc: val('fn-racc'), freq: val('fn-rf'), next: val('fn-rd') || t, on: id ? $('#fn-ron').checked : true };
        if (id) Object.assign(D.recur.find(r => r.id === id), o); else D.recur.push({ id: X.uid(), ...o });
        commit('حُفظ'); break;
      }
      case 'recur-pay': X.payRecur(D, id, t > D.recur.find(r => r.id === id).next ? t : undefined); commit('سُجّلت العملية'); break;
      case 'recur-skip': X.skipRecur(D, id); commit('تُخطّي هذا الموعد'); break;
      case 'recur-del': if (confirm('حذف هذا المتكرر؟')) { D.recur = D.recur.filter(r => r.id !== id); commit('حُذف'); } break;
      case 'goal-edit': goalSheet(id ? D.goals.find(g => g.id === id) : null); break;
      case 'goal-save': {
        const name = val('fn-gn'), target = num('fn-gt'); if (!name || !(target > 0)) return toast('اكتب الاسم والمبلغ');
        const o = { name, target: X.r2(target), due: val('fn-gd'), acc: val('fn-gacc'), saved: X.r2(num('fn-gs') || 0) };
        if (id) Object.assign(D.goals.find(g => g.id === id), o); else D.goals.push({ id: X.uid(), ...o });
        commit('حُفظ الهدف'); break;
      }
      case 'goal-del': if (confirm('حذف الهدف؟')) { D.goals = D.goals.filter(g => g.id !== id); commit('حُذف'); } break;
      case 'debt-edit': debtSheet(id ? D.debts.find(d => d.id === id) : null, b.dataset.dir); break;
      case 'debt-save': {
        const who = val('fn-dw'), amt = num('fn-da'); if (!who || !(amt > 0)) return toast('اكتب الاسم والمبلغ');
        const o = { who, amt: X.r2(amt), due: val('fn-dd'), note: val('fn-dn'), dir: b.dataset.dir, sure: $('#fn-dsure') ? $('#fn-dsure').checked : true };
        if (id) Object.assign(D.debts.find(d => d.id === id), o); else D.debts.push({ id: X.uid(), paid: [], ...o });
        commit('حُفظ'); break;
      }
      case 'debt-pay': { const v = num('fn-dp'); if (!(v > 0)) return toast('اكتب المبلغ'); const d = D.debts.find(x => x.id === id); d.paid = d.paid || []; d.paid.push({ d: t, amt: X.r2(v) }); save(); debtSheet(d); rerender(); toast('سُجّل القسط'); break; }
      case 'debt-del': if (confirm('حذف الدين؟')) { D.debts = D.debts.filter(d => d.id !== id); commit('حُذف'); } break;
      case 'acc-edit': accSheet(id ? D.accounts.find(x => x.id === id) : null); break;
      case 'acc-save': {
        const name = val('fn-an'), bal = num('fn-ab'); if (!name) return toast('اكتب اسم الحساب');
        const o = { name, type: val('fn-at'), zak: $('#fn-az').checked, zr: Math.min(100, Math.max(0, isNaN(num('fn-azr')) ? 100 : num('fn-azr'))) / 100 };
        if (id) { const x = D.accounts.find(y => y.id === id); const cur = X.balances(D)[id]; Object.assign(x, o); if (!isNaN(bal)) x.bal0 = X.r2(x.bal0 + bal - cur); }
        else D.accounts.push({ id: X.uid(), bal0: isNaN(bal) ? 0 : X.r2(bal), ...o });
        commit('حُفظ الحساب'); break;
      }
      case 'acc-del': {
        const used = D.tx.some(x => x.acc === id || x.to === id);
        if (!confirm(used ? 'لهذا الحساب عمليات. حذفه يحذف عملياته أيضًا. متابعة؟' : 'حذف الحساب؟')) return;
        D.accounts = D.accounts.filter(x => x.id !== id); D.tx = D.tx.filter(x => x.acc !== id && x.to !== id); commit('حُذف'); break;
      }
      case 'zk-base': D.zakat.base = b.dataset.b; commit(); break;
      case 'zk-xadd': { const n = val('zk-xn'), v = num('zk-xv'); if (!n || !(v > 0)) return toast('اكتب الوصف والمبلغ'); D.zakat.extra.push({ name: n, v: X.r2(v) }); commit('أُضيف'); break; }
      case 'zk-xdel': D.zakat.extra.splice(+b.dataset.i, 1); commit(); break;
      case 'zk-pay': {
        const z = X.zakat(D, t), accs = D.accounts.filter(x => x.type !== 'other');
        openSheet(`<h3>تسجيل إخراج الزكاة</h3><div class="sub">المحسوب: ${money(z.due)}. سجّل ما أخرجته فعلًا.</div>
          <label class="field"><span>المبلغ المُخرَج (€)</span><input type="text" inputmode="decimal" dir="ltr" id="zk-amt" value="${String(z.due).replace('.', ',')}"></label>
          <label class="field"><span>من حساب (تُسجَّل عملية في فئة الزكاة)</span><select id="zk-acc"><option value="">لا تسجّل عملية</option>${accs.map(x => opt(x.id, x.name, '')).join('')}</select></label>
          <div class="btns"><button class="btn pri" data-fn="zk-paygo">تسجيل</button><button class="btn" data-act="close">إلغاء</button></div>`); break;
      }
      case 'zk-paygo': { const v = num('zk-amt'); if (!(v > 0)) return toast('اكتب المبلغ'); X.payZakat(D, t, v, val('zk-acc')); commit('تقبّل الله منك'); break; }
      case 'rule-add': { const k = val('fn-rk2'), c = val('fn-rc2'); if (!k) return toast('اكتب الكلمة'); D.rules.push({ k, cat: c }); D.tx.forEach(x => { if (x.src === 'csv' && (!x.cat || x.cat === 'أخرى') && x.note.toLowerCase().includes(k.toLowerCase())) x.cat = c; }); commit('أُضيفت القاعدة وطُبّقت على العمليات المستوردة'); break; }
      case 'rule-del': D.rules.splice(+b.dataset.i, 1); commit(); break;
      case 'csv-go': { if (!csvRows) return; const acc = val('fn-imacc'); if (!acc) return toast('أضف حسابًا أولًا'); const r = X.importRows(D, csvRows, acc); csvRows = null; commit(`أُضيفت ${r.added} عملية${r.dup ? '، وتُجوهلت ' + r.dup + ' مكررة' : ''}`); break; }
    }
  });
  document.addEventListener('change', e => {
    const el = e.target, D = S && S.fin; if (!D) return;
    if (el.dataset && el.dataset.fnb !== undefined) { const v = parseFloat(String(el.value).replace(',', '.')); if (v > 0) D.budget[el.dataset.fnb] = X.r2(v); else delete D.budget[el.dataset.fnb]; save(); toast('حُفظ الحد'); return; }
    const id = el.id;
    if (id === 'fn-fcat') { fCat = el.value; rerender(); return; }
    if (id === 'fn-facc') { fAcc = el.value; rerender(); return; }
    if (id === 'fn-csv') { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { csvRows = X.parseCSV(r.result); if (!csvRows.length) { csvRows = null; return toast('لم أجد عمليات في الملف'); } $('#fn-impv').innerHTML = previewHtml(); } catch (x) { toast('تعذّرت قراءة الملف'); } }; r.readAsText(f, /\.csv$/i.test(f.name) ? 'utf-8' : undefined); return; }
    const Z = D.zakat, n = v => { const x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isNaN(x) ? 0 : x; };
    const zmap = { 'zk-gold': () => { Z.gold = n(el.value); Z.priceDate = todayStr(); }, 'zk-silver': () => { Z.silver = n(el.value); Z.priceDate = todayStr(); }, 'zk-goldG': () => { Z.goldG = n(el.value); }, 'zk-goldK': () => { Z.goldK = +el.value; }, 'zk-silverG': () => { Z.silverG = n(el.value); }, 'zk-dd': () => { Z.deductDebts = el.checked; }, 'zk-hawl': () => { Z.hawlStart = el.value; } };
    if (zmap[id]) { zmap[id](); save(); rerender(); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'fn-q') { q = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(() => { rerender(); const i = $('#fn-q'); if (i) { i.focus(); i.setSelectionRange(q.length, q.length); } }, 350); } });
  window.finSummary = () => { const D = S.fin; if (!D || !D.accounts.length) return null; const t = todayStr(); return { up: X.upcoming(D, t, 3).filter(u => u.d === u.r.next), z: X.zakat(D, t) }; };
})();
