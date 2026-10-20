import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import { OpsBridge } from "@/features/ops/ops-bridge";
import { IbangaProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "iBanga — Freight marketplace",
  description:
    "A freight marketplace connecting importers, truck owners, drivers and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-ink">
        <IbangaProvider>
          <ToastProvider>
            <OpsBridge />
            {children}
          </ToastProvider>
        </IbangaProvider>
      </body>
    </html>
  );
}
