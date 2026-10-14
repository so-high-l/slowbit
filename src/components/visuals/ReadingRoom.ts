import type { SceneFrame } from "./drawing.ts";
import { createImageAssetCache } from "./image-assets.ts";

const SOURCE_WIDTH = 1672;
const SOURCE_HEIGHT = 941;

export const readingRoomImagePaths = {
  dark: "/images/reading-room/Cozy%20Rainy%20Night%20Study%20dark.png",
  light: "/images/reading-room/Cozy%20Rainy%20Night%20Study.png",
} as const;

export const readingRoomImages = createImageAssetCache(readingRoomImagePaths);

type ReadingRoomAssets = Pick<typeof readingRoomImages, "get">;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  w: number,
  h: number,
  scale: number,
) {
  const cover = Math.max(w / SOURCE_WIDTH, h / SOURCE_HEIGHT) * scale;
  const width = SOURCE_WIDTH * cover;
  const height = SOURCE_HEIGHT * cover;
  ctx.drawImage(image, (w - width) / 2, (h - height) / 2, width, height);
}

/** The two source images share identical framing, so every frame uses one transform. */
export function paintReadingRoom(
  { ctx, w, h, t, particles, focus = 0, reducedMotion = false }: SceneFrame,
  assets: ReadingRoomAssets = readingRoomImages,
) {
  const progress = clamp01(focus);
  const light = progress * progress * (3 - 2 * progress);
  const motionTime = reducedMotion ? 0 : t;
  const breathing = reducedMotion ? 0 : Math.sin(motionTime * 0.12) * 0.003;
  const imageScale = 1.012 + breathing + light * (reducedMotion ? 0 : 0.022);
  const darkImage = assets.get("dark");
  const lightImage = assets.get("light");

  ctx.save();
  ctx.fillStyle = "#07101b";
  ctx.fillRect(0, 0, w, h);

  if (darkImage) drawCover(ctx, darkImage, w, h, imageScale);
  if (lightImage && (!darkImage || light > 0.001)) {
    ctx.globalAlpha = darkImage ? light : 1;
    drawCover(ctx, lightImage, w, h, imageScale);
    ctx.globalAlpha = 1;
    if (!darkImage && light < 1) {
      ctx.fillStyle = `rgba(2, 7, 14, ${0.68 * (1 - light)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // Rain remains outside the room and drifts only across the window panes.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w * 0.635, h * 0.66);
  ctx.clip();
  ctx.lineCap = "round";
  for (const [index, particle] of particles.slice(0, 34).entries()) {
    const x = particle.x * w * 0.68;
    const y = ((particle.y + motionTime * (0.012 + particle.s * 0.008)) % 1) * h * 0.72 - h * 0.04;
    const length = h * (0.018 + particle.r * 0.006);
    ctx.strokeStyle = `rgba(190, 215, 235, ${0.025 + (index % 4) * 0.008})`;
    ctx.lineWidth = Math.max(0.5, w / 2200);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - length * 0.18, y + length);
    ctx.stroke();
  }
  ctx.restore();

  if (light > 0.001) {
    const lampX = w * 0.735;
    const lampY = h * 0.46;
    const glow = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, Math.max(w, h) * 0.23);
    glow.addColorStop(0, `rgba(255, 185, 95, ${0.10 * light})`);
    glow.addColorStop(1, "rgba(255, 156, 65, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lampX - w * 0.28, lampY - h * 0.34, w * 0.56, h * 0.68);

    // A few warm motes make the newly lit side feel occupied without becoming a particle effect.
    for (const particle of particles.slice(34, 48)) {
      const x = w * (0.62 + particle.x * 0.34);
      const y = h * (0.14 + ((particle.y + motionTime * particle.s * 0.003) % 1) * 0.58);
      const twinkle = reducedMotion ? 0.55 : 0.45 + Math.sin(motionTime * 0.45 + particle.phase) * 0.15;
      ctx.fillStyle = `rgba(255, 222, 172, ${light * twinkle * 0.16})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, particle.r * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reducedMotion) {
      ctx.strokeStyle = `rgba(235, 226, 211, ${0.10 * light})`;
      ctx.lineWidth = Math.max(0.8, w / 1700);
      ctx.lineCap = "round";
      for (let strand = 0; strand < 2; strand++) {
        const sway = Math.sin(motionTime * 0.32 + strand * 2.1) * w * 0.004;
        const x = w * 0.718 + strand * w * 0.006;
        const y = h * 0.575;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x - w * 0.009, y - h * 0.035, x + sway + w * 0.01, y - h * 0.065, x + sway, y - h * 0.105);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
