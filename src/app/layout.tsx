import type { Metadata } from "next";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { AudioProvider } from "@/components/audio/AudioProvider";
import ButtonHints from "@/components/ButtonHints";
import AnalyticsConsentNotice from "@/components/AnalyticsConsent";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://slowbit.vercel.app"),
  title: "slowbit — a little space to switch off",
  description:
    "Step away from the code. Find your quiet with immersive ambient scenes and a soundscape of your own.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Slowbit",
    title: "slowbit — a little space to switch off",
    description:
      "Immersive focus and unwind scenes with soundscapes you can make your own.",
    images: [
      {
        url: "/images/checkin-rain.png",
        width: 1660,
        height: 948,
        alt: "Slowbit ambient rain scene",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "slowbit — a little space to switch off",
    description:
      "Immersive focus and unwind scenes with soundscapes you can make your own.",
    images: ["/images/checkin-rain.png"],
  },
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
        <ButtonHints />
        <AnalyticsConsentNotice />
      </body>
    </html>
  );
}
