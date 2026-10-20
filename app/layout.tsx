import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "StockPilot — Restaurant Inventory & Operations",
    template: "%s · StockPilot",
  },
  description:
    "StockPilot is a demo inventory management system for restaurants, bars and cafes. Frontend-only prototype with local storage persistence.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <AppProviders>
            <AppShell>{children}</AppShell>
          </AppProviders>
        </ToastProvider>
      </body>
    </html>
  );
}
