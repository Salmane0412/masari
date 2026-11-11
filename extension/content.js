// Relie le site Masari à l'extension : clé du code du jour et fin des tâches (le code est vérifié par l'extension).
window.addEventListener('message', e => {
  if (e.source !== window || !e.data || !e.data.masari) return;
  if (e.data.masari === 'secret') chrome.runtime.sendMessage({ cmd: 'secret', s: e.data.s });
  if (e.data.masari === 'daydone') chrome.runtime.sendMessage({ cmd: 'daydone', code: e.data.code });
});
window.postMessage({ masariGuard: true }, '*');
