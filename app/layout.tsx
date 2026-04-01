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
  title: "Conteo — Analytics simple y privado para tu sitio web",
  description:
    "Trackea las visitas de tu sitio en 2 minutos. Sin cookies, GDPR compliant, gratis hasta 10k visitas/mes. La alternativa simple a Google Analytics.",
  metadataBase: new URL("https://conteo.online"),
  openGraph: {
    title: "Conteo — Analytics simple y privado",
    description:
      "Trackea las visitas de tu sitio en 2 minutos. Sin cookies, GDPR compliant, gratis hasta 10k visitas/mes.",
    url: "https://conteo.online",
    siteName: "Conteo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conteo — Analytics simple y privado",
    description: "Trackea las visitas de tu sitio en 2 minutos. Sin cookies, GDPR compliant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
