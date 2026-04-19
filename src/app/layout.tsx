import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mausam Live Updates",
    template: "%s | Mausam Live Updates",
  },
  description:
    "Weather dashboard with SSR, SSG, and live Open-Meteo updates built with Next.js.",
  applicationName: "Mausam Live Updates",
  keywords: ["weather", "nextjs", "ssr", "ssg", "open-meteo"],
  icons: [
    { rel: "icon", url: "/weatherIcon.png" },
    { rel: "shortcut icon", url: "/weatherIcon.png" },
    { rel: "apple-touch-icon", url: "/weatherIcon.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
