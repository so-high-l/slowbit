import { background, glow, type ScenePainter } from "./drawing.ts";

const TAU = Math.PI * 2;
const amber = "232,188,119";
const amberBright = "255,220,163";
const blue = "132,176,198";
const blueBright = "192,222,234";
const RECURSIVE_SECONDS = 28;
const RECURSIVE_MAIN_RADIUS = 0.34;
const RECURSIVE_ZOOM = 1 / RECURSIVE_MAIN_RADIUS;

export function quietMachineLayout(w: number, h: number) {
  const compact = w < h * 0.9;
  const unit = Math.min(w, h);
  return (compact ? [
    [0.57, 0.45, 0.25, 1], [0.23, 0.69, 0.15, -2],
    [0.79, 0.23, 0.12, 3], [0.78, 0.77, 0.09, -1], [0.23, 0.26, 0.07, 2],
  ] : [
    [0.55, 0.48, 0.205, 1], [0.21, 0.67, 0.19, -2],
    [0.86, 0.29, 0.13, 3], [0.86, 0.67, 0.085, -1], [0.32, 0.31, 0.058, 2],
  ]).map(([x, y, radius, rate]) => ({ x: x * w, y: y * h, radius: radius * unit, rate }));
}

// Integer ratios periodically line up, then separate again. The caller integrates
// this clock so toggling immersion never changes an element's current angle.
export function machineAngle(time: number, rate: number) {
  return (time % 240) / 240 * TAU * rate;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (start: number, end: number, value: number) => {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

export function quietMachineCamera(w: number, h: number, focus: number) {
  const ring = quietMachineLayout(w, h)[0];
  const progress = smoothstep(0, 1, focus);
  const targetScale = Math.max(w, h) / (ring.radius * 2) * 1.08;
  return {
    x: ring.x,
    y: ring.y,
    scale: 1 + (targetScale - 1) * progress,
    progress,
  };
}

export function quietMachineDetailStrengths(focus: number) {
  return {
    structure: smoothstep(0.08, 0.42, focus),
    movement: smoothstep(0.30, 0.70, focus),
    fine: smoothstep(0.58, 0.96, focus),
  };
}

const seeded = (generation: number, salt: number) => {
  const value = Math.sin((generation + 1) * 91.713 + salt * 47.117) * 43758.5453;
  return value - Math.floor(value);
};

export function quietMachineRecursiveState(time: number) {
  const travel = Math.max(0, time) / RECURSIVE_SECONDS;
  const generation = Math.floor(travel);
  const progress = travel - generation;
  return { generation, progress, scale: RECURSIVE_ZOOM ** progress };
}

const recursiveLayout = [
  { x: 0, y: 0, radius: RECURSIVE_MAIN_RADIUS, rate: 1 },
  { x: -0.5, y: 0.3, radius: 0.22, rate: -2 },
  { x: 0.53, y: -0.3, radius: 0.15, rate: 3 },
  { x: 0.5, y: 0.34, radius: 0.1, rate: -1 },
  { x: -0.44, y: -0.31, radius: 0.085, rate: 2 },
] as const;

function paintRecursiveComposition(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  extent: number,
  time: number,
  alpha: number,
  cycleProgress: number,
  depth = 0,
) {
  if (depth > 2 || extent < 0.2 || alpha <= 0.001) return;
  const baseAlpha = alpha;
  if (depth === 0) alpha *= 1 - smoothstep(0.72, 1, cycleProgress);
  else if (depth === 2) alpha *= smoothstep(0, 0.3, cycleProgress);

  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, extent * 0.98, 0, TAU); ctx.clip();

  const centers = recursiveLayout.map(part => ({
    x: x + part.x * extent,
    y: y + part.y * extent,
    radius: part.radius * extent,
    rate: part.rate,
  }));

  if (alpha > 0.001) {
    for (let index = 0; index < centers.length; index++) {
      const part = centers[index];
      const color = index % 2 ? amber : blue;
      const alternate = index % 2 ? blue : amber;
      const angle = machineAngle(time, part.rate) + seeded(index, 7) * 0.45;
      const lineWidth = extent * (index === 0 ? 0.002 : 0.00145);

      const surface = ctx.createLinearGradient(
        part.x - part.radius,
        part.y + part.radius,
        part.x + part.radius,
        part.y - part.radius,
      );
      surface.addColorStop(0, "rgba(3,10,15,.025)");
      surface.addColorStop(0.52, `rgba(${blue},${alpha * (index === 0 ? 0.045 : 0.025)})`);
      surface.addColorStop(0.84, `rgba(${amber},${alpha * (index === 0 ? 0.095 : 0.055)})`);
      surface.addColorStop(1, `rgba(${amberBright},${alpha * 0.035})`);
      ctx.beginPath(); ctx.arc(part.x, part.y, part.radius, 0, TAU);
      ctx.fillStyle = surface; ctx.fill();
      ctx.strokeStyle = `rgba(${color},${alpha * (index === 0 ? 0.38 : 0.27)})`;
      ctx.lineWidth = lineWidth; ctx.stroke();

      ctx.save();
      ctx.shadowColor = `rgba(${amberBright},${alpha * 0.2})`;
      ctx.shadowBlur = part.radius * 0.055;
      ctx.beginPath(); ctx.arc(part.x, part.y, part.radius, angle - 0.95, angle + 0.42);
      ctx.strokeStyle = `rgba(${index === 0 ? amberBright : alternate},${alpha * (index === 0 ? 0.68 : 0.43)})`;
      ctx.lineWidth = lineWidth * 1.25; ctx.stroke();
      ctx.restore();

      for (const ratio of index === 0 ? [0.58, 0.78] : [0.48]) {
        ctx.beginPath(); ctx.arc(part.x, part.y, part.radius * ratio, 0, TAU);
        ctx.strokeStyle = `rgba(${alternate},${alpha * (ratio > 0.7 ? 0.18 : 0.12)})`;
        ctx.lineWidth = lineWidth * 0.62; ctx.stroke();
      }

      const markerX = part.x + Math.cos(angle) * part.radius;
      const markerY = part.y + Math.sin(angle) * part.radius;
      ctx.beginPath(); ctx.moveTo(part.x, part.y); ctx.lineTo(markerX, markerY);
      ctx.strokeStyle = `rgba(${color},${alpha * 0.2})`; ctx.lineWidth = lineWidth * 0.55; ctx.stroke();
      glow(ctx, markerX, markerY, part.radius * 0.16, `rgba(${alternate},${alpha * 0.09})`);
      ctx.beginPath(); ctx.arc(markerX, markerY, part.radius * 0.035, 0, TAU);
      ctx.fillStyle = `rgba(${index === 0 ? amberBright : alternate},${alpha * 0.9})`; ctx.fill();
    }

    for (let index = 0; index < centers.length - 1; index++) {
      const from = centers[index];
      const to = centers[index + 1];
      ctx.setLineDash([extent * 0.006, extent * 0.014]);
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = `rgba(${index % 2 ? blueBright : amber},${alpha * 0.14})`;
      ctx.lineWidth = extent * 0.0012; ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath(); ctx.moveTo(x - extent * 0.72, y); ctx.lineTo(x + extent * 0.72, y);
    ctx.strokeStyle = `rgba(${blueBright},${alpha * 0.13})`;
    ctx.lineWidth = extent * 0.0011; ctx.stroke();
  }

  const childExtent = extent * RECURSIVE_MAIN_RADIUS;
  paintRecursiveComposition(ctx, x, y, childExtent, time, baseAlpha, cycleProgress, depth + 1);
  ctx.restore();
}

export const paintQuietMachine = ({ ctx, w, h, t, focus = 0, reducedMotion = false, zoomTime = 0 }: Parameters<ScenePainter>[0] & { zoomTime?: number }) => {
  if (w <= 0 || h <= 0) return;
  const time = reducedMotion ? 0 : t;
  const strength = Math.max(0, Math.min(1, focus));
  const unit = Math.min(w, h);
  const rings = quietMachineLayout(w, h);
  const recursion = quietMachineRecursiveState(zoomTime);
  const recursionStrength = smoothstep(0.72, 0.96, strength);
  const root = rings[0];
  const camera = quietMachineCamera(w, h, strength);
  camera.scale *= recursion.scale ** recursionStrength;
  const details = quietMachineDetailStrengths(strength);
  const overviewAlpha = 1 - smoothstep(0.72, 0.97, strength);
  const innerAlpha = smoothstep(0.68, 0.96, strength);
  background(ctx, w, h, "#02070b", "#071119");
  glow(ctx, w * 0.57, h * 0.45, unit * 0.72, "rgba(72,112,132,.052)");
  glow(ctx, root.x, root.y, root.radius * 2.3, `rgba(${amber},${0.018 + strength * 0.012})`);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.5);
  ctx.scale(camera.scale, camera.scale);
  ctx.translate(-camera.x, -camera.y);
  ctx.globalAlpha = overviewAlpha;
  ctx.lineWidth = 0.7;
  const line = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const dot = (x: number, y: number, radius: number, color: string, alpha: number) => {
    glow(ctx, x, y, radius * 5.4, `rgba(${color},${alpha * 0.16})`);
    ctx.save();
    ctx.shadowColor = `rgba(${color},${alpha * 0.42})`;
    ctx.shadowBlur = radius * 2.4;
    ctx.fillStyle = `rgba(${color},${alpha})`;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${blueBright},${alpha * 0.3})`;
    ctx.lineWidth = Math.max(0.4, radius * 0.16); ctx.stroke();
    ctx.restore();
  };
  const marks = rings.map((ring, i) => {
    const angle = machineAngle(time, ring.rate);
    const r = ring.radius * (i === 0 ? 1.28 : 1);
    return { x: ring.x + Math.cos(angle) * r, y: ring.y + Math.sin(angle) * r };
  });

  // Hairline rails leave the upper-left caption area quiet.
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    line(ring.x, Math.max(h * 0.12, ring.y - ring.radius * 1.55), ring.x, Math.min(h * 0.86, ring.y + ring.radius * 1.6), `rgba(${blueBright},.115)`);
    const railY = i === 1 ? ring.y - ring.radius * 0.9 : ring.y;
    line(Math.max(w * 0.07, ring.x - ring.radius * 1.6), railY, Math.min(w * 0.96, ring.x + ring.radius * 1.5), railY, `rgba(${blue},.105)`);
    const travel = Math.sin(machineAngle(time, ring.rate)) * ring.radius * 1.35;
    dot(ring.x, ring.y + travel, Math.max(1.2, unit * 0.002), i % 2 ? amber : blue, 0.5);
  }
  // A single shared datum gives the asymmetric parts a common reference.
  line(w * 0.29, rings[0].y, w * 0.96, rings[0].y, `rgba(${amberBright},.22)`);

  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    const color = i % 2 === 0 ? blue : amber;
    const angle = machineAngle(time, ring.rate);
    const disk = ctx.createLinearGradient(ring.x - ring.radius, ring.y + ring.radius, ring.x + ring.radius, ring.y - ring.radius);
    disk.addColorStop(0, "rgba(3,10,15,.04)");
    disk.addColorStop(0.46, "rgba(34,66,82,.065)");
    disk.addColorStop(0.76, `rgba(${blue},${i === 0 ? 0.14 : 0.085})`);
    disk.addColorStop(0.93, `rgba(${amber},${i === 0 ? 0.24 : 0.13})`);
    disk.addColorStop(1, `rgba(${amberBright},${i === 0 ? 0.12 : 0.065})`);
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
    ctx.fillStyle = disk; ctx.fill();
    ctx.strokeStyle = `rgba(${color},${i === 0 ? 0.34 : 0.27})`; ctx.stroke();
    ctx.save();
    ctx.shadowColor = `rgba(${amberBright},${i === 0 ? 0.2 : 0.1})`;
    ctx.shadowBlur = ring.radius * (i === 0 ? 0.055 : 0.035);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, -1.3, 0.65);
    ctx.strokeStyle = `rgba(${amberBright},${i === 0 ? 0.66 : 0.38})`; ctx.stroke();
    ctx.restore();
    for (const ratio of i === 0 ? [0.61, 1.15, 1.28, 1.46] : [0.24, 0.5, 1.22]) {
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * ratio, 0, TAU);
      ctx.strokeStyle = `rgba(${ratio > 1 ? blueBright : color},${ratio > 1 ? 0.12 : 0.22})`; ctx.stroke();
    }
    if (i === 0 && details.structure > 0.001) {
      ctx.save();
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius * 0.965, 0, TAU); ctx.clip();

      // The close view reveals a calm instrument-like interior in three stages.
      for (let inner = 0; inner < 6; inner++) {
        const innerRadius = ring.radius * (0.12 + inner * 0.115);
        const innerAngle = angle * (inner % 2 ? -1.4 : 1.8) + inner * 0.8;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, innerRadius, innerAngle - 0.72, innerAngle + 1.55);
        ctx.strokeStyle = `rgba(${inner % 2 ? amber : blue},${details.structure * (0.10 + inner * 0.018)})`;
        ctx.lineWidth = inner % 2 ? 0.55 : 0.85;
        ctx.stroke();
      }

      const rotorAngle = machineAngle(time, -3);
      for (let spoke = 0; spoke < 3; spoke++) {
        const spokeAngle = rotorAngle + spoke * TAU / 3;
        const innerRadius = ring.radius * 0.54;
        line(
          ring.x + Math.cos(spokeAngle) * ring.radius * 0.13,
          ring.y + Math.sin(spokeAngle) * ring.radius * 0.13,
          ring.x + Math.cos(spokeAngle) * innerRadius,
          ring.y + Math.sin(spokeAngle) * innerRadius,
          `rgba(${blue},${details.structure * 0.16})`,
        );
      }

      if (details.movement > 0.001) {
        const tracks = [-0.42, -0.14, 0.16, 0.43];
        for (let track = 0; track < tracks.length; track++) {
          const y = ring.y + ring.radius * tracks[track];
          const half = ring.radius * Math.sqrt(Math.max(0, 0.78 ** 2 - tracks[track] ** 2));
          line(ring.x - half, y, ring.x + half, y, `rgba(${track % 2 ? amber : blue},${details.movement * 0.12})`);
          const travel = 0.5 + Math.sin(time * (0.055 + track * 0.009) + track * 1.7) * 0.43;
          dot(ring.x - half + half * 2 * travel, y, Math.max(0.85, ring.radius * 0.009), track % 2 ? amber : blue, details.movement * 0.72);
        }

        for (let satellite = 0; satellite < 4; satellite++) {
          const orbitRadius = ring.radius * (0.20 + satellite * 0.12);
          const satelliteAngle = machineAngle(time, satellite % 2 ? -5 - satellite : 4 + satellite) + satellite * 1.4;
          const x = ring.x + Math.cos(satelliteAngle) * orbitRadius;
          const y = ring.y + Math.sin(satelliteAngle) * orbitRadius;
          dot(x, y, Math.max(0.9, ring.radius * (0.012 - satellite * 0.001)), satellite % 2 ? amber : blue, details.movement * 0.78);
        }
      }

      if (details.fine > 0.001) {
        const fineAngle = machineAngle(time, 8);
        for (let tick = 0; tick < 24; tick++) {
          const a = tick * TAU / 24 + fineAngle;
          const inner = ring.radius * (tick % 3 === 0 ? 0.72 : 0.755);
          const outer = ring.radius * 0.79;
          line(
            ring.x + Math.cos(a) * inner,
            ring.y + Math.sin(a) * inner,
            ring.x + Math.cos(a) * outer,
            ring.y + Math.sin(a) * outer,
            `rgba(${tick % 3 === 0 ? amber : blue},${details.fine * 0.18})`,
          );
        }
        const coreRadius = ring.radius * (0.075 + Math.sin(time * 0.09) * 0.004);
        glow(ctx, ring.x, ring.y, ring.radius * 0.3, `rgba(${amberBright},${details.fine * 0.085})`);
        ctx.beginPath(); ctx.arc(ring.x, ring.y, coreRadius, 0, TAU);
        ctx.strokeStyle = `rgba(${amberBright},${details.fine * 0.58})`; ctx.lineWidth = 0.9; ctx.stroke();
      }
      ctx.restore();
    }

    // Partial arcs and a fine pointer make rotation readable without gears.
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (i === 0 ? 1.28 : 1), angle - 1.05, angle);
    ctx.strokeStyle = `rgba(${amberBright},${0.54 + strength * 0.18})`;
    ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 0.7;
    line(ring.x, ring.y, marks[i].x, marks[i].y, `rgba(${color},${0.18 + strength * 0.14})`);
    dot(ring.x, ring.y, Math.max(1.6, unit * (i === 0 ? 0.005 : 0.003)), i === 0 || i === 1 ? amber : blue, 0.85);
    dot(marks[i].x, marks[i].y, Math.max(1.5, unit * 0.003), amber, 0.8);
    for (let tick = 0; tick < 8; tick++) {
      const a = tick * TAU / 8;
      line(ring.x + Math.cos(a) * ring.radius * 1.28, ring.y + Math.sin(a) * ring.radius * 1.28,
        ring.x + Math.cos(a) * (ring.radius * 1.28 + 3), ring.y + Math.sin(a) * (ring.radius * 1.28 + 3), `rgba(${blue},.21)`);
    }
  }

  // Relationships are part of the default living mechanism.
  for (let i = 0; i < marks.length - 1; i++) {
    const a = marks[i], b = marks[i + 1];
    const alignment = (0.5 + 0.5 * Math.cos(machineAngle(time, rings[i].rate - rings[i + 1].rate))) ** 4;
    const alpha = (0.72 + strength * 0.28) * (0.045 + alignment * 0.28);
    ctx.setLineDash([2, 6]);
    line(a.x, a.y, b.x, b.y, `rgba(${i % 2 ? blue : amber},${alpha})`);
    ctx.setLineDash([]);
    const progress = 0.5 - 0.5 * Math.cos(time * 0.07 + i);
    dot(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, Math.max(1.4, unit * 0.0023), blue, alpha * 2);
  }

  // A low horizontal track echoes the reference's sliding indicator.
  const railX = w * 0.61, railY = h * 0.85, railW = w * 0.21;
  ctx.beginPath(); ctx.roundRect(railX, railY, railW, 12, 6);
  ctx.fillStyle = "rgba(112,150,168,.045)"; ctx.fill();
  ctx.strokeStyle = `rgba(${blueBright},.18)`; ctx.stroke();
  dot(railX + railW * (0.5 + Math.sin(time * 0.026) * 0.43), railY + 6, 2.5, amber, 0.65);
  ctx.globalAlpha = 1;
  paintRecursiveComposition(ctx, root.x, root.y, root.radius, time, innerAlpha, recursion.progress);
  ctx.restore();

  const vignette = ctx.createRadialGradient(w * 0.52, h * 0.47, unit * 0.16, w * 0.5, h * 0.5, Math.max(w, h) * 0.76);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,3,6,.035)");
  vignette.addColorStop(1, "rgba(0,3,6,.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};
