import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

export const paintPaperLantern: ScenePainter = ({ ctx, w, h, t }) => {
  background(ctx, w, h, "#070707", "#19120e");

  // Very dark room with a subtle warm wall wash.
  const wall = ctx.createLinearGradient(0, 0, w, h);
  wall.addColorStop(0, "#080808");
  wall.addColorStop(0.58, "#11100f");
  wall.addColorStop(1, "#1a120d");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  const lx = w * 0.64;
  const ly = h * 0.48;
  const breath = 0.5 + 0.5 * Math.sin(t * 0.32);

  glow(ctx, lx, ly, Math.min(w, h) * (0.25 + breath * 0.015), `rgba(227, 154, 82, ${0.11 + breath * 0.025})`);
  glow(ctx, lx, ly, Math.min(w, h) * 0.12, `rgba(255, 195, 115, ${0.12 + breath * 0.03})`);

  // Low table
  const tableY = h * 0.73;
  ctx.fillStyle = "rgba(14, 10, 8, .88)";
  ctx.fillRect(w * 0.34, tableY, w * 0.48, h * 0.035);
  ctx.fillStyle = "rgba(52, 34, 24, .20)";
  ctx.fillRect(w * 0.34, tableY, w * 0.48, 2);

  // Lantern body
  ctx.save();
  ctx.translate(lx, ly);

  const bodyW = Math.min(w, h) * 0.13;
  const bodyH = Math.min(w, h) * 0.22;

  const lanternGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
  lanternGrad.addColorStop(0, `rgba(235, 188, 119, ${0.35 + breath * 0.04})`);
  lanternGrad.addColorStop(0.5, `rgba(255, 210, 139, ${0.53 + breath * 0.04})`);
  lanternGrad.addColorStop(1, `rgba(206, 137, 76, ${0.27 + breath * 0.03})`);

  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.38, -bodyH * 0.48);
  ctx.quadraticCurveTo(-bodyW * 0.58, 0, -bodyW * 0.38, bodyH * 0.48);
  ctx.quadraticCurveTo(0, bodyH * 0.56, bodyW * 0.38, bodyH * 0.48);
  ctx.quadraticCurveTo(bodyW * 0.58, 0, bodyW * 0.38, -bodyH * 0.48);
  ctx.quadraticCurveTo(0, -bodyH * 0.56, -bodyW * 0.38, -bodyH * 0.48);
  ctx.closePath();
  ctx.fillStyle = lanternGrad;
  ctx.fill();

  // Paper ribs
  ctx.strokeStyle = "rgba(89, 53, 32, .22)";
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    const y = (i / 4) * bodyH * 0.46;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.42, y);
    ctx.quadraticCurveTo(0, y + 3, bodyW * 0.42, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(37, 22, 15, .75)";
  ctx.fillRect(-bodyW * 0.30, -bodyH * 0.55, bodyW * 0.60, 5);
  ctx.fillRect(-bodyW * 0.30, bodyH * 0.53, bodyW * 0.60, 5);

  ctx.restore();

  // A cup and book on the table, almost silhouette only.
  const cupX = w * 0.48;
  const cupY = tableY - 29;
  ctx.fillStyle = "rgba(19, 13, 10, .80)";
  ctx.beginPath();
  ctx.roundRect(cupX, cupY, 34, 29, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cupX + 34, cupY + 14, 8, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = "rgba(22, 14, 10, .78)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Steam
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cupX + 12 + i * 9, cupY);
    ctx.bezierCurveTo(
      cupX + 5 + i * 10 + Math.sin(t * 0.35 + i) * 4,
      cupY - 12,
      cupX + 20 + i * 4,
      cupY - 22,
      cupX + 12 + i * 8 + Math.sin(t * 0.28 + i) * 5,
      cupY - 34,
    );
    ctx.strokeStyle = "rgba(215, 198, 180, .055)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(20, 13, 10, .75)";
  ctx.fillRect(w * 0.42, tableY - 8, 90, 7);
  ctx.fillStyle = "rgba(112, 70, 40, .10)";
  ctx.fillRect(w * 0.42, tableY - 9, 90, 1);

  // Floor reflection
  const reflection = ctx.createRadialGradient(lx, tableY + 15, 0, lx, tableY + 15, Math.min(w, h) * 0.25);
  reflection.addColorStop(0, `rgba(225, 139, 62, ${0.06 + breath * 0.012})`);
  reflection.addColorStop(1, "rgba(225,139,62,0)");
  ctx.fillStyle = reflection;
  ctx.fillRect(0, tableY, w, h - tableY);

  const vignette = ctx.createRadialGradient(lx, ly, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.52)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
