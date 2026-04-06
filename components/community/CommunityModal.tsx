"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Lightbulb, X } from "lucide-react";
import { CommunityRoute } from "./CommunityCard";

interface CommunityDetailModalProps {
  route: CommunityRoute;
  onClose: () => void;
}

export default function CommunityDetailModal({ route, onClose }: CommunityDetailModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Parse route steps from the route string (split by →)
  const routeSteps = route.route.split("→").map((s) => s.trim());

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 px-4 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-[#FFFDF5] border-[3px] border-black shadow-neo-lg transition-transform duration-300 transform ${
          isAnimating ? "scale-100" : "scale-95"
        }`}
      >
        {/* HEADER BAR */}
        <div className="bg-black py-4 px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] text-white tracking-[0.2em] uppercase font-black">
              ROUTE_SPECIFICATION
            </span>
            <span className="text-[7px] text-white/50 font-heading uppercase tracking-widest font-bold">
              ID // 00{route.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center bg-brutal-pink border-2 border-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <X className="h-5 w-5 text-black" strokeWidth={3} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* TITLE */}
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 bg-brutal-yellow border-2 border-black mb-2">
              <span className="font-heading text-[8px] font-black uppercase tracking-widest">
                VERIFIED_PATH
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black leading-tight">
              {route.title}
            </h2>
          </div>

          {/* ROUTE STEPS */}
          <div className="space-y-4">
            <span className="font-heading text-[10px] text-black/40 uppercase tracking-[0.2em] font-black block">
              TRAJECTORY_SEQUENCE
            </span>
            <div className="flex flex-col gap-3">
              {routeSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-6 w-6 border-2 border-black flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-brutal-green' : idx === routeSteps.length - 1 ? 'bg-brutal-pink' : 'bg-white'}`}>
                      {idx + 1}
                    </div>
                    {idx < routeSteps.length - 1 && <div className="w-[2px] h-4 bg-black" />}
                  </div>
                  <span className="font-heading text-xs uppercase tracking-wider text-black font-black py-2 px-4 bg-white border-2 border-black shadow-neo flex-1">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TIP */}
          <div className="flex items-start gap-4 bg-brutal-blue/10 border-[3px] border-black p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 opacity-10">
               <Lightbulb className="h-10 w-10 text-black" />
            </div>
            <div className="relative z-10">
              <span className="font-heading text-[9px] text-brutal-blue border-b-2 border-brutal-blue uppercase tracking-[0.2em] font-black mb-3 inline-block">
                COMMUTER_INTEL
              </span>
              <p className="text-black text-xs font-heading font-black leading-relaxed uppercase tracking-wider">
                {route.tip}
              </p>
            </div>
          </div>

          {/* FOOTER STATS */}
          <div className="flex items-center justify-between border-t-2 border-black pt-6">
            <div className="flex flex-col">
              <span className="font-heading text-[8px] text-black/40 uppercase tracking-widest font-bold">
                COMMUNITY_TRUST
              </span>
              <span className={`font-numbers text-xl font-black ${route.votes >= 0 ? "text-brutal-green" : "text-brutal-pink"}`}>
                {route.votes > 0 ? `+${route.votes}` : route.votes}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="bg-black text-white font-heading font-black py-3 px-8 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] text-[10px]"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
