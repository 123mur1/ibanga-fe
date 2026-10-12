import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { IbangaProvider } from "@/lib/store";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-ibanga-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iBanga — Freight marketplace",
  description:
    "A freight marketplace connecting importers, truck owners, and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        <IbangaProvider>{children}</IbangaProvider>
      </body>
    </html>
  );
}
