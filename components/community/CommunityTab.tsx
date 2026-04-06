"use client";

import { useState, useEffect } from "react";
import { Plus, Users, X } from "lucide-react";
import CommunityCard, { CommunityRoute } from "./CommunityCard";
import CommunityDetailModal from "./CommunityModal";

const STATIC_ROUTES: CommunityRoute[] = [
  {
    id: 1,
    title: "Tughlaqabad → Vishwavidyalaya",
    route: "Tughlaqabad → Kashmere Gate → Vishwavidyalaya",
    tag: "Less crowded",
    tip: "Less walking and better chance of getting a seat during peak hours.",
    votes: 12,
    userVote: null,
  },
  {
    id: 2,
    title: "Rajiv Chowk → Hauz Khas",
    route: "Rajiv Chowk → Hauz Khas",
    tag: "Fastest",
    tip: "Direct Yellow Line — no interchange needed. Fastest during off-peak.",
    votes: 8,
    userVote: null,
  },
  {
    id: 3,
    title: "Noida Sec 18 → Rajiv Chowk",
    route: "Noida Sec 18 → Rajiv Chowk",
    tag: "No interchange",
    tip: "Direct Blue Line. Board from the first coach for quick exit at Rajiv Chowk.",
    votes: 10,
    userVote: null,
  },
  {
    id: 4,
    title: "Huda City Centre → Kashmere Gate",
    route: "Huda City Centre → Rajiv Chowk → Kashmere Gate",
    tag: "Less crowded",
    tip: "Yellow Line is less packed after Qutub Minar station. Prefer morning hours.",
    votes: 6,
    userVote: null,
  },
];

interface CommunityTabProps {
  onClose: () => void;
}

export default function CommunityTab({ onClose }: CommunityTabProps) {
  const [routes, setRoutes] = useState<CommunityRoute[]>(STATIC_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<CommunityRoute | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    // ESC to close
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedRoute) setSelectedRoute(null);
        else if (showComingSoon) setShowComingSoon(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedRoute, showComingSoon]);

  const handleVote = (id: number, direction: "up" | "down") => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        let newVotes = r.votes;
        let newUserVote: "up" | "down" | null = direction;

        if (r.userVote === direction) {
          // Toggle off if clicking the same direction
          newVotes = direction === "up" ? r.votes - 1 : r.votes + 1;
          newUserVote = null;
        } else if (r.userVote === null) {
          // First time voting
          newVotes = direction === "up" ? r.votes + 1 : r.votes - 1;
        } else {
          // Switching from up to down or vice versa
          newVotes = direction === "up" ? r.votes + 2 : r.votes - 2;
        }

        return { ...r, votes: newVotes, userVote: newUserVote };
      })
    );
  };

  return (
    <>
      {/* ── DARK OVERLAY BACKDROP ── */}
      <div
        className={`fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto py-12 px-4 pb-32 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        {/* ── MODAL CONTAINER ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[500px] mx-auto bg-[#FFFDF5] border-[3px] border-black shadow-neo-lg overflow-hidden transition-transform duration-300 ${
            isVisible ? "scale-100" : "scale-95"
          }`}
        >
          {/* HEADER */}
          <div className="bg-black py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brutal-yellow border-2 border-white">
                <Users className="h-5 w-5 text-black" strokeWidth={3} />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xs text-white tracking-[0.2em] uppercase font-black">
                  COMMUNITY_HUB
                </span>
                <span className="text-[8px] text-white/50 font-heading uppercase tracking-widest font-bold">
                  LOCAL_ROOTS // DEL_METRO
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center bg-brutal-pink border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-black" strokeWidth={3} />
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-0.5 flex-1 bg-black opacity-10" />
              <span className="font-heading text-[9px] text-black/40 uppercase tracking-[0.3em] font-black">
                STREET_KNOWLEDGE
              </span>
              <div className="h-0.5 flex-1 bg-black opacity-10" />
            </div>

            {/* ── CARD LIST ── */}
            <div className="flex flex-col gap-5">
              {routes.map((route) => (
                <CommunityCard
                  key={route.id}
                  data={route}
                  onVote={handleVote}
                  onClick={() => setSelectedRoute(route)}
                />
              ))}
            </div>

            {/* FOOTER */}
            <div className="mt-8 p-4 bg-brutal-blue/10 border-2 border-black border-dashed flex items-center justify-center text-center">
              <p className="text-[9px] font-heading text-black/60 uppercase tracking-widest leading-relaxed font-bold">
                TAP ANY CARD TO REVEAL<br />THE SECRET PATHWAY
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING ADD BUTTON ── */}
      <button
        onClick={() => setShowComingSoon(true)}
        className="fixed bottom-24 right-6 z-[60] h-16 w-16 bg-brutal-yellow border-[3px] border-black shadow-neo flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group"
        aria-label="Suggest a route"
      >
        <Plus className="h-8 w-8 text-black group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
      </button>

      {/* ── MODALS ── */}
      {selectedRoute && (
        <CommunityDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {/* ── TOAST ── */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF5] border-[3px] border-black shadow-neo-lg p-10 max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="h-16 w-16 bg-brutal-green border-2 border-black shadow-neo mx-auto flex items-center justify-center">
              <Plus className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-black font-heading text-lg uppercase tracking-widest font-black">
                UNAUTHORIZED_ACCESS
              </h3>
              <p className="text-black/60 text-xs font-heading font-bold uppercase tracking-wider leading-relaxed">
                THE SQUAD IS STILL CALIBRATING<br />THIS FEATURE. COME BACK SOON.
              </p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-brutal-yellow font-heading font-black text-black border-[3px] border-black py-4 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] text-xs"
            >
              COGNIZED
            </button>
          </div>
        </div>
      )}
    </>
  );
}
