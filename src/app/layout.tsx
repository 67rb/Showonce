import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {IdentityProvider} from "@/components/learning/Identity";
import {
  Anton,
  Archivo,
  Inter,
  Inter_Tight,
  Instrument_Serif,
} from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Parallax } from "@/components/Parallax";
import "./globals.css";
import "./learning.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const archivo = Archivo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-archivo",
});

// Site language (v3, Adorn): Inter Tight display / Inter body for everything
// below the hero — the hero keeps Anton/Archivo.
const interTight = Inter_Tight({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
});

// Feel stack (Prompt 2.19 / Task D): Instrument Serif italic, used only for
// the serif-accent span on a heading's final word (.font-serif-accent).
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "SHOW ONCE",
  description: "Paste a video link. Learn it step by step, checked as you go.",
};

export const viewport: Viewport = {
  themeColor: "#16161A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${interTight.variable} ${inter.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-dvh">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <Script src="/practice-library.js" strategy="beforeInteractive"/>
        <IdentityProvider>
        <SmoothScroll />
        <Parallax />
        <div className="relative z-10">{children}</div>
        </IdentityProvider>
      </body>
    </html>
  );
}