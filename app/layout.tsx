import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SerwistProvider } from "./serwist";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sacred Imposter",
  description: "Recovery-themed social deduction game",
  applicationName: "Sacred Imposter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sacred Imposter",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
