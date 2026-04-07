import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WebsiteStructuredData } from "@/components/structured-data";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "600", "700", "800"],
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://conteo.online"),
  title: {
    default: "Conteo — Simple and private analytics for your website",
    template: "%s | Conteo",
  },
  description:
    "Privacy-first web analytics. No cookies, GDPR compliant, real-time dashboard. One line of code. Free for small sites. The simple Google Analytics alternative.",
  keywords: [
    "web analytics",
    "privacy analytics",
    "GDPR compliant analytics",
    "Google Analytics alternative",
    "cookie-free analytics",
    "simple analytics",
    "real-time analytics",
  ],
  authors: [{ name: "Conteo" }],
  creator: "Conteo",
  publisher: "Conteo",
  alternates: {
    canonical: "https://conteo.online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://conteo.online",
    siteName: "Conteo",
    title: "Conteo — Simple and private analytics",
    description:
      "Privacy-first web analytics. No cookies, GDPR compliant, real-time dashboard. One line of code. Free for small sites.",
    images: [
      {
        url: "/og-image.png",
        width: 1424,
        height: 752,
        alt: "Conteo — Simple and private web analytics dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conteo — Simple and private analytics",
    description:
      "Privacy-first web analytics. No cookies, GDPR compliant. Free for small sites.",
    images: ["/og-image.png"],
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
        <WebsiteStructuredData />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
