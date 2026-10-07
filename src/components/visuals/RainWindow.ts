import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 127.1) * 43758.5453123);

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCityGlow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  // soft skyline silhouettes
  for (let i = 0; i < 7; i++) {
    const x = w * (0.52 + i * 0.07);
    const bw = w * (0.035 + rand(i + 3) * 0.03);
    const bh = h * (0.18 + rand(i + 10) * 0.22);

    ctx.fillStyle = "rgba(10, 17, 24, 0.45)";
    ctx.fillRect(x, h * 0.32, bw, bh);
  }

  // blurred city bokeh lights
  for (let i = 0; i < 22; i++) {
    const x = w * (0.52 + rand(i + 20) * 0.42);
    const y = h * (0.42 + rand(i + 40) * 0.22);
    const r = 8 + rand(i + 80) * 14;
    const pulse = 0.75 + 0.25 * Math.sin(t * 0.7 + i * 0.8);

    const warm = i % 3 === 0;
    glow(
      ctx,
      x,
      y,
      r * pulse,
      warm ? "rgba(237, 176, 101, 0.28)" : "rgba(179, 209, 219, 0.18)"
    );
  }
}

function drawIndoorLamp(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const lx = w * 0.11;
  const ly = h * 0.58;

  glow(ctx, lx, ly, w * 0.12, "rgba(232, 175, 110, 0.18)");
  glow(ctx, lx, ly, 55, "rgba(250, 202, 144, 0.18)");

  // small lamp silhouette
  ctx.fillStyle = "rgba(20, 14, 11, 0.65)";
  roundedRect(ctx, lx - 26, ly + 12, 52, 12, 5);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(lx - 8, ly + 12);
  ctx.lineTo(lx + 8, ly + 12);
  ctx.lineTo(lx + 4, ly - 20);
  ctx.lineTo(lx - 4, ly - 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(246, 217, 168, 0.18)";
  ctx.beginPath();
  ctx.ellipse(lx, ly - 28, 34, 20, 0, 0, TAU);
  ctx.fill();
}

function drawPlantSilhouette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  const baseX = w * 0.35;
  const baseY = h * 0.73;

  ctx.strokeStyle = "rgba(17, 25, 20, 0.58)";
  ctx.lineWidth = 3;

  for (let i = 0; i < 6; i++) {
    const stemX = baseX + i * 12;
    const sway = Math.sin(t * 0.2 + i) * 2;

    ctx.beginPath();
    ctx.moveTo(stemX, baseY);
    ctx.quadraticCurveTo(
      stemX - 10 + sway,
      baseY - 70,
      stemX + 5 + sway,
      baseY - 150 - i * 8
    );
    ctx.stroke();

    for (let j = 0; j < 4; j++) {
      const ly = baseY - 30 - j * 28 - i * 3;
      const dir = j % 2 === 0 ? -1 : 1;

      ctx.beginPath();
      ctx.ellipse(
        stemX + dir * 12 + sway,
        ly,
        12,
        6,
        dir * 0.6,
        0,
        TAU
      );
      ctx.fillStyle = "rgba(20, 30, 22, 0.45)";
      ctx.fill();
    }
  }
}

function drawDeskAndMug(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // desk / window sill
  const deskGrad = ctx.createLinearGradient(0, h * 0.78, 0, h);
  deskGrad.addColorStop(0, "rgba(18, 18, 20, 0.25)");
  deskGrad.addColorStop(1, "rgba(7, 7, 9, 0.88)");
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, h * 0.74, w, h * 0.26);

  // front edge
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, h * 0.735, w, 6);

  // mug silhouette
  const mx = w * 0.78;
  const my = h * 0.73;
  ctx.fillStyle = "rgba(12, 14, 18, 0.68)";
  roundedRect(ctx, mx, my - 38, 48, 50, 8);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(mx + 48, my - 18, 11, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = "rgba(16, 18, 22, 0.65)";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function drawWindowFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(4, 8, 12, 0.28)";
  ctx.fillRect(w * 0.23, 0, 10, h); // left vertical
  ctx.fillRect(w * 0.77, 0, 10, h); // right vertical
  ctx.fillRect(0, h * 0.71, w, 8); // horizontal sill

  // subtle reflection on frame edges
  ctx.fillStyle = "rgba(180, 210, 220, 0.04)";
  ctx.fillRect(w * 0.23 + 10, 0, 2, h);
  ctx.fillRect(w * 0.77 - 2, 0, 2, h);
}

function drawCondensation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  for (let i = 0; i < 16; i++) {
    const x = w * (0.5 + rand(i + 120) * 0.42);
    const y = h * (0.16 + rand(i + 150) * 0.48);
    const rr = 8 + rand(i + 12) * 16;
    const alpha = 0.03 + rand(i + 90) * 0.04;

    glow(ctx, x, y, rr, `rgba(210, 232, 238, ${alpha})`);
  }

  // occasional fogged vertical wipe
  for (let i = 0; i < 5; i++) {
    const x = w * (0.53 + i * 0.09);
    const width = 18 + rand(i + 33) * 24;
    const alpha = 0.025 + 0.01 * Math.sin(t * 0.25 + i);

    const grad = ctx.createLinearGradient(x, 0, x + width, 0);
    grad.addColorStop(0, "rgba(220,235,240,0)");
    grad.addColorStop(0.5, `rgba(220,235,240,${alpha})`);
    grad.addColorStop(1, "rgba(220,235,240,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(x, h * 0.08, width, h * 0.6);
  }
}

function drawRainOnGlass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  particles: Array<{ x: number; y: number; s: number; r: number }>
) {
  for (const p of particles) {
    const x = p.x * w;
    const y = ((p.y + t * p.s * 0.032) % 1) * h;
    const length = 12 + p.s * 36;
    const drift = 2 + p.s * 5;

    // streak
    ctx.strokeStyle = "rgba(185, 214, 224, 0.20)";
    ctx.lineWidth = Math.max(0.8, p.r * 0.65);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x - drift * 0.2,
      y + 8,
      x - drift,
      y + length * 0.65,
      x - drift,
      y + length
    );
    ctx.stroke();

    // bright droplet head
    glow(ctx, x, y, 1.5 + p.r * 1.2, "rgba(225, 242, 247, 0.22)");

    // occasional droplet body / bead
    if (p.s > 0.45) {
      ctx.beginPath();
      ctx.ellipse(x - drift * 0.6, y + length * 0.45, 1.3, 2.4, 0, 0, TAU);
      ctx.fillStyle = "rgba(220, 238, 244, 0.10)";
      ctx.fill();
    }
  }
}

function drawStaticDroplets(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  for (let i = 0; i < 40; i++) {
    const x = w * (0.48 + rand(i + 210) * 0.47);
    const y = h * (0.12 + rand(i + 240) * 0.52);
    const r = 1 + rand(i + 270) * 2.5;
    const alpha = 0.05 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.5 + i));

    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = `rgba(218, 235, 241, ${alpha})`;
    ctx.fill();

    // tiny highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, TAU);
    ctx.fillStyle = `rgba(245, 250, 252, ${alpha * 0.7})`;
    ctx.fill();
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    Math.min(w, h) * 0.2,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.8
  );

  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.30)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

export const paintRain: ScenePainter = ({ ctx, w, h, t, particles }) => {
  // base atmosphere
  background(ctx, w, h, "#07131b", "#13232a");

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#08131d");
  sky.addColorStop(0.35, "#10212a");
  sky.addColorStop(0.7, "#162a31");
  sky.addColorStop(1, "#0b141a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // misty outside glow
  glow(ctx, w * 0.72, h * 0.46, w * 0.34, "rgba(97, 134, 145, 0.14)");

  drawCityGlow(ctx, w, h, t);
  drawIndoorLamp(ctx, w, h);
  drawPlantSilhouette(ctx, w, h, t);
  drawDeskAndMug(ctx, w, h);

  // subtle glass haze before raindrops
  drawCondensation(ctx, w, h, t);

  // rain streaks and static droplets
  drawRainOnGlass(ctx, w, h, t, particles);
  drawStaticDroplets(ctx, w, h, t);

  drawWindowFrame(ctx, w, h);
  drawVignette(ctx, w, h);
};