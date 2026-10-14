import type { VisualId } from "../../lib/types";
import { glow } from "./drawing.ts";

type LightStyle = { color: string; x: number; y: number; spread: number; reflection?: boolean };

// One quiet guide, with the color and placement of each scene's own light.
export const sceneLights: Record<VisualId, LightStyle> = {
  focusComingSoon: { color: "192,212,220", x: 0.5, y: 0.5, spread: 0 },
  quietMachine: { color: "221,191,144", x: 0.55, y: 0.48, spread: 0.07 },
  nightDrive: { color: "245,181,110", x: 0.5, y: 0.48, spread: 0 },
  readingRoom: { color: "245,174,95", x: 0.73, y: 0.45, spread: 0 },
  orbitStudy: { color: "218,230,248", x: 0.61, y: 0.38, spread: 0.10 },
  morningLattice: { color: "249,216,158", x: 0.70, y: 0.42, spread: 0.06, reflection: true },
  rain: { color: "204,222,237", x: 0.61, y: 0.42, spread: 0.07, reflection: true },
  aurora: { color: "163,235,207", x: 0.55, y: 0.36, spread: 0.16 },
  stars: { color: "209,224,247", x: 0.56, y: 0.42, spread: 0.10 },
  embers: { color: "248,186,111", x: 0.52, y: 0.46, spread: 0.07 },
  drift: { color: "204,232,222", x: 0.55, y: 0.43, spread: 0.10 },
  ocean: { color: "179,222,231", x: 0.58, y: 0.57, spread: 0.12, reflection: true },
  pond: { color: "208,231,184", x: 0.58, y: 0.53, spread: 0.10, reflection: true },
  mist: { color: "161,227,192", x: 0.58, y: 0.48, spread: 0.09 },
  snow: { color: "218,234,250", x: 0.57, y: 0.43, spread: 0.11 },
  dunes: { color: "242,204,156", x: 0.59, y: 0.51, spread: 0.10, reflection: true },
  clouds: { color: "238,227,207", x: 0.58, y: 0.42, spread: 0.13 },
  jelly: { color: "139,227,236", x: 0.55, y: 0.48, spread: 0.10 },
  meadow: { color: "238,224,148", x: 0.60, y: 0.44, spread: 0.11 },
  lantern: { color: "243,204,148", x: 0.63, y: 0.38, spread: 0.08, reflection: true },
  ink: { color: "197,221,217", x: 0.57, y: 0.46, spread: 0.10 },
  vinyl: { color: "241,199,146", x: 0.72, y: 0.35, spread: 0.025, reflection: true },
  nightSky: { color: "206,224,246", x: 0.58, y: 0.32, spread: 0.13 },
  thread: { color: "227,208,234", x: 0.57, y: 0.46, spread: 0.10 },
  ribbonTunnel: { color: "195,223,241", x: 0.55, y: 0.45, spread: 0.07 },
  magneticField: { color: "169,226,222", x: 0.58, y: 0.44, spread: 0.10 },
};

export function followLightPosition(scene: VisualId, t: number, reducedMotion = false) {
  const style = sceneLights[scene];
  const time = reducedMotion ? 0 : t;
  return {
    x: style.x + Math.sin(time * 0.085) * style.spread,
    y: style.y + Math.sin(time * 0.065) * style.spread * 0.55,
  };
}

export function paintFollowLight(
  ctx: CanvasRenderingContext2D, scene: VisualId, w: number, h: number,
  t: number, strength: number, reducedMotion = false,
) {
  if (strength <= 0.005 || w <= 0 || h <= 0) return;
  const style = sceneLights[scene];
  const point = followLightPosition(scene, t, reducedMotion);
  const size = Math.min(1, w / 650, h / 550);
  const pulse = reducedMotion ? 1 : 0.94 + Math.sin(t * 0.38) * 0.06;
  ctx.save();
  ctx.globalAlpha *= Math.max(0, Math.min(1, strength)) * pulse;
  ctx.translate(point.x * w, point.y * h);
  ctx.scale(size, size);
  if (style.reflection) ctx.scale(1.7, 0.6);
  glow(ctx, 0, 0, 44, `rgba(${style.color},0.075)`);
  glow(ctx, 0, 0, 13, `rgba(${style.color},0.24)`);
  ctx.beginPath();
  ctx.arc(0, 0, style.reflection ? 1.4 : 2.1, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${style.color},0.72)`;
  ctx.fill();
  ctx.restore();
}
