import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GLOBAL SHORTS STUDIO",
  description: "AI-powered YouTube Shorts Studio"
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
