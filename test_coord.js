// 坐标系转换测试：从实际 index.html 中抽取转换函数并验证
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf-8");
// 抽取 <script> 主脚本块（第 2 个 script），再从中定位坐标转换函数段
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const src = scripts.length >= 2 ? scripts[1][1] : html;

const start = src.indexOf("const GEO_PI");
const end = src.indexOf("/* 地图服务");
if (start < 0 || end < 0) { console.error("未找到转换函数段"); process.exit(1); }
const code = src.slice(start, end);

// 用 vm 在干净上下文执行
const vm = require("vm");
const ctx = { Math };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const { wgs84ToGcj02, gcj02ToWgs84, bd09ToGcj02, gcj02ToBd09, bd09ToWgs84, toWgs84 } = ctx;
let pass = 0, fail = 0;
function eq(name, a, b, tol) {
  const ok = Math.abs(a - b) <= (tol == null ? 1e-8 : tol);
  if (ok) pass++; else { fail++; console.log(`  ✗ ${name}: ${a} vs ${b}`); }
}
function close(name, a, b, tol) { eq(name, a, b, tol); }

// 1) WGS84 <-> GCJ-02 往返（单次逆变换近似，误差约 1e-4° ≈ 10m，符合行业通行精度）
for (const [lat, lng] of [[39.9087, 116.3975], [31.2304, 121.4737], [22.5431, 114.0579], [34.3416, 108.9398]]) {
  const g = wgs84ToGcj02(lat, lng);
  const back = gcj02ToWgs84(g.lat, g.lng);
  close(`gcj02 roundtrip lat@${lat}`, back.lat, lat, 2e-4);
  close(`gcj02 roundtrip lng@${lng}`, back.lng, lng, 2e-4);
}
// 2) 境外点不偏移
const abr = wgs84ToGcj02(40.7128, -74.0060); // 纽约
close("境外 wgs84->gcj02 lat 不偏移", abr.lat, 40.7128, 1e-9);
close("境外 wgs84->gcj02 lng 不偏移", abr.lng, -74.0060, 1e-9);
// 3) BD09 往返
const b = gcj02ToBd09(39.9087, 116.3975);
const g2 = bd09ToGcj02(b.lat, b.lng);
close("bd09 roundtrip lat", g2.lat, 39.9087, 1e-6);
close("bd09 roundtrip lng", g2.lng, 116.3975, 1e-6);
// 4) 中国大陆 GCJ-02 -> WGS84 应有可感知偏移（火星坐标特征）
const g3 = wgs84ToGcj02(39.9087, 116.3975);
const dl = Math.abs(g3.lat - 39.9087) + Math.abs(g3.lng - 116.3975);
if (dl > 0.001) { pass++; } else { fail++; console.log("  ✗ 中国境内偏移量异常小: " + dl); }
// 5) toWgs84 分发
const w1 = toWgs84(39.9087, 116.3975, "WGS84");
close("toWgs84(WGS84) 原样", w1.lat, 39.9087, 1e-9);
const w2 = toWgs84(39.9087, 116.3975, "GCJ-02");
const expectG = gcj02ToWgs84(39.9087, 116.3975);
close("toWgs84(GCJ-02) 一致", w2.lat, expectG.lat, 1e-9);
// 6) 未知坐标系原样返回
const w3 = toWgs84(10, 20, "XXX");
close("toWgs84(未知) 原样", w3.lat, 10, 1e-9);

console.log(`\n结果：通过 ${pass} 项，失败 ${fail} 项`);
process.exit(fail ? 1 : 0);
