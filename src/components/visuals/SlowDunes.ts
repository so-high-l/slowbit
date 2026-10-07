import { background, glow, type ScenePainter } from "./drawing";

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 143.8) * 43758.5453);

export const paintSlowDunes: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#2a1b1e", "#b36f4f");

  // Sunset sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#302231");
  sky.addColorStop(0.42, "#9b5a50");
  sky.addColorStop(0.68, "#d88a5e");
  sky.addColorStop(1, "#57352f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.72;
  const sunY = h * 0.27;
  glow(ctx, sunX, sunY, Math.min(w, h) * 0.22, "#ffc6872d");
  ctx.beginPath();
  ctx.arc(sunX, sunY, Math.min(w, h) * 0.027, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 210, 151, .72)";
  ctx.fill();

  // Thin atmospheric bands
  for (let i = 0; i < 4; i++) {
    const y = h * (0.34 + i * 0.045);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y - 8, w * 0.72, y + 5, w, y - 3);
    ctx.strokeStyle = `rgba(253, 206, 162, ${0.03 + i * 0.006})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Distant dunes
  const layers = [
    { y: 0.58, amp: 44, color: "rgba(86, 48, 46, .75)", speed: 0.015 },
    { y: 0.69, amp: 68, color: "rgba(113, 64, 47, .88)", speed: 0.022 },
    { y: 0.82, amp: 92, color: "rgba(79, 46, 35, .98)", speed: 0.03 },
  ];

  layers.forEach((layer, index) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * layer.y);

    for (let x = 0; x <= w; x += 16) {
      const n = x / w;
      const y =
        h * layer.y -
        Math.sin(n * Math.PI * (1.15 + index * 0.25) + index + t * layer.speed) *
          layer.amp -
        Math.sin(n * 7 + index * 2.1) * layer.amp * 0.14;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  });

  // Highlight on the nearest dune crest
  ctx.beginPath();
  for (let x = 0; x <= w; x += 10) {
    const n = x / w;
    const y =
      h * 0.82 -
      Math.sin(n * Math.PI * 1.65 + 2 + t * 0.03) * 92 -
      Math.sin(n * 7 + 4.2) * 13;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(245, 175, 112, .13)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tiny drifting sand motes
  for (let i = 0; i < 24; i++) {
    const baseX = rand(i + 10) * w;
    const x = (baseX + t * (2 + rand(i + 20) * 3)) % w;
    const y = h * (0.48 + rand(i + 30) * 0.34) + Math.sin(t * 0.3 + i) * 4;
    const a = 0.015 + 0.025 * rand(i + 40);
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + rand(i + 50) * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 204, 145, ${a})`;
    ctx.fill();
  }

  // A tiny lone grass tuft gives scale and a focal point.
  const gx = w * 0.28;
  const gy = h * 0.78;
  for (let i = 0; i < 7; i++) {
    const sway = Math.sin(t * 0.17 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + (i - 3) * 4, gy - 20, gx + (i - 3) * 8 + sway, gy - 36 - i * 2);
    ctx.strokeStyle = "rgba(48, 31, 25, .48)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.74);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.26)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
