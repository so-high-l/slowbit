/** Original periodic, softly colored tape-like noise. No recording or tonal carrier. */
export function createAnalogTape(sampleRate: number, seconds = 24): Float32Array {
  const length = Math.max(2, Math.round(sampleRate * seconds));
  const noise = new Float32Array(length);
  let seed = 41077;
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noise[i] = seed / 2147483648 - 1;
  }
  // Warm the filter through one full cycle, then render the periodic steady state.
  // The smooth periodic envelope never drops out at the loop boundary.
  const result = new Float32Array(length);
  const coefficient = 1 - Math.exp(-2 * Math.PI * 1800 / sampleRate);
  let low = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < length; i++) {
      low += coefficient * (noise[i] - low);
      if (pass) result[i] = low * (0.87 + 0.07 * Math.sin(i / length * Math.PI * 2) + 0.035 * Math.sin(i / length * Math.PI * 6));
    }
  }
  return result;
}
