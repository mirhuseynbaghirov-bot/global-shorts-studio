import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLOBAL SHORTS STUDIO",
  description: "AI-powered YouTube Shorts production studio"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
