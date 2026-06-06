import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves relative OG/icon URLs to absolute. Uses the deploy URL (AUTH_URL is
  // already set per-environment), falling back to the production domain.
  metadataBase: new URL(
    process.env.AUTH_URL ?? "https://squash.tomlinson.co.za",
  ),
  title: "Doubles Squash @ BSC",
  description: "BSC Doubles Squash ladder — session results and player rankings",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Squash",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Doubles Squash @ BSC",
    description:
      "BSC Doubles Squash ladder — session results and player rankings",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
