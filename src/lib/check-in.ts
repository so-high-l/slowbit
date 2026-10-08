import type { Mood, SoundId, VisualId } from "./types";

export interface CheckInProfile {
  label: string;
  title: string;
  scene: VisualId;
  description: string;
  pace: number;
  mix: Partial<Record<SoundId, number>>;
  opening: [string, string, string];
}

export const checkIns: Record<Mood, CheckInProfile> = {
  fried: {
    label: "Fried", title: "Fried.", scene: "rain", pace: 0.45,
    description: "Rain. Low sound. Very little movement.",
    mix: { rain: 0.4, brown: 0.07 },
    opening: ["You picked fried.", "That can mean a lot of things.", "We’ll start with less sound. Less movement. Less happening."],
  },
  restless: {
    label: "Restless", title: "Restless.", scene: "drift", pace: 0.8,
    description: "Drifting particles. Leaves. A little room to wander.",
    mix: { forest: 0.18, wind: 0.08, tones: 0.15 },
    opening: ["You picked restless.", "Sitting still might not be the thing right now.", "There’s something moving here. You can follow it, or not."],
  },
  stuck: {
    label: "Stuck", title: "Stuck.", scene: "aurora", pace: 0.7,
    description: "Slow colour. Soft tones. Something else to look at.",
    mix: { wind: 0.12, tones: 0.22 },
    opening: ["You picked stuck.", "We won’t try to solve it here.", "For a few minutes, something else on the screen."],
  },
  overstimulated: {
    label: "Too much", title: "Too much.", scene: "stars", pace: 0.25,
    description: "A still sky. A low hum. Nothing in the foreground.",
    mix: { brown: 0.09, night: 0.06 },
    opening: ["You picked too much.", "We’ll keep this one sparse.", "A little sound. An almost-still sky. No more questions."],
  },
  chill: {
    label: "Just here", title: "Just here.", scene: "embers", pace: 0.6,
    description: "Warm embers. A quiet crackle. No particular reason.",
    mix: { fire: 0.38, tones: 0.08, forest: 0.05 },
    opening: ["You’re just here.", "That’s enough of a reason.", "We’ve put the fire on. Change anything you like."],
  },
  burned_out: {
    label: "Burned out",
    title: "Burned out.",
    scene: "ocean",
    pace: 0.5,
    description: "Open water. A slow surface. Nothing asking for your attention.",
    mix: { wind: 0.12, tones: 0.1 },
    opening: [
      "You picked burned out.",
      "We won’t turn this break into another task.",
      "Let the water do the moving.",
    ],
  },
};

export const stationOrder: Mood[] = ["fried", "restless", "stuck", "overstimulated", "chill", 'burned_out'];
export function checkInMix(mood: Mood): Record<SoundId, number> {
  return { rain: 0, fire: 0, wind: 0, forest: 0, brown: 0, night: 0, tones: 0, ...checkIns[mood].mix };
}
export function availableCheckInScene(mood: Mood, hidden: VisualId[]): VisualId | undefined {
  const preferred = checkIns[mood].scene;
  return !hidden.includes(preferred) ? preferred : ([
    "rain", "drift", "aurora", "stars", "embers", "ocean",
    "pond", "mist", "snow", "dunes", "clouds", "jelly",
    "meadow", "lantern", "ink", "vinyl", "nightSky",
    "thread", "ribbonTunnel", "magneticField",
  ] as VisualId[]).find(id => !hidden.includes(id));
}
