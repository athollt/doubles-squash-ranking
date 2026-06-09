import type { Metadata, Viewport } from "next";
import { Archivo, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { type Role } from "@/lib/nav";
import { SiteHeader } from "@/components/site-header";
import { BottomNavBar } from "@/components/ui/bottom-nav";

// Court CI fonts (step 13.4): Space Grotesk = body, Archivo = headings/display.
// Exposed as CSS vars consumed by globals.css @theme (--font-sans / --font-heading).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-heading",
  weight: ["500", "700", "900"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const RUNGS_DESCRIPTION =
  "Individual ranking ladders for doubles play — one ladder per club, any sport.";

export const metadata: Metadata = {
  // Resolves relative OG/icon URLs to absolute. Uses the deploy URL (AUTH_URL is
  // already set per-environment), falling back to the production domain. The
  // domain rename to rungs.co.za lands at cutover (step 25), not here.
  metadataBase: new URL(
    process.env.AUTH_URL ?? "https://squash.tomlinson.co.za",
  ),
  // Single shared PWA identity = "Rungs" (ADR-013). Page titles set just their
  // own label; the template appends " — Rungs" (a bare shell page is "Rungs").
  title: {
    default: "Rungs",
    template: "%s — Rungs",
  },
  description: RUNGS_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Rungs",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Rungs",
    description: RUNGS_DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const role = session?.role as Role | undefined;
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <BottomNavBar role={role} />
      </body>
    </html>
  );
}
