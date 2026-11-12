const tabs=await (await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/',{method:'PUT'})).json();
const ws=new WebSocket(tabs.webSocketDebuggerUrl);
let id=0;const pending=new Map();
const send=(m,p={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
await send('Page.enable');
const expr=`(()=>{
  const b=el=>{const r=el.getBoundingClientRect();return {t:+r.top.toFixed(1),b:+r.bottom.toFixed(1),l:+r.left.toFixed(1),r:+r.right.toFixed(1)}};
  const links=document.querySelector('.v0-links');
  const items=[...document.querySelectorAll('.v0-stack__item')];
  const marks=items.map(i=>b(i.querySelector('svg')));
  const lb=b(links);
  // horizontal overlap test: does any icon's x-range intersect the links' x-range AND y-range?
  const bad=marks.map((m,i)=>({i,...m,vOverlap: !(m.b<=lb.t||m.t>=lb.b), hOverlap: !(m.r<=lb.l||m.l>=lb.r)}))
                 .filter(o=>o.vOverlap&&o.hOverlap);
  return JSON.stringify({vw:innerWidth, links:lb, icon1:marks[0], iconLast:marks[marks.length-1], colliding:bad},null,1);
})()`;
for (const [w,h] of [[1440,900],[1024,768],[820,700],[768,800],[600,800],[390,844]]) {
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<900});
  await new Promise(r=>setTimeout(r,2500));
  const res=await send('Runtime.evaluate',{expression:expr,returnByValue:true});
  const o=JSON.parse(res.result.value);
  console.log(`\n=== ${w}x${h} === links x ${o.links.l}->${o.links.r}, y ${o.links.t}->${o.links.b}`);
  console.log(`  icons x ${o.icon1.l}->${o.iconLast.r}, y ${o.icon1.t}`);
  console.log(`  COLLIDING ICONS: ${o.colliding.length? JSON.stringify(o.colliding) : 'none'}`);
}
ws.close();
