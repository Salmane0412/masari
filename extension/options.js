const $ = id => document.getElementById(id), send = m => new Promise(r => chrome.runtime.sendMessage(m, r));
async function load() {
  const s = await send({ cmd: 'state' }), c = s.cfg || { banned: [], until: [], budgets: {} };
  $('banned').value = c.banned.join('\n'); $('until').value = c.until.join('\n'); $('budgets').value = Object.entries(c.budgets).map(([d, m]) => d + '=' + m).join('\n');
  $('st').textContent = [s.unlocked === s.today ? '✅ مفتوح اليوم' : '🔒 محجوب حتى إنهاء المهام', s.secret ? 'مربوط بمساري' : 'افتح مساري مرة لربط رمز اليوم', s.partner ? 'الشريك مربوط' : 'الشريك غير مربوط', s.setup ? '🟢 نافذة الإعداد مفتوحة' : '', s.pending ? '⏳ تخفيف منتظر' : ''].filter(Boolean).join(' · ');
}
const lines = id => $(id).value.split(/\s+/).map(x => x.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')).filter(x => x.includes('.'));
$('save').onclick = async () => {
  const budgets = {}; $('budgets').value.split('\n').forEach(l => { const [d, m] = l.split('='); if (d && d.includes('.') && +m >= 0) budgets[d.trim().toLowerCase()] = +m; });
  const r = await send({ cmd: 'save', cfg: { banned: lines('banned'), until: lines('until'), budgets }, code: $('pcode').value });
  $('res').textContent = r.r === 'applied' ? 'حُفظ وطُبّق' : 'طُبّق التشديد فورًا، والتخفيف بعد 24 ساعة'; load();
};
$('cancel').onclick = async () => { await send({ cmd: 'cancel' }); load(); };
$('savepk').onclick = async () => { const r = await send({ cmd: 'partner', s: $('pk').value }); $('res').textContent = r.ok ? 'حُفظ مفتاح الشريك' : 'مفتاح الشريك موجود (يُغيَّر في نافذة الإعداد فقط)'; $('pk').value = ''; load(); };
load();
