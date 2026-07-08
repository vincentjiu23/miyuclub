import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import GlobalStickers from "@/components/GlobalStickers";

export const metadata: Metadata = {
  title: "MIYU CLUB",
  description: "Digital Community Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;700&family=Syne:wght@700;800&family=Space+Mono:wght@400;700&family=Gloria+Hallelujah&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="notebook-grid relative">
        <Header />
        <div className="min-h-screen pb-24">
          {children}
        </div>
        <GlobalStickers />
        <BottomNav />
      </body>
    </html>
  );
}
