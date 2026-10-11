import { background, glow, type SceneFrame } from "./drawing.ts";
import { createImageAssetCache } from "./image-assets.ts";
import { orbitEffects, projectOrbit, type OrbitMotion } from "./orbit-motion.ts";

const assetRoot = "/images/orbit-study/";
export const orbitAssetPaths = {
  sun: `${assetRoot}glowing_solar_disk_with_fiery_prominences.png`,
  mercury: `${assetRoot}crat_ered_mercury_style_planet.png`,
  venus: `${assetRoot}venus_in_golden_cloud_bands.png`,
  earth: `${assetRoot}western_hemisphere_earth_globe.png`,
  mars: `${assetRoot}detailed_mars_planet_isolated_on_transparent_backg.png`,
  jupiter: `${assetRoot}detailed_jupiter_with_great_red_spot.png`,
  saturn: `${assetRoot}isolated_saturn_with_detailed_rings.png`,
  uranus: `${assetRoot}icy_blue_planet_with_wispy_bands.png`,
  neptune: `${assetRoot}neptune_like_blue_planet_isolated.png`,
};
export const orbitImages = createImageAssetCache(orbitAssetPaths);

// Sizes are full image footprints, not radii. Keep the inner orbits intimate
// and give the outer system progressively more breathing room.
export const orbitPlanets = [
  { key: "mercury", radius: 0.08, angle: -0.6, size: 0.014, color: "#9b9c99" },
  { key: "venus", radius: 0.115, angle: -2.25, size: 0.020, color: "#ccb887" },
  { key: "earth", radius: 0.155, angle: 3.12, size: 0.020, color: "#789fb6" },
  { key: "mars", radius: 0.20, angle: 1.02, size: 0.017, color: "#ae7960" },
  { key: "jupiter", radius: 0.285, angle: -0.35, size: 0.042, color: "#b9a18b" },
  { key: "saturn", radius: 0.38, angle: 2.38, size: 0.060, color: "#c2b596" },
  { key: "uranus", radius: 0.49, angle: -0.85, size: 0.026, color: "#86b7c3" },
  { key: "neptune", radius: 0.59, angle: 0.72, size: 0.025, color: "#6488c2" },
] as const;

export function orbitLayout(w: number, h: number, motion?: OrbitMotion) {
  const unit = Math.min(w, h);
  // Fit every ring inside the viewport, including portrait screens and cards.
  const orbitUnit = unit * 0.74;
  return {
    cx: w / 2, cy: h / 2, sunSize: unit * 0.070,
    planets: orbitPlanets.map(planet => ({
      ...planet,
      radius: planet.radius * orbitUnit,
      size: planet.size * unit,
      x: w / 2 + Math.cos(planet.angle + (motion?.[planet.key] ?? 0)) * planet.radius * orbitUnit,
      y: h / 2 + Math.sin(planet.angle + (motion?.[planet.key] ?? 0)) * planet.radius * orbitUnit,
    })),
  };
}

const noise = (n: number) => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const stars = Array.from({ length: 220 }, (_, i) => ({
  x: noise(i), y: noise(i + 200), size: i % 23 === 0 ? 1.1 : 0.35 + noise(i + 400) * 0.4,
  alpha: i % 47 === 0 ? 0.48 : 0.10 + noise(i + 600) * 0.17,
}));

// A fixed sparse belt, between Mars and Jupiter; never respawn or flicker.
export const orbitAsteroids = Array.from({ length: 56 }, (_, i) => ({
  angle: (i + noise(i + 800) * 0.7) / 56 * Math.PI * 2,
  radius: 0.232 + noise(i + 1000) * 0.028,
  size: 0.35 + noise(i + 1200) * 0.45,
  alpha: 0.10 + noise(i + 1400) * 0.14,
}));

function spatialSystem(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  layout: ReturnType<typeof orbitLayout>, orbit: OrbitMotion,
  effect: ReturnType<typeof orbitEffects>,
) {
  const { cx, cy, sunSize, planets } = layout;
  const unit = Math.min(w, h);
  const strength = effect.planeStrength;
  const detail = Math.max(0, (strength - 0.2) / 0.8);
  const dx = effect.x * unit, dy = effect.y * unit;
  const positions = planets.map(planet => {
    const angle = planet.angle + orbit[planet.key];
    const point = projectOrbit(planet.radius, angle, strength);
    const parallax = 0.35 + planet.radius / unit;
    return { ...planet, angle, point, x: cx + point.x + dx * parallax, y: cy + point.y + dy * parallax };
  }).sort((a, b) => a.point.depth - b.point.depth);
  const arc = (radius: number, start: number, end: number, alpha: number) => {
    const parallax = 0.35 + radius / unit;
    ctx.strokeStyle = `rgba(154,181,197,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx + dx * parallax, cy + dy * parallax, radius, radius * effect.planeY, effect.rotation, start, end);
    ctx.stroke();
  };
  const drawHalf = (front: boolean) => {
    ctx.lineWidth = 0.6;
    for (const planet of planets) {
      arc(planet.radius, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2,
        effect.lineAlpha * (front ? 1 + 0.15 * strength : 1 - 0.38 * strength));
    }
    // Eighteen-degree tails: the oldest segments fade into the background.
    if (detail > 0) {
      for (const planet of positions) {
        for (let segment = 0; segment < 12; segment++) {
          const start = planet.angle - Math.PI / 10 * (1 - segment / 12);
          const end = start + Math.PI / 120;
          if ((Math.sin((start + end) / 2) >= 0) !== front) continue;
          ctx.lineWidth = 1;
          arc(planet.radius, start, end, detail * 0.11 * ((segment + 1) / 12) ** 2);
        }
      }
      for (const asteroid of orbitAsteroids) {
        const point = projectOrbit(asteroid.radius * unit * 0.74, asteroid.angle + orbit.elapsed * 0.0015, strength);
        if ((point.depth >= 0) !== front) continue;
        const parallax = 0.35 + asteroid.radius * 0.74;
        ctx.fillStyle = `rgba(170,186,195,${asteroid.alpha * detail * (front ? 1 : 0.65)})`;
        ctx.beginPath();
        ctx.arc(cx + point.x + dx * parallax, cy + point.y + dy * parallax, asteroid.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  const drawPlanets = (front: boolean) => {
    for (const planet of positions) {
      if ((planet.point.depth >= 0) !== front) continue;
      body(ctx, planet.key, planet.x, planet.y, planet.size * planet.point.sizeScale, planet.color);
    }
  };
  // Paint by depth so foreground bodies cover the sun and orbit strokes.
  drawHalf(false);
  drawPlanets(false);
  drawHalf(true);
  glow(ctx, cx + dx * 1.1, cy + dy * 1.1, sunSize * 1.2 * effect.pulse, "rgba(243,183,91,.10)");
  body(ctx, "sun", cx + dx * 1.1, cy + dy * 1.1, sunSize, "#e5bc78");
  drawPlanets(true);
}

function body(ctx: CanvasRenderingContext2D, key: keyof typeof orbitAssetPaths, x: number, y: number, size: number, color: string) {
  const image = orbitImages.get(key);
  if (image) {
    const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
    return;
  }
  // Intentional, quiet markers while loading or when a local PNG is missing.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * (key === "saturn" ? 0.26 : 0.42), 0, Math.PI * 2);
  ctx.fill();
  if (key === "saturn") {
    ctx.strokeStyle = "rgba(194,181,150,.65)";
    ctx.lineWidth = Math.max(0.6, size * 0.045);
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.48, size * 0.12, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export const paintOrbitStudy = ({ ctx, w, h, orbit, reducedMotion = false }: SceneFrame & { orbit?: OrbitMotion; reducedMotion?: boolean }) => {
  if (w <= 0 || h <= 0) return;
  const { cx, cy, sunSize, planets } = orbitLayout(w, h, reducedMotion ? undefined : orbit);
  const unit = Math.min(w, h);
  const effect = orbitEffects(orbit, reducedMotion);
  const dx = effect.x * unit, dy = effect.y * unit;
  ctx.save();
  background(ctx, w, h, "#02070d", "#05111a");
  glow(ctx, cx, cy, unit * 0.65, "rgba(32,67,86,.10)");
  for (const star of stars) {
    ctx.fillStyle = `rgba(204,224,236,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x * w - dx * 0.3, star.y * h - dy * 0.3, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  if (effect.scale !== 1) {
    ctx.translate(cx, cy);
    ctx.scale(effect.scale, effect.scale);
    ctx.translate(-cx, -cy);
  }
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = "rgba(139,173,192,.07)";
  ctx.beginPath();
  if (effect.planeStrength > 0) {
    const horizontal = projectOrbit(unit * 0.47, 0, effect.planeStrength);
    const vertical = projectOrbit(unit * 0.47, Math.PI / 2, effect.planeStrength);
    ctx.moveTo(cx - horizontal.x, cy - horizontal.y); ctx.lineTo(cx + horizontal.x, cy + horizontal.y);
    ctx.moveTo(cx - vertical.x, cy - vertical.y); ctx.lineTo(cx + vertical.x, cy + vertical.y);
  } else {
    ctx.moveTo(cx - unit * 0.47, cy); ctx.lineTo(cx + unit * 0.47, cy);
    ctx.moveTo(cx, cy - unit * 0.47); ctx.lineTo(cx, cy + unit * 0.47);
  }
  ctx.stroke();
  if (effect.planeStrength > 0 && orbit) {
    spatialSystem(ctx, w, h, { cx, cy, sunSize, planets }, orbit, effect);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = effect.lineAlpha === 0.20 ? "rgba(154,181,197,.20)" : `rgba(154,181,197,${effect.lineAlpha})`;
  for (const planet of planets) {
    const depth = 0.35 + planet.radius / unit;
    ctx.beginPath();
    ctx.arc(cx + dx * depth, cy + dy * depth, planet.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  glow(ctx, cx + dx * 1.1, cy + dy * 1.1, sunSize * 1.2 * effect.pulse, "rgba(243,183,91,.10)");
  body(ctx, "sun", cx + dx * 1.1, cy + dy * 1.1, sunSize, "#e5bc78");
  for (const planet of planets) {
    const depth = 0.35 + planet.radius / unit;
    body(ctx, planet.key, planet.x + dx * depth, planet.y + dy * depth, planet.size, planet.color);
  }
  ctx.restore();
};
