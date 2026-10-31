export type MusicCredit = {
  artist: string;
  tracks: MusicTrackCredit[];
  href: string;
};

export type MusicTrackCredit = { title: string; scenes: string[] };
export type SceneMusicCredit = { scene: string; tracks: Array<{ title: string; artist: string; href: string }> };

const inScenes = (scenes: string[], titles: string[]): MusicTrackCredit[] =>
  titles.map(title => ({ title, scenes }));

const ondrosikTracks = [
  "Whispered", "ondrik and Ivanka", "A Bedtime Confession", "For ivanka 2",
  "Pilgrimage", "sunday evening", "Dotted Stories", "breakthrough version 2025",
  "Here Comes the Little Train", "For Ivanka 1", "Face in the Grass",
  "Cristal snowflakes", "nostalgic (version 2025)", "Violet music", "Falling stars",
  "Violet-Music-2025", "Fragile Memories", "nostalgic", "sweet home", "No words",
  "labirint",
];

const holiznaTracks = [
  "Drifting Piano", "So Broke", "Something In the Air",
  "Still Life (Lofi, Chill, Nostalgic)", "Theta Frequency (Lofi, Chill, Calm)",
  "Vintage", "Waves", "Whatever", "When Time Called Me Darling", "Windows Down",
  "Yesterday", "You Loved Me Once", "A Little Shade", "All The Way Sad", "Autumn",
  "Birds (LoFi, Chill)", "Blue Skies", "Cellar Door", "Clouds", "Come Again",
  "Everything You Ever Dreamed.", "Fractured", "Ghosts", "Glad To Be Stuck Inside",
  "Keeping Cool", "Laundry On The Wire", "Letting Go Of The Past", "Morning Coffee",
  "Mundane", "Poor, But Happy", "Pretty Little Lies", "Puppy Love", "Ramen",
  "Shut up, or shut in", "Small Towns Smaller Lives",
];

export const musicCredits: MusicCredit[] = [
  { artist: "Ondrosik", tracks: inScenes(["Sunlit Wall"], ondrosikTracks), href: "https://ondrosik.sk/music/" },
  { artist: "HoliznaCC0", tracks: [...inScenes(["Sunlit Wall"], [holiznaTracks[0]]), ...inScenes(["Japanese Corner Café", "Train Carriage"], holiznaTracks.slice(1))], href: "https://freemusicarchive.org/music/holiznacc0/" },
  { artist: "ZephiraMusic", tracks: inScenes(["Quiet Machine", "Train Carriage"], ["Lofi Background"]), href: "https://pixabay.com/users/zephiramusic-54643547/" },
  { artist: "SerenoMusic", tracks: inScenes(["Quiet Machine", "Train Carriage"], ["Abstract Chill"]), href: "https://pixabay.com/users/serenomusic-57694013/" },
  { artist: "HoggyArt", tracks: inScenes(["Chromatic Drift"], ["777 Hz Higher Angelic Frequencies"]), href: "https://pixabay.com/users/hoggyart-4203169/" },
  { artist: "Turning Pages", tracks: inScenes(["Night Drive", "Train Carriage"], ["Golden Hour Drive", "Night Drive"]), href: "https://youtube.com/@turningpages" },
  { artist: "OpenMind Audio", tracks: inScenes(["Night Drive", "Train Carriage"], ["Night Drive, Deep Mood", "Space Lounge, Chill Drift", "Shadow Bloom, Smooth Fade"]), href: "https://pixabay.com/users/openmindaudio-53602733/" },
  { artist: "knoodles", tracks: inScenes(["Quiet Machine", "Train Carriage"], ["Chill Hop Trap Lofi", "Chill House Midnight Drive", "Chill Trap Lofi Evening"]), href: "https://pixabay.com/music/trap-chill-hop-trap-lofi-558426/" },
  { artist: "DivineAwakeningFrequency", tracks: inScenes(["Chromatic Drift"], ["3. warm-soft ambient pad with gentle evolving cinematic okie #3.1", "ambient pad wide stereo airy alpha brainwave friendly", "ambient warm cinematic texture softly like glowing up 1", "drone warm halo texture ambient 9.1", "gentle bed slow soothing like soft movie Revelation frequency #5", "soft airy ambient pad warm angelic 9.3", "ultra clean ambient crystal air pad made only of smooth high frequency", "warm pad heart mind energy ambient"]), href: "https://pixabay.com/music/ambient-ambient-pad-wide-stereo-airy-alpha-brainwave-friendly-450942/" },
  { artist: "Liecio", tracks: [...inScenes(["Chromatic Drift"], ["Calming and Relaxing Meditation Music"]), ...inScenes(["Deep Passage"], ["Mysterious Drone Pad in Perfect Loop"])], href: "https://pixabay.com/music/meditationspiritual-calming-and-relaxing-meditation-music-110208/" },
  { artist: "Monument Music", tracks: inScenes(["Night Drive", "Train Carriage"], ["City Lights (Chill Lo-Fi)"]), href: "https://pixabay.com/music/beats-city-lights-chill-lo-fi-176145/" },
  { artist: "DF Wahyu Music Production", tracks: inScenes(["Night Drive", "Train Carriage"], ["Dreamy lo-fi"]), href: "https://pixabay.com/music/lofi-dreamy-lo-fi-456975/" },
  { artist: "Miyagisama", tracks: inScenes(["Night Drive", "Train Carriage"], ["Late Night Drive"]), href: "https://pixabay.com/music/beats-miyagisama-late-night-drive-9987/" },
  { artist: "DesiFreeMusic", tracks: inScenes(["Night Drive", "Train Carriage"], ["Chillhop Night Drive – Moody Lofi Groove"]), href: "https://pixabay.com/music/epic-classical-chillhop-night-drive-moody-lofi-groove-451182/" },
  { artist: "Tristan1234G34", tracks: inScenes(["Night Drive", "Train Carriage"], ["Night Drive Melody"]), href: "https://pixabay.com/music/lofi-night-drive-melody-469369/" },
  { artist: "Free Audio Library", tracks: inScenes(["Reading Room"], ["Amber Slowdance", "Coffee in Blue", "Crimson Latte", "Dreams Over Wood", "Evening Sketches", "Mellow Windows", "Shadows in Swing", "Soft Strings Café", "Twilight Reverb", "Whispers on 5th"]), href: "https://pixabay.com/users/free_audio_library-47261967/" },
  { artist: "Souhail EL MAHDANI", tracks: [...inScenes(["Reading Room"], ["Black And Brown Morning", "Grab A Coffee", "Noujoum Lil", "The Last Note"]), ...inScenes(["L’océan"], ["Dreamy Sunset", "Guembridiculous", "Kaddour Hits", "Geneve Groove", "Afromantic", "Jazzilian 2026", "Maybe Next Night", "Sunny Afternoon In Marrakesh", "Unresolved Thoughts"])], href: "https://github.com/so-high-l/slowbit" },
];

export const sceneMusicCredits: SceneMusicCredit[] = Array.from(
  musicCredits.reduce((scenes, credit) => {
    for (const track of credit.tracks) for (const scene of track.scenes) {
      const entries = scenes.get(scene) ?? [];
      entries.push({ title: track.title, artist: credit.artist, href: credit.href });
      scenes.set(scene, entries);
    }
    return scenes;
  }, new Map<string, SceneMusicCredit["tracks"]>()),
  ([scene, tracks]) => ({ scene, tracks }),
).sort((a, b) => a.scene.localeCompare(b.scene));
