import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Bhargav Academy | IIT JEE Foundation | Hyderabad",
  description:
    "Bhargav Academy — IIT JEE Foundation Coaching in Hyderabad. Founded by IIT Kanpur alumnus & GATE AIR 721 holder. Classes for Maths, Physics & Chemistry (Class 8–10). Students scored 100/100 in Maths.",
  openGraph: {
    title: "Bhargav Academy | IIT JEE Foundation | Hyderabad",
    description:
      "Taught by an IIT Kanpur alumnus and GATE AIR 721 holder — with students scoring 100/100 in Mathematics.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
