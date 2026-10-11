// Original Slowbit audio. Run with Node and ffmpeg installed; no sampled media.
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rate = 44100, seconds = 48, frames = rate * seconds;
const data = Buffer.alloc(frames * 4);
const voices = [110, 165, 220, 330]; // A stable open fifth; no melody or percussion.
const partials = [];
for (let voice = 0; voice < voices.length; voice++) {
  for (const detune of [-1, 1]) {
    for (let harmonic = 1; harmonic <= 5; harmonic++) {
      partials.push({
        // Integer cycles over the complete loop, including the slow detuning.
        frequency: (voices[voice] + detune / seconds) * harmonic,
        gain: 0.045 * Math.exp(-(harmonic - 1) * 0.9) / harmonic / (1 + voice * 0.65),
        phase: voice * 0.73 + harmonic * 0.31 + detune * 0.4,
        pan: detune * (0.15 + voice * 0.04),
      });
    }
  }
}
let peak = 0, energy = 0;
for (let i = 0; i < frames; i++) {
  const t = i / rate;
  let left = 0, right = 0;
  for (const p of partials) {
    const tone = Math.sin(2 * Math.PI * p.frequency * t + p.phase) * p.gain;
    left += tone * (1 - p.pan); right += tone * (1 + p.pan);
  }
  const breath = 0.94 + 0.06 * Math.cos(2 * Math.PI * t / seconds);
  left *= breath; right *= breath;
  peak = Math.max(peak, Math.abs(left), Math.abs(right));
  energy += left * left + right * right;
  data.writeInt16LE(Math.round(left * 32767), i * 4);
  data.writeInt16LE(Math.round(right * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4);
header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 4, 28);
header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
header.write("data", 36); header.writeUInt32LE(data.length, 40);
const temporary = mkdtempSync(join(tmpdir(), "slowbit-orbital-pad-"));
try {
  const wav = join(temporary, "orbital-pad-loop.wav");
  writeFileSync(wav, Buffer.concat([header, data]));
  const output = fileURLToPath(new URL("../public/audio/orbital-pad-loop.mp3", import.meta.url));
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "160k", "-map_metadata", "-1", output], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg exited ${result.status}`);
  console.log(`Generated 48s stereo pad. Peak ${peak.toFixed(4)}, RMS ${Math.sqrt(energy / (frames * 2)).toFixed(4)}.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
