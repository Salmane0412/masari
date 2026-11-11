const q = new URLSearchParams(location.search), r = q.get('r'), d = q.get('d');
const T = { banned: ['⛔ موقع محظور نهائيًا', 'اخترتَ حظره بلا استثناء. وقتك أثمن منه.'], until: ['📖 محجوب حتى تُنهي مهام اليوم', 'أنهِ حفظ اليوم واختباره في مساري فيُفتح تلقائيًا، أو أدخل رمز اليوم.'], budget: ['⏱ انتهى وقتك اليوم لهذا الموقع', 'يعود غدًا بإذن الله.'] }[r] || ['محجوب', ''];
document.getElementById('t').textContent = T[0]; document.getElementById('m').textContent = (d ? d + ' — ' : '') + T[1];
if (r !== 'until') document.getElementById('unl').style.display = 'none';
document.getElementById('go').onclick = () => chrome.runtime.sendMessage({ cmd: 'unlock', code: document.getElementById('code').value }, res => {
  if (res && res.ok) { document.getElementById('res').textContent = 'فُتح لهذا اليوم ✓'; setTimeout(() => history.length > 1 ? history.back() : location.replace('https://' + d), 600); }
  else document.getElementById('res').textContent = 'رمز غير صحيح';
});
