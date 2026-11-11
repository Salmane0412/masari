// Masari Guard — mêmes règles que le téléphone : bannis toujours, « jusqu'à la fin des tâches », budget de temps.
// Tout renforcement s'applique tout de suite ; tout assouplissement attend 24 h (ou le code du partenaire).
const PRESET = {
  banned: ['tiktok.com', 'instagram.com', 'reddit.com', 'x.com', 'twitter.com', 'facebook.com', 'snapchat.com', 'threads.net'],
  until: ['youtube.com', 'youtu.be', 'netflix.com', 'twitch.tv', 'primevideo.com', 'disneyplus.com'],
  budgets: { 'web.telegram.org': 20 }
};
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const get = () => chrome.storage.local.get(null);
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32dec(s) { let bits = ''; for (const c of (s || '').replace(/[=\s]/g, '').toUpperCase()) { const v = B32.indexOf(c); if (v >= 0) bits += v.toString(2).padStart(5, '0'); } const o = []; for (let i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(o); }
async function hmac(alg, key, msg) { const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: alg }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, msg)); }
async function dailyCode(secret, day) { const s = await hmac('SHA-256', b32dec(secret), new TextEncoder().encode('masari:' + day)); return String(((s[0] & 0x7f) << 24 | s[1] << 16 | s[2] << 8 | s[3]) % 1000000).padStart(6, '0'); }
async function totp(secret, step) { const m = new Uint8Array(8); let x = step; for (let i = 7; i >= 0; i--) { m[i] = x & 0xff; x = Math.floor(x / 256); } const h = await hmac('SHA-1', b32dec(secret), m); const o = h[h.length - 1] & 0xf; return String(((h[o] & 0x7f) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1000000).padStart(6, '0'); }
async function verifySelf(st, code) { return !!st.secret && (await dailyCode(st.secret, today())) === String(code).trim(); }
async function verifyPartner(st, code) { if (!st.partner) return false; const n = Math.floor(Date.now() / 30000); for (let d = -3; d <= 3; d++) if ((await totp(st.partner, n + d)) === String(code).trim()) return true; return false; }
const setupOpen = st => Date.now() - (st.installedAt || 0) < 30 * 60000;

function strengthen(cur, nw) {
  const U = (a, b) => [...new Set([...(a || []), ...(b || [])])];
  const budgets = { ...(nw.budgets || {}) };
  for (const [k, v] of Object.entries(cur.budgets || {})) budgets[k] = budgets[k] === undefined ? v : Math.min(v, budgets[k]);
  return { banned: U(cur.banned, nw.banned), until: U(cur.until, nw.until), budgets };
}
const same = (a, b) => JSON.stringify([[...a.banned].sort(), [...a.until].sort(), Object.entries(a.budgets).sort()]) === JSON.stringify([[...b.banned].sort(), [...b.until].sort(), Object.entries(b.budgets).sort()]);

async function applyRules() {
  const st = await get(), t = today(), usage = st.usage && st.usage.d === t ? st.usage.m : {};
  if (st.pending && Date.now() >= st.pending.at) { await chrome.storage.local.set({ cfg: st.pending.cfg, pending: null }); return applyRules(); }
  const cfg = st.cfg || PRESET, unlocked = st.unlocked === t || (st.emergencyUntil || 0) > Date.now();
  const block = [...cfg.banned.map(d => [d, 'banned']), ...(unlocked ? [] : cfg.until.map(d => [d, 'until'])),
    ...Object.entries(cfg.budgets).filter(([d, m]) => (usage[d] || 0) >= m).map(([d]) => [d, 'budget'])];
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map(r => r.id),
    addRules: block.map(([d, why], i) => ({ id: i + 1, priority: 1, condition: { requestDomains: [d], resourceTypes: ['main_frame', 'sub_frame'] },
      action: { type: 'redirect', redirect: { extensionPath: `/blocked.html?r=${why}&d=${encodeURIComponent(d)}` } } })) });
}

chrome.runtime.onInstalled.addListener(async () => { const st = await get(); if (!st.installedAt) await chrome.storage.local.set({ installedAt: Date.now(), cfg: PRESET }); chrome.alarms.create('tick', { periodInMinutes: 1 }); applyRules(); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('tick', { periodInMinutes: 1 }); applyRules(); });
chrome.alarms.onAlarm.addListener(async () => {
  const st = await get(), t = today(), cfg = st.cfg || PRESET;
  const usage = st.usage && st.usage.d === t ? st.usage : { d: t, m: {} };
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  try { const win = tab && await chrome.windows.get(tab.windowId); if (tab && tab.url && win.focused) { const h = new URL(tab.url).hostname.replace(/^www\./, ''); for (const d of Object.keys(cfg.budgets)) if (h === d || h.endsWith('.' + d)) usage.m[d] = (usage.m[d] || 0) + 1; } } catch (e) { }
  await chrome.storage.local.set({ usage }); applyRules();
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    const st = await get(), t = today();
    if (msg.cmd === 'state') return reply({ ...st, partner: !!st.partner, secret: !!st.secret, setup: setupOpen(st), today: t });
    if (msg.cmd === 'unlock') {
      if (await verifySelf(st, msg.code) || await verifyPartner(st, msg.code)) { await chrome.storage.local.set({ unlocked: t }); await applyRules(); return reply({ ok: true }); }
      return reply({ ok: false });
    }
    if (msg.cmd === 'daydone') { if (await verifySelf(st, msg.code)) { await chrome.storage.local.set({ unlocked: t }); await applyRules(); } return reply({}); }
    if (msg.cmd === 'secret') { if (!st.secret || setupOpen(st)) await chrome.storage.local.set({ secret: msg.s }); return reply({}); }
    if (msg.cmd === 'partner') { if (!st.partner || setupOpen(st)) { await chrome.storage.local.set({ partner: msg.s.replace(/\s/g, '').toUpperCase() }); return reply({ ok: true }); } return reply({ ok: false }); }
    if (msg.cmd === 'save') {
      const cur = st.cfg || PRESET, nw = msg.cfg, strong = strengthen(cur, nw);
      if (same(strong, nw) || setupOpen(st) || (msg.code && await verifyPartner(st, msg.code))) { await chrome.storage.local.set({ cfg: nw, pending: null }); await applyRules(); return reply({ r: 'applied' }); }
      await chrome.storage.local.set({ cfg: strong, pending: { cfg: nw, at: Date.now() + 864e5 } }); await applyRules(); return reply({ r: 'pending' });
    }
    if (msg.cmd === 'cancel') { await chrome.storage.local.set({ pending: null }); return reply({}); }
  })();
  return true;
});
