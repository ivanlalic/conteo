import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Conteo — Simple and private analytics for your website",
  description:
    "Track your site's visits in 2 minutes. No cookies, GDPR compliant, free up to 10k visits/mo. The simple alternative to Google Analytics.",
  metadataBase: new URL("https://conteo.online"),
  openGraph: {
    title: "Conteo — Simple and private analytics",
    description:
      "Track your site's visits in 2 minutes. No cookies, GDPR compliant, free up to 10k visits/mo.",
    url: "https://conteo.online",
    siteName: "Conteo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conteo — Simple and private analytics",
    description: "Track your site's visits in 2 minutes. No cookies, GDPR compliant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
