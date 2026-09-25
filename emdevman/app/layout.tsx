import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "./context/ThemeProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ClientBackground from "./components/ui/ClientBackground";

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
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
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
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ClientBackground />
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
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
