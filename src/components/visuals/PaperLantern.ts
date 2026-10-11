import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;
const random = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Keep the saved scene identifier while replacing its setting with a sleeper carriage.
export const paintPaperLantern: ScenePainter = ({ ctx, w, h, t }) => {
  const unit = Math.min(w, h);
  const left = w * 0.075;
  const top = h * 0.105;
  const width = w * 0.85;
  const height = h * 0.65;
  const radius = unit * 0.045;
  background(ctx, w, h, "#161617", "#090c10");
  glow(ctx, w * 0.12, h * 0.17, unit * 0.7, "rgba(181,117,63,.12)");

  // Deep window reveal, with the landscape contained behind the glass.
  ctx.fillStyle = "#05080c";
  ctx.beginPath();
  ctx.roundRect(left - 13, top - 13, width + 26, height + 30, radius + 8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, radius);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, top, 0, top + height);
  sky.addColorStop(0, "#0b1729");
  sky.addColorStop(0.65, "#25394a");
  sky.addColorStop(1, "#111d26");
  ctx.fillStyle = sky;
  ctx.fillRect(left, top, width, height);

  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(207,220,232,${0.15 + random(i + 3) * 0.3})`;
    ctx.beginPath();
    ctx.arc(left + random(i) * width, top + random(i + 90) * height * 0.5, 0.5 + random(i + 80) * 0.6, 0, TAU);
    ctx.fill();
  }
  const moonX = left + width * 0.73;
  const moonY = top + height * 0.24;
  glow(ctx, moonX, moonY, unit * 0.17, "rgba(190,209,226,.12)");
  ctx.fillStyle = "#b7c6ce";
  ctx.beginPath();
  ctx.arc(moonX, moonY, unit * 0.019, 0, TAU);
  ctx.fill();

  // Continuous world coordinates prevent hills popping when they cross the window.
  for (let layer = 0; layer < 4; layer++) {
    const speed = [2, 6, 15, 30][layer];
    const baseline = top + height * (0.56 + layer * 0.12);
    ctx.beginPath();
    ctx.moveTo(left, top + height);
    for (let x = left; x <= left + width + 8; x += 8) {
      const world = (x + t * speed) / unit;
      const y = baseline + Math.sin(world * (3 + layer) + layer * 2) * unit * 0.035
        + Math.sin(world * 9.3 + layer) * unit * 0.012;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(left + width, top + height);
    ctx.closePath();
    ctx.fillStyle = ["#213241", "#192b36", "#11222b", "#0a161d"][layer];
    ctx.fill();
  }

  // Sparse houses pass at middle distance, never flashing or filling the horizon.
  const spacing = unit * 0.34;
  const travel = t * 12;
  const start = Math.floor(travel / spacing) - 1;
  for (let i = start; i < start + Math.ceil(width / spacing) + 3; i++) {
    if (random(i + 17) < 0.44) continue;
    const x = left + i * spacing - travel;
    const y = top + height * 0.75 + random(i + 8) * unit * 0.035;
    const size = unit * (0.012 + random(i + 20) * 0.012);
    ctx.fillStyle = "#0b1820";
    ctx.fillRect(x, y - size, size * 2, size);
    ctx.beginPath();
    ctx.moveTo(x - 2, y - size);
    ctx.lineTo(x + size, y - size * 1.6);
    ctx.lineTo(x + size * 2 + 2, y - size);
    ctx.fill();
    ctx.fillStyle = "rgba(218,171,100,.5)";
    ctx.fillRect(x + size * 0.4, y - size * 0.65, Math.max(1, size * 0.22), size * 0.3);
  }

  // Nearby tree silhouettes carry the movement; distant sky remains restful.
  const treeSpacing = unit * 0.42;
  const treeTravel = t * 38;
  const firstTree = Math.floor(treeTravel / treeSpacing) - 1;
  for (let i = firstTree; i < firstTree + Math.ceil(width / treeSpacing) + 3; i++) {
    const x = left + i * treeSpacing - treeTravel;
    const base = top + height;
    const treeHeight = unit * (0.12 + random(i + 200) * 0.13);
    ctx.fillStyle = "#081219";
    ctx.fillRect(x - 2, base - treeHeight, 4, treeHeight);
    for (let branch = 0; branch < 3; branch++) {
      const y = base - treeHeight + branch * treeHeight * 0.2;
      const breadth = treeHeight * (0.16 + branch * 0.07);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + breadth, y + treeHeight * 0.44);
      ctx.lineTo(x - breadth, y + treeHeight * 0.44);
      ctx.fill();
    }
  }

  // Condensation and warm cabin reflections stay attached to the glass.
  for (let i = 0; i < 36; i++) {
    const x = left + random(i + 300) * width;
    const y = top + ((random(i + 400) + t * (0.001 + random(i) * 0.001)) % 1) * height;
    ctx.strokeStyle = "rgba(183,210,227,.10)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + unit * (0.005 + random(i + 5) * 0.024));
    ctx.stroke();
  }
  const reflection = ctx.createLinearGradient(left, 0, left + width, 0);
  reflection.addColorStop(0, "rgba(205,143,81,.10)");
  reflection.addColorStop(0.3, "rgba(205,143,81,0)");
  reflection.addColorStop(0.8, "rgba(205,143,81,.015)");
  reflection.addColorStop(1, "rgba(205,143,81,.07)");
  ctx.fillStyle = reflection;
  ctx.fillRect(left, top, width, height);
  ctx.restore();

  ctx.strokeStyle = "rgba(171,150,119,.23)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(left - 4, top - 4, width + 8, height + 8, radius + 3);
  ctx.stroke();
  // Broad sill and upholstered seat anchor the viewer inside the compartment.
  const sill = ctx.createLinearGradient(0, top + height + 8, 0, top + height + h * 0.055);
  sill.addColorStop(0, "#39302a");
  sill.addColorStop(1, "#181719");
  ctx.fillStyle = sill;
  ctx.fillRect(left - 12, top + height + 10, width + 24, h * 0.035);
  ctx.fillStyle = "#121b21";
  ctx.beginPath();
  ctx.roundRect(w * 0.025, h * 0.86, w * 0.95, h * 0.24, unit * 0.04);
  ctx.fill();
  ctx.strokeStyle = "rgba(114,133,144,.10)";
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.89);
  ctx.lineTo(w * 0.94, h * 0.89);
  ctx.stroke();
  const shade = ctx.createRadialGradient(w * 0.5, h * 0.4, unit * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  shade.addColorStop(0, "transparent");
  shade.addColorStop(1, "rgba(0,0,0,.65)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
};
