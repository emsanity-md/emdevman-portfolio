const tabs=await (await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/',{method:'PUT'})).json();
const ws=new WebSocket(tabs.webSocketDebuggerUrl);
let id=0;const pending=new Map();
const send=(m,p={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
await send('Page.enable');
const expr=`(()=>{
  const q=s=>document.querySelector(s);
  const links=q('.v0-links'), stack=q('.v0-stack'), col=q('.v0-column'), sign=q('.v0-sign'), bar=q('.v0-bar');
  if(!links||!stack) return JSON.stringify({err:'missing'});
  const b=el=>{const r=el.getBoundingClientRect();return {t:+r.top.toFixed(1),b:+r.bottom.toFixed(1),l:+r.left.toFixed(1),r:+r.right.toFixed(1),h:+r.height.toFixed(1)}};
  const L=b(links), S=b(stack);
  return JSON.stringify({
    vw:innerWidth, vh:innerHeight,
    links:L, stack:S,
    verticalGap:+(S.t-L.b).toFixed(1),
    overlap: S.t < L.b,
    overlapPx: S.t < L.b ? +(L.b-S.t).toFixed(1) : 0,
    column:b(col), sign:b(sign), bar:b(bar),
  },null,1);
})()`;
for (const [w,h] of [[1440,900],[1280,800],[1180,820],[1024,768],[960,700],[900,700]]) {
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
  await new Promise(r=>setTimeout(r,2500));
  const res=await send('Runtime.evaluate',{expression:expr,returnByValue:true});
  const o=JSON.parse(res.result.value);
  console.log(`\n=== ${w}x${h} ===`);
  console.log(`  links  y ${o.links.t} -> ${o.links.b}`);
  console.log(`  icons  y ${o.stack.t} -> ${o.stack.b}`);
  console.log(`  VERTICAL GAP: ${o.verticalGap}px  ${o.overlap?'*** OVERLAP '+o.overlapPx+'px ***':'ok'}`);
}
ws.close();
