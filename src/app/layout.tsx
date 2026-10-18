import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { IbangaProvider } from "@/lib/store";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-ibanga-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        <IbangaProvider>
          <ToastProvider>{children}</ToastProvider>
        </IbangaProvider>
      </body>
    </html>
  );
}
