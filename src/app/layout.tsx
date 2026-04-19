import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyCast Live Weather",
  description:
    "Weather dashboard built with Next.js using SSR, SSG and live updates via Open-Meteo API.",
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
