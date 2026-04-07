import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* neobrutalism.dev official palette */
        background:         "#dde8ff",  /* light blue-tinted bg */
        foreground:         "#000000",
        "brutal-main":      "#5294FF",  /* neobrutalism.dev main blue */
        "brutal-yellow":    "#FACC00",  /* chart amber-yellow */
        "brutal-pink":      "#FF4D50",  /* chart red */
        "brutal-blue":      "#5294FF",  /* main blue */
        "brutal-green":     "#05E17A",  /* chart green */
        "brutal-orange":    "#FF7A05",  /* chart orange */
        "brutal-lavender":  "#7A83FF",  /* chart indigo-violet */
      },
      fontFamily: {
        heading: ["var(--font-heading)", "cursive"],
        body: ["var(--font-body)", "sans-serif"],
        numbers: ["var(--font-numbers)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

