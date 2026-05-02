"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronUp, ChevronDown } from "lucide-react";

type Theme = "pink" | "yellow" | "blue";

const THEMES: { id: Theme; label: string; accent: string; bg: string }[] = [
  { id: "pink",   label: "PINK",   accent: "#FF2E88", bg: "#FFFEF0" },
  { id: "yellow", label: "YELLOW", accent: "#FACC00", bg: "#FFFFF0" },
  { id: "blue",   label: "BLUE",   accent: "#4DA3FF", bg: "#EEF4FF" },
];

function applyTheme(theme: Theme) {
  const t = THEMES.find(x => x.id === theme)!;
  const root = document.documentElement;

  // 1. Remove old class, add new
  root.classList.remove("theme-pink", "theme-yellow", "theme-blue");
  root.classList.add(`theme-${theme}`);

  // 2. Directly set CSS variables AND background (belt + suspenders)
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--dot", t.accent);
  root.style.backgroundColor = t.bg;

  localStorage.setItem("libre-metro-theme", theme);
}

export default function ThemeToggle() {
  const [active, setActive]   = useState<Theme>("pink");
  const [open,   setOpen]     = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("libre-metro-theme") as Theme;
    const init  = saved && ["pink","yellow","blue"].includes(saved) ? saved : "pink";
    const raf = requestAnimationFrame(() => {
      setActive(init);
      applyTheme(init);
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const select = (theme: Theme) => {
    setActive(theme);
    applyTheme(theme);
    setOpen(false);
  };

  if (!mounted) return null;

  const current = THEMES.find(t => t.id === active)!;

  return (
    <div className="fixed top-5 left-4 z-[9999] font-heading">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 border-[3px] border-black text-[9px] tracking-[0.2em] uppercase font-black text-black cursor-pointer transition-all ${open ? 'shadow-none translate-x-[2px] translate-y-[2px]' : 'shadow-neo'}`}
        style={{ backgroundColor: current.accent }}
      >
        {/* Color dot */}
        <span className="inline-block w-2 h-2 rounded-full bg-black border border-black shrink-0" />
        SKIN {open ? <ChevronUp className="h-2.5 w-2.5 ml-1 inline" /> : <ChevronDown className="h-2.5 w-2.5 ml-1 inline" />}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.12 }}
            className="origin-top-left absolute top-[calc(100%+4px)] left-0 w-[170px] border-[3px] border-black bg-white shadow-neo z-[9999]"
          >
            {/* Header */}
            <div className="bg-black px-3 py-1.5">
              <span className="text-[7px] text-white/50 tracking-[0.2em] uppercase">
                CHOOSE SKIN
              </span>
            </div>

            {THEMES.map((t, i) => {
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => select(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-none ${i < THEMES.length - 1 ? 'border-b-2 border-black border-solid' : ''}`}
                  style={{ backgroundColor: isActive ? t.accent : "#fff" }}
                >
                  {/* Swatch */}
                  <span className={`w-5 h-5 border-2 border-black flex items-center justify-center shrink-0 text-[9px] font-black ${isActive ? 'shadow-[2px_2px_0_#000]' : 'shadow-[1px_1px_0_#000]'}`} style={{ backgroundColor: t.accent }}>
                    {isActive ? <Check className="h-3 w-3 text-black" strokeWidth={4} /> : ""}
                  </span>
                  <span className={`text-[9px] tracking-[0.15em] uppercase font-black ${isActive ? 'text-black' : 'text-black/45'}`}>
                    {t.label}
                  </span>
                </button>
              );
            })}

            {/* Footer */}
            <div className="bg-[#f5f5f5] px-3 py-1 border-t-2 border-black">
              <span className="text-[6px] tracking-[0.15em] uppercase text-black/30">
                LIBRE_METRO v2
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
