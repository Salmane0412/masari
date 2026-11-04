'use strict';
/* Masari — suivi personnel de mémorisation et d'étude. Données stockées localement (localStorage). */
const Q = window.QDATA;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const AR = '٠١٢٣٤٥٦٧٨٩';
const toAr = n => String(n).replace(/\d/g, d => AR[d]);
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
  const label = `${CH[A[0]].ar} ${toAr(A[1])} – ${B[0] !== A[0] ? CH[B[0]].ar + ' ' : ''}${toAr(B[1])}`;
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
const fmtD = (s, o = { day: 'numeric', month: 'short' }) => parseD(s).toLocaleDateString('fr-FR', o);

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
function ensure() { S.errors = S.errors || {}; S.tests = S.tests || []; S.units.forEach(u => { if (u.pri === undefined) u.pri = 0; }); }
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
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Stockage plein ou bloqué : exporte une sauvegarde.'); }
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
  if (r.status === 401 || r.status === 403) throw new Error('Jeton refusé ou droits insuffisants (Contents : lecture et écriture).');
  if (!r.ok) throw new Error('GitHub a répondu ' + r.status);
  const j = await r.json(); return { sha: j.sha, data: JSON.parse(b64d(j.content)) };
}
async function ghPush(manual) {
  if (!ghReady()) return;
  try {
    ghStatus('Envoi en cours…');
    const rem = await ghRemote();
    if (rem.data && rem.data.updatedAt > (S.updatedAt || 0) + 1000 && !manual) { ghStatus('Une version plus récente existe sur GitHub : touche Récupérer.'); return; }
    const body = { message: 'Sauvegarde Masari ' + new Date().toISOString(), content: b64e(JSON.stringify(S)) };
    if (rem.sha) body.sha = rem.sha;
    const r = await fetch(ghUrl(), { method: 'PUT', headers: { ...ghHead(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Écriture refusée (' + r.status + ')');
    gh.last = Date.now(); ghStatus('Synchronisé à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  } catch (e) { ghStatus('Échec : ' + e.message); }
}
async function ghPull(quiet) {
  if (!ghReady()) return;
  try {
    const rem = await ghRemote();
    if (!rem.data) { if (!quiet) ghStatus('Aucune sauvegarde sur GitHub pour l\'instant.'); return; }
    if (rem.data.units && rem.data.units.length === NQ && (!quiet || rem.data.updatedAt > (S.updatedAt || 0))) {
      S = rem.data; ensure(); save(true); gh.last = Date.now(); ghStatus('Données récupérées depuis GitHub.'); route(); toast('Synchronisé depuis GitHub');
    } else if (!quiet) ghStatus('Déjà à jour.');
  } catch (e) { ghStatus('Échec : ' + e.message); }
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
const LBL = { mem: 'Acquis', rel: 'À réapprendre', prog: 'En cours', none: 'Pas encore' };

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

/* ---------- plan du jour ---------- */
function plan() {
  const t = todayStr(), L = S.log[t] || { new: [], rev: [], bnew: [], brev: [] };
  const daysLeft = Math.max(1, diffDays(t, S.settings.end) + 1);
  const keys = [...Array(NQ).keys()];
  const isPri = i => S.units[i].pri && S.units[i].s !== 'mem';
  const queue = keys.filter(isPri).concat(keys.filter(i => !isPri(i) && (S.units[i].s === 'rel' || S.units[i].s === 'prog')), keys.filter(i => !isPri(i) && S.units[i].s === 'none'));
  const doneNew = L.new.length;
  const quota = (queue.length + doneNew) === 0 ? 0 : Math.ceil((queue.length + doneNew) / daysLeft);
  const newList = queue.slice(0, Math.max(0, quota - doneNew));
  const dueAll = keys.filter(i => S.units[i].s === 'mem' && S.units[i].due && S.units[i].due <= t)
    .sort((a, b) => (S.units[a].due < S.units[b].due ? -1 : S.units[a].due > S.units[b].due ? 1 : (S.units[b].weak - S.units[a].weak) || a - b));
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
function weave() { return `<div class="weave" role="img" aria-label="Progression sur les 60 hizb">${S.units.map(u => `<i class="${u.s}"></i>`).join('')}</div>`; }
function legend() { return `<div class="legend"><span class="mem">Acquis</span><span class="rel">À réapprendre</span><span class="prog">En cours</span><span>Pas encore</span></div>`; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2400); }
function openSheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}</div>`; s.hidden = false; }
function closeSheet() { $('#sheet').hidden = true; }
const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');

/* ---------- éléments de séance (Coran / livres) ---------- */
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
const sessState = { level: 0, rev: {} };
function wordsHtml(text, key, g) {
  return text.split(' ').filter(Boolean).map((w, k) => {
    const hid = (hash(key + ':' + k) % 100) < sessState.level;
    const err = g !== undefined && errScore(g) > 0;
    return `<span class="w${hid ? ' hid' : ''}${err ? ' err' : ''}"${g !== undefined ? ` data-g="${g}"` : ''} data-act="reveal">${esc(w)}</span>`;
  }).join(' ');
}
function getItem(kind, id) {
  if (kind === 'q') {
    const i = +id, u = UI[i], st = S.units[i];
    let html = '', lastC = 0;
    for (let g = u.a; g <= u.b; g++) {
      const [c, v, tx] = Q.ayas[g];
      let text = tx;
      if (c !== lastC && (v === 1 || g === u.a)) {
        html += `<span class="surah">سورة ${CH[c].ar}<small>${esc(CH[c].tr)}${v > 1 ? ' · à partir du verset ' + v : ''}</small></span>`;
        lastC = c;
      }
      if (v === 1 && c !== 1 && c !== 9) {
        const toks = tx.split(' ');
        html += `<span class="bism">${wordsHtml(toks.slice(0, BISM_TOKENS).join(' '), 'b' + c)}</span>`;
        text = toks.slice(BISM_TOKENS).join(' ');
      }
      html += `${wordsHtml(text, g, g)}<span class="n">﴿${toAr(v)}﴾</span> `;
    }
    return { title: u.label, sub: `Hizb ${u.hizb} · rub' ${u.rub} · ≈ ${fmt1(u.pages)} p.`, html, st, kind: 'q', id };
  }
  const [bid, j] = id.split(':'); const b = S.books.find(x => x.id === bid), p = b.portions[+j];
  const html = p.lines.map((l, k) => `<span class="line" dir="auto">${wordsHtml(l, bid + j + k)}</span>`).join('');
  return { title: b.title, sub: `Partie ${+j + 1} / ${b.portions.length}`, html, st: p, kind: 'b', id, book: b, note: true };
}

/* ---------- vues ---------- */
const views = {};
views.today = () => {
  const P = plan(), c = counts(), L = P.L;
  const dayN = Math.max(1, diffDays(S.settings.start, P.t) + 1), total = diffDays(S.settings.start, S.settings.end) + 1;
  const row = (id, kind, mode, title, meta, done, lat) => `<button class="row${done ? ' done' : ''}" data-act="open" data-kind="${kind}" data-id="${id}" data-mode="${mode}"><span class="main"><span class="t${lat ? ' lat' : ' ar'}">${title}</span><span class="m">${meta}</span></span><span class="go">${done ? 'Fait ✓' : 'Commencer'}</span></button>`;
  const newRows = L.new.map(i => row(i, 'q', 'new', UI[i].label, `Hizb ${UI[i].hizb} · rub' ${UI[i].rub}`, true)).join('') +
    P.newList.map(i => row(i, 'q', 'new', UI[i].label, `${S.units[i].pri ? 'Prioritaire · ' : ''}${S.units[i].s === 'rel' ? 'À réapprendre' : S.units[i].s === 'prog' ? 'En cours' : 'Nouveau'} · Hizb ${UI[i].hizb} · rub' ${UI[i].rub} · ≈ ${fmt1(UI[i].pages)} p.`, false)).join('');
  const revRows = L.rev.map(i => row(i, 'q', 'rev', UI[i].label, 'Révisé', true)).join('') +
    P.revList.map(i => { const late = diffDays(S.units[i].due, P.t); return row(i, 'q', 'rev', UI[i].label, `${S.units[i].weak ? 'Fragile · ' : ''}${late > 0 ? 'en retard de ' + late + ' j' : 'prévu aujourd\'hui'} · Hizb ${UI[i].hizb} · rub' ${UI[i].rub}`, false); }).join('');
  const bRows = P.bnew.map(([b, j]) => { const bk = S.books.find(x => x.id === b); return row(b + ':' + j, 'b', 'new', esc(bk.title) + ' — partie ' + (j + 1), bk.kind === 'matn' ? 'À mémoriser' : 'À lire', false, true); }).join('') +
    P.brev.map(([b, j]) => { const bk = S.books.find(x => x.id === b); return row(b + ':' + j, 'b', 'rev', esc(bk.title) + ' — partie ' + (j + 1), 'À réviser', false, true); }).join('') +
    L.bnew.concat(L.brev).map(x => { const [b, j] = x.split(':'); const bk = S.books.find(y => y.id === b); return bk ? row(x, 'b', 'rev', esc(bk.title) + ' — partie ' + (+j + 1), 'Fait', true, true) : ''; }).join('');
  const overdue = P.dueAll.length - P.revList.length;
  return `
  <div class="hero-title">Jour ${Math.min(dayN, total)} sur ${total}</div>
  <div class="sub">Objectif : fin le ${fmtD(S.settings.end, { day: 'numeric', month: 'long', year: 'numeric' })} · ${P.daysLeft} j restants</div>
  ${weave()}${legend()}
  <div class="kpis">
    <div class="kpi"><b>${c.mem}</b><span>rub' acquis (≈ ${Math.round(pagesOf('mem'))} p.)</span></div>
    <div class="kpi"><b>${P.remaining}</b><span>à apprendre (≈ ${Math.round(pagesOf('none') + pagesOf('rel') + pagesOf('prog'))} p.)</span></div>
    <div class="kpi"><b>${P.dueAll.length}</b><span>révisions dues</span></div>
  </div>
  <h2>Mémoriser <span class="count">· objectif du jour : ${P.quota} rub' (≈ ${fmt1(P.quota * 604 / 240)} p.)</span></h2>
  <div class="rows">${newRows || '<div class="empty">Rien à apprendre aujourd\'hui. Bravo, ou ajuste les dates dans Réglages.</div>'}</div>
  <h2>Réviser <span class="count">· ${P.dueAll.length} due${P.dueAll.length > 1 ? 's' : ''}${overdue > 0 ? ', ' + overdue + ' reportée' + (overdue > 1 ? 's' : '') + ' (plafond ' + S.settings.reviewCap + '/j)' : ''}</span></h2>
  <div class="rows">${revRows || '<div class="empty">Aucune révision due.</div>'}</div>
  ${(() => { const w = weakAyas(); if (!w.length) return ''; return `<h2>À renforcer <span class="count">· ${w.length} verset${w.length > 1 ? 's' : ''}</span></h2><div class="rows">${w.slice(0, 5).map(g => `<div class="row"><span class="main"><span class="t ar">${refOf(g)}</span><span class="m">${S.errors[g].n} erreur${S.errors[g].n > 1 ? 's' : ''}${S.errors[g].last ? ' · dernière le ' + fmtD(S.errors[g].last) : ''}</span></span></div>`).join('')}</div><div class="btns" style="margin-top:10px"><button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">Test sur mes points faibles</button></div>`; })()}
  ${bRows ? `<h2>Livres</h2><div class="rows">${bRows}</div>` : ''}`;
};

views.map = () => {
  let h = `<div class="hero-title">Carte du Coran</div><div class="sub">60 hizb, 4 rub' chacun. Touche un rub' pour l'ouvrir ou changer son statut.</div>${legend()}
  <details><summary>Modifier une plage</summary>
    <label class="field"><span>Statut à appliquer</span><select id="rg-status"><option value="mem">Acquis (en révision)</option><option value="rel">À réapprendre</option><option value="prog">En cours</option><option value="none">Pas encore</option></select></label>
    <div class="two"><label class="field"><span>Du hizb</span><input id="rg-from" type="number" min="1" max="60" value="1"></label><label class="field"><span>Au hizb</span><input id="rg-to" type="number" min="1" max="60" value="1"></label></div>
    <button class="btn block" data-act="range-hizb">Appliquer aux hizb</button>
    <label class="field"><span>Ou à toute une sourate</span><select id="rg-surah">${Q.chapters.map(c => `<option value="${c[0]}">${c[0]} · ${esc(c[2])} · ${c[1]}</option>`).join('')}</select></label>
    <button class="btn block" data-act="range-surah">Appliquer à la sourate</button>
  </details><div style="height:12px"></div>`;
  const t = todayStr();
  for (let h4 = 0; h4 < 60; h4++) {
    h += `<div class="hizb"><span class="n">${h4 + 1}</span>`;
    for (let r = 0; r < 4; r++) {
      const i = h4 * 4 + r, u = UI[i], st = S.units[i];
      h += `<button class="cell ${st.s}${st.s === 'mem' && st.due && st.due <= t ? ' due' : ''}" data-act="cell" data-id="${i}" aria-label="Hizb ${h4 + 1} rub' ${r + 1}, ${LBL[st.s]}"><span class="s">${CH[u.A[0]].ar}</span><span class="g">${toAr(u.A[1])}</span></button>`;
    }
    h += '</div>';
  }
  return h;
};

views.books = () => {
  const t = todayStr();
  const cards = S.books.map(b => {
    const done = b.portions.filter(p => p.s === 'mem').length, n = b.portions.length;
    return `<a class="row" href="#/book/${b.id}" style="text-decoration:none;color:inherit"><span class="main"><span class="t lat">${esc(b.title)}</span><span class="m">${b.kind === 'matn' ? 'Matn à mémoriser' : 'Livre à lire'} · ${done}/${n} parties · fin le ${fmtD(b.end)}</span><span class="bar"><i style="width:${n ? 100 * done / n : 0}%"></i></span></span><span class="go">Ouvrir</span></a>`;
  }).join('');
  return `<div class="hero-title">Livres et matn</div><div class="sub">Colle un texte : Masari le découpe en parties à lire ou à mémoriser, avec un rythme jusqu'à la date voulue.</div>
  <div class="rows" style="margin-top:14px">${cards || '<div class="empty">Aucun livre pour l\'instant.</div>'}</div>
  <div style="height:14px"></div><button class="btn pri block" data-act="book-new">Ajouter un livre ou un matn</button>`;
};

views.book = id => {
  const b = S.books.find(x => x.id === id); if (!b) return '<p>Livre introuvable.</p>';
  const done = b.portions.filter(p => p.s === 'mem').length, word = b.kind === 'matn' ? 'mémorisée' : 'lue';
  return `<div class="sess-h"><a class="btn sm" href="#/books">←</a><div class="tt"><b>${esc(b.title)}</b><span class="sub">${done}/${b.portions.length} parties ${word}s · fin le ${fmtD(b.end)}</span></div></div>
  <div class="bar"><i style="width:${100 * done / b.portions.length}%"></i></div>
  <div class="rows">${b.portions.map((p, j) => `<button class="row" data-act="open" data-kind="b" data-id="${b.id}:${j}" data-mode="${p.s === 'mem' ? 'rev' : 'new'}"><span class="main"><span class="t lat" dir="auto" style="font-weight:400;font-size:16px">${esc((p.lines[0] || '').slice(0, 70))}</span><span class="m">Partie ${j + 1} · ${LBL[p.s] || p.s}${p.due ? ' · prochaine révision ' + fmtD(p.due) : ''}${p.note ? ' · note' : ''}</span></span><span class="pill ${p.s}">${p.s === 'mem' ? '✓' : '·'}</span></button>`).join('')}</div>
  <div style="height:16px"></div><button class="btn warn block" data-act="book-del" data-id="${b.id}">Supprimer ce livre</button>`;
};

views.stats = () => {
  const t = todayStr(), c = counts();
  const act = d => logCount(S.log[d]);
  let streak = 0, d = act(t) ? t : addDays(t, -1);
  while (act(d)) { streak++; d = addDays(d, -1); }
  const dow = (parseD(t).getDay() + 6) % 7; // lundi = 0
  const startHeat = addDays(t, -(dow + 13 * 7)); const cells = [];
  for (let k = 0; k < 14 * 7; k++) { const dd = addDays(startHeat, k); const n = dd > t ? -1 : act(dd); cells.push(n < 0 ? '<i style="visibility:hidden"></i>' : `<i class="l${n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4}" title="${dd} : ${n}"></i>`); }
  let newDone = 0; for (let k = 0; k < 14; k++) newDone += (S.log[addDays(t, -k)] || { new: [] }).new.length;
  const firstDay = Object.keys(S.log).sort()[0]; const span = Math.min(14, Math.max(1, firstDay ? diffDays(firstDay, t) + 1 : 1));
  const rate = newDone / span, remaining = c.none + c.rel + c.prog;
  const proj = rate > 0 ? addDays(t, Math.ceil(remaining / rate)) : null;
  const need = remaining / Math.max(1, diffDays(t, S.settings.end) + 1);
  const total = Object.values(S.log).reduce((n, L) => n + logCount(L), 0);
  return `<div class="hero-title">Progression</div>
  <div class="kpis"><div class="kpi"><b>${streak}</b><span>jours d'affilée</span></div><div class="kpi"><b>${total}</b><span>séances faites</span></div><div class="kpi"><b>${Math.round(100 * pagesOf('mem') / 604)} %</b><span>du Coran acquis</span></div></div>
  <h2>14 dernières semaines</h2><div class="heat">${cells.join('')}</div>
  <h2>Rythme</h2>
  <p style="margin:6px 0">Il reste <b>${remaining} rub'</b> (≈ ${Math.round(remaining * 604 / 240)} p.) à apprendre. Pour finir le ${fmtD(S.settings.end)}, il faut <b>${fmt1(need)} rub'/jour</b> (≈ ${fmt1(need * 604 / 240)} p.).</p>
  <p style="margin:6px 0" class="sub">${proj ? `Avec ton rythme des ${span} derniers jours (${fmt1(rate)} rub'/jour), tu finirais vers le ${fmtD(proj, { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Termine quelques séances pour voir une projection.'}</p>
  <div class="note">Plus tu avances, plus le nombre de révisions dues grandit. Si le plafond de révisions par jour est trop bas, elles s'accumulent ; trop haut, la mémorisation du jour en pâtit. Ajuste-le dans Réglages.</div>`;
};

views.settings = () => {
  const s = S.settings;
  return `<div class="hero-title">Réglages</div>
  <div class="two"><label class="field"><span>Début</span><input type="date" id="st-start" value="${s.start}"></label><label class="field"><span>Fin de l'objectif</span><input type="date" id="st-end" value="${s.end}"></label></div>
  <div class="two"><label class="field"><span>Révisions max par jour</span><input type="number" id="st-cap" min="1" max="60" value="${s.reviewCap}"></label><label class="field"><span>Répétitions par séance</span><input type="number" id="st-rep" min="1" max="100" value="${s.rep}"></label></div>
  <div class="two"><label class="field"><span>Parties de livre / jour (révision)</span><input type="number" id="st-bcap" min="0" max="30" value="${s.bookCap}"></label><label class="field"><span>Taille du texte</span><input type="number" id="st-font" min="20" max="56" value="${s.font}"></label></div>
  <h2>Rappels</h2>
  <div class="two"><label class="field"><span>Mémorisation</span><input type="time" id="st-t0" value="${s.times[0]}"></label><label class="field"><span>Révision</span><input type="time" id="st-t1" value="${s.times[1]}"></label></div>
  <div class="btns"><button class="btn" data-act="notif">Activer les notifications</button><button class="btn" data-act="ics">Rappels quotidiens (.ics)</button></div>
  <p class="sub">Les notifications du navigateur n'arrivent que si Masari est ouvert ou installé et actif. Pour des rappels fiables, importe le fichier .ics dans ton agenda : il crée des événements quotidiens avec alarme jusqu'à la date de fin.</p>
  <h2>Synchronisation GitHub</h2>
  <p class="sub">Sauvegarde automatique de tes données dans un dépôt GitHub privé à toi, pour les retrouver sur tous tes appareils. Le jeton reste sur cet appareil et n'est jamais inclus dans l'export.</p>
  <label class="field"><span>Dépôt privé (propriétaire/nom)</span><input type="text" id="gh-repo" value="${esc(gh.repo)}" placeholder="Salmane0412/masari-data" autocapitalize="off" autocomplete="off"></label>
  <label class="field"><span>Jeton d'accès (fine-grained, Contents : lecture et écriture)</span><input type="password" id="gh-token" value="${esc(gh.token)}" autocomplete="off"></label>
  <div class="btns"><button class="btn pri" data-act="gh-conn">Enregistrer et tester</button><button class="btn" data-act="gh-push">Envoyer maintenant</button><button class="btn" data-act="gh-pull">Récupérer</button></div>
  <p class="sub" id="gh-status" role="status">${esc(gh.msg || (ghReady() ? 'Prêt.' : 'Non configuré.'))}</p>
  <h2>Données</h2>
  <p class="sub">Tout reste sur cet appareil. Exporte régulièrement une sauvegarde, surtout avant de changer de téléphone ou de vider le navigateur.</p>
  <div class="btns"><button class="btn" data-act="export">Exporter</button><label class="btn" style="display:inline-flex;align-items:center">Importer<input type="file" id="imp" accept="application/json" hidden></label><button class="btn warn" data-act="reset">Tout réinitialiser</button></div>
  <h2>Crédits</h2>
  <p class="sub">Texte coranique : Tanzil Project (tanzil.net), licence Creative Commons Attribution 3.0, texte reproduit sans modification. Index des hizb, rub' et pages : mêmes données Tanzil, via le dépôt quran-json.</p>`;
};

views.session = (kind, id, mode) => {
  const it = getItem(kind, id), st = it.st, t = todayStr();
  const key = `${kind}:${id}`;
  const reps = (sessState.reps && sessState.key === key) ? sessState.reps : 0;
  const isMatn = kind === 'b' && it.book.kind === 'livre';
  const done = isMatn ? 'Lu' : 'Appris';
  const acts = mode === 'rev'
    ? `<div class="actions"><button class="btn" data-act="grade" data-g="hard">Difficile</button><button class="btn" data-act="grade" data-g="ok">Moyen</button><button class="btn pri" data-act="grade" data-g="easy">Solide</button></div>`
    : `<div class="actions"><button class="btn" data-act="grade" data-g="later">Pas encore</button><button class="btn" data-act="grade" data-g="prog">En cours</button><button class="btn pri" data-act="grade" data-g="learned">${done} ✓</button></div>`;
  return `<div class="sess-h"><button class="btn sm" data-act="back" aria-label="Retour">←</button><div class="tt"><b class="${kind === 'q' ? 'ar' : ''}" style="font-size:${kind === 'q' ? 20 : 17}px">${esc(it.title)}</b><span class="sub">${it.sub}${st.weak ? ' · fragile' : ''}</span></div></div>
  <div class="tools"><span class="seg" role="group" aria-label="Masquer des mots">${[0, 30, 60, 100].map(l => `<button data-act="level" data-l="${l}" aria-pressed="${sessState.level === l}">${l === 0 ? 'Texte' : l + ' %'}</button>`).join('')}</span><button class="btn sm" data-act="showall">Tout afficher</button><span class="lbl">Masque des mots : touche un mot pour le révéler</span></div>
  ${kind === 'q' ? `<div class="btns" style="margin:0 0 12px"><button class="btn" id="rec-btn" data-act="recite">🎤 Réciter pour vérifier</button></div><div id="rec-out"></div>` : ''}
  ${(() => { if (kind !== 'q') return ''; const u = UI[+id]; let n = 0; for (let g = u.a; g <= u.b; g++) if (errScore(g) > 0) n++; return n ? `<div class="note">${n} verset${n > 1 ? 's' : ''} de ce passage ${n > 1 ? 'te posent' : 'te pose'} problème : ${n > 1 ? 'ils sont soulignés' : 'il est souligné'}. Masque le texte à 60 % ou plus pour t'y tester.</div>` : ''; })()}
  <article class="mushaf ar" dir="rtl" style="font-size:${S.settings.font}px">${it.html}</article>
  <div class="counter"><button class="btn" data-act="rep-minus" aria-label="Moins un">−</button><div class="big"><span id="rep-n">${reps}</span> <small>/ ${S.settings.rep}</small></div><button class="btn pri" data-act="rep-plus">+1</button></div>
  ${it.note ? `<label class="field"><span>Note sur cette partie</span><textarea id="note">${esc(st.note || '')}</textarea></label>` : ''}
  ${acts}`;
};


/* ---------- récitation : comparaison de ce que tu dis au texte attendu ---------- */
const normW = t => normAr(t).replace(/[^ء-ي]/g, '');
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
function wcost(e, h) { if (e === h) return 0; const d = lev(e, h); return d <= (e.length >= 5 ? 2 : 1) && Math.max(e.length, h.length) >= 3 ? 0.4 : 1; }
/* retourne, pour chaque mot attendu, 'ok' | 'bad' */
function alignWords(exp, heard) {
  const n = exp.length, m = heard.length, D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) D[i][0] = i; for (let j = 1; j <= m; j++) D[0][j] = 0 + j * 0.3;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 0.3, D[i - 1][j - 1] + wcost(exp[i - 1], heard[j - 1]));
  const res = new Array(n).fill('bad'); let i = n, j = m;
  while (i > 0 && j > 0) { const c = wcost(exp[i - 1], heard[j - 1]); if (D[i][j] === D[i - 1][j - 1] + c) { res[i - 1] = c <= 0.4 ? 'ok' : 'bad'; i--; j--; } else if (D[i][j] === D[i - 1][j] + 1) { i--; } else j--; }
  return res;
}
let recog = null, recTxt = '';
function reciteStart() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Reconnaissance vocale indisponible ici : utilise Chrome (Android ou PC)'); return; }
  if (recog) { recog.stop(); return; }
  recTxt = ''; recog = new SR(); recog.lang = 'ar-SA'; recog.continuous = true; recog.interimResults = true;
  let fin = '';
  recog.onresult = e => { let tmp = ''; for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += ' ' + e.results[i][0].transcript; else tmp += ' ' + e.results[i][0].transcript; } recTxt = fin + tmp; const o = $('#rec-out'); if (o) o.innerHTML = `<div class="note ar" dir="rtl">${esc(recTxt)}</div>`; };
  recog.onerror = e => { toast('Micro : ' + e.error); };
  recog.onend = () => { recog = null; const b = $('#rec-btn'); if (b) b.textContent = '🎤 Réciter pour vérifier'; if (recTxt.trim()) reciteCheck(); };
  try { recog.start(); $('#rec-btn').textContent = '⏹ Terminer et vérifier'; } catch (err) { recog = null; toast('Micro refusé'); }
}
function reciteCheck() {
  const [, , kind, id] = location.hash.split('/'); if (kind !== 'q') return;
  const u = UI[+id], exp = [], owner = [];
  for (let g = u.a; g <= u.b; g++) { let ws = wordsOf(g); if (Q.ayas[g][1] === 1 && Q.ayas[g][0] !== 1 && Q.ayas[g][0] !== 9) ws = ws.slice(BISM_TOKENS); ws.forEach(w => { const n = normW(w); if (n) { exp.push(n); owner.push(g); } }); }
  let heard = normAr(recTxt).split(/\s+/).map(w => w.replace(/[^ء-ي]/g, '')).filter(Boolean);
  const bis = ['بسم', 'الله', 'الرحمن', 'الرحيم']; if (heard.slice(0, 2).join() === 'بسم,الله') heard = heard.slice(4);
  if (!heard.length) { toast('Rien entendu'); return; }
  const res = alignWords(exp, heard), bad = {}, tot = {};
  res.forEach((r, k) => { const g = owner[k]; tot[g] = (tot[g] || 0) + 1; if (r === 'bad') (bad[g] = bad[g] || []).push(k); });
  let nb = 0, nok = 0; const lines = [];
  Object.keys(tot).forEach(g => { g = +g; if (bad[g] && bad[g].length > Math.max(0, 0)) { nb++; noteError(g); lines.push(`<div class="row"><span class="main"><span class="t ar">${refOf(g)}</span><span class="m ar" dir="rtl">${bad[g].map(k => esc(exp[k])).join(' · ')}</span></span></div>`); } else { nok++; noteOk(g); } });
  save();
  const o = $('#rec-out'); if (o) o.innerHTML = `<div class="note">${nb ? `${nb} verset${nb > 1 ? 's' : ''} à reprendre, ${nok} correct${nok > 1 ? 's' : ''}. Mots manqués ou différents ci-dessous (reconnaissance approximative : le tajwid n'est pas vérifié).` : 'Aucune erreur détectée sur ce passage. Belle récitation.'}</div>${nb ? `<div class="rows">${lines.join('')}</div><div class="btns" style="margin-top:10px"><button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">Test sur mes points faibles</button></div>` : ''}`;
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
  return { type: 'next', g, prompt: clip(W, 14, true), ask: 'Quel est le verset qui suit ?', opts, ref: refOf(nxt), full: Q.ayas[nxt][2] };
}
function qCloze(g) {
  const W = wordsOf(g); if (W.length < 5) return null;
  const idx = W.map((w, k) => k).filter(k => normAr(W[k]).length >= 3); if (!idx.length) return null;
  const k = idx[rnd(idx.length)], corr = W[k], nc = normAr(corr), c = Q.ayas[g][0];
  const gather = (from, to) => { const seen = new Set([nc]), out = []; for (let x = from; x <= to; x++) { if (x === g || x < first[c] || x >= first[c] + CH[c].n) continue; wordsOf(x).forEach(w => { const n = normAr(w); if (!seen.has(n) && Math.abs(n.length - nc.length) <= 2 && n.length >= 3) { seen.add(n); out.push(w); } }); } return out; };
  let cand = gather(g - 10, g + 10); if (cand.length < 3) cand = gather(first[c], first[c] + CH[c].n - 1);
  if (cand.length < 3) return null;
  const opts = shuffle([{ t: corr, ok: true }, ...sample(cand, 3).map(t => ({ t }))]);
  return { type: 'cloze', g, prompt: W.map((w, i) => i === k ? '＿＿＿＿' : w).join(' '), ask: 'Quel est le mot manquant ?', opts, ref: refOf(g), full: Q.ayas[g][2] };
}
function qSurah(g) {
  const c = Q.ayas[g][0], W = wordsOf(g); if (W.length < 3) return null;
  const others = Q.chapters.map(x => x[0]).filter(x => x !== c);
  const opts = shuffle([{ t: 'سورة ' + CH[c].ar, ok: true }, ...sample(others, 3).map(x => ({ t: 'سورة ' + CH[x].ar }))]);
  return { type: 'surah', g, prompt: clip(W, 16), ask: 'De quelle sourate vient ce verset ?', opts, ref: refOf(g), full: Q.ayas[g][2] };
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
const SCOPE_L = { weak: 'Mes points faibles', due: "Révisions du jour", all: 'Tout ce que j\'ai acquis', hizb: 'Un hizb précis' };
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
  return `<div class="hero-title">Tests</div><div class="sub">QCM générés à partir de ton propre programme : mot manquant, verset suivant, sourate d'origine. Chaque erreur est notée et te revient dans « À renforcer » et dans les séances.</div>
  <div class="kpis"><div class="kpi"><b>${val}/${mem.length}</b><span>rub' acquis validés par test</span></div><div class="kpi"><b>${w}</b><span>versets à renforcer</span></div><div class="kpi"><b>${S.tests.length}</b><span>tests passés</span></div></div>
  <label class="field"><span>Sur quoi</span><select id="qz-scope"><option value="weak">Mes points faibles (${w})</option><option value="due">Révisions du jour</option><option value="all" selected>Tout ce que j'ai acquis</option><option value="hizb">Un hizb précis</option></select></label>
  <div class="two"><label class="field"><span>Hizb (si choisi)</span><input id="qz-hizb" type="number" min="1" max="60" value="9"></label><label class="field"><span>Nombre de questions</span><select id="qz-n"><option>10</option><option>20</option><option>30</option></select></label></div>
  <button class="btn pri block" data-act="quiz-start">Commencer le test</button>
  <h2>Derniers résultats</h2><div class="rows">${last.map(t => `<div class="row"><span class="main"><span class="t lat">${t.ok} / ${t.n} · ${Math.round(100 * t.ok / t.n)} %</span><span class="m">${fmtD(t.d)} · ${SCOPE_L[t.scope] || t.scope}</span></span><span class="pill ${t.ok / t.n >= .8 ? 'mem' : 'rel'}">${t.ok / t.n >= .8 ? 'Validé' : 'À reprendre'}</span></div>`).join('') || '<div class="empty">Aucun test pour l\'instant.</div>'}</div>`;
};
views.quiz = () => {
  if (!quiz) return '<div class="empty">Aucun test en cours. <a href="#/tests">Choisir un test</a></div>';
  if (quiz.done) {
    const n = quiz.qs.length, ok = quiz.score, pct = Math.round(100 * ok / n), wrong = quiz.qs.filter(q => !q.right), seen = new Set();
    return `<div class="hero-title">${ok} / ${n}</div><div class="sub">${pct >= 80 ? 'Validé : tu connais bien ce passage.' : 'À reprendre : relis les versets ci-dessous puis refais un test.'}</div>
    <h2>${wrong.length ? 'À revoir' : 'Aucune erreur'}</h2>
    ${wrong.filter(q => !seen.has(q.g) && seen.add(q.g)).map(q => `<div class="mushaf ar" dir="rtl" style="font-size:${Math.max(22, S.settings.font - 6)}px;padding:10px 14px"><span class="surah" style="font-size:.7em">${refOf(q.g)}</span>${esc(Q.ayas[q.g][2])}</div>`).join('')}
    <div class="btns" style="margin-top:12px">${wrong.length ? '<button class="btn pri" data-act="quiz-start" data-scope="weak" data-n="10">Refaire sur mes erreurs</button>' : ''}<a class="btn" href="#/tests" style="text-decoration:none">Retour</a></div>`;
  }
  const q = quiz.qs[quiz.i], ans = quiz.ans;
  return `<div class="sess-h"><a class="btn sm" href="#/tests">←</a><div class="tt"><b>Question ${quiz.i + 1} / ${quiz.qs.length}</b><span class="sub">${esc(SCOPE_L[quiz.scope])} · ${quiz.score} bonne${quiz.score > 1 ? 's' : ''}</span></div></div>
  <div class="bar"><i style="width:${100 * quiz.i / quiz.qs.length}%"></i></div>
  <div class="sub" style="margin:10px 0 6px">${q.ask}</div>
  <div class="mushaf ar" dir="rtl" style="font-size:${S.settings.font}px;padding:12px 14px">${esc(q.prompt)}</div>
  <div class="opts">${q.opts.map((o, k) => `<button class="opt ar${ans !== undefined ? (o.ok ? ' right' : k === ans ? ' wrong' : '') : ''}" data-act="quiz-pick" data-k="${k}" ${ans !== undefined ? 'disabled' : ''} style="font-size:${Math.max(20, S.settings.font - 6)}px">${esc(o.t)}</button>`).join('')}</div>
  ${ans !== undefined ? `<div class="note">${q.opts[ans].ok ? 'Correct.' : 'Réponse : ' + esc(q.opts.find(o => o.ok).t)} · ${q.ref}<div class="ar" dir="rtl" style="margin-top:6px;font-size:${Math.max(20, S.settings.font - 6)}px;line-height:2">${esc(q.full)}</div></div><button class="btn pri block" data-act="quiz-next">${quiz.i + 1 >= quiz.qs.length ? 'Voir le résultat' : 'Question suivante'}</button>` : ''}`;
};

/* ---------- routeur ---------- */
const TABS = [['today', '☀', "Aujourd'hui"], ['map', '▦', 'Carte'], ['tests', '✓', 'Tests'], ['books', '☰', 'Livres'], ['stats', '↗', 'Stats'], ['settings', '⚙', 'Réglages']];
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, a, b, c] = h.split('/');
  closeSheet();
  const top = $('#top'), view = $('#view'), tabs = $('#tabs');
  const inSess = name === 's';
  top.innerHTML = `<span class="brand">Masari<span class="ar">مساري</span></span><span class="date">${fmtD(todayStr(), { weekday: 'short', day: 'numeric', month: 'long' })}</span>`;
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
  openSheet(`<h3 class="ar">${u.label}</h3><div class="sub">Hizb ${u.hizb} · rub' ${u.rub} · ≈ ${fmt1(u.pages)} p. · <span class="pill ${st.s}">${LBL[st.s]}</span>${st.due ? ' · prochaine révision ' + fmtD(st.due) : ''}${st.vdate ? ' · validé par test le ' + fmtD(st.vdate) : ''}</div>
  <div class="btns" style="margin:14px 0"><button class="btn pri" data-act="open" data-kind="q" data-id="${i}" data-mode="${st.s === 'mem' ? 'rev' : 'new'}">Ouvrir la séance</button></div>
  <div class="sub" style="margin-bottom:6px">Définir le statut</div>
  <div class="btns">${['mem', 'rel', 'prog', 'none'].map(s => `<button class="btn sm" data-act="set" data-id="${i}" data-s="${s}" data-scope="one">${LBL[s]}</button>`).join('')}</div>
  <div class="sub" style="margin:12px 0 6px">… pour tout le hizb ${u.hizb}</div>
  <div class="btns">${['mem', 'rel', 'prog', 'none'].map(s => `<button class="btn sm" data-act="set" data-id="${i}" data-s="${s}" data-scope="hizb">${LBL[s]}</button>`).join('')}</div>
  <div class="btns" style="margin-top:12px"><button class="btn sm" data-act="pri" data-id="${i}">${st.pri ? 'Retirer la priorité' : 'Marquer prioritaire'}</button></div>
  <div style="height:10px"></div><button class="btn block" data-act="close">Fermer</button>`);
}
function applyRange(list, s) { list.forEach((i, k) => setStatus(S.units[i], s, k)); save(); route(); toast(`${list.length} rub' → ${LBL[s]}`); }

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
      if (!qs) return toast(scope === 'weak' ? 'Aucun point faible pour l\'instant.' : 'Pas assez de versets pour ce test (marque des rub\' comme acquis).');
      quiz = { qs, i: 0, score: 0, scope, ans: undefined }; go('#/quiz'); break;
    }
    case 'quiz-pick': {
      if (!quiz || quiz.ans !== undefined) return; const k = +d.k, q = quiz.qs[quiz.i]; quiz.ans = k; q.right = !!q.opts[k].ok;
      if (q.right) { quiz.score++; noteOk(q.g); } else noteError(q.g);
      save(); $('#view').innerHTML = views.quiz(); break;
    }
    case 'quiz-next': quiz.i++; quiz.ans = undefined; if (quiz.i >= quiz.qs.length) finishQuiz(); $('#view').innerHTML = views.quiz(); window.scrollTo(0, 0); break;
    case 'pri': { const u = S.units[+d.id]; u.pri = u.pri ? 0 : 1; save(); closeSheet(); route(); toast(u.pri ? 'Prioritaire' : 'Priorité retirée'); break; }
    case 'set': {
      const i = +d.id, list = d.scope === 'hizb' ? [0, 1, 2, 3].map(k => (i >> 2) * 4 + k) : [i];
      applyRange(list, d.s); break;
    }
    case 'range-hizb': {
      let a = +$('#rg-from').value, b = +$('#rg-to').value; if (!(a >= 1 && b >= 1)) return toast('Indique deux numéros de hizb.');
      if (a > b) [a, b] = [b, a]; a = Math.max(1, a); b = Math.min(60, b);
      applyRange([...Array((b - a + 1) * 4).keys()].map(k => (a - 1) * 4 + k), $('#rg-status').value); break;
    }
    case 'range-surah': applyRange(unitsInRange(...chRange(+$('#rg-surah').value)), $('#rg-status').value); break;
    case 'recite': reciteStart(); break;
    case 'reveal': if (el.classList.contains('hid') && el.dataset.g) sessState.rev[el.dataset.g] = (sessState.rev[el.dataset.g] || 0) + 1; el.classList.toggle('hid'); break;
    case 'level': sessState.level = +d.l; { const keep = sessState.reps; const [, , a, b, c] = location.hash.split('/'); $('#view').innerHTML = views.session(a, b, c); sessState.reps = keep; } break;
    case 'showall': document.querySelectorAll('.w.hid').forEach(w => w.classList.remove('hid')); break;
    case 'rep-plus': case 'rep-minus': {
      sessState.reps = Math.max(0, (sessState.reps || 0) + (act === 'rep-plus' ? 1 : -1)); $('#rep-n').textContent = sessState.reps;
      if (act === 'rep-plus') { logOf(t).reps = (logOf(t).reps || 0) + 1; save(); if (sessState.reps === S.settings.rep) toast('Objectif de répétitions atteint'); } break;
    }
    case 'grade': {
      const [, , kind, id, mode] = location.hash.split('/'), it = getItem(kind, id), st = it.st, L = logOf(t), tag = kind === 'q' ? +id : id;
      const note = $('#note'); if (note) st.note = note.value;
      const push = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
      if (mode === 'rev') { gradeItem(st, d.g, t); push(kind === 'q' ? L.rev : L.brev, tag); toast(d.g === 'hard' ? 'À revoir demain' : 'Prochaine révision le ' + fmtD(st.due)); }
      else if (d.g === 'learned') { markLearned(st, t); push(kind === 'q' ? L.new : L.bnew, tag); toast('Enregistré. Première révision demain.'); }
      else if (d.g === 'prog') { if (st.s === 'none') st.s = 'prog'; toast('Gardé en cours'); }
      else { toast('Pas de souci, ça reste prévu.'); }
      if (kind === 'q') commitErrors(+id);
      save();
      const nx = (mode === 'rev' || d.g === 'learned') ? nextAfter(kind, mode) : '#/today';
      sessState.lastKey = ''; go(nx); break;
    }
    case 'book-new': openSheet(`<h3>Nouveau livre ou matn</h3>
      <label class="field"><span>Titre</span><input type="text" id="bk-title"></label>
      <div class="two"><label class="field"><span>Type</span><select id="bk-kind"><option value="matn">Matn à mémoriser</option><option value="livre">Livre à lire</option></select></label><label class="field"><span>Terminer le</span><input type="date" id="bk-end" value="${addMonths(todayStr(), 3)}"></label></div>
      <label class="field"><span>Découpage</span><select id="bk-split"><option value="4">4 lignes par partie</option><option value="2">2 lignes par partie</option><option value="8">8 lignes par partie</option><option value="blank">Une partie par paragraphe (ligne vide)</option></select></label>
      <label class="field"><span>Texte</span><textarea id="bk-text" dir="auto" placeholder="Colle le texte ici, un vers ou une phrase par ligne"></textarea></label>
      <div class="btns"><button class="btn pri" data-act="book-save">Créer</button><button class="btn" data-act="close">Annuler</button></div>`); break;
    case 'book-save': {
      const title = $('#bk-title').value.trim(), raw = $('#bk-text').value.replace(/\r/g, '').trim(), sp = $('#bk-split').value;
      if (!title || !raw) return toast('Titre et texte sont nécessaires.');
      let parts;
      if (sp === 'blank') parts = raw.split(/\n\s*\n/).map(p => p.split('\n').map(l => l.trim()).filter(Boolean)).filter(p => p.length);
      else { const lines = raw.split('\n').map(l => l.trim()).filter(Boolean), n = +sp; parts = []; for (let i = 0; i < lines.length; i += n) parts.push(lines.slice(i, i + n)); }
      const id = 'k' + Date.now().toString(36);
      S.books.push({ id, title, kind: $('#bk-kind').value, end: $('#bk-end').value || addMonths(todayStr(), 3), portions: parts.map(lines => ({ lines, ...blank() })) });
      save(); closeSheet(); go('#/book/' + id); toast(parts.length + ' parties créées'); break;
    }
    case 'book-del': if (confirm('Supprimer ce livre et sa progression ?')) { S.books = S.books.filter(b => b.id !== d.id); save(); go('#/books'); } break;
    case 'notif':
      if (!('Notification' in window)) return toast('Notifications non prises en charge ici.');
      Notification.requestPermission().then(p => toast(p === 'granted' ? 'Notifications activées' : 'Notifications refusées')); break;
    case 'ics': downloadICS(); break;
    case 'gh-conn': gh.repo = $('#gh-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''); gh.token = $('#gh-token').value.trim(); ghSave();
      if (!ghReady()) return toast('Indique le dépôt et le jeton.');
      ghStatus('Test en cours…'); ghRemote().then(r => r.data ? ghPull(false) : ghPush(true)).catch(e => ghStatus('Échec : ' + e.message)); break;
    case 'gh-push': ghPush(true); break;
    case 'gh-pull': ghPull(false); break;
    case 'export': download(`masari-sauvegarde-${t}.json`, JSON.stringify(S), 'application/json'); break;
    case 'reset': if (confirm('Effacer toutes les données de Masari sur cet appareil ?')) { localStorage.removeItem(KEY); load(); go('#/today'); } break;
  }
});
document.addEventListener('change', e => {
  const id = e.target.id, v = e.target.value, s = S.settings;
  if (id === 'imp') {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const o = JSON.parse(r.result); if (!o.units || o.units.length !== NQ) throw 0; S = o; ensure(); save(); go('#/today'); toast('Sauvegarde importée'); } catch (x) { toast('Fichier invalide.'); } };
    r.readAsText(f); return;
  }
  const map = { 'st-start': () => s.start = v, 'st-end': () => s.end = v, 'st-cap': () => s.reviewCap = Math.max(1, +v || 8), 'st-rep': () => s.rep = Math.max(1, +v || 20), 'st-bcap': () => s.bookCap = Math.max(0, +v || 0), 'st-font': () => s.font = Math.min(56, Math.max(20, +v || 30)), 'st-t0': () => s.times[0] = v, 'st-t1': () => s.times[1] = v };
  if (map[id]) { map[id](); save(); toast('Enregistré'); }
});
document.addEventListener('input', e => { if (e.target.id === 'note') { const [, , kind, id] = location.hash.split('/'); if (kind === 'b') { const it = getItem(kind, id); it.st.note = e.target.value; save(); } } });

function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
function downloadICS() {
  const s = S.settings, start = s.start.replace(/-/g, ''), until = s.end.replace(/-/g, '') + 'T235900', now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const names = ['Masari : mémoriser', 'Masari : réviser'], L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Masari//FR', 'CALSCALE:GREGORIAN'];
  s.times.forEach((tm, k) => {
    const [h, m] = tm.split(':').map(Number), e = h * 60 + m + 30, eh = Math.floor(e / 60) % 24, em = e % 60;
    L.push('BEGIN:VEVENT', `UID:masari-${k}-${start}@local`, `DTSTAMP:${now}`, `DTSTART:${start}T${pad(h)}${pad(m)}00`, `DTEND:${start}T${pad(eh)}${pad(em)}00`, `RRULE:FREQ=DAILY;UNTIL=${until}`, `SUMMARY:${names[k]}`, 'BEGIN:VALARM', 'TRIGGER:PT0S', 'ACTION:DISPLAY', 'DESCRIPTION:Masari', 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR'); download('masari-rappels.ics', L.join('\r\n'), 'text/calendar'); toast('Importe ce fichier dans ton agenda');
}

/* ---------- notifications (si l'app est ouverte) ---------- */
setInterval(() => {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !S) return;
  const n = new Date(), hm = `${pad(n.getHours())}:${pad(n.getMinutes())}`, t = todayStr();
  S.settings.times.forEach((tm, k) => {
    const key = t + k; if (tm !== hm || S.fired[key]) return; S.fired[key] = 1; save();
    const P = plan(), body = k === 0 ? `${P.newList.length} à mémoriser aujourd'hui` : `${P.revList.length} révision${P.revList.length > 1 ? 's' : ''} à faire`;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('Masari', { body, tag: 'masari' + k })).catch(() => new Notification('Masari', { body }));
    else new Notification('Masari', { body });
  });
}, 30000);

/* ---------- démarrage ---------- */
load();
window.addEventListener('hashchange', route);
route();
ghPull(true);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
