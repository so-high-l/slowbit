import { background, glow, type ScenePainter } from "./drawing";

import { pondRippleCycle } from "@/lib/pond-timing";

const TAU = Math.PI * 2;

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 127.1) * 43758.5453);

export const paintPond: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#061714", "#15362f");

  // Distant dawn / moonlight
  glow(ctx, w * 0.7, h * 0.22, Math.min(w, h) * 0.22, "#bfe2cf20");

  const water = ctx.createLinearGradient(0, h * 0.28, 0, h);
  water.addColorStop(0, "rgba(22, 68, 58, .45)");
  water.addColorStop(0.55, "rgba(10, 42, 38, .78)");
  water.addColorStop(1, "rgba(4, 21, 20, .96)");
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.28, w, h * 0.72);

  // Far shoreline and reeds
  ctx.fillStyle = "rgba(4, 17, 15, .58)";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.34);
  for (let x = 0; x <= w; x += 28) {
    const y = h * 0.34 + Math.sin(x * 0.017) * 7 + Math.sin(x * 0.043) * 3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(0, h * 0.42);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 44; i++) {
    const x = rand(i + 10) * w;
    const baseY = h * (0.29 + rand(i + 20) * 0.08);
    const height = 14 + rand(i + 30) * 34;
    const sway = Math.sin(t * 0.22 + i) * 2;
    ctx.strokeStyle = `rgba(17, 42, 31, ${0.25 + rand(i + 40) * 0.25})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + sway, baseY - height * 0.55, x + sway * 1.4, baseY - height);
    ctx.stroke();
  }

  // Water reflection bands
  for (let i = 0; i < 28; i++) {
    const y = h * (0.39 + i * 0.018);
    const x = w * (0.35 + Math.sin(i * 0.7) * 0.08);
    const len = 28 + (i % 7) * 13;
    const drift = Math.sin(t * 0.22 + i * 1.7) * 9;

    ctx.beginPath();
    ctx.moveTo(x - len + drift, y);
    ctx.lineTo(x + len + drift, y);
    ctx.strokeStyle = `rgba(190, 225, 208, ${0.025 + (i % 5) * 0.008})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Gentle ripples - staggered so something catches the eye every few seconds.
  for (let r = 0; r < 3; r++) {
    const cycle = pondRippleCycle(t, r) % 1;
    const centerX = w * (0.42 + r * 0.12);
    const centerY = h * (0.57 + r * 0.05);
    const radiusX = 10 + cycle * w * 0.11;
    const radiusY = 4 + cycle * h * 0.025;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, TAU);
    ctx.strokeStyle = `rgba(203, 236, 220, ${(1 - cycle) * 0.14})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  // Main floating leaf
  const leafX = w * 0.55 + Math.sin(t * 0.11) * 18;
  const leafY = h * 0.61 + Math.sin(t * 0.15) * 5;
  const angle = Math.sin(t * 0.09) * 0.15;

  ctx.save();
  ctx.translate(leafX, leafY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 9, -0.28, 0, TAU);
  ctx.fillStyle = "rgba(94, 125, 74, .82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 197, 132, .18)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-16, 3);
  ctx.quadraticCurveTo(0, -1, 16, -3);
  ctx.strokeStyle = "rgba(215, 224, 170, .14)";
  ctx.stroke();
  ctx.restore();

  // Near-bank silhouettes for depth
  ctx.fillStyle = "rgba(2, 11, 10, .52)";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.88);
  ctx.quadraticCurveTo(w * 0.12, h * 0.81, w * 0.26, h);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w, h);
  ctx.lineTo(w, h * 0.86);
  ctx.quadraticCurveTo(w * 0.88, h * 0.81, w * 0.75, h);
  ctx.closePath();
  ctx.fill();

  // Soft vignette
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
