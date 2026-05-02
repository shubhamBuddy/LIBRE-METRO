import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/theme/ThemeToggle";
import AuthListener from "@/components/auth/AuthListener";

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
  title: "Libre Metro — Delhi Metro Route Finder",
  description: "Find the fastest Delhi Metro route. 230+ stations, powered by Dijkstra's algorithm.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${spaceGrotesk.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply saved theme to <html> BEFORE first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("libre-metro-theme")||"pink";document.documentElement.classList.add("theme-"+t);}catch(e){}})();`,
          }}
        />
      </head>

      <body
        className="min-h-screen overflow-x-hidden"
        style={{ fontFamily: "var(--body-font), sans-serif", color: "#000" }}
      >
        {/* Thin accent stripe at top */}
        <div
          className="fixed top-0 left-0 right-0 h-[5px] z-[9999] border-b-[2px] border-black"
          style={{ backgroundColor: "var(--accent, #FF2E88)" }}
        />

        <ThemeToggle />
        <AuthListener />

        <main className="mx-auto w-full max-w-[540px] px-4 pt-8 pb-10 md:px-6 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
