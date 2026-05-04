import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/auth/ThemeContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "CreatorPulse — Social Media Growth for African Creators",
    template: "%s | CreatorPulse",
  },
  description:
    "AI-powered social media growth platform built for content creators in Kenya and Africa. Trend insights, best time to post, and smart growth tools.",
  keywords: ["social media", "content creator", "Kenya", "Africa", "TikTok", "Instagram", "growth"],
  authors: [{ name: "CreatorPulse" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "CreatorPulse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
