import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

export const paintLateNightRecord: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#090a0b", "#261b16");

  // Warm room gradient
  const room = ctx.createLinearGradient(0, 0, w, h);
  room.addColorStop(0, "#08090a");
  room.addColorStop(0.55, "#171313");
  room.addColorStop(1, "#2a1b14");
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, w, h);

  // Lamp glow
  const lampX = w * 0.75;
  const lampY = h * 0.32;
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.24);
  glow(ctx, lampX, lampY, Math.min(w, h) * 0.20, `rgba(230, 155, 79, ${0.08 + pulse * 0.012})`);

  // Lamp silhouette
  ctx.fillStyle = "rgba(18, 12, 10, .7)";
  ctx.beginPath();
  ctx.moveTo(lampX - 42, lampY + 12);
  ctx.lineTo(lampX + 42, lampY + 12);
  ctx.lineTo(lampX + 24, lampY - 30);
  ctx.lineTo(lampX - 22, lampY - 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(lampX - 3, lampY + 12, 6, 76);
  ctx.fillRect(lampX - 24, lampY + 88, 48, 5);

  // Desk
  const deskY = h * 0.69;
  ctx.fillStyle = "rgba(15, 10, 9, .92)";
  ctx.fillRect(0, deskY, w, h - deskY);
  ctx.fillStyle = "rgba(111, 70, 44, .12)";
  ctx.fillRect(0, deskY, w, 2);

  // Turntable base
  const deckX = w * 0.32;
  const deckY = h * 0.69 - 10;
  const deckW = Math.min(w * 0.42, 520);
  const deckH = Math.min(h * 0.25, 210);

  ctx.fillStyle = "rgba(35, 28, 26, .92)";
  ctx.beginPath();
  ctx.roundRect(deckX - deckW / 2, deckY - deckH, deckW, deckH, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(142, 102, 75, .12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Record
  const recordX = deckX - deckW * 0.12;
  const recordY = deckY - deckH * 0.5;
  const recordR = Math.min(deckH * 0.38, 88);

  ctx.beginPath();
  ctx.arc(recordX, recordY, recordR, 0, TAU);
  ctx.fillStyle = "rgba(6, 7, 8, .96)";
  ctx.fill();

  for (let i = 1; i <= 6; i++) {
    ctx.beginPath();
    ctx.arc(recordX, recordY, recordR * (0.28 + i * 0.1), 0, TAU);
    ctx.strokeStyle = "rgba(157, 160, 160, .035)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Center label
  ctx.beginPath();
  ctx.arc(recordX, recordY, recordR * 0.22, 0, TAU);
  ctx.fillStyle = "rgba(112, 65, 49, .62)";
  ctx.fill();

  // Rotating highlight - the main subtle animation
  const a = t * 0.28;
  const hx1 = recordX + Math.cos(a) * recordR * 0.34;
  const hy1 = recordY + Math.sin(a) * recordR * 0.34;
  const hx2 = recordX + Math.cos(a) * recordR * 0.92;
  const hy2 = recordY + Math.sin(a) * recordR * 0.92;
  ctx.beginPath();
  ctx.moveTo(hx1, hy1);
  ctx.lineTo(hx2, hy2);
  ctx.strokeStyle = "rgba(236, 214, 186, .10)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tonearm
  const pivotX = deckX + deckW * 0.27;
  const pivotY = deckY - deckH * 0.72;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 11, 0, TAU);
  ctx.fillStyle = "rgba(63, 55, 51, .95)";
  ctx.fill();

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(-0.58 + Math.sin(t * 0.04) * 0.002);
  ctx.strokeStyle = "rgba(132, 127, 119, .52)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-recordR * 1.1, recordR * 0.82);
  ctx.stroke();
  ctx.restore();

  // Small stack of records / books
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(${36 + i * 8}, ${24 + i * 5}, ${20 + i * 4}, .75)`;
    ctx.fillRect(w * 0.68, deskY - 18 - i * 8, w * 0.12, 7);
  }

  // Soft foreground blur / vignette
  glow(ctx, w * 0.15, h * 0.82, Math.min(w, h) * 0.18, "#00000055");

  const vignette = ctx.createRadialGradient(w * 0.48, h * 0.48, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
