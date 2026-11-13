const V='masari-v30';
const SHELL=['./','index.html','style.css','app.js','prog.js','gym.js','gymui.js','reco.js','recoui.js','studyui.js','careerui.js','icons.js','pinlock.js','fin.js','finui.js','tasks.js','tasksui.js','hifzui.js','prayer.js','prayerui.js','phoneui.js','ideas.js','data.js','tajweed.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// شبكة أولًا (لتصل التحديثات فورًا) ثم الذاكرة عند انقطاع الاتصال
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url), ok=u.origin===location.origin||/fonts\.(googleapis|gstatic)\.com/.test(u.host);
  if(!ok)return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request).then(h=>h||caches.match('index.html'))));
});
