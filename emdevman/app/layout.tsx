import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Newsreader, Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import { designPrePaintScript } from "./lib/designs";
import { ThemeProvider } from "./context/ThemeProvider";
import { DesignProvider } from "./context/DesignProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ClientBackground from "./components/ui/ClientBackground";
import ContentProtection from "./components/ui/ContentProtection";
import { DesignSwitch } from "./components/ui/DesignSwitch";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fontDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

/*
  The v3 design's four font roles.

  Geist Sans and Geist Mono come from the package as preconfigured
  next/font/local presets with fixed variable names, so they cannot be renamed
  or re-configured here - globals.css re-points the V2 variables at them
  instead of the other way around.

  Geist Pixel is loaded straight from the installed package rather than via
  `geist/font/pixel`, because that module registers all five pixel variants at
  module scope: importing one of them made Next preload all five, ~129kb, four
  fifths of it never rendered. Pointing next/font/local at the single woff2 we
  want also lets us skip preloading it - it is a display accent that most pages
  never reach. Geist fonts are licensed under the SIL Open Font License 1.1.
*/
const geistSans = GeistSans;
const geistMono = GeistMono;
const geistPixel = localFont({
  src: "../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2",
  weight: "500",
  style: "normal",
  variable: "--font-geist-pixel-square",
  display: "swap",
  preload: false,
  fallback: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://emmanuelbitancor.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Emmanuel Bitancor | Full-Stack Developer",
    template: "%s | Emmanuel Bitancor",
  },
  description:
    "Portfolio of Emmanuel Bitancor, a full-stack developer building accessible, responsive and performant web applications.",
  keywords: [
    "Emmanuel Bitancor",
    "Full Stack Developer",
    "Next.js",
    "React",
    "TypeScript",
    "Web Development",
    "Portfolio",
  ],
  authors: [{ name: "Emmanuel Bitancor" }],
  creator: "Emmanuel Bitancor",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Emmanuel Bitancor Portfolio",
    title: "Emmanuel Bitancor | Full-Stack Developer",
    description:
      "Selected work and projects built with modern web technologies, with an emphasis on accessible and responsive experiences.",
    images: [{ url: "/assets/images/profile3.png", width: 1024, height: 1040 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emmanuel Bitancor | Full-Stack Developer",
    description: "Full-stack developer building accessible and responsive web experiences.",
    images: ["/assets/images/profile3.png"],
  },
  icons: {
    icon: "/assets/images/icon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        id="top"
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} ${geistSans.variable} ${geistMono.variable} ${geistPixel.variable} ${sourceSerif.variable} bg-background font-sans text-foreground antialiased`}
      >
        {/*
          Resolves the design and writes data-design onto <html> before the
          first frame, so there is no flash of the wrong design. Synchronous
          and parser-blocking, which is the point.
        */}
        <script dangerouslySetInnerHTML={{ __html: designPrePaintScript }} />
        <DesignProvider>
          <ThemeProvider attribute="class" defaultTheme="system">
            <ClientBackground />
            <ContentProtection />
            <a
              href="#main-content"
              className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
            >
              Skip to content
            </a>
            <Navbar />
            <div className="theme-brightness-layer relative z-10 flex min-h-screen flex-col">
              <main id="main-content" className="w-full flex-grow">
                {children}
              </main>
              <Footer />
              <DesignSwitch />
            </div>
            <div className="theme-brightness-overlay" aria-hidden="true" />
          </ThemeProvider>
        </DesignProvider>
      </body>
    </html>
  );
}
