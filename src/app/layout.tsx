import type { Metadata } from "next";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { AudioProvider } from "@/components/audio/AudioProvider";
import "./globals.css";
export const metadata: Metadata = {
  title: "slowbit — a little space to switch off",
  description:
    "Step away from the code. Find your quiet with immersive ambient scenes and a soundscape of your own.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PreferencesProvider><AudioProvider>{children}</AudioProvider></PreferencesProvider>
      </body>
    </html>
  );
}
