import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./marketing.css";

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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bhargavacademy.com"),
  title: {
    default: "Bhargav Academy | IIT JEE Foundation | Hyderabad",
    template: "%s · Bhargav Academy",
  },
  description:
    "Bhargav Academy — IIT JEE Foundation Coaching in Hyderabad. Founded by IIT Kanpur alumnus & GATE AIR 721 holder. Classes for Maths, Physics & Chemistry (Class 8–10).",
  openGraph: {
    title: "Bhargav Academy | IIT JEE Foundation | Hyderabad",
    description:
      "Taught by an IIT Kanpur alumnus and GATE AIR 721 holder — with students scoring 100/100 in Mathematics.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2140",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg shadow-elevation-lg focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[60] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
