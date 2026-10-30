import type { CSSProperties } from "react";
import {
  Blend, BookOpen, Brush, CarFront, CircleDashed, Cloud, CloudRain, Coffee,
  Construction, Disc3, Droplets, Feather, Fish, Flame, Flower2, Gauge, Infinity,
  Lamp, Magnet, MoonStar, Orbit, Snowflake, Sparkles, Spline, Star, SunMedium,
  TrainFront, Waves, type LucideIcon,
} from "lucide-react";
import type { VisualId } from "@/lib/types";
import { scenePreviewThemes, type ScenePreviewIcon } from "@/lib/scene-previews";

type ScenePreviewProps = { scene: VisualId; className?: string };

const icons: Record<ScenePreviewIcon, LucideIcon> = {
  blend: Blend, book: BookOpen, brush: Brush, car: CarFront, circle: CircleDashed,
  cloud: Cloud, coffee: Coffee, construction: Construction, disc: Disc3,
  droplets: Droplets, feather: Feather, fish: Fish, flame: Flame, flower: Flower2,
  gauge: Gauge, infinity: Infinity, lamp: Lamp, magnet: Magnet, moon: MoonStar,
  orbit: Orbit, rain: CloudRain, snow: Snowflake, sparkles: Sparkles, spline: Spline,
  star: Star, sun: SunMedium, train: TrainFront, waves: Waves,
};

export default function ScenePreview({ scene, className = "" }: ScenePreviewProps) {
  const theme = scenePreviewThemes[scene];
  const Icon = icons[theme.icon];
  const style = {
    "--scene-preview-accent": theme.accent,
    "--scene-preview-surface": theme.surface,
  } as CSSProperties;

  return (
    <div className={`scene-preview scene-preview-icon ${className}`.trim()} data-scene={scene} style={style} aria-hidden="true">
      <span className="scene-preview-icon-halo" />
      <Icon className="scene-preview-glyph" strokeWidth={1.35} />
    </div>
  );
}
