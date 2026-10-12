import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { IbangaProvider } from "@/lib/store";
import { PersistentDashboardShell } from "@/components/persistent-dashboard-shell";
import { SiteFooter } from "@/components/site-footer";
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
        <IbangaProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <PersistentDashboardShell footer={<SiteFooter />}>
                {children}
              </PersistentDashboardShell>
            </div>
          </div>
        </IbangaProvider>
      </body>
    </html>
  );
}
