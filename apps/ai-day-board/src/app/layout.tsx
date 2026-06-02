import type { Metadata } from "next";
import { IBM_Plex_Sans, Questrial } from "next/font/google";
import "./globals.css";

// Body / supporting type — IBM Plex Sans (brand body font, free on Google).
const plex = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Display / headlines — brand uses Century Gothic (an Office/system font, not on
// Google Fonts). Questrial is a close geometric web stand-in; the CSS stack in
// globals.css prefers real Century Gothic when the viewer's machine has it.
const questrial = Questrial({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "AI Day Board — Project AIR",
  description: "AI Day (US), June 9, 2026. Live schedule board.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plex.variable} ${questrial.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
