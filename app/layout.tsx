import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Libre Metro",
  description: "A clean, structured, and modern system-like interface.",
};

import PersonalizeSystem from "@/components/personalization/PersonalizeSystem";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background text-foreground font-sans selection:bg-accent/30 overflow-x-hidden">
        <main className="mx-auto w-full max-w-[540px] px-4 py-8 md:px-6">
          <div className="flex flex-col gap-12">
            {children}
          </div>
        </main>
        
        {/* Personalization system handled via browser storage logic */}
        <PersonalizeSystem />
      </body>
    </html>
  );
}


