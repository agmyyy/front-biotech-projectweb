import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
// @ts-ignore
import "./globals.css";

const fontPrimary = Inter({
  weight: ["200", "300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const fontSecondary = Roboto_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-secondary",
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "4WBiotech",
  description: "Interface de chat inteligente para biotecnologia",
  metadataBase: new URL("http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#f6f5f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontPrimary.variable} ${fontSecondary.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
