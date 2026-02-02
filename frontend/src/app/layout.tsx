import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4WBIOTECH",
  description: "4W Biotech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html lang="pt-BR">
      <body >{children}</body>
    </html>
  );
}
