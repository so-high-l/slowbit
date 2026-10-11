import { background, glow, type ScenePainter } from "./drawing";

const noise = (i: number) => {
  const value = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const textures = new WeakMap<CanvasRenderingContext2D, CanvasPattern>();

// Retain the original scene identifier so saved mixes and favorites survive.
export const paintMorningLattice: ScenePainter = ({ ctx, w, h, t, focus = 0 }) => {
  if (w <= 0 || h <= 0) return;
  const curtain = Math.max(0, Math.min(1, focus));
  const unit = Math.min(w, h);
  background(ctx, w, h, "#242b2c", "#34332e");
  glow(ctx, w * 0.8, h * 0.35, Math.max(w, h) * 0.8, `rgba(225,194,140,${0.26 - curtain * 0.23})`);

  // A softly feathered projection from an unseen window, angled across plaster.
  const drift = Math.sin(t * 0.007) * unit * 0.018;
  const lightWidth = Math.min(w * 0.61, h * 0.83);
  const lightHeight = h * 0.79;
  ctx.save();
  ctx.translate(w * 0.68 + drift, h * 0.43 + Math.sin(t * 0.005) * unit * 0.008);
  ctx.transform(1, -0.12, -0.26, 1, 0, 0);
  ctx.globalAlpha = 1 - curtain * 0.88;
  ctx.filter = `blur(${Math.max(5, unit * (0.012 + curtain * 0.014))}px)`;
  const light = ctx.createLinearGradient(-lightWidth / 2, -lightHeight / 2, lightWidth / 2, lightHeight / 2);
  light.addColorStop(0, "rgba(242,224,185,.58)");
  light.addColorStop(0.6, "rgba(235,208,158,.42)");
  light.addColorStop(1, "rgba(220,191,139,.16)");
  ctx.fillStyle = light;
  const gap = unit * 0.024;
  const paneW = (lightWidth - gap) / 2;
  const paneH = (lightHeight - gap) / 2;
  // The curtain's shadow travels across the window projection. Shortening the
  // panes before blurring keeps the moving edge soft, including on small screens.
  const shadowEdge = -lightWidth / 2 + lightWidth * curtain;
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 2; column++) {
      const paneLeft = -lightWidth / 2 + column * (paneW + gap);
      const left = Math.max(paneLeft, shadowEdge);
      const width = Math.max(0, paneLeft + paneW - left);
      if (width > 0) ctx.fillRect(left, -lightHeight / 2 + row * (paneH + gap), width, paneH);
    }
  }
  ctx.restore();

  // Broad translucent folds settle over the projection, without attention-seeking motion.
  if (curtain > 0.001) {
    const folds = ctx.createLinearGradient(w * 0.35, 0, w, 0);
    for (let i = 0; i <= 12; i++) {
      folds.addColorStop(i / 12, `rgba(18,24,27,${curtain * (i % 2 ? 0.12 : 0.26)})`);
    }
    ctx.fillStyle = folds;
    ctx.fillRect(0, 0, w, h);
  }

  // A passing veil of cloud changes illumination without a visible moving object.
  const veil = ctx.createLinearGradient(0, 0, w, h);
  veil.addColorStop(0, "rgba(11,20,25,.08)");
  veil.addColorStop(1, `rgba(21,27,30,${0.035 + (Math.sin(t * 0.018) + 1) * 0.025})`);
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, w, h);

  // Cache a deterministic plaster texture: no per-frame noise or flicker.
  let texture = textures.get(ctx);
  if (!texture) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = 256;
    const paint = tile.getContext("2d");
    if (paint) {
      for (let i = 0; i < 5000; i++) {
        paint.fillStyle = i % 2 ? "rgba(239,229,205,.035)" : "rgba(8,17,22,.05)";
        paint.fillRect(noise(i) * 256, noise(i + 7000) * 256, 0.5 + noise(i + 9000), 0.6);
      }
      texture = ctx.createPattern(tile, "repeat") ?? undefined;
      if (texture) textures.set(ctx, texture);
    }
  }
  if (texture) { ctx.fillStyle = texture; ctx.fillRect(0, 0, w, h); }

  // Leave the title side quiet and dark, while retaining the warm wall surface.
  const shade = ctx.createLinearGradient(0, 0, w, 0);
  shade.addColorStop(0, "rgba(7,16,22,.48)");
  shade.addColorStop(0.48, "rgba(7,16,22,.10)");
  shade.addColorStop(1, "rgba(7,16,22,.03)");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
};
