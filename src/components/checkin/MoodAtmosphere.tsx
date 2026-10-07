import type { Mood } from "@/lib/types";

const atmospheres: { mood: Mood; image: string }[] = [
  { mood: "fried", image: "warm" },
  { mood: "burned_out", image: "warm" },
  { mood: "restless", image: "cool" },
  { mood: "stuck", image: "cool" },
  { mood: "overstimulated", image: "cool" },
  { mood: "chill", image: "sage" },
];

export default function MoodAtmosphere({ mood }: { mood: Mood }) {
  return (
    <div className="mood-atmosphere" aria-hidden="true">
      {atmospheres.map(atmosphere => (
        <div
          key={atmosphere.mood}
          data-atmosphere={atmosphere.mood}
          className={`atmosphere-layer ${mood === atmosphere.mood ? "is-current" : ""}`}
        >
          <img
            src={`/images/mood-${atmosphere.image}.png`}
            alt=""
            width={1484}
            height={1060}
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
