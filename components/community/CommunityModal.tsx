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
      className={`fixed inset-0 z-[60] p-4 sm:p-6 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 px-4 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] flex flex-col bg-[#FFFDF5] border-[3px] border-black shadow-neo-lg transition-transform duration-300 transform ${
          isAnimating ? "scale-100" : "scale-95"
        }`}
      >
        {/* HEADER BAR FIXED */}
        <div className="shrink-0 bg-black py-4 px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-heading text-[10px] text-white tracking-[0.2em] uppercase font-black">
              ROUTE_SPECIFICATION
            </span>
            <span className="text-[7px] text-white/50 font-heading uppercase tracking-widest font-bold">
              ID // 00{route.id.slice(0, 4)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 flex items-center justify-center bg-brutal-pink border-2 border-white hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <X className="h-5 w-5 text-black" strokeWidth={3} />
          </button>
        </div>

        {/* SCROLLABLE INNER CONTENT */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1">
          {/* TITLE */}
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 bg-brutal-yellow border-[3px] border-black mb-2">
              <span className="font-heading text-[8px] font-black uppercase tracking-widest">
                VERIFIED_PATH
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black leading-tight">
              {route.title}
            </h2>
          </div>

          {/* AUTHOR */}
          <div className="flex items-center gap-3 border-[3px] border-black p-3 bg-white shadow-[2px_2px_0px_#000]">
            {route.authorAvatar ? (
              <img src={route.authorAvatar} alt={route.author ?? "User"} className="h-10 w-10 shrink-0 border-[3px] border-black object-cover" />
            ) : (
              <div className={`h-10 w-10 shrink-0 ${route.accentColor ?? "bg-brutal-lavender"} border-[3px] border-black flex items-center justify-center`}>
                <span className="font-heading text-[12px] font-black text-black tracking-wider">{route.initials ?? (route.author ? route.author.slice(0, 2).toUpperCase() : "CM")}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-heading text-[10px] font-black text-black uppercase tracking-widest truncate">
                {route.author ?? "COMMUNITY_USER"}
              </p>
              <p className="font-heading text-[8px] text-black/50 uppercase tracking-widest font-black">
                ROUTE_CONTRIBUTOR // VERIFIED
              </p>
            </div>
          </div>

          {/* ROUTE STEPS WITH CONTINUOUS LINE */}
          <div className="space-y-5">
            <span className="font-heading text-[10px] text-black/40 uppercase tracking-[0.2em] font-black block">
              TRAJECTORY_SEQUENCE
            </span>
            
            <div className="relative flex flex-col gap-3 sm:gap-4 before:absolute before:top-4 before:bottom-4 before:left-[10.5px] sm:before:left-[11.5px] before:w-[3px] before:bg-black before:z-0">
              {routeSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 relative z-10">
                  <div className={`shrink-0 h-6 w-6 sm:h-[26px] sm:w-[26px] border-[3px] border-black flex items-center justify-center text-[9px] sm:text-[10px] font-black ${idx === 0 ? 'bg-brutal-green' : idx === routeSteps.length - 1 ? 'bg-brutal-pink' : 'bg-brutal-yellow'}`}>
                    {idx + 1}
                  </div>
                  <span className="font-heading text-[10px] sm:text-xs uppercase tracking-wider text-black font-black py-2.5 sm:py-3 px-4 bg-white border-[3px] border-black shadow-[2px_2px_0px_#000] flex-1 leading-tight">
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
            <div className="relative z-10 space-y-3">
              <span className="font-heading text-[9px] text-brutal-blue border-b-[3px] border-brutal-blue uppercase tracking-[0.2em] font-black inline-block pb-1">
                COMMUTER_INTEL
              </span>
              <p className="text-black text-[10px] sm:text-xs font-heading font-black leading-relaxed uppercase tracking-wider">
                {route.tip}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER STATS FIXED */}
        <div className="shrink-0 flex items-center justify-between border-t-[3px] border-black px-6 sm:px-8 py-5 bg-[#FFFDF5]">
          <div className="flex flex-col">
            <span className="font-heading text-[8px] text-black/40 uppercase tracking-widest font-bold">
              COMMUNITY_TRUST
            </span>
            <span className={`font-numbers text-xl sm:text-2xl font-black ${route.votes >= 0 ? "text-brutal-green" : "text-brutal-pink"}`}>
              {route.votes > 0 ? `+${route.votes}` : route.votes}
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="bg-black text-white font-heading font-black py-3 sm:py-3.5 px-6 sm:px-8 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] text-[8px] sm:text-[10px]"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
}
