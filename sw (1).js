// গণনা খাতা – অফলাইনে খোলা + WhatsApp থেকে শেয়ার করা সিমের ছবি গ্রহণ
const C='bk-v3';
const FILES=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='sim-share').map(x=>caches.delete(x)))));self.clients.claim()});
// নতুন সংস্করণ এলে খোলা পাতাকে জানানো (পাতা তৈরি হতে একটু সময় লাগে, তাই কয়েকবার চেষ্টা)
async function tell(id){for(let i=0;i<12;i++){const w=id?await self.clients.get(id):null;const all=await self.clients.matchAll({type:'window'});const L=w?[w]:all;if(L.length){L.forEach(x=>x.postMessage({t:'gk-update'}));if(w)return}await new Promise(r=>setTimeout(r,500))}}
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  // শেয়ার করা ছবি: ফোনেই সাময়িক রাখা হয়, তারপর অ্যাপের সিম গণনা পাতা খোলে
  if(r.method==='POST'&&u.origin===location.origin&&u.pathname==='/share-sim'){
    e.respondWith((async()=>{
      try{
        const fd=await r.formData();const files=fd.getAll('photos').filter(f=>f&&f.size);
        await caches.delete('sim-share');const c=await caches.open('sim-share');
        let i=0;for(const f of files.slice(0,60)){await c.put('/sim-share/'+(i++),new Response(f,{headers:{'Content-Type':f.type||'image/jpeg'}}))}
      }catch(x){}
      return Response.redirect('/?simshare=1',303);
    })());
    return;
  }
  if(r.method!=='GET'||u.origin!==location.origin)return; // Firebase/Google নিজের মতো চলবে
  // দ্রুত খোলা: আগে ফোনে রাখা কপি সাথে সাথে দেখানো হয়, পেছনে নতুন কপি নামিয়ে রাখা হয়
  const isPage=r.mode==='navigate'||u.pathname==='/'||u.pathname.endsWith('.html');
  if(isPage){
    e.respondWith((async()=>{
      const c=await caches.open(C),key=u.pathname.endsWith('.html')?r:'/',old=await c.match(key)||await c.match('/'),oldT=old?await old.clone().text().catch(()=>null):null;
      const net=fetch(r,{cache:'no-cache'}).then(async res=>{
        if(res&&res.ok){const t=await res.clone().text();let changed=false;
          if(oldT!==null)changed=oldT!==t;
          await c.put(key,new Response(t,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
          if(changed)await tell(e.resultingClientId||e.clientId)}
        return res}).catch(()=>null);
      if(old){e.waitUntil(net);return old}
      return (await net)||new Response('অফলাইন',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    })());
    return;
  }
  e.respondWith(caches.open(C).then(async c=>{const m=await c.match(r);const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>null);if(m){e.waitUntil(net);return m}return (await net)||caches.match('/')}));
});
