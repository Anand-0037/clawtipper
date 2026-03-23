import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  icons: {
    icon: "/clawtipper.png",
    apple: "/clawtipper.png",
  },
  title:
    "ClawTipper — Autonomous USDT Reward Agent for Open Source",
  description:
    "Automatically reward GitHub contributors with USDT using an autonomous agent powered by Tether WDK.",
  keywords: [
    "autonomous agents",
    "USDT",
    "Tether",
    "open source rewards",
    "GitHub automation",
    "ClawTipper",
    "WDK",
  ],
  openGraph: {
    title: "ClawTipper — Autonomous USDT Reward Agent for Open Source",
    description:
      "Automatically reward GitHub contributors with USDT using an autonomous agent powered by Tether WDK.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawTipper — Autonomous USDT Reward Agent",
    description:
      "Autonomous capital allocator for open source — USDT on Polygon.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-slate-100 text-base leading-relaxed text-slate-900 antialiased`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
