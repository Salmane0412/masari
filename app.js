'use strict';
/* Masari — suivi personnel de mémorisation et d'étude. Données stockées localement (localStorage). */
const Q = window.QDATA;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const AR = '٠١٢٣٤٥٦٧٨٩';
const toAr = n => String(n); // chiffres latins (0-9) partout
const BISM_TOKENS = 4; // « بسم الله الرحمن الرحيم » = 4 mots, retirée à l'affichage du 1er verset (texte source inchangé)

/* ---------- index du Coran ---------- */
const first = {}; let tot = 0;
Q.chapters.forEach(c => { first[c[0]] = tot; tot += c[3]; });
const CH = Object.fromEntries(Q.chapters.map(c => [c[0], { id: c[0], ar: c[1], tr: c[2], n: c[3] }]));
const gi = (s, a) => first[s] + a - 1;
const qStart = Q.quarters.map(([s, a]) => gi(s, a)); qStart.push(tot);
const pStart = Q.pages.map(([s, a]) => gi(s, a)); pStart.push(tot);
const NQ = 240;
function bs(arr, g) { let lo = 0, hi = arr.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= g) lo = m; else hi = m - 1; } return lo; }
const pageF = g => { const p = bs(pStart, g); return p + (g - pStart[p]) / (pStart[p + 1] - pStart[p]); };
function unitInfo(i) {
  const a = qStart[i], b = qStart[i + 1] - 1, A = Q.ayas[a], B = Q.ayas[b];
  const label = `${CH[A[0]].ar} ${A[1]} – ${B[0] !== A[0] ? CH[B[0]].ar + ' ' : ''}${B[1]}`;
  return { i, a, b, A, B, label, hizb: (i >> 2) + 1, rub: (i % 4) + 1, pages: pageF(b + 1) - pageF(a) };
}
const UI = Array.from({ length: NQ }, (_, i) => unitInfo(i));
const chRange = c => [first[c], first[c] + CH[c].n - 1];
function unitsInRange(g1, g2) { // rub' dont au moins la moitié des versets est dans [g1,g2]
  const out = [];
  for (let i = 0; i < NQ; i++) { const a = qStart[i], b = qStart[i + 1] - 1; const ov = Math.min(b, g2) - Math.max(a, g1) + 1; if (ov > 0 && ov * 2 >= (b - a + 1)) out.push(i); }
  return out;
}

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => ymd(new Date());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const addMonths = (s, n) => { const d = parseD(s); d.setMonth(d.getMonth() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const fmtD = (s, o = { day: 'numeric', month: 'short' }) => parseD(s).toLocaleDateString('ar-u-nu-latn-ca-gregory', o);

/* ---------- état ---------- */
const KEY = 'masari.v1';
let S;
const blank = () => ({ s: 'none', idx: 0, due: null, reps: 0, last: null, weak: false });
function seedUnits(t) {
  const U = Array.from({ length: NQ }, blank);
  const mem = (list, idx, spread, base, weak) => list.forEach((u, k) => { U[u] = { ...blank(), s: 'mem', idx, due: addDays(t, base + (k % spread)), weak: !!weak }; });
  mem(unitsInRange(gi(2, 1), gi(3, 200)), 2, 14, 1);                            // Al-Baqara + Âl ʿImrân → révision
  mem(unitsInRange(...chRange(3)), 1, 1, 0, true);                              // Âl ʿImrân : à réviser en priorité (dû aujourd'hui, fragile)
  mem(unitsInRange(gi(4, 1), gi(4, 57)), 2, 14, 1);                             // An-Nisâ' : acquis jusqu'au verset 57 (fin du 2e rub' du hizb 9)
  [38, 21].forEach(c => mem(unitsInRange(...chRange(c)), 1, 3, 0, true));       // Sâd, Al-Anbiyâ' : mémorisation moyenne → révision rapprochée
  mem(unitsInRange(gi(87, 1), tot - 1), 2, 7, 2);                               // dernier hizb (de Sabbih…)
  [26, 27, 34, 45].forEach(c => unitsInRange(...chRange(c)).forEach(u => { U[u].s = 'rel'; })); // Shuʿarâ', Naml, Saba, Jâthiya → à réapprendre vite
  [30, 31, 37].forEach(c => unitsInRange(...chRange(c)).forEach(u => { if (U[u].s === 'none') U[u].pri = 1; })); // Rûm, Luqmân, Sâffât : à mémoriser en priorité
  return U;
}
function ensure() { S.errors = S.errors || {}; S.tests = S.tests || []; S.units.forEach(u => { if (u.pri === undefined) u.pri = 0; }); const s = S.settings; if (s.reciter === undefined) s.reciter = 'Alafasy_128kbps'; if (s.arep === undefined) s.arep = 1; if (s.tjOn === undefined) s.tjOn = true; s.tjCol = s.tjCol || {}; s.tjOff = s.tjOff || {};
  if (!S.pv) { S.pv = 1; NEW_ORDER.forEach(c => { for (let i = 0; i < NQ; i++) if (S.units[i].s === 'none' && overlapsCh(i, c)) S.units[i].pri = 1; }); } }
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || !S.units || S.units.length !== NQ) {
    const t = todayStr();
    S = { v: 1, settings: { start: t, end: addMonths(t, 3), reviewCap: 8, rep: 20, font: 30, times: ['06:00', '20:30'], bookCap: 4 }, units: seedUnits(t), books: [], log: {}, fired: {} };
    save(true);
  }
  ensure();
}
function save(skipSync) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('التخزين ممتلئ أو محجوب: صدّر نسخة احتياطية.'); }
  if (!skipSync) ghSchedule();
}

/* ---------- synchronisation GitHub (dépôt privé de l'utilisateur) ---------- */
const GKEY = 'masari.gh';
const gh = (() => { try { return Object.assign({ repo: '', token: '', auto: true, last: 0, msg: '' }, JSON.parse(localStorage.getItem(GKEY))); } catch (e) { return { repo: '', token: '', auto: true, last: 0, msg: '' }; } })();
const ghSave = () => { try { localStorage.setItem(GKEY, JSON.stringify(gh)); } catch (e) { } };
const ghReady = () => gh.repo.includes('/') && gh.token.length > 10;
const b64e = str => { let r = ''; new TextEncoder().encode(str).forEach(x => { r += String.fromCharCode(x); }); return btoa(r); };
const b64d = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), c => c.charCodeAt(0)));
const ghUrl = () => `https://api.github.com/repos/${gh.repo}/contents/masari.json`;
const ghHead = () => ({ Authorization: 'Bearer ' + gh.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' });
function ghStatus(msg) { gh.msg = msg; ghSave(); const el = $('#gh-status'); if (el) el.textContent = msg; }
async function ghRemote() {
  const r = await fetch(ghUrl(), { headers: ghHead(), cache: 'no-store' });
  if (r.status === 404) return { sha: null, data: null };
  if (r.status === 401 || r.status === 403) throw new Error('الرمز مرفوض أو صلاحياته غير كافية (Contents: قراءة وكتابة).');
  if (!r.ok) throw new Error('ردّ GitHub بالرمز ' + r.status);
  const j = await r.json(); return { sha: j.sha, data: JSON.parse(b64d(j.content)) };
}
async function ghPush(manual) {
  if (!ghReady()) return;
  try {
    ghStatus('جارٍ الإرسال…');
    const rem = await ghRemote();
    if (rem.data && rem.data.updatedAt > (S.updatedAt || 0) + 1000 && !manual) { ghStatus('توجد نسخة أحدث على GitHub: اضغط استرجاع.'); return; }
    const body = { message: 'نسخة مساري ' + new Date().toISOString(), content: b64e(JSON.stringify(S)) };
    if (rem.sha) body.sha = rem.sha;
    const r = await fetch(ghUrl(), { method: 'PUT', headers: { ...ghHead(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('رُفضت الكتابة (' + r.status + ')');
    gh.last = Date.now(); ghStatus('تمّت المزامنة ' + new Date().toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit' }));
  } catch (e) { ghStatus('فشل: ' + e.message); }
}
async function ghPull(quiet) {
  if (!ghReady()) return;
  try {
    const rem = await ghRemote();
    if (!rem.data) { if (!quiet) ghStatus('لا توجد نسخة على GitHub بعد.'); return; }
    if (rem.data.units && rem.data.units.length === NQ && (!quiet || rem.data.updatedAt > (S.updatedAt || 0))) {
      S = rem.data; ensure(); save(true); gh.last = Date.now(); ghStatus('تم استرجاع البيانات من GitHub.'); route(); toast('تمت المزامنة من GitHub');
    } else if (!quiet) ghStatus('محدَّث بالفعل.');
  } catch (e) { ghStatus('فشل: ' + e.message); }
}
let ghTimer; function ghSchedule() { if (!ghReady() || !gh.auto) return; clearTimeout(ghTimer); ghTimer = setTimeout(() => ghPush(false), 5000); }


/* ---------- révision espacée ---------- */
const LADDER = [1, 3, 7, 14, 30, 60, 120];
function gradeItem(st, g, t) {
  if (g === 'hard') { st.idx = Math.max(0, st.idx - 2); st.weak = true; st.due = addDays(t, 1); }
  else { if (g === 'easy') st.idx = Math.min(LADDER.length - 1, st.idx + 1); st.weak = false; st.due = addDays(t, LADDER[st.idx]); }
  st.reps = (st.reps || 0) + 1; st.last = t;
}
function markLearned(st, t) { Object.assign(st, { s: 'mem', idx: 0, due: addDays(t, 1), reps: 0, last: t, weak: false }); }
function setStatus(st, s, k = 0) {
  if (s === 'mem' && st.s !== 'mem') Object.assign(st, { idx: 2, due: addDays(todayStr(), 1 + (k % 10)), reps: 0, weak: false });
  if (s !== 'mem') st.due = null;
  st.s = s;
}
const LBL = { mem: 'محفوظ', rel: 'يُعاد حفظه', prog: 'قيد الحفظ', none: 'لم يبدأ' };

/* ---------- journal ---------- */
const logOf = t => (S.log[t] = S.log[t] || { new: [], rev: [], bnew: [], brev: [], reps: 0 });
const logCount = L => L ? L.new.length + L.rev.length + L.bnew.length + L.brev.length + (L.quiz || 0) : 0;

/* ---------- journal d'erreurs (par verset) ---------- */
const errScore = g => { const e = S.errors[g]; return e ? e.n - 2 * (e.ok || 0) : 0; };
function noteError(g, k = 1) { const e = S.errors[g] = S.errors[g] || { n: 0, ok: 0, last: null }; e.n += k; e.last = todayStr(); }
function noteOk(g) { const e = S.errors[g]; if (e) e.ok = (e.ok || 0) + 1; }
const weakAyas = () => Object.keys(S.errors).map(Number).filter(g => errScore(g) > 0).sort((a, b) => errScore(b) - errScore(a) || (S.errors[b].last > S.errors[a].last ? 1 : -1));
const refOf = g => `${CH[Q.ayas[g][0]].ar} ${toAr(Q.ayas[g][1])}`;
function commitErrors(i) { // appelé à la fin d'une séance Coran
  const u = UI[i];
  for (let g = u.a; g <= u.b; g++) {
    if (sessState.rev[g]) noteError(g, sessState.rev[g]);
    else if (sessState.level >= 60 && S.errors[g]) noteOk(g);
  }
  sessState.rev = {};
}

/* ---------- ordre de priorité (réglé par l'utilisateur) ---------- */
const REV_ORDER = [3, 2, 4];   // révision : Âl ʿImrân, puis Al-Baqara, puis la partie apprise d'An-Nisâ', puis le reste
const NEW_ORDER = [37, 30, 31]; // mémorisation : Aṣ-Ṣâffât, puis Ar-Rûm, puis Luqmân
const overlapsCh = (i, c) => qStart[i] <= chRange(c)[1] && qStart[i + 1] - 1 >= chRange(c)[0];
const revRank = i => { const k = REV_ORDER.findIndex(c => overlapsCh(i, c)); return k < 0 ? REV_ORDER.length : k; };
const newRank = i => { const k = NEW_ORDER.findIndex(c => overlapsCh(i, c)); return k < 0 ? NEW_ORDER.length : k; };

/* ---------- plan du jour ---------- */
function plan() {
  const t = todayStr(), L = S.log[t] || { new: [], rev: [], bnew: [], brev: [] };
  const daysLeft = Math.max(1, diffDays(t, S.settings.end) + 1);
  const keys = [...Array(NQ).keys()];
  const isPri = i => S.units[i].pri && S.units[i].s !== 'mem';
  keys.sort((a, b) => a - b);
  const queue = keys.filter(isPri).sort((a, b) => (newRank(a) - newRank(b)) || a - b).concat(keys.filter(i => !isPri(i) && (S.units[i].s === 'rel' || S.units[i].s === 'prog')), keys.filter(i => !isPri(i) && S.units[i].s === 'none'));
  const doneNew = L.new.length;
  const quota = (queue.length + doneNew) === 0 ? 0 : Math.ceil((queue.length + doneNew) / daysLeft);
  const newList = queue.slice(0, Math.max(0, quota - doneNew));
  const dueAll = keys.filter(i => S.units[i].s === 'mem' && S.units[i].due && S.units[i].due <= t)
    .sort((a, b) => (revRank(a) - revRank(b)) || (S.units[a].due < S.units[b].due ? -1 : S.units[a].due > S.units[b].due ? 1 : (S.units[b].weak - S.units[a].weak) || a - b));
  const revList = dueAll.slice(0, Math.max(0, S.settings.reviewCap - L.rev.length));
  // livres
  const bnew = [], brev = [];
  S.books.forEach(b => {
    const left = b.portions.map((p, j) => [p, j]).filter(([p]) => p.s === 'none');
    const dl = Math.max(1, diffDays(t, b.end) + 1);
    const done = L.bnew.filter(x => x.startsWith(b.id + ':')).length;
    const q = (left.length + done) === 0 ? 0 : Math.ceil((left.length + done) / dl);
    left.slice(0, Math.max(0, q - done)).forEach(([, j]) => bnew.push([b.id, j]));
    b.portions.forEach((p, j) => { if (p.s === 'mem' && p.due && p.due <= t) brev.push([b.id, j, p.due]); });
  });
  brev.sort((a, b) => (a[2] < b[2] ? -1 : 1));
  return { t, L, daysLeft, queue, quota, newList, dueAll, revList, bnew, brev: brev.slice(0, Math.max(0, S.settings.bookCap - L.brev.length)), remaining: queue.length };
}

/* ---------- rendu utilitaires ---------- */
const statusOf = i => S.units[i].s;
const counts = () => { const c = { mem: 0, rel: 0, prog: 0, none: 0 }; S.units.forEach(u => c[u.s]++); return c; };
const pagesOf = s => UI.reduce((n, u, i) => n + (S.units[i].s === s ? u.pages : 0), 0);
function weave() { return `<div class="weave" role="img" aria-label="التقدّم على الأحزاب الستين">${S.units.map(u => `<i class="${u.s}"></i>`).join('')}</div>`; }
function legend() { return `<div class="legend"><span class="mem">محفوظ</span><span class="rel">يُعاد حفظه</span><span class="prog">قيد الحفظ</span><span>لم يبدأ</span></div>`; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400); }
function openSheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}</div>`; s.hidden = false; }
function closeSheet() { $('#sheet').hidden = true; }
const fmt1 = n => String(Math.round(n * 10) / 10);

/* ---------- éléments de séance (Coran / livres) ---------- */
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
const sessState = { level: 0, rev: {} };
/* ---------- couleurs du tajwid ---------- */
const TJ = window.TJ;
const TJ_AR = ['غنّة', 'إدغام بغنّة', 'إدغام بلا غنّة', 'إدغام متجانسين', 'إدغام متقاربين', 'إدغام شفوي', 'إخفاء', 'إخفاء شفوي', 'إقلاب', 'مدّ طبيعي', 'مدّ عارض / لين', 'مدّ متصل', 'مدّ منفصل', 'مدّ لازم', 'قلقلة', 'همزة وصل', 'لام شمسية', 'حرف لا يُنطق'];
const TJ_SAMPLE = ['نّ', 'نْ', 'نْ', 'تْ', 'لْ', 'مْ', 'نْ', 'مْ', 'نْ', 'ا', 'ي', 'ء', 'ء', 'آ', 'دْ', 'ٱ', 'ل', 'ا'];
const TJ_DEF = ['#2f9e44', '#37b24d', '#868e96', '#868e96', '#868e96', '#20c997', '#1c7ed6', '#4dabf7', '#7048e8', '#e8872c', '#d9a21b', '#d6336c', '#e8590c', '#c92a2a', '#1098ad', '#adb5bd', '#adb5bd', '#adb5bd'];
const tjColor = i => (S.settings.tjCol && S.settings.tjCol[i]) || TJ_DEF[i];
const tjOn = i => !(S.settings.tjOff && S.settings.tjOff[i]);
function applyTj() {
  let st = document.getElementById('tjcss'); if (!st) { st = document.createElement('style'); st.id = 'tjcss'; document.head.appendChild(st); }
  st.textContent = TJ.rules.map((r, i) => `.tj-${i}{color:${(S.settings.tjOn !== false && tjOn(i)) ? tjColor(i) : 'inherit'}}`).join('');
}
const _tjc = {};
function tjCls(g) {
  if (_tjc[g]) return _tjc[g];
  const len = Q.ayas[g][2].length, a = new Int8Array(len).fill(-1), v = TJ.v[g];
  for (let k = 0; k < v.length; k += 3) for (let x = v[k + 1]; x < v[k + 2] && x < len; x++) a[x] = v[k];
  return (_tjc[g] = a);
}
function tjWord(w, g, off) {
  if (S.settings.tjOn === false) return esc(w);
  const cls = tjCls(g); let out = '', cur = -2, buf = '';
  const flush = () => { if (buf) out += cur >= 0 ? `<i class="tj-${cur}">${esc(buf)}</i>` : esc(buf); buf = ''; };
  for (let k = 0; k < w.length; k++) { const c = cls[off + k] === undefined ? -1 : cls[off + k]; if (c !== cur) { flush(); cur = c; } buf += w[k]; }
  flush(); return out;
}
function wordsHtml(text, key, g, off, wc) {
  let pos = off || 0, k = 0; const out = [];
  text.split(' ').forEach(w => {
    const p = pos; pos += w.length + 1; if (!w) return;
    const kk = k++, hid = (hash(key + ':' + kk) % 100) < sessState.level;
    const err = g !== undefined && errScore(g) > 0;
    const wi = (wc && normW(w)) ? ` data-wi="${wc.n++}"` : '';
    out.push(`<span class="w${hid ? ' hid' : ''}${err ? ' err' : ''}"${g !== undefined ? ` data-g="${g}"` : ''}${wi} data-act="reveal">${g !== undefined ? tjWord(w, g, p) : esc(w)}</span>`);
  });
  return out.join(' ');
}
function getItem(kind, id) {
  if (kind === 'q') {
    const i = +id, u = UI[i], st = S.units[i], wc = { n: 0 };
    let html = '', lastC = 0;
    for (let g = u.a; g <= u.b; g++) {
      const [c, v, tx] = Q.ayas[g];
      let text = tx, off = 0;
      if (c !== lastC && (v === 1 || g === u.a)) {
        html += `<span class="surah">سورة ${CH[c].ar}${v > 1 ? `<small>من الآية ${v}</small>` : ''}</span>`;
        lastC = c;
      }
      if (v === 1 && c !== 1 && c !== 9) {
        const toks = tx.split(' ');
        html += `<span class="bism">${wordsHtml(toks.slice(0, BISM_TOKENS).join(' '), 'b' + c)}</span>`;
        off = toks.slice(0, BISM_TOKENS).join(' ').length + 1;
        text = toks.slice(BISM_TOKENS).join(' ');
      }
      html += `<span class="verse" data-v="${g}">${wordsHtml(text, g, g, off, wc)}<span class="n">﴿${v}﴾</span></span> `;
    }
    return { title: u.label, sub: `الحزب ${u.hizb} · الربع ${u.rub} · ≈ ${fmt1(u.pages)} ص`, html, st, kind: 'q', id };
  }
  const [bid, j] = id.split(':'); const b = S.books.find(x => x.id === bid), p = b.portions[+j];
  const html = p.lines.map((l, k) => `<span class="line" dir="auto">${wordsHtml(l, bid + j + k)}</span>`).join('');
  return { title: b.title, sub: `الجزء ${+j + 1} / ${b.portions.length}`, html, st: p, kind: 'b', id, book: b, note: true };
}

/* ---------- vues ---------- */
const views = {};
views.today = () => {
  const P = plan(), c = counts(), L = P.L;
  const dayN = Math.max(1, diffDays(S.settings.start, P.t) + 1), total = diffDays(S.settings.start, S.settings.end) + 1;
  const row = (id, kind, mode, title, meta, done, lat) => `<button class="row${done ? ' done' : ''}" data-act="open" data-kind="${kind}" data-id="${id}" data-mode="${mode}"><span class="main"><span class="t${lat ? ' lat' : ' ar'}">${title}</span><span class="m">${meta}</span></span><span class="go">${done ? 'تمّ ✓' : 'ابدأ'}</span></button>`;
  const loc = u => `الحزب ${UI[u].hizb} · الربع ${UI[u].rub}`;
  const newRows = L.new.map(i => row(i, 'q', 'new', UI[i].label, loc(i), true)).join('') +
    P.newList.map(i => row(i, 'q', 'new', UI[i].label, `${S.units[i].pri ? 'أولوية · ' : ''}${S.units[i].s === 'rel' ? 'يُعاد حفظه' : S.units[i].s === 'prog' ? 'قيد الحفظ' : 'جديد'} · ${loc(i)} · ≈ ${fmt1(UI[i].pages)} ص`, false)).join('');
  const revRows = L.rev.map(i => row(i, 'q', 'rev', UI[i].label, 'تمّت المراجعة', true)).join('') +
    P.revList.map(i => { const late = diffDays(S.units[i].due, P.t); return row(i, 'q', 'rev', UI[i].label, `${S.units[i].weak ? 'ضعيف · ' : ''}${late > 0 ? 'متأخر ' + late + ' يوم' : 'موعده اليوم'} · ${loc(i)}`, false); }).join('');
  const bRows = P.bnew.map(([b, j]) => { const bk = S.books.find(x => x.id === b); return row(b + ':' + j, 'b', 'new', esc(bk.title) + ' — الجزء ' + (j + 1), bk.kind === 'matn' ? 'للحفظ' : 'للقراءة', false, true); }).join('') +
    P.brev.map(([b, j]) => { const bk = S.books.find(x => x.id === b); return row(b + ':' + j, 'b', 'rev', esc(bk.title) + ' — الجزء ' + (j + 1), 'للمراجعة', false, true); }).join('') +
    L.bnew.concat(L.brev).map(x => { const [b, j] = x.split(':'); const bk = S.books.find(y => y.id === b); return bk ? row(x, 'b', 'rev', esc(bk.title) + ' — الجزء ' + (+j + 1), 'تمّ', true, true) : ''; }).join('');
  const overdue = P.dueAll.length - P.revList.length;
  return `
  <div class="hero-title">اليوم ${Math.min(dayN, total)} من ${total}</div>
  <div class="sub">الهدف: الانتهاء في ${fmtD(S.settings.end, { day: 'numeric', month: 'long', year: 'numeric' })} · بقي ${P.daysLeft} يوم</div>
  ${weave()}${legend()}
  <div class="kpis">
    <div class="kpi"><b>${c.mem}</b><span>أرباع محفوظة (≈ ${Math.round(pagesOf('mem'))} ص)</span></div>
    <div class="kpi"><b>${P.remaining}</b><span>أرباع للحفظ (≈ ${Math.round(pagesOf('none') + pagesOf('rel') + pagesOf('prog'))} ص)</span></div>
    <div class="kpi"><b>${P.dueAll.length}</b><span>مراجعات مستحقة</span></div>
  </div>
  <h2>الحفظ <span class="count">· هدف اليوم: ${P.quota} أرباع (≈ ${fmt1(P.quota * 604 / 240)} ص)</span></h2>
  <div class="rows">${newRows || '<div class="empty">لا حفظ جديد اليوم. بارك الله فيك، أو عدّل التواريخ من الإعدادات.</div>'}</div>
  <h2>المراجعة <span class="count">· ${P.dueAll.length} مستحقة${overdue > 0 ? '، مؤجَّلة منها ' + overdue + ' (الحد الأقصى ' + S.settings.reviewCap + ' يوميًا)' : ''}</span></h2>
  <div class="rows">${revRows || '<div class="empty">لا مراجعة مستحقة.</div>'}</div>
  ${(() => { const w = weakAyas(); if (!w.length) return ''; return `<h2>مواضع التثبيت <span class="count">· ${w.length} آية</span></h2><div class="rows">${w.slice(0, 5).map(g => `<div class="row"><span class="main"><span class="t ar">${refOf(g)}</span><span class="m">أخطاء: ${S.errors[g].n}${S.errors[g].last ? ' · آخرها ' + fmtD(S.errors[g].last) : ''}</span></span></div>`).join('')}</div><div class="btns" style="margin-top:10px"><button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">اختبار في مواضع ضعفي</button></div>`; })()}
  ${bRows ? `<h2>الكتب والمتون</h2><div class="rows">${bRows}</div>` : ''}`;
};

views.map = () => {
  let h = `<div class="hero-title">خريطة القرآن</div><div class="sub">٦٠ حزبًا، لكل حزب أربعة أرباع. المس ربعًا لفتحه أو تغيير حالته.</div>${legend()}
  <details><summary>تعديل نطاق</summary>
    <label class="field"><span>الحالة المطلوبة</span><select id="rg-status"><option value="mem">محفوظ (قيد المراجعة)</option><option value="rel">يُعاد حفظه</option><option value="prog">قيد الحفظ</option><option value="none">لم يبدأ</option></select></label>
    <div class="two"><label class="field"><span>من الحزب</span><input id="rg-from" type="number" min="1" max="60" value="1"></label><label class="field"><span>إلى الحزب</span><input id="rg-to" type="number" min="1" max="60" value="1"></label></div>
    <button class="btn block" data-act="range-hizb">تطبيق على الأحزاب</button>
    <label class="field"><span>أو على سورة كاملة</span><select id="rg-surah">${Q.chapters.map(c => `<option value="${c[0]}">${c[0]} · ${c[1]}</option>`).join('')}</select></label>
    <button class="btn block" data-act="range-surah">تطبيق على السورة</button>
  </details><div style="height:12px"></div>`;
  const t = todayStr();
  for (let h4 = 0; h4 < 60; h4++) {
    h += `<div class="hizb"><span class="n">${h4 + 1}</span>`;
    for (let r = 0; r < 4; r++) {
      const i = h4 * 4 + r, u = UI[i], st = S.units[i];
      h += `<button class="cell ${st.s}${st.s === 'mem' && st.due && st.due <= t ? ' due' : ''}" data-act="cell" data-id="${i}" aria-label="الحزب ${h4 + 1} الربع ${r + 1}، ${LBL[st.s]}"><span class="s">${CH[u.A[0]].ar}</span><span class="g">${u.A[1]}</span></button>`;
    }
    h += '</div>';
  }
  return h;
};

views.books = () => {
  const t = todayStr();
  const cards = S.books.map(b => {
    const done = b.portions.filter(p => p.s === 'mem').length, n = b.portions.length;
    return `<a class="row" href="#/book/${b.id}" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat">${esc(b.title)}</span><span class="m">${b.kind === 'matn' ? 'متن للحفظ' : 'كتاب للقراءة'} · ${done}/${n} جزء · ينتهي في ${fmtD(b.end)}</span><span class="bar"><i style="width:${n ? 100 * done / n : 0}%"></i></span></span><span class="go">فتح</span></a>`;
  }).join('');
  return `<div class="hero-title">الكتب والمتون</div><div class="sub">الصق نصًّا وسيقسّمه مساري إلى أجزاء للقراءة أو الحفظ بوتيرة تنتهي في التاريخ الذي تريده.</div>
  <div class="rows" style="margin-top:14px">${cards || '<div class="empty">لا كتب بعد.</div>'}</div>
  <div style="height:14px"></div><button class="btn pri block" data-act="book-new">إضافة كتاب أو متن</button>`;
};

views.book = id => {
  const b = S.books.find(x => x.id === id); if (!b) return '<p>الكتاب غير موجود.</p>';
  const done = b.portions.filter(p => p.s === 'mem').length, word = b.kind === 'matn' ? 'محفوظة' : 'مقروءة';
  return `<div class="sess-h"><a class="btn sm" href="#/books">→</a><div class="tt"><b>${esc(b.title)}</b><span class="sub">${done}/${b.portions.length} أجزاء ${word} · ينتهي في ${fmtD(b.end)}</span></div></div>
  <div class="bar"><i style="width:${100 * done / b.portions.length}%"></i></div>
  <div class="rows">${b.portions.map((p, j) => `<button class="row" data-act="open" data-kind="b" data-id="${b.id}:${j}" data-mode="${p.s === 'mem' ? 'rev' : 'new'}"><span class="main"><span class="t lat" dir="auto" style="font-weight:400;font-size:16px">${esc((p.lines[0] || '').slice(0, 70))}</span><span class="m">الجزء ${j + 1} · ${LBL[p.s] || p.s}${p.due ? ' · المراجعة القادمة ' + fmtD(p.due) : ''}${p.note ? ' · ملاحظة' : ''}</span></span><span class="pill ${p.s}">${p.s === 'mem' ? '✓' : '·'}</span></button>`).join('')}</div>
  <div style="height:16px"></div><button class="btn warn block" data-act="book-del" data-id="${b.id}">حذف هذا الكتاب</button>`;
};

views.stats = () => {
  const t = todayStr(), c = counts();
  const act = d => logCount(S.log[d]);
  let streak = 0, d = act(t) ? t : addDays(t, -1);
  while (act(d)) { streak++; d = addDays(d, -1); }
  const dow = (parseD(t).getDay() + 1) % 7; // السبت = 0
  const startHeat = addDays(t, -(dow + 13 * 7)); const cells = [];
  for (let k = 0; k < 14 * 7; k++) { const dd = addDays(startHeat, k); const n = dd > t ? -1 : act(dd); cells.push(n < 0 ? '<i style="visibility:hidden"></i>' : `<i class="l${n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4}" title="${dd} : ${n}"></i>`); }
  let newDone = 0; for (let k = 0; k < 14; k++) newDone += (S.log[addDays(t, -k)] || { new: [] }).new.length;
  const firstDay = Object.keys(S.log).sort()[0]; const span = Math.min(14, Math.max(1, firstDay ? diffDays(firstDay, t) + 1 : 1));
  const rate = newDone / span, remaining = c.none + c.rel + c.prog;
  const proj = rate > 0 ? addDays(t, Math.ceil(remaining / rate)) : null;
  const need = remaining / Math.max(1, diffDays(t, S.settings.end) + 1);
  const total = Object.values(S.log).reduce((n, L) => n + logCount(L), 0);
  return `<div class="hero-title">التقدّم</div>
  <div class="kpis"><div class="kpi"><b>${streak}</b><span>أيام متتالية</span></div><div class="kpi"><b>${total}</b><span>جلسات منجزة</span></div><div class="kpi"><b>${Math.round(100 * pagesOf('mem') / 604)}%</b><span>من القرآن محفوظ</span></div></div>
  <h2>آخر ١٤ أسبوعًا</h2><div class="heat">${cells.join('')}</div>
  <h2>الوتيرة</h2>
  <p style="margin:6px 0">بقي <b>${remaining} ربعًا</b> (≈ ${Math.round(remaining * 604 / 240)} ص) للحفظ. للانتهاء في ${fmtD(S.settings.end)} تحتاج <b>${fmt1(need)} ربع يوميًا</b> (≈ ${fmt1(need * 604 / 240)} ص).</p>
  <p style="margin:6px 0" class="sub">${proj ? `بوتيرتك في آخر ${span} يومًا (${fmt1(rate)} ربع يوميًا) ستنتهي حوالي ${fmtD(proj, { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'أنجز بعض الجلسات لتظهر لك التوقعات.'}</p>
  <div class="note">كلما تقدّمتَ زاد عدد المراجعات المستحقة. إن كان الحد اليومي للمراجعة منخفضًا تراكمت المراجعات، وإن كان مرتفعًا ضاق وقت الحفظ الجديد. عدّله من الإعدادات.</div>`;
};

views.settings = () => {
  const s = S.settings;
  const tjRows = TJ.rules.map((r, i) => `<div class="tjrow"><input type="checkbox" data-tjon="${i}" ${tjOn(i) ? 'checked' : ''} aria-label="تفعيل"><span class="tjn"><i class="tj-${i}">${TJ_SAMPLE[i]}</i> ${TJ_AR[i]}</span><input type="color" data-tj="${i}" value="${tjColor(i)}"></div>`).join('');
  return `<div class="hero-title">الإعدادات</div>
  <div class="two"><label class="field"><span>البداية</span><input type="date" id="st-start" value="${s.start}"></label><label class="field"><span>نهاية الهدف</span><input type="date" id="st-end" value="${s.end}"></label></div>
  <div class="two"><label class="field"><span>أقصى مراجعات يوميًا</span><input type="number" id="st-cap" min="1" max="60" value="${s.reviewCap}"></label><label class="field"><span>عدد التكرار في الجلسة</span><input type="number" id="st-rep" min="1" max="100" value="${s.rep}"></label></div>
  <div class="two"><label class="field"><span>أجزاء الكتب للمراجعة يوميًا</span><input type="number" id="st-bcap" min="0" max="30" value="${s.bookCap}"></label><label class="field"><span>حجم خط المصحف</span><input type="number" id="st-font" min="20" max="56" value="${s.font}"></label></div>
  <h2>المصحف وألوان التجويد</h2>
  <label class="check"><input type="checkbox" id="st-tj" ${s.tjOn !== false ? 'checked' : ''}> تلوين أحكام التجويد في المصحف</label>
  <p class="sub">فعّل أو عطّل كل حكم، وغيّر لونه كما تشاء. التغيير فوري.</p>
  <div class="tjlist">${tjRows}</div>
  <div class="btns" style="margin-top:8px"><button class="btn sm" data-act="tj-reset">استرجاع الألوان الافتراضية</button></div>
  <h2>الاستماع</h2>
  <div class="two"><label class="field"><span>القارئ</span><select id="st-reciter">${RECITERS.map(([k, n]) => `<option value="${k}" ${s.reciter === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="field"><span>تكرار كل آية</span><select id="st-arep">${[1, 2, 3, 5, 10].map(n => `<option ${s.arep === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
  <h2>التذكيرات</h2>
  <div class="two"><label class="field"><span>الحفظ</span><input type="time" id="st-t0" value="${s.times[0]}"></label><label class="field"><span>المراجعة</span><input type="time" id="st-t1" value="${s.times[1]}"></label></div>
  <div class="btns"><button class="btn" data-act="notif">تفعيل الإشعارات</button><button class="btn" data-act="ics">تذكيرات يومية (.ics)</button></div>
  <p class="sub">إشعارات المتصفح لا تصل إلا إذا كان مساري مفتوحًا أو مثبّتًا ونشطًا. للتذكير الموثوق استورد ملف .ics في تقويم هاتفك: ينشئ حدثًا يوميًا بتنبيه حتى تاريخ النهاية.</p>
  <h2>المزامنة مع GitHub</h2>
  <p class="sub">نسخ احتياطي تلقائي لبياناتك في مستودع GitHub خاص بك لتجدها على كل أجهزتك. يبقى الرمز على هذا الجهاز ولا يدخل في التصدير.</p>
  <label class="field"><span>المستودع الخاص (المالك/الاسم)</span><input type="text" id="gh-repo" dir="ltr" value="${esc(gh.repo)}" placeholder="Salmane0412/masari-data" autocapitalize="off" autocomplete="off"></label>
  <label class="field"><span>رمز الوصول (fine-grained، صلاحية Contents: قراءة وكتابة)</span><input type="password" id="gh-token" dir="ltr" value="${esc(gh.token)}" autocomplete="off"></label>
  <div class="btns"><button class="btn pri" data-act="gh-conn">حفظ واختبار</button><button class="btn" data-act="gh-push">إرسال الآن</button><button class="btn" data-act="gh-pull">استرجاع</button></div>
  <p class="sub" id="gh-status" role="status">${esc(gh.msg || (ghReady() ? 'جاهز.' : 'غير مضبوط.'))}</p>
  <h2>البيانات</h2>
  <p class="sub">كل شيء محفوظ على هذا الجهاز. صدّر نسخة احتياطية بانتظام، خصوصًا قبل تغيير الهاتف أو مسح المتصفح.</p>
  <div class="btns"><button class="btn" data-act="export">تصدير</button><label class="btn" style="display:inline-flex;align-items:center">استيراد<input type="file" id="imp" accept="application/json" hidden></label><button class="btn warn" data-act="reset">مسح كل شيء</button></div>
  <h2>المصادر</h2>
  <p class="sub">نص القرآن: مشروع تنزيل (tanzil.net) برخصة Creative Commons Attribution 3.0، منقول دون تعديل. فهرس الأحزاب والأرباع والصفحات من بيانات تنزيل عبر مستودع quran-json. علامات التجويد: مشروع cpfair/quran-tajweed (مبنية على نص تنزيل).</p>`;
};

views.session = (kind, id, mode) => {
  const it = getItem(kind, id), st = it.st, t = todayStr();
  const key = `${kind}:${id}`;
  const reps = (sessState.reps && sessState.key === key) ? sessState.reps : 0;
  const isMatn = kind === 'b' && it.book.kind === 'livre';
  const done = isMatn ? 'قرأته' : 'حفظته';
  const acts = mode === 'rev'
    ? `<div class="actions"><button class="btn" data-act="grade" data-g="hard">صعب</button><button class="btn" data-act="grade" data-g="ok">متوسط</button><button class="btn pri" data-act="grade" data-g="easy">متقن</button></div>`
    : `<div class="actions"><button class="btn" data-act="grade" data-g="later">ليس بعد</button><button class="btn" data-act="grade" data-g="prog">قيد الحفظ</button><button class="btn pri" data-act="grade" data-g="learned">${done} ✓</button></div>`;
  const qtools = kind === 'q' ? `
  <div class="btns" style="margin:0 0 10px"><button class="btn" id="aud-btn" data-act="listen">▶ استماع</button><button class="btn pri" id="fol-btn" data-act="follow">🎙 تلاوة بمتابعة مباشرة</button><button class="btn sm" data-act="tj-legend">مفتاح الألوان</button></div>
  <div id="fol-status" class="sub" role="status"></div><div id="rec-out"></div>` : '';
  return `<div class="sess-h"><button class="btn sm" data-act="back" aria-label="رجوع">→</button><div class="tt"><b class="${kind === 'q' ? 'ar' : ''}" style="font-size:${kind === 'q' ? 20 : 17}px">${esc(it.title)}</b><span class="sub">${it.sub}${st.weak ? ' · ضعيف' : ''}</span></div></div>
  <div class="tools"><span class="seg" role="group" aria-label="إخفاء الكلمات">${[0, 30, 60, 100].map(l => `<button data-act="level" data-l="${l}" aria-pressed="${sessState.level === l}">${l === 0 ? 'النص' : l + '%'}</button>`).join('')}</span><button class="btn sm" data-act="showall">إظهار الكل</button><span class="lbl">إخفاء الكلمات: المس الكلمة لإظهارها</span></div>
  ${qtools}
  ${(() => { if (kind !== 'q') return ''; const u = UI[+id]; let n = 0; for (let g = u.a; g <= u.b; g++) if (errScore(g) > 0) n++; return n ? `<div class="note">في هذا المقطع ${n} آية تتعثّر فيها، وهي مسطّرة بخط متعرّج. أخفِ النص بنسبة ٦٠% فأكثر لتختبر نفسك فيها.</div>` : ''; })()}
  <article class="mushaf ar" dir="rtl" style="font-size:${S.settings.font}px">${it.html}</article>
  <div class="counter"><button class="btn" data-act="rep-minus" aria-label="أنقص واحدًا">−</button><div class="big"><span id="rep-n">${reps}</span> <small>/ ${S.settings.rep}</small></div><button class="btn pri" data-act="rep-plus">+1</button></div>
  ${it.note ? `<label class="field"><span>ملاحظة على هذا الجزء</span><textarea id="note">${esc(st.note || '')}</textarea></label>` : ''}
  ${acts}`;
};


/* ---------- متابعة التلاوة مباشرة (على طريقة ترتيل) ---------- */
const normW = t => normAr(t).replace(/[^ء-ي]/g, '');
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
function wcost(e, h) { if (e === h) return 0; const d = lev(e, h); return d <= (e.length >= 5 ? 2 : 1) && Math.max(e.length, h.length) >= 3 ? 0.4 : 1; }
function expectedOf(i) {
  const u = UI[i], exp = [], owner = [];
  for (let g = u.a; g <= u.b; g++) { let ws = wordsOf(g); if (Q.ayas[g][1] === 1 && Q.ayas[g][0] !== 1 && Q.ayas[g][0] !== 9) ws = ws.slice(BISM_TOKENS); ws.forEach(w => { const n = normW(w); if (n) { exp.push(n); owner.push(g); } }); }
  return { exp, owner };
}
function followEval(exp, heard) {
  const st = new Array(exp.length); let p = 0, miss = 0;
  for (const h of heard) {
    if (p >= exp.length) break;
    let f = -1;
    for (let d = 0; d < 5 && p + d < exp.length; d++) if (wcost(exp[p + d], h) <= 0.4) { f = d; break; }
    if (f >= 0) { for (let k = 0; k < f; k++) st[p + k] = 'bad'; st[p + f] = 'ok'; p += f + 1; miss = 0; }
    else { miss++; if (miss >= 2) { st[p] = 'bad'; p++; miss = 0; } }
  }
  return { st, p };
}
const fol = { on: false, rec: null, base: '', cur: '', exp: [], owner: [], st: [], p: 0, unit: -1 };
const heardWords = () => {
  let h = normAr(fol.base + ' ' + fol.cur).split(/\s+/).map(w => w.replace(/[^ء-ي]/g, '')).filter(Boolean);
  if (h.slice(0, 2).join() === 'بسم,الله' && fol.exp.slice(0, 2).join() !== 'بسم,الله') h = h.slice(4);
  return h;
};
function followPaint() {
  const r = followEval(fol.exp, heardWords()); fol.st = r.st; fol.p = r.p;
  let ok = 0, bad = 0;
  document.querySelectorAll('.w[data-wi]').forEach(el => {
    const k = +el.dataset.wi, s = r.st[k];
    el.classList.toggle('f-ok', s === 'ok'); el.classList.toggle('f-bad', s === 'bad'); el.classList.toggle('f-cur', fol.on && k === r.p);
    if (s) el.classList.remove('hid'); if (s === 'ok') ok++; if (s === 'bad') bad++;
  });
  const c = document.querySelector('.w.f-cur'); if (c) { const b = c.getBoundingClientRect(); if (b.top < 120 || b.bottom > innerHeight - 140) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  folStatus(fol.on ? `🎙 يستمع إليك… صحيح ${ok} · أخطاء ${bad} · من ${fol.exp.length} كلمة` : '');
}
function folStatus(m) { const el = $('#fol-status'); if (el) el.textContent = m; }
const SR_ERR = { 'not-allowed': 'لم يُسمح بالميكروفون: اسمح له من إعدادات الموقع في المتصفح ثم أعد المحاولة.', 'service-not-allowed': 'خدمة التعرّف الصوتي غير مسموحة في هذا المتصفح.', 'audio-capture': 'لم يُعثر على ميكروفون.', 'network': 'التعرّف الصوتي يحتاج اتصالًا بالإنترنت.', 'language-not-supported': 'اللغة العربية غير مدعومة في هذا المتصفح.' };
function followStart() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { folStatus('المتصفح لا يدعم التعرّف الصوتي. استعمل Chrome على الحاسوب أو أندرويد.'); toast('استعمل متصفح Chrome'); return; }
  if (fol.on) return followStop();
  const [, , kind, id] = location.hash.split('/'); if (kind !== 'q') return;
  stopAudio();
  Object.assign(fol, { on: true, base: '', cur: '', unit: +id, ...expectedOf(+id), st: [], p: 0 });
  document.querySelectorAll('.w').forEach(el => el.classList.remove('f-ok', 'f-bad'));
  const btn = $('#fol-btn'); if (btn) btn.textContent = '⏹ إنهاء وتقييم';
  const startRec = () => {
    const rec = fol.rec = new SR(); rec.lang = 'ar-SA'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => { let s = ''; for (let i = 0; i < e.results.length; i++) s += ' ' + e.results[i][0].transcript; fol.cur = s; followPaint(); };
    rec.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') return; folStatus(SR_ERR[e.error] || ('خطأ في الميكروفون: ' + e.error)); if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { fol.on = false; const b = $('#fol-btn'); if (b) b.textContent = '🎙 تلاوة بمتابعة مباشرة'; } };
    rec.onend = () => { fol.base += ' ' + fol.cur; fol.cur = ''; if (fol.on) { try { startRec(); } catch (x) { } } };
    try { rec.start(); } catch (x) { fol.on = false; folStatus('تعذّر تشغيل الميكروفون.'); }
  };
  folStatus('🎙 اسمح للمتصفح بالميكروفون ثم ابدأ التلاوة من أول المقطع…'); startRec();
}
function followStop() {
  fol.on = false; try { fol.rec && fol.rec.stop(); } catch (x) { } fol.rec = null;
  const btn = $('#fol-btn'); if (btn) btn.textContent = '🎙 تلاوة بمتابعة مباشرة';
  setTimeout(followFinish, 350);
}
function followFinish() {
  followPaint(); folStatus('');
  const { st, p } = fol, bad = {}, seen = {};
  fol.exp.forEach((w, k) => { if (k >= p && st[k] === undefined) return; const g = fol.owner[k]; seen[g] = (seen[g] || 0) + 1; if (st[k] === 'bad') (bad[g] = bad[g] || []).push(k); });
  const gs = Object.keys(seen).map(Number); if (!gs.length) { $('#rec-out').innerHTML = '<div class="note">لم أسمع تلاوة. جرّب مرة أخرى في مكان هادئ.</div>'; return; }
  const lastG = fol.owner[Math.min(p, fol.exp.length - 1)], lines = []; let nb = 0, nok = 0;
  gs.forEach(g => { if (bad[g]) { nb++; noteError(g, 1); lines.push(`<div class="row"><span class="main"><span class="t ar">${refOf(g)}</span><span class="m ar" dir="rtl">${bad[g].map(k => esc(fol.exp[k])).join(' · ')}</span></span></div>`); } else if (g !== lastG || p >= fol.exp.length) { nok++; noteOk(g); } });
  save();
  $('#rec-out').innerHTML = `<div class="note">${nb ? `الآيات التي تحتاج مراجعة: ${nb}، والسليمة: ${nok}. الكلمات الناقصة أو المختلفة مبيَّنة أدناه وسُجّلت في مواضع التثبيت. (التعرّف تقريبي ولا يتحقق من أحكام التجويد.)` : 'لم تُرصد أخطاء في ما قرأتَ. ما شاء الله.'}</div>${nb ? `<div class="rows">${lines.join('')}</div><div class="btns" style="margin-top:10px"><button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">اختبار في مواضع ضعفي</button></div>` : ''}`;
}
/* ---------- استماع إلى قارئ ---------- */
const RECITERS = [['Alafasy_128kbps', 'مشاري العفاسي'], ['Husary_128kbps', 'محمود خليل الحصري'], ['Husary_Muallim_128kbps', 'الحصري (المعلّم: مع التكرار)'], ['Minshawy_Murattal_128kbps', 'المنشاوي (مرتّل)'], ['Abdul_Basit_Murattal_192kbps', 'عبد الباسط (مرتّل)'], ['Abdurrahmaan_As-Sudais_192kbps', 'عبد الرحمن السديس'], ['Saood_ash-Shuraym_128kbps', 'سعود الشريم'], ['Hudhaify_128kbps', 'علي الحذيفي'], ['Maher_AlMuaiqly_64kbps', 'ماهر المعيقلي']];
const aud = { a: null, on: false, list: [], k: 0, r: 0 };
const audioUrl = g => `https://everyayah.com/data/${S.settings.reciter}/${String(Q.ayas[g][0]).padStart(3, '0')}${String(Q.ayas[g][1]).padStart(3, '0')}.mp3`;
function stopAudio() { aud.on = false; if (aud.a) { aud.a.pause(); aud.a = null; } document.querySelectorAll('.verse.playing').forEach(e => e.classList.remove('playing')); const b = $('#aud-btn'); if (b) b.textContent = '▶ استماع'; }
function playNextAyah() {
  document.querySelectorAll('.verse.playing').forEach(e => e.classList.remove('playing'));
  if (!aud.on || aud.k >= aud.list.length) return stopAudio();
  const g = aud.list[aud.k], el = document.querySelector(`.verse[data-v="${g}"]`); if (el) { el.classList.add('playing'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  const a = aud.a = new Audio(audioUrl(g));
  a.onended = () => { aud.r++; if (aud.r >= (S.settings.arep || 1)) { aud.r = 0; aud.k++; } playNextAyah(); };
  a.onerror = () => { toast('تعذّر تشغيل الصوت: تحقق من الاتصال أو غيّر القارئ في الإعدادات'); stopAudio(); };
  a.play().catch(() => { toast('اضغط مرة أخرى للسماح بتشغيل الصوت'); stopAudio(); });
}
function listenStart() {
  if (aud.on) return stopAudio();
  const [, , kind, id] = location.hash.split('/'); if (kind !== 'q') return;
  if (fol.on) followStop();
  const u = UI[+id]; aud.list = []; for (let g = u.a; g <= u.b; g++) aud.list.push(g);
  Object.assign(aud, { on: true, k: 0, r: 0 }); const b = $('#aud-btn'); if (b) b.textContent = '⏹ إيقاف'; playNextAyah();
}

/* ---------- tests et QCM ---------- */
const normAr = t => t.replace(/[ـً-ٰٟۖ-ۭ࣓-ࣿ]/g, '').replace(/[ٱآأإ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const wordsOf = g => Q.ayas[g][2].split(' ').filter(Boolean);
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (arr, n) => shuffle(arr.slice()).slice(0, Math.max(0, n));
const clip = (w, n, fromEnd) => fromEnd ? (w.length > n ? '… ' : '') + w.slice(-n).join(' ') : w.slice(0, n).join(' ') + (w.length > n ? ' …' : '');
const chapterAyas = c => Array.from({ length: CH[c].n }, (_, k) => first[c] + k);
function poolFor(scope, h) {
  const out = new Set(), addUnit = i => { for (let g = qStart[i]; g < qStart[i + 1]; g++) out.add(g); };
  if (scope === 'weak') weakAyas().forEach(g => out.add(g));
  else if (scope === 'due') { const P = plan(); [...P.dueAll, ...P.L.rev, ...P.L.new].forEach(addUnit); }
  else if (scope === 'hizb') { for (let r = 0; r < 4; r++) addUnit((h - 1) * 4 + r); }
  else S.units.forEach((u, i) => { if (u.s === 'mem') addUnit(i); });
  return [...out];
}
function qNext(g) {
  const [c, v] = Q.ayas[g]; if (v >= CH[c].n) return null;
  const W = wordsOf(g); if (W.length < 3) return null;
  const nxt = g + 1, same = chapterAyas(c).filter(k => k !== g && k !== nxt);
  const fw = normAr(wordsOf(nxt)[0]), sim = same.filter(k => normAr(wordsOf(k)[0]) === fw);
  let dis = sample(sim, 2); dis = dis.concat(sample(same.filter(k => !dis.includes(k)), 3 - dis.length));
  if (dis.length < 3) return null;
  const opts = shuffle([{ t: clip(wordsOf(nxt), 9), ok: true }, ...dis.map(k => ({ t: clip(wordsOf(k), 9) }))]);
  return { type: 'next', g, prompt: clip(W, 14, true), ask: 'ما الآية التالية؟', opts, ref: refOf(nxt), full: Q.ayas[nxt][2] };
}
function qCloze(g) {
  const W = wordsOf(g); if (W.length < 5) return null;
  const idx = W.map((w, k) => k).filter(k => normAr(W[k]).length >= 3); if (!idx.length) return null;
  const k = idx[rnd(idx.length)], corr = W[k], nc = normAr(corr), c = Q.ayas[g][0];
  const gather = (from, to) => { const seen = new Set([nc]), out = []; for (let x = from; x <= to; x++) { if (x === g || x < first[c] || x >= first[c] + CH[c].n) continue; wordsOf(x).forEach(w => { const n = normAr(w); if (!seen.has(n) && Math.abs(n.length - nc.length) <= 2 && n.length >= 3) { seen.add(n); out.push(w); } }); } return out; };
  let cand = gather(g - 10, g + 10); if (cand.length < 3) cand = gather(first[c], first[c] + CH[c].n - 1);
  if (cand.length < 3) return null;
  const opts = shuffle([{ t: corr, ok: true }, ...sample(cand, 3).map(t => ({ t }))]);
  return { type: 'cloze', g, prompt: W.map((w, i) => i === k ? '＿＿＿＿' : w).join(' '), ask: 'ما الكلمة الناقصة؟', opts, ref: refOf(g), full: Q.ayas[g][2] };
}
function qSurah(g) {
  const c = Q.ayas[g][0], W = wordsOf(g); if (W.length < 3) return null;
  const others = Q.chapters.map(x => x[0]).filter(x => x !== c);
  const opts = shuffle([{ t: 'سورة ' + CH[c].ar, ok: true }, ...sample(others, 3).map(x => ({ t: 'سورة ' + CH[x].ar }))]);
  return { type: 'surah', g, prompt: clip(W, 16), ask: 'من أي سورة هذه الآية؟', opts, ref: refOf(g), full: Q.ayas[g][2] };
}
function buildQuiz(scope, h, n) {
  const pool = shuffle(poolFor(scope, h)); if (pool.length < 3) return null;
  const qs = []; let tries = 0;
  while (qs.length < n && tries < n * 10) {
    const g = pool[tries % pool.length]; tries++; const r = Math.random();
    const q = (r < .4 ? qCloze(g) : r < .8 ? qNext(g) : qSurah(g)) || qCloze(g) || qNext(g) || qSurah(g);
    if (q) qs.push(q);
  }
  return qs.length ? qs : null;
}
let quiz = null;
const SCOPE_L = { weak: 'مواضع ضعفي', due: 'مراجعات اليوم', all: 'كل ما حفظته', hizb: 'حزب محدد' };
function finishQuiz() {
  const n = quiz.qs.length, ok = quiz.score;
  S.tests.push({ d: todayStr(), scope: quiz.scope, n, ok }); S.tests = S.tests.slice(-60);
  logOf(todayStr()).quiz = (logOf(todayStr()).quiz || 0) + 1;
  const by = {}; quiz.qs.forEach(q => { const i = bs(qStart, q.g); (by[i] = by[i] || [0, 0]); by[i][1]++; if (q.right) by[i][0]++; });
  Object.entries(by).forEach(([i, [a, b]]) => { if (b >= 2 && a / b >= 0.8) S.units[i].vdate = todayStr(); });
  save(); quiz.done = true;
}
views.tests = () => {
  const w = weakAyas().length, mem = S.units.filter(u => u.s === 'mem'), val = mem.filter(u => u.vdate).length;
  const last = S.tests.slice(-5).reverse();
  return `<div class="hero-title">الاختبارات</div><div class="sub">أسئلة اختيار من متعدد مولَّدة من محفوظك أنت: الكلمة الناقصة، الآية التالية، سورة الآية. كل خطأ يُسجَّل ويعود إليك في «مواضع التثبيت» وفي الجلسات.</div>
  <div class="kpis"><div class="kpi"><b>${val}/${mem.length}</b><span>أرباع محفوظة أُثبتت باختبار</span></div><div class="kpi"><b>${w}</b><span>آيات تحتاج تثبيتًا</span></div><div class="kpi"><b>${S.tests.length}</b><span>اختبارات منجزة</span></div></div>
  <label class="field"><span>في ماذا؟</span><select id="qz-scope"><option value="weak">مواضع ضعفي (${w})</option><option value="due">مراجعات اليوم</option><option value="all" selected>كل ما حفظته</option><option value="hizb">حزب محدد</option></select></label>
  <div class="two"><label class="field"><span>الحزب (إن اخترته)</span><input id="qz-hizb" type="number" min="1" max="60" value="9"></label><label class="field"><span>عدد الأسئلة</span><select id="qz-n"><option>10</option><option>20</option><option>30</option></select></label></div>
  <button class="btn pri block" data-act="quiz-start">ابدأ الاختبار</button>
  <h2>آخر النتائج</h2><div class="rows">${last.map(t => `<div class="row"><span class="main"><span class="t lat">${t.ok} / ${t.n} · ${Math.round(100 * t.ok / t.n)}%</span><span class="m">${fmtD(t.d)} · ${SCOPE_L[t.scope] || t.scope}</span></span><span class="pill ${t.ok / t.n >= .8 ? 'mem' : 'rel'}">${t.ok / t.n >= .8 ? 'مُثبَت' : 'يحتاج مراجعة'}</span></div>`).join('') || '<div class="empty">لا اختبارات بعد.</div>'}</div>`;
};
views.quiz = () => {
  if (!quiz) return '<div class="empty">لا اختبار جارٍ. <a href="#/tests">اختر اختبارًا</a></div>';
  if (quiz.done) {
    const n = quiz.qs.length, ok = quiz.score, pct = Math.round(100 * ok / n), wrong = quiz.qs.filter(q => !q.right), seen = new Set();
    return `<div class="hero-title">${ok} / ${n}</div><div class="sub">${pct >= 80 ? 'مُثبَت: أنت تتقن هذا المقطع.' : 'يحتاج مراجعة: اقرأ الآيات أدناه ثم أعد الاختبار.'}</div>
    <h2>${wrong.length ? 'للمراجعة' : 'لا أخطاء'}</h2>
    ${wrong.filter(q => !seen.has(q.g) && seen.add(q.g)).map(q => `<div class="mushaf ar" dir="rtl" style="font-size:${Math.max(22, S.settings.font - 6)}px;padding:10px 14px"><span class="surah" style="font-size:.7em">${refOf(q.g)}</span>${esc(Q.ayas[q.g][2])}</div>`).join('')}
    <div class="btns" style="margin-top:12px">${wrong.length ? '<button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">أعد الاختبار في أخطائي</button>' : ''}<a class="btn" href="#/tests" style="text-decoration:none">رجوع</a></div>`;
  }
  const q = quiz.qs[quiz.i], ans = quiz.ans;
  return `<div class="sess-h"><a class="btn sm" href="#/tests">→</a><div class="tt"><b>السؤال ${quiz.i + 1} / ${quiz.qs.length}</b><span class="sub">${esc(SCOPE_L[quiz.scope])} · الصحيح: ${quiz.score}</span></div></div>
  <div class="bar"><i style="width:${100 * quiz.i / quiz.qs.length}%"></i></div>
  <div class="sub" style="margin:10px 0 6px">${q.ask}</div>
  <div class="mushaf ar" dir="rtl" style="font-size:${S.settings.font}px;padding:12px 14px">${esc(q.prompt)}</div>
  <div class="opts">${q.opts.map((o, k) => `<button class="opt ar${ans !== undefined ? (o.ok ? ' right' : k === ans ? ' wrong' : '') : ''}" data-act="quiz-pick" data-k="${k}" ${ans !== undefined ? 'disabled' : ''} style="font-size:${Math.max(20, S.settings.font - 6)}px">${esc(o.t)}</button>`).join('')}</div>
  ${ans !== undefined ? `<div class="note">${q.opts[ans].ok ? 'أحسنت، إجابة صحيحة.' : 'الجواب: ' + esc(q.opts.find(o => o.ok).t)} · ${q.ref}<div class="ar" dir="rtl" style="margin-top:6px;font-size:${Math.max(20, S.settings.font - 6)}px;line-height:2">${esc(q.full)}</div></div><button class="btn pri block" data-act="quiz-next">${quiz.i + 1 >= quiz.qs.length ? 'عرض النتيجة' : 'السؤال التالي'}</button>` : ''}`;
};

/* ---------- routeur ---------- */
const TABS = [['today', '☀', 'اليوم'], ['map', '▦', 'الخريطة'], ['tests', '✓', 'اختبارات'], ['books', '☰', 'كتب'], ['stats', '↗', 'تقدّم'], ['settings', '⚙', 'إعدادات']];
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, a, b, c] = h.split('/');
  closeSheet();
  const top = $('#top'), view = $('#view'), tabs = $('#tabs');
  const inSess = name === 's';
  top.innerHTML = `<span class="brand"><span class="ar">مساري</span></span><span class="date">${fmtD(todayStr(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>`;
  if (!inSess) { if (fol.on) followStop(); stopAudio(); }
  tabs.innerHTML = `<div class="in">${TABS.map(([k, g, l]) => `<a href="#/${k}" ${(name === k || (name === 'book' && k === 'books') || (name === 'quiz' && k === 'tests')) ? 'aria-current="page"' : ''}><b>${g}</b>${l}</a>`).join('')}</div>`;
  if (inSess) { sessState.key = `${a}:${b}`; if (sessState.lastKey !== sessState.key) { sessState.reps = 0; sessState.level = 0; sessState.rev = {}; sessState.lastKey = sessState.key; } view.innerHTML = views.session(a, b, c); }
  else if (name === 'book') view.innerHTML = views.book(a);
  else view.innerHTML = (views[name] || views.today)();
  window.scrollTo(0, 0);
}
const go = h => { if (location.hash === h) route(); else location.hash = h; };

/* ---------- actions ---------- */
function nextAfter(kind, mode) {
  const P = plan();
  if (kind === 'q') { const l = mode === 'new' ? P.newList : P.revList; return l.length ? `#/s/q/${l[0]}/${mode}` : '#/today'; }
  const l = mode === 'new' ? P.bnew : P.brev; return l.length ? `#/s/b/${l[0][0]}:${l[0][1]}/${mode}` : '#/today';
}
function statusSheet(i) {
  const u = UI[i], st = S.units[i];
  openSheet(`<h3 class="ar">${u.label}</h3><div class="sub">الحزب ${u.hizb} · الربع ${u.rub} · ≈ ${fmt1(u.pages)} ص · <span class="pill ${st.s}">${LBL[st.s]}</span>${st.due ? ' · المراجعة القادمة ' + fmtD(st.due) : ''}${st.vdate ? ' · أُثبت باختبار في ' + fmtD(st.vdate) : ''}</div>
  <div class="btns" style="margin:14px 0"><button class="btn pri" data-act="open" data-kind="q" data-id="${i}" data-mode="${st.s === 'mem' ? 'rev' : 'new'}">فتح الجلسة</button></div>
  <div class="sub" style="margin-bottom:6px">تحديد الحالة</div>
  <div class="btns">${['mem', 'rel', 'prog', 'none'].map(s => `<button class="btn sm" data-act="set" data-id="${i}" data-s="${s}" data-scope="one">${LBL[s]}</button>`).join('')}</div>
  <div class="sub" style="margin:12px 0 6px">… لكل الحزب ${u.hizb}</div>
  <div class="btns">${['mem', 'rel', 'prog', 'none'].map(s => `<button class="btn sm" data-act="set" data-id="${i}" data-s="${s}" data-scope="hizb">${LBL[s]}</button>`).join('')}</div>
  <div class="btns" style="margin-top:12px"><button class="btn sm" data-act="pri" data-id="${i}">${st.pri ? 'إلغاء الأولوية' : 'جعله أولوية'}</button></div>
  <div style="height:10px"></div><button class="btn block" data-act="close">إغلاق</button>`);
}
function applyRange(list, s) { list.forEach((i, k) => setStatus(S.units[i], s, k)); save(); route(); toast(`${list.length} ربعًا ← ${LBL[s]}`); }

document.addEventListener('click', e => {
  if (e.target.id === 'sheet') return closeSheet();
  const el = e.target.closest('[data-act]'); if (!el) return;
  const d = el.dataset, act = d.act, t = todayStr();
  switch (act) {
    case 'open': closeSheet(); go(`#/s/${d.kind}/${d.id}/${d.mode}`); break;
    case 'back': history.length > 1 ? history.back() : go('#/today'); break;
    case 'close': closeSheet(); break;
    case 'cell': statusSheet(+d.id); break;
    case 'quiz-start': {
      const scope = d.scope || ($('#qz-scope') ? $('#qz-scope').value : 'all'), n = +(d.n || ($('#qz-n') ? $('#qz-n').value : 10)), h = $('#qz-hizb') ? +$('#qz-hizb').value : 9;
      const qs = buildQuiz(scope, Math.min(60, Math.max(1, h || 1)), n);
      if (!qs) return toast(scope === 'weak' ? 'لا مواضع ضعف حتى الآن.' : 'آيات غير كافية لهذا الاختبار (حدّد بعض الأرباع كمحفوظة).');
      quiz = { qs, i: 0, score: 0, scope, ans: undefined }; go('#/quiz'); break;
    }
    case 'quiz-pick': {
      if (!quiz || quiz.ans !== undefined) return; const k = +d.k, q = quiz.qs[quiz.i]; quiz.ans = k; q.right = !!q.opts[k].ok;
      if (q.right) { quiz.score++; noteOk(q.g); } else noteError(q.g);
      save(); $('#view').innerHTML = views.quiz(); break;
    }
    case 'quiz-next': quiz.i++; quiz.ans = undefined; if (quiz.i >= quiz.qs.length) finishQuiz(); $('#view').innerHTML = views.quiz(); window.scrollTo(0, 0); break;
    case 'pri': { const u = S.units[+d.id]; u.pri = u.pri ? 0 : 1; save(); closeSheet(); route(); toast(u.pri ? 'أولوية' : 'أُلغيت الأولوية'); break; }
    case 'set': {
      const i = +d.id, list = d.scope === 'hizb' ? [0, 1, 2, 3].map(k => (i >> 2) * 4 + k) : [i];
      applyRange(list, d.s); break;
    }
    case 'range-hizb': {
      let a = +$('#rg-from').value, b = +$('#rg-to').value; if (!(a >= 1 && b >= 1)) return toast('اكتب رقمَي حزبين.');
      if (a > b) [a, b] = [b, a]; a = Math.max(1, a); b = Math.min(60, b);
      applyRange([...Array((b - a + 1) * 4).keys()].map(k => (a - 1) * 4 + k), $('#rg-status').value); break;
    }
    case 'range-surah': applyRange(unitsInRange(...chRange(+$('#rg-surah').value)), $('#rg-status').value); break;
    case 'follow': followStart(); break;
    case 'listen': listenStart(); break;
    case 'tj-legend': openSheet(`<h3>مفتاح ألوان التجويد</h3><div class="tjlist">${TJ.rules.map((r, i) => tjOn(i) ? `<div class="tjrow"><span class="tjn"><i class="tj-${i}">${TJ_SAMPLE[i]}</i> ${TJ_AR[i]}</span></div>` : '').join('')}</div><button class="btn block" data-act="close">إغلاق</button>`); break;
    case 'tj-reset': S.settings.tjCol = {}; S.settings.tjOff = {}; save(); applyTj(); route(); toast('أُعيدت الألوان الافتراضية'); break;
    case 'reveal': if (el.classList.contains('hid') && el.dataset.g) sessState.rev[el.dataset.g] = (sessState.rev[el.dataset.g] || 0) + 1; el.classList.toggle('hid'); break;
    case 'level': sessState.level = +d.l; { const keep = sessState.reps; const [, , a, b, c] = location.hash.split('/'); $('#view').innerHTML = views.session(a, b, c); sessState.reps = keep; } break;
    case 'showall': document.querySelectorAll('.w.hid').forEach(w => w.classList.remove('hid')); break;
    case 'rep-plus': case 'rep-minus': {
      sessState.reps = Math.max(0, (sessState.reps || 0) + (act === 'rep-plus' ? 1 : -1)); $('#rep-n').textContent = sessState.reps;
      if (act === 'rep-plus') { logOf(t).reps = (logOf(t).reps || 0) + 1; save(); if (sessState.reps === S.settings.rep) toast('بلغتَ عدد التكرار المطلوب'); } break;
    }
    case 'grade': {
      const [, , kind, id, mode] = location.hash.split('/'), it = getItem(kind, id), st = it.st, L = logOf(t), tag = kind === 'q' ? +id : id;
      const note = $('#note'); if (note) st.note = note.value;
      const push = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
      if (mode === 'rev') { gradeItem(st, d.g, t); push(kind === 'q' ? L.rev : L.brev, tag); toast(d.g === 'hard' ? 'تُراجَع غدًا' : 'المراجعة القادمة ' + fmtD(st.due)); }
      else if (d.g === 'learned') { markLearned(st, t); push(kind === 'q' ? L.new : L.bnew, tag); toast('تم الحفظ. أول مراجعة غدًا.'); }
      else if (d.g === 'prog') { if (st.s === 'none') st.s = 'prog'; toast('بقي قيد الحفظ'); }
      else { toast('لا بأس، يبقى مجدولًا.'); }
      if (kind === 'q') commitErrors(+id);
      save();
      const nx = (mode === 'rev' || d.g === 'learned') ? nextAfter(kind, mode) : '#/today';
      sessState.lastKey = ''; go(nx); break;
    }
    case 'book-new': openSheet(`<h3>كتاب أو متن جديد</h3>
      <label class="field"><span>العنوان</span><input type="text" id="bk-title"></label>
      <div class="two"><label class="field"><span>النوع</span><select id="bk-kind"><option value="matn">متن للحفظ</option><option value="livre">كتاب للقراءة</option></select></label><label class="field"><span>الانتهاء في</span><input type="date" id="bk-end" value="${addMonths(todayStr(), 3)}"></label></div>
      <label class="field"><span>التقسيم</span><select id="bk-split"><option value="4">٤ أسطر لكل جزء</option><option value="2">سطران لكل جزء</option><option value="8">٨ أسطر لكل جزء</option><option value="blank">جزء لكل فقرة (سطر فارغ)</option></select></label>
      <label class="field"><span>النص</span><textarea id="bk-text" dir="auto" placeholder="الصق النص هنا، بيت أو جملة في كل سطر"></textarea></label>
      <div class="btns"><button class="btn pri" data-act="book-save">إنشاء</button><button class="btn" data-act="close">إلغاء</button></div>`); break;
    case 'book-save': {
      const title = $('#bk-title').value.trim(), raw = $('#bk-text').value.replace(/\r/g, '').trim(), sp = $('#bk-split').value;
      if (!title || !raw) return toast('العنوان والنص مطلوبان.');
      let parts;
      if (sp === 'blank') parts = raw.split(/\n\s*\n/).map(p => p.split('\n').map(l => l.trim()).filter(Boolean)).filter(p => p.length);
      else { const lines = raw.split('\n').map(l => l.trim()).filter(Boolean), n = +sp; parts = []; for (let i = 0; i < lines.length; i += n) parts.push(lines.slice(i, i + n)); }
      const id = 'k' + Date.now().toString(36);
      S.books.push({ id, title, kind: $('#bk-kind').value, end: $('#bk-end').value || addMonths(todayStr(), 3), portions: parts.map(lines => ({ lines, ...blank() })) });
      save(); closeSheet(); go('#/book/' + id); toast('أُنشئ ' + parts.length + ' جزءًا'); break;
    }
    case 'book-del': if (confirm('حذف هذا الكتاب وتقدّمه؟')) { S.books = S.books.filter(b => b.id !== d.id); save(); go('#/books'); } break;
    case 'notif':
      if (!('Notification' in window)) return toast('الإشعارات غير مدعومة هنا.');
      Notification.requestPermission().then(p => toast(p === 'granted' ? 'فُعّلت الإشعارات' : 'رُفضت الإشعارات')); break;
    case 'ics': downloadICS(); break;
    case 'gh-conn': gh.repo = $('#gh-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''); gh.token = $('#gh-token').value.trim(); ghSave();
      if (!ghReady()) return toast('اكتب المستودع والرمز.');
      ghStatus('جارٍ الاختبار…'); ghRemote().then(r => r.data ? ghPull(false) : ghPush(true)).catch(e => ghStatus('فشل: ' + e.message)); break;
    case 'gh-push': ghPush(true); break;
    case 'gh-pull': ghPull(false); break;
    case 'export': download(`masari-backup-${t}.json`, JSON.stringify(S), 'application/json'); break;
    case 'reset': if (confirm('مسح كل بيانات مساري من هذا الجهاز؟')) { localStorage.removeItem(KEY); load(); go('#/today'); } break;
  }
});
document.addEventListener('change', e => {
  const id = e.target.id, v = e.target.value, s = S.settings;
  if (id === 'imp') {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const o = JSON.parse(r.result); if (!o.units || o.units.length !== NQ) throw 0; S = o; ensure(); save(); go('#/today'); toast('تم استيراد النسخة'); } catch (x) { toast('ملف غير صالح.'); } };
    r.readAsText(f); return;
  }
  if (e.target.dataset && e.target.dataset.tj !== undefined) { s.tjCol[e.target.dataset.tj] = v; save(); applyTj(); return; }
  if (e.target.dataset && e.target.dataset.tjon !== undefined) { if (e.target.checked) delete s.tjOff[e.target.dataset.tjon]; else s.tjOff[e.target.dataset.tjon] = 1; save(); applyTj(); return; }
  if (id === 'st-tj') { s.tjOn = e.target.checked; save(); applyTj(); toast('تم الحفظ'); return; }
  if (id === 'st-reciter') { s.reciter = v; save(); toast('تم الحفظ'); return; }
  if (id === 'st-arep') { s.arep = +v; save(); toast('تم الحفظ'); return; }
  const map = { 'st-start': () => s.start = v, 'st-end': () => s.end = v, 'st-cap': () => s.reviewCap = Math.max(1, +v || 8), 'st-rep': () => s.rep = Math.max(1, +v || 20), 'st-bcap': () => s.bookCap = Math.max(0, +v || 0), 'st-font': () => s.font = Math.min(56, Math.max(20, +v || 30)), 'st-t0': () => s.times[0] = v, 'st-t1': () => s.times[1] = v };
  if (map[id]) { map[id](); save(); toast('تم الحفظ'); }
});
document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.tj !== undefined) { S.settings.tjCol[e.target.dataset.tj] = e.target.value; applyTj(); return; } if (e.target.id === 'note') { const [, , kind, id] = location.hash.split('/'); if (kind === 'b') { const it = getItem(kind, id); it.st.note = e.target.value; save(); } } });

function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function downloadICS() {
  const s = S.settings, start = s.start.replace(/-/g, ''), until = s.end.replace(/-/g, '') + 'T235900', now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const names = ['مساري: الحفظ', 'مساري: المراجعة'], L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Masari//AR', 'CALSCALE:GREGORIAN'];
  s.times.forEach((tm, k) => {
    const [h, m] = tm.split(':').map(Number), e = h * 60 + m + 30, eh = Math.floor(e / 60) % 24, em = e % 60;
    L.push('BEGIN:VEVENT', `UID:masari-${k}-${start}@local`, `DTSTAMP:${now}`, `DTSTART:${start}T${pad(h)}${pad(m)}00`, `DTEND:${start}T${pad(eh)}${pad(em)}00`, `RRULE:FREQ=DAILY;UNTIL=${until}`, `SUMMARY:${names[k]}`, 'BEGIN:VALARM', 'TRIGGER:PT0S', 'ACTION:DISPLAY', 'DESCRIPTION:مساري', 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR'); download('masari-rappels.ics', L.join('\r\n'), 'text/calendar'); toast('استورد هذا الملف في تقويمك');
}

/* ---------- notifications (si l'app est ouverte) ---------- */
setInterval(() => {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !S) return;
  const n = new Date(), hm = `${pad(n.getHours())}:${pad(n.getMinutes())}`, t = todayStr();
  S.settings.times.forEach((tm, k) => {
    const key = t + k; if (tm !== hm || S.fired[key]) return; S.fired[key] = 1; save();
    const P = plan(), body = k === 0 ? `للحفظ اليوم: ${P.newList.length}` : `مراجعات اليوم: ${P.revList.length}`;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('مساري', { body, tag: 'masari' + k })).catch(() => new Notification('مساري', { body }));
    else new Notification('مساري', { body });
  });
}, 30000);

/* ---------- démarrage ---------- */
load(); applyTj();
window.addEventListener('hashchange', route);
route();
ghPull(true);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
