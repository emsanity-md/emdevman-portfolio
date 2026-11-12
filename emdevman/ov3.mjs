const tabs=await (await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/',{method:'PUT'})).json();
const ws=new WebSocket(tabs.webSocketDebuggerUrl);
let id=0;const pending=new Map();
const send=(m,p={})=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await new Promise(r=>setTimeout(r,5000));
const expr=`(()=>{
  const q=s=>document.querySelector(s);
  const sign=q('.v0-sign'), col=q('.v0-column'), stack=q('.v0-stack');
  const cs=el=>{const c=getComputedStyle(el);return {pos:c.position,top:c.top,left:c.left,z:c.zIndex,op:c.opacity,visible:c.visibility,ml:c.marginLeft,transform:c.transform,blend:c.mixBlendMode,color:c.color,bottom:c.bottom}};
  // What is actually painted at the centre of an icon? Use elementFromPoint.
  const svg=stack.querySelector('svg');
  const r=svg.getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  const hit=document.elementFromPoint(cx,cy);
  return JSON.stringify({
    vh:innerHeight,
    sign:cs(sign), col:cs(col), stack:cs(stack),
    signRect:{t:+sign.getBoundingClientRect().top.toFixed(1),b:+sign.getBoundingClientRect().bottom.toFixed(1)},
    iconCentre:{x:+cx.toFixed(1),y:+cy.toFixed(1)},
    elementAtIconCentre: hit ? (hit.tagName+'.'+(hit.className.baseVal??hit.className)) : 'null',
    iconIsTopmost: hit ? (hit===svg || svg.contains(hit)) : false,
  },null,1);
})()`;
const res=await send('Runtime.evaluate',{expression:expr,returnByValue:true});
console.log(res.result.value);
ws.close();
