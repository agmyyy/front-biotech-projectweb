import { Inter, Roboto_Mono } from "next/font/google";

export const fontPrimary = Inter({
  weight: ["200", "300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const fontSecondary = Roboto_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-secondary",
  display: "swap",
  fallback: ["monospace"],
});

export const typography = {
  fontFamilies: {
    primary: "var(--font-primary)",
    secondary: "var(--font-secondary)",
  },
  fontWeights: {
    extraLight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
} as const;

export type FontFamily = keyof typeof typography.fontFamilies;
export type FontWeight = keyof typeof typography.fontWeights;
export type LineHeight = keyof typeof typography.lineHeights;
export type FontSize = keyof typeof typography.fontSizes;
