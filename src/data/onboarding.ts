export const SESSION_TOUR_ID = "session-basics-v1";

export type TourStep = {
    target: "favorite" | "hide" | "audio" | "mute" | "playback" | "chat" | "scene-navigation";
    title: string;
    description: string;
};

export const sessionTourSteps: TourStep[] = [
    {
        target: "scene-navigation",
        title: "Explore at your own pace",
        description: "Move between scenes whenever you want. There’s no right way to unwind.",
    },
    {
        target: "playback",
        title: "Pause whenever you need",
        description: "Pause or resume the scene without losing your place.",
    },
    {
        target: "audio",
        title: "Make it yours",
        description: "Adjust the sounds for each scene. Slowbit remembers your mix locally.",
    },
    {
        target: "mute",
        title: "Quiet, instantly",
        description: "Mute every sound while keeping your scene moving.",
    },
    {
        target: "chat",
        title: "Leave a little note",
        description: "Open the anonymous board when you want to share a thought.",
    },
    {
        target: "favorite",
        title: "Keep the ones you love",
        description: "Favorite a scene to find it quickly again.",
    },
    {
        target: "hide",
        title: "Not your thing?",
        description: "Hide scenes you don’t want to see again.",
    },
];
