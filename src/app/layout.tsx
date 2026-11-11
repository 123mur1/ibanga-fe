import type { Metadata } from "next";
import { GlobalLoading } from "@/components/global-loading";
import { ToastProvider } from "@/components/toast";
import { OpsBridge } from "@/features/ops/ops-bridge";
import { IbangaProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "iBanga — Connect, Book, Transport",
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
            <GlobalLoading />
            {children}
          </ToastProvider>
        </IbangaProvider>
      </body>
    </html>
  );
}
