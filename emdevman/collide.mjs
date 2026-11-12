const tabs=await (await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/',{method:'PUT'})).json();
const ws=new WebSocket(tabs.webSocketDebuggerUrl);
let id=0;const pending=new Map();
const send=(m,p={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
await send('Page.enable');
const expr=`(()=>{
  const b=el=>{const r=el.getBoundingClientRect();return {t:+r.top.toFixed(1),b:+r.bottom.toFixed(1)}};
  const links=document.querySelector('.v0-links'), stack=document.querySelector('.v0-stack'), sign=document.querySelector('.v0-sign');
  const L=b(links), S=b(stack), G=b(sign);
  return JSON.stringify({linksBottom:L.b, iconsTop:S.t, signTop:G.t,
    gap:+(S.t-L.b).toFixed(1), overlap: S.t<L.b});
})()`;
for (const [w,h] of [[1440,900],[1440,760],[1440,700],[1280,700],[1024,700],[1024,600],[820,700],[390,844],[390,700]]) {
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<900});
  await new Promise(r=>setTimeout(r,2200));
  const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true});
  const o=JSON.parse(r.result.value);
  console.log(`${String(w)+'x'+h}`.padEnd(10), 'linksB='+String(o.linksBottom).padEnd(8), 'iconsT='+String(o.iconsTop).padEnd(8), 'gap='+String(o.gap).padEnd(9), o.overlap? '*** OVERLAP ***':'ok');
}
ws.close();
