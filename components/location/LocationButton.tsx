"use client";

import { Crosshair } from "lucide-react";

interface LocationButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export default function LocationButton({ onClick, isLoading }: LocationButtonProps) {
  return (
    <div className="flex justify-center mt-5 w-full max-w-[500px]">
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`group relative flex items-center justify-center gap-2.5 bg-white border-[3px] border-black font-heading text-[9px] uppercase tracking-widest text-black px-7 py-3.5 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
          isLoading ? "opacity-70 cursor-wait" : ""
        }`}
      >
        <Crosshair className={`h-3.5 w-3.5 text-black ${isLoading ? "animate-spin" : ""}`} strokeWidth={3} />
        <span className="font-black">{isLoading ? "DETECTING LOCATION..." : "USE MY LOCATION"}</span>
      </button>
    </div>
  );
}
