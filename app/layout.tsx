import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conteo.online - Simple Analytics",
  description: "GA4 alternative for indie hackers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
