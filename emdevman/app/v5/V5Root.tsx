import { Inter } from "next/font/google";

import "./v5.css";

/**
 * Server-side root for v5, so the same profile tree can render on `/` (when the
 * active design is `v5`) without needing the removed route layout.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export function V5Root({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} v5-root`}>{children}</div>;
}