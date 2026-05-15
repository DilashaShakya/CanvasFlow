import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: "CanvasFlow",
  description: "A production-style realtime collaborative whiteboard built for an engineering portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
