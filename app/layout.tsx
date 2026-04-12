import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { siteUrl } from "@/lib/env";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display"
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Liensi",
  title: {
    default: "Liensi",
    template: "%s | Liensi"
  },
  description: "Catálogo íntimo com curadoria sofisticada e atendimento direto pelo WhatsApp.",
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  },
  appleWebApp: {
    capable: true,
    title: "Liensi",
    statusBarStyle: "black-translucent"
  },
  openGraph: {
    title: "Liensi",
    description: "Catálogo íntimo com curadoria sofisticada.",
    url: "/",
    siteName: "Liensi",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Liensi"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Liensi",
    description: "Catálogo íntimo com curadoria sofisticada.",
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
