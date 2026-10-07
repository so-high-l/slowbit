import type { Mood, Visual, SoundId } from "@/lib/types";
export const moods: {
  id: Mood;
  name: string;
  description: string;
  symbol: string;
}[] = [
    {
      id: "fried",
      name: "Fried",
      description: "Too many tabs in my head",
      symbol: "◌",
    },
    {
      id: "restless",
      name: "Restless",
      description: "A little too much energy",
      symbol: "≈",
    },
    {
      id: "stuck",
      name: "Stuck on a bug",
      description: "Time for a fresh perspective",
      symbol: "⌘",
    },
    {
      id: "overstimulated",
      name: "Overstimulated",
      description: "Everything feels a bit loud",
      symbol: "⊙",
    },
    {
      id: "chill",
      name: "Just chill",
      description: "No reason needed",
      symbol: "☾",
    },
  ];
export const visuals: Visual[] = [
  {
    id: "rain",
    name: "Rainy window",
    subtitle: "Let the world blur a little.",
    tags: ["Rain", "Slow"],
    recommendedMoods: ["fried", "overstimulated"],
    defaultSounds: { rain: 0.35, wind: 0.08, brown: 0.08 },
  },
  {
    id: "aurora",
    name: "Northern lights",
    subtitle: "Nothing to do. Just look up.",
    tags: ["Fluid", "Dreamy"],
    recommendedMoods: ["stuck", "chill"],
    defaultSounds: { wind: 0.18, brown: 0.05, tones: 0.38 },
  },
  {
    id: "stars",
    name: "After midnight",
    subtitle: "A little perspective, a lot of space.",
    tags: ["Stars", "Still"],
    recommendedMoods: ["overstimulated", "chill"],
    defaultSounds: { night: 0.22, wind: 0.06, tones: 0.16 },
  },
  {
    id: "embers",
    name: "Slow burn",
    subtitle: "Some things can wait.",
    tags: ["Warm", "Grounding"],
    recommendedMoods: ["restless", "fried"],
    defaultSounds: { fire: 0.38, forest: 0.08, tones: 0.1 },
  },
  {
    id: "drift",
    name: "Weightless",
    subtitle: "Let your thoughts float past.",
    tags: ["Soft", "Floating"],
    recommendedMoods: ["restless", "stuck"],
    defaultSounds: { forest: 0.24, wind: 0.1, tones: 0.22 },
  },
  {
    id: "ocean",
    name: "Open water",
    subtitle: "Let the surface carry the noise.",
    tags: ["Water", "Slow"],
    recommendedMoods: ["fried", "chill"],
    defaultSounds: {
      wind: 0.12,
      tones: 0.14,
      brown: 0.05,
    },
  },
  {
    id: "pond",
    name: "Still pond",
    subtitle: "Nothing needs to move quickly.",
    tags: ["Water", "Minimal", "Slow"],
    recommendedMoods: ["fried", "chill"],
    defaultSounds: { wind: 0.12, tones: 0.08, brown: 0.04 },
  },
  {
    id: "mist",
    name: "Quiet forest",
    subtitle: "Let the distance soften.",
    tags: ["Forest", "Fog", "Nature"],
    recommendedMoods: ["overstimulated", "fried"],
    defaultSounds: { forest: 0.28, wind: 0.12, brown: 0.05 },
  },
  {
    id: "snow",
    name: "First snow",
    subtitle: "Watch the world slow down.",
    tags: ["Snow", "Night", "Slow"],
    recommendedMoods: ["restless", "chill"],
    defaultSounds: { wind: 0.08, tones: 0.12, brown: 0.06 },
  },
  {
    id: "dunes",
    name: "Slow dunes",
    subtitle: "There is nowhere to rush.",
    tags: ["Desert", "Warm", "Minimal"],
    recommendedMoods: ["fried", "stuck"],
    defaultSounds: { wind: 0.18, tones: 0.09 },
  },
  {
    id: "clouds",
    name: "Above the clouds",
    subtitle: "There is space above the noise.",
    tags: ["Sky", "Clouds", "Soft"],
    recommendedMoods: ["overstimulated", "chill"],
    defaultSounds: { wind: 0.1, tones: 0.16 },
  },
  {
    id: "jelly",
    name: "Deep blue",
    subtitle: "Let yourself drift.",
    tags: ["Water", "Deep", "Floating"],
    recommendedMoods: ["restless", "chill"],
    defaultSounds: { wind: 0.14, tones: 0.18, brown: 0.04 },
  },
  {
    id: "meadow",
    name: "Evening meadow",
    subtitle: "Stay until the light gets quiet.",
    tags: ["Nature", "Dusk", "Fireflies"],
    recommendedMoods: ["fried", "chill"],
    defaultSounds: { forest: 0.2, wind: 0.08, night: 0.15 },
  },
  {
    id: "lantern",
    name: "Paper lantern",
    subtitle: "A little light is enough.",
    tags: ["Warm", "Minimal", "Dark"],
    recommendedMoods: ["overstimulated", "restless"],
    defaultSounds: { brown: 0.12, tones: 0.1, night: 0.06 },
  },
  {
    id: "ink",
    name: "Slow ink",
    subtitle: "Let the edges disappear.",
    tags: ["Abstract", "Fluid", "Dark"],
    recommendedMoods: ["stuck", "restless"],
    defaultSounds: { tones: 0.16, brown: 0.08 },
  },
  {
    id: "vinyl",
    name: "Late night record",
    subtitle: "Nothing left to solve tonight.",
    tags: ["Warm", "Night", "Cozy"],
    recommendedMoods: ["stuck", "chill"],
    defaultSounds: { rain: 0.08, tones: 0.12, night: 0.1 },
  },
  {
    id: "nightSky",
    name: "Night sky",
    subtitle: "Look up and let it pass.",
    tags: ["Sky", "Stars", "Night"],
    recommendedMoods: ["fried", "chill", "restless"],
    defaultSounds: { wind: 0.08, tones: 0.14, night: 0.12 },
  },
];
export const sounds: { id: SoundId; name: string; note: string }[] = [
  { id: "rain", name: "Rain", note: "Soft, steady rainfall" },
  { id: "fire", name: "Fire", note: "Warm crackle" },
  { id: "wind", name: "Wind", note: "A slow passing breeze" },
  { id: "forest", name: "Forest", note: "Leaves and distant birds" },
  { id: "brown", name: "Brown noise", note: "Deep, gentle texture" },
  { id: "night", name: "Night ambience", note: "Crickets in the distance" },
];
sounds.push({
  id: "tones",
  name: "Soft tones",
  note: "A slow, warm ambient chord",
});
export const durations = [5, 10, 15, null];
