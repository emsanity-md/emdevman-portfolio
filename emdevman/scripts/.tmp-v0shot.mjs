import { writeFileSync } from "node:fs";

const [w, h, out] = [900, 700, process.argv[2] ?? "shot.png"];
const tabs = await (
  await fetch("http://127.0.0.1:9222/json/new?http://localhost:3000/", {
    method: "PUT",
  })
).json();
const ws = new WebSocket(tabs.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (m, p = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(process.argv[3] ?? 1440),
  height: Number(process.argv[4] ?? 700),
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://localhost:3000/" });
await new Promise((r) => setTimeout(r, 4000));
const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("wrote", out);
ws.close();
