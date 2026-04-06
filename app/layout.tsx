import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  variable: "--heading-font",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--body-font",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--numbers-font",
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
      className={`${pressStart.variable} ${spaceGrotesk.variable} ${syne.variable} h-full antialiased`}
    >

      <body className="min-h-full bg-background text-foreground font-body selection:bg-brutal-yellow selection:text-black overflow-x-hidden">
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



