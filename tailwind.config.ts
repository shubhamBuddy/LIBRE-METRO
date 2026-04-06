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
        background: "#FFFDF5",
        foreground: "#000000",
        "brutal-yellow": "#FFD23F",
        "brutal-pink": "#FF6B6B",
        "brutal-blue": "#74B9FF",
        "brutal-green": "#88D498",
        "brutal-orange": "#FFA552",
        "brutal-lavender": "#B8A9FA",
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

