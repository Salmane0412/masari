// Récitation parfaite de tout le Coran en graphie « entendue » (alif suscrit retiré) : doit donner 0 fausse alerte. Serveur: python3 -m http.server 8765
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{
 const heardW=t=>normAr(t.replace(/ٰ/g,'')).replace(/[^ء-ي]/g,'');
 let bad=0,tot=0,ex={};
 for(let c=1;c<=114;c++){ const exp=[],hw=[],own=[];
  Q.ayas.forEach((a,g)=>{ if(a[0]!==c) return; let ws=wordsOf(g); if(a[1]===1&&c!==1&&c!==9) ws=ws.slice(BISM_TOKENS); ws.forEach(w=>{const n=normW(w); if(!n) return; exp.push(n); own.push(g); const h=heardW(w); if(h) hw.push(h);}); });
  const r=followEval(exp,hw,0,own); tot+=exp.length; r.st.forEach((s,k)=>{ if(s==='bad'){bad++; ex[exp[k]]=(ex[exp[k]]||0)+1;} }); }
 return {tot,bad,top:Object.entries(ex).sort((a,b)=>b[1]-a[1]).slice(0,12)};});
console.log(JSON.stringify(r));await b.close()})()
