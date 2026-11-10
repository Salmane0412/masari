/* مساري — قفل التطبيق برمز سري (PIN) على هذا الجهاز. الرمز لا يُحفظ، بل بصمته (PBKDF2-SHA256). */
(function () {
  'use strict';
  const K = 'masari.pin', ITER = 150000;
  const get = () => { try { return JSON.parse(localStorage.getItem(K)); } catch (e) { return null; } };
  const put = o => { try { o ? localStorage.setItem(K, JSON.stringify(o)) : localStorage.removeItem(K); } catch (e) { } };
  const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
  async function derive(pin, salt, iter) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: iter }, k, 256));
  }
  async function check(pin) { const c = get(); return !!c && (await derive(pin, c.salt, c.iter)) === c.hash; }
  async function setPin(pin, auto) { const salt = hex(crypto.getRandomValues(new Uint8Array(16))); put({ salt, iter: ITER, hash: await derive(pin, salt, ITER), auto: auto === undefined ? 1 : auto, fails: 0, until: 0 }); }

  let el = null, entry = '', hiddenAt = 0;
  function show() {
    if (!get() || el) return;
    el = document.createElement('div'); el.id = 'pinlock'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    document.body.appendChild(el); document.documentElement.classList.add('locked'); paint('');
  }
  function paint(msg) {
    if (!el) return; const c = get() || {}, wait = Math.max(0, Math.ceil(((c.until || 0) - Date.now()) / 1000));
    el.innerHTML = `<div class="pl-in"><div class="pl-logo">مساري</div><div class="pl-t">أدخل الرمز السري</div>
      <div class="pl-dots" aria-live="polite">${Array.from({ length: Math.max(4, entry.length) }, (_, i) => `<i class="${i < entry.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="pl-msg">${wait ? `محاولات كثيرة: انتظر ${wait} ثانية` : msg || '&nbsp;'}</div>
      <div class="pl-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'del', 0, 'ok'].map(k => `<button data-pl="${k}" aria-label="${k === 'del' ? 'مسح' : k === 'ok' ? 'دخول' : k}"${wait ? ' disabled' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>
      <button class="pl-forgot" data-pl="forgot">نسيت الرمز</button></div>`;
    if (wait) setTimeout(() => paint(''), 1000);
  }
  async function submit() {
    if (entry.length < 4) return paint('الرمز من 4 أرقام على الأقل');
    const ok = await check(entry), c = get();
    if (ok) { c.fails = 0; c.until = 0; put(c); entry = ''; el.remove(); el = null; document.documentElement.classList.remove('locked'); return; }
    c.fails = (c.fails || 0) + 1; if (c.fails >= 5) c.until = Date.now() + Math.min(3600, 30 * 2 ** (c.fails - 5)) * 1000; put(c);
    entry = ''; paint('رمز خاطئ'); try { navigator.vibrate && navigator.vibrate(120); } catch (e) { }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]'); if (!b || !el) return; const k = b.dataset.pl;
    if (k === 'del') { entry = entry.slice(0, -1); paint(''); }
    else if (k === 'ok') submit();
    else if (k === 'forgot') { if (confirm('لا يمكن استرجاع الرمز. البديل الوحيد: مسح كل بيانات مساري من هذا الجهاز (ثم استرجاعها من مستودعك على GitHub إن كانت المزامنة مفعّلة). هل تريد المسح؟') && confirm('تأكيد أخير: مسح بيانات هذا الجهاز نهائيًا؟')) { localStorage.clear(); location.reload(); } }
    else if (entry.length < 8) { entry += k; paint(''); if (entry.length >= 4 && get() && entry.length === (get().len || 0)) submit(); }
  }, true);
  document.addEventListener('keydown', e => { if (!el) return; if (/^\d$/.test(e.key) && entry.length < 8) { entry += e.key; paint(''); } else if (e.key === 'Backspace') { entry = entry.slice(0, -1); paint(''); } else if (e.key === 'Enter') submit(); }, true);
  document.addEventListener('visibilitychange', () => { const c = get(); if (!c) return; if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt >= (c.auto || 0) * 60000) show(); });
  show();

  // صفحة الإعداد
  window.PIN = { get, check, setPin, clear: () => put(null), lock: show };
  window.addEventListener('DOMContentLoaded', () => {});
})();
