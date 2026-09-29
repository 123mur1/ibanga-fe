import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { IbangaProvider } from "@/lib/store";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-ibanga-sans",
  subsets: ["latin"],
});

const display = Outfit({
  variable: "--font-ibanga-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iBanga — Direct cargo–truck marketplace",
  description:
    "Book a truck at its listed RWF price, pay after the owner accepts, then confirm delivery to release the held payment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        <IbangaProvider>{children}</IbangaProvider>
      </body>
    </html>
  );
}
