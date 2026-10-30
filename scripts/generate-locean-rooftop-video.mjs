import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "public/videos/locean-rooftop/source-master.png");
const outputDir = path.join(root, "public/videos/locean-rooftop");
const fps = 24;
const seconds = 8;
const frames = fps * seconds;
const width = 960;
const height = 540;
const ocean = { x: 1000, y: 460, width: 920, height: 320 };

function run(args, frameFactory) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      stdio: [frameFactory ? "pipe" : "ignore", "inherit", "inherit"],
    });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)));
    if (!frameFactory) return;
    (async () => {
      for (let frame = 0; frame < frames; frame++) {
        if (!child.stdin.write(frameFactory(frame))) await new Promise(resolveDrain => child.stdin.once("drain", resolveDrain));
      }
      child.stdin.end();
    })().catch(error => child.stdin.destroy(error));
  });
}

function readOceanPixels() {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-i", source,
    "-vf", `scale=1920:1080:flags=lanczos,crop=${ocean.width}:${ocean.height}:${ocean.x}:${ocean.y}`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1",
  ], { encoding: null, maxBuffer: ocean.width * ocean.height * 4 + 1024 * 1024 });
  if (result.status !== 0 || result.stdout.length !== ocean.width * ocean.height * 4)
    throw new Error(result.stderr?.toString() || "Unable to read the ocean crop");
  return result.stdout;
}

function seeded(index) {
  const value = Math.sin(index * 91.731 + 17.113) * 43758.5453;
  return value - Math.floor(value);
}

function blendPixel(buffer, x, y, red, green, blue, alpha) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= width || y < 0 || y >= height || alpha <= 0) return;
  const offset = (y * width + x) * 4;
  const oldAlpha = buffer[offset + 3] / 255;
  const nextAlpha = alpha / 255;
  const combined = nextAlpha + oldAlpha * (1 - nextAlpha);
  if (combined <= 0) return;
  buffer[offset] = Math.round((red * nextAlpha + buffer[offset] * oldAlpha * (1 - nextAlpha)) / combined);
  buffer[offset + 1] = Math.round((green * nextAlpha + buffer[offset + 1] * oldAlpha * (1 - nextAlpha)) / combined);
  buffer[offset + 2] = Math.round((blue * nextAlpha + buffer[offset + 2] * oldAlpha * (1 - nextAlpha)) / combined);
  buffer[offset + 3] = Math.round(combined * 255);
}

function rectangle(buffer, x, y, w, h, color, alpha) {
  for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
    for (let px = Math.floor(x); px < Math.ceil(x + w); px++) blendPixel(buffer, px, py, ...color, alpha);
  }
}

function glow(buffer, cx, cy, radius, color, alpha) {
  const limit = Math.ceil(radius);
  for (let y = -limit; y <= limit; y++) {
    for (let x = -limit; x <= limit; x++) {
      const distance = Math.hypot(x, y) / radius;
      if (distance >= 1) continue;
      blendPixel(buffer, cx + x, cy + y, ...color, alpha * (1 - distance) ** 2);
    }
  }
}

function petal(buffer, x, y, size, phase, color, alpha) {
  const vertical = Math.sin(phase * Math.PI * 2) > 0;
  if (vertical) {
    rectangle(buffer, x, y + 1, size, size + 2, color, alpha);
    rectangle(buffer, x - 1, y + 2, size + 2, size, color, alpha);
  } else {
    rectangle(buffer, x + 1, y, size + 2, size, color, alpha);
    rectangle(buffer, x, y - 1, size, size + 2, color, alpha);
  }
}

function sampleOcean(sourcePixels, x, y, channel) {
  const left = Math.max(0, Math.min(ocean.width - 1, Math.floor(x)));
  const right = Math.max(0, Math.min(ocean.width - 1, left + 1));
  const top = Math.max(0, Math.min(ocean.height - 1, Math.floor(y)));
  const bottom = Math.max(0, Math.min(ocean.height - 1, top + 1));
  const tx = x - Math.floor(x);
  const ty = y - Math.floor(y);
  const at = (px, py) => sourcePixels[(py * ocean.width + px) * 4 + channel];
  const upper = at(left, top) * (1 - tx) + at(right, top) * tx;
  const lower = at(left, bottom) * (1 - tx) + at(right, bottom) * tx;
  return Math.round(upper * (1 - ty) + lower * ty);
}

function drawOcean(frame, sourcePixels) {
  const output = Buffer.alloc(sourcePixels.length);
  const phase = frame / frames;
  const cycle = phase * Math.PI * 2;
  for (let y = 0; y < ocean.height; y++) {
    const globalY = ocean.y + y;
    if (globalY < 480) continue;
    const leftEdge = 1320;
    const rowShift = Math.sin(cycle + y * 0.105) * 1.05 + Math.sin(cycle * 2 - y * 0.047) * 0.38;
    for (let x = 0; x < ocean.width; x++) {
      const globalX = ocean.x + x;
      const bottomEdge = globalX > 1750 ? 580 : Math.min(615, 560 + (globalX - leftEdge) * 0.12);
      if (globalX < leftEdge || globalY > bottomEdge) continue;
      const verticalShift = Math.sin(cycle + x * 0.031 + y * 0.021) * 0.42;
      const edgeDistance = Math.min(globalX - leftEdge, globalY - 480, bottomEdge - globalY, ocean.x + ocean.width - 1 - globalX);
      const feather = Math.max(0, Math.min(1, edgeDistance / 10));
      if (feather <= 0) continue;
      const sourceOffset = (y * ocean.width + x) * 4;
      const red = sourcePixels[sourceOffset];
      const green = sourcePixels[sourceOffset + 1];
      const blue = sourcePixels[sourceOffset + 2];
      // Keep dark rocks and foreground plants anchored; only colored water and foam deform.
      const luminance = red * 0.21 + green * 0.72 + blue * 0.07;
      const likelyFoliage = green > red * 0.72 && green > blue * 0.92 && luminance < 105;
      if (likelyFoliage || luminance < 24) continue;
      const target = sourceOffset;
      output[target] = sampleOcean(sourcePixels, x + rowShift, y + verticalShift, 0);
      output[target + 1] = sampleOcean(sourcePixels, x + rowShift, y + verticalShift, 1);
      output[target + 2] = sampleOcean(sourcePixels, x + rowShift, y + verticalShift, 2);
      output[target + 3] = Math.round(245 * feather);
    }
  }
  return output;
}

function drawOverlay(frame) {
  const buffer = Buffer.alloc(width * height * 4);
  const phase = frame / frames;
  const cycle = phase * Math.PI * 2;

  // The half-submerged sun breathes almost imperceptibly.
  const sunBreath = 0.5 + 0.5 * Math.sin(cycle - 0.7);
  glow(buffer, 847, 232, 31, [255, 83, 30], 5 + sunBreath * 7);

  // Kasbah and promenade lights twinkle on unrelated, slow phases.
  for (let index = 0; index < 30; index++) {
    const x = 292 + index * 12.4 + seeded(index + 500) * 5;
    const y = 201 + seeded(index + 530) * 21;
    const pulse = 0.5 + 0.5 * Math.sin(cycle * (1 + Math.floor(seeded(index + 560) * 3)) + seeded(index + 590) * Math.PI * 2);
    rectangle(buffer, x, y, 1, 1, [255, 193, 92], 18 + pulse * 54);
    if (pulse > 0.82) blendPixel(buffer, x + 1, y, 255, 147, 55, (pulse - 0.82) * 95);
  }

  // Existing lanterns warm and cool independently, like real flames behind wicker.
  const lanterns = [
    [96, 93, 23, 0.2], [301, 110, 14, 1.8], [263, 359, 11, 3.2], [867, 414, 18, 4.4],
  ];
  for (const [x, y, radius, offset] of lanterns) {
    const flicker = 0.5 + 0.5 * Math.sin(cycle * 3 + offset) * Math.sin(cycle + offset * 0.7);
    glow(buffer, x, y, radius, [255, 147, 54], 5 + flicker * 8);
    rectangle(buffer, x - 1, y - 1, 3, 3, [255, 225, 149], 12 + flicker * 28);
  }

  // A sparse bougainvillea fall gives the foreground life without becoming a particle effect.
  const petalColors = [[237, 135, 134], [255, 187, 150], [221, 95, 119], [248, 211, 178]];
  for (let index = 0; index < 19; index++) {
    const cycles = seeded(index + 710) > 0.76 ? 2 : 1;
    const local = (phase * cycles + seeded(index + 730)) % 1;
    const startX = 45 + seeded(index + 760) * 475;
    const drift = Math.sin(local * Math.PI * 4 + seeded(index + 780) * 6) * (8 + seeded(index + 800) * 18);
    const x = startX + drift + local * (8 + seeded(index + 820) * 26);
    const y = -12 + local * 520;
    const fade = Math.min(1, local * 8, (1 - local) * 8);
    petal(buffer, x, y, index % 4 === 0 ? 2 : 1, local + seeded(index + 840), petalColors[index % petalColors.length], 65 * fade);
  }

  return buffer;
}

const temporary = await mkdtemp(path.join(tmpdir(), "slowbit-locean-"));
const oceanOverlay = path.join(temporary, "ocean.mov");
const atmosphereOverlay = path.join(temporary, "atmosphere.mov");
const filter = [
  `[0:v]scale=1920:1080:flags=lanczos,format=rgba[base]`,
  `[base][1:v]overlay=${ocean.x}:${ocean.y}:shortest=1:format=auto[water]`,
  `[2:v]scale=1920:1080:flags=neighbor[effects]`,
  `[water][effects]overlay=shortest=1:format=auto,format=yuv420p[video]`,
].join(";");

try {
  const oceanPixels = readOceanPixels();
  await run([
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${ocean.width}x${ocean.height}`, "-r", String(fps), "-i", "pipe:0",
    "-c:v", "qtrle", oceanOverlay,
  ], frame => drawOcean(frame, oceanPixels));
  await run([
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`, "-r", String(fps), "-i", "pipe:0",
    "-c:v", "qtrle", atmosphereOverlay,
  ], drawOverlay);

  const shared = [
    "-loop", "1", "-framerate", String(fps), "-i", source,
    "-i", oceanOverlay, "-i", atmosphereOverlay,
    "-filter_complex", filter, "-map", "[video]", "-t", String(seconds), "-r", String(fps),
  ];
  await run([
    ...shared, "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart",
    path.join(outputDir, "locean-rooftop-loop.mp4"),
  ]);
  await run([
    ...shared, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "25", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
    path.join(outputDir, "locean-rooftop-loop.webm"),
  ]);
  await run([
    "-i", source, "-vf", "scale=1920:1080:flags=lanczos", "-frames:v", "1", "-q:v", "2", path.join(outputDir, "poster.jpg"),
  ]);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
