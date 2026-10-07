import type { Mood, Preferences, Visual } from "./types";
export function recommend(
  catalog: Visual[],
  mood: Mood,
  prefs: Preferences,
  random = Math.random,
): Visual | undefined {
  const available = catalog.filter((v) => !prefs.hiddenVisuals.includes(v.id));
  const matching = available.filter((v) => v.recommendedMoods.includes(mood));
  const pool = matching.length ? matching : available;
  const weighted = pool.flatMap((v) =>
    prefs.favoriteVisuals.includes(v.id) ? [v, v] : [v],
  );
  return weighted[
    Math.min(weighted.length - 1, Math.floor(random() * weighted.length))
  ];
}
