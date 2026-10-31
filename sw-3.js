// গণনা খাতা – অফলাইনে খোলা + WhatsApp থেকে শেয়ার করা সিমের ছবি গ্রহণ
const C='bk-v2';
const FILES=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='sim-share').map(x=>caches.delete(x)))));self.clients.claim()});
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
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));
});
