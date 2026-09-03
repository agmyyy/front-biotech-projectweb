import { Inter, Roboto_Mono } from "next/font/google";

export const type_first = Inter({
  weight: ["200", "300", "400"],
  subsets: ["latin"],
  variable: "--type-first-inter",
  display: "swap",
});

export const type_second = Roboto_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--type-second-roboto",
  display: "swap",
});
