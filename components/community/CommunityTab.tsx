"use client";

import { useState, useEffect } from "react";
import { Plus, Users, X, LogIn, Zap, Loader2 } from "lucide-react";
import CommunityCard, { CommunityRoute, ACCENT_COLORS_LIST } from "./CommunityCard";
import CommunityDetailModal from "./CommunityModal";
import AuthModal from "@/components/auth/AuthModal";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── DB Row → CommunityRoute mapper ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbRow(row: any, index: number): CommunityRoute {
  const routeArr: string[] = Array.isArray(row.full_route) ? row.full_route : [];
  const routeStr =
    routeArr.length > 0
      ? routeArr.join(" → ")
      : `${row.origin} → ${row.destination}`;
  const tag =
    Array.isArray(row.hashtags) && row.hashtags.length > 0
      ? row.hashtags[0]
      : "Less crowded";

  return {
    id:          row.id as string,
    title:       `${row.origin} → ${row.destination}`,
    route:       routeStr,
    tag,
    tip:         row.tip ?? "",
    votes:       row.votes ?? 0,
    userVote:    null,
    accentColor: ACCENT_COLORS_LIST[index % ACCENT_COLORS_LIST.length],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommunityTabProps {
  onClose: () => void;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="w-full bg-white border-[3px] border-black/20 animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 border-b-[3px] border-black/10">
        <div className="h-9 w-9 bg-black/10 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 bg-black/10 w-32 rounded" />
          <div className="h-2 bg-black/10 w-20 rounded" />
        </div>
        <div className="h-5 w-20 bg-black/10 rounded" />
      </div>
      <div className="px-4 py-3 border-b-[3px] border-black/10 space-y-2">
        <div className="h-3 bg-black/10 w-3/4 rounded" />
        <div className="h-2 bg-black/10 w-full rounded" />
      </div>
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="h-5 bg-black/10 w-40 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-black/10 rounded" />
          <div className="h-8 w-8 bg-black/10 rounded" />
          <div className="h-8 w-8 bg-black/10 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityTab({ onClose }: CommunityTabProps) {
  const [routes, setRoutes]               = useState<CommunityRoute[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<CommunityRoute | null>(null);
  const [showComingSoon, setShowComingSoon]     = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showAuthModal, setShowAuthModal]         = useState(false);
  const [isVisible, setIsVisible]                 = useState(false);
  const [user, setUser]                           = useState<User | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginRequired(false);
        setShowAuthModal(false);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch suggestions from Supabase ────────────────────────────────────────
  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .order("votes", { ascending: false });

      if (error) {
        setFetchError("Failed to load community routes.");
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setRoutes((data ?? []).map((row: any, i: number) => mapDbRow(row, i)));
      setLoading(false);
    }
    fetchSuggestions();
  }, []);

  // ── Mount + ESC ────────────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showAuthModal)     { setShowAuthModal(false);     return; }
      if (showLoginRequired) { setShowLoginRequired(false); return; }
      if (selectedRoute)     { setSelectedRoute(null);      return; }
      if (showComingSoon)    { setShowComingSoon(false);     return; }
      onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedRoute, showComingSoon, showLoginRequired, showAuthModal]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddClick = () => {
    if (!user) setShowLoginRequired(true);
    else       setShowComingSoon(true);
  };

  const handleVote = (id: string, direction: "up" | "down") => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let newVotes   = r.votes;
        let newUserVote: "up" | "down" | null = direction;
        if (r.userVote === direction) {
          newVotes    = direction === "up" ? r.votes - 1 : r.votes + 1;
          newUserVote = null;
        } else if (r.userVote === null) {
          newVotes = direction === "up" ? r.votes + 1 : r.votes - 1;
        } else {
          newVotes = direction === "up" ? r.votes + 2 : r.votes - 2;
        }
        return { ...r, votes: newVotes, userVote: newUserVote };
      })
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── BACKDROP ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto py-10 px-4 pb-32 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        {/* ── PANEL ──────────────────────────────────────────────────────── */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[600px] mx-auto transition-transform duration-300 ${
            isVisible ? "scale-100" : "scale-95"
          }`}
        >
          {/* HEADER ─────────────────────────────────────────────────────── */}
          <div className="bg-black border-[3px] border-black mb-0 flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brutal-yellow border-2 border-white">
                <Users className="h-4 w-4 text-black" strokeWidth={3} />
              </div>
              <div>
                <p className="font-heading text-[10px] text-white tracking-[0.25em] uppercase font-black">
                  COMMUNITY_HUB
                </p>
                <p className="font-heading text-[7px] text-white/40 uppercase tracking-widest font-bold">
                  STREET_KNOWLEDGE // DEL_METRO
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center bg-brutal-pink border-2 border-white hover:brightness-95 active:scale-95 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-black" strokeWidth={3} />
            </button>
          </div>

          {/* KICKER ─────────────────────────────────────────────────────── */}
          <div className="bg-brutal-yellow border-[3px] border-t-0 border-black px-5 py-2 flex items-center gap-2">
            <Zap className="h-3 w-3 text-black shrink-0" strokeWidth={3} />
            <p className="font-heading text-[8px] text-black uppercase tracking-[0.25em] font-black">
              LOVED BY THE COMMUNITY
            </p>
            <div className="flex-1 h-[2px] bg-black/20 ml-1" />
            <span className="font-numbers text-[9px] font-black text-black/60">
              {loading ? "…" : `${routes.length} TIPS`}
            </span>
          </div>

          {/* ── SINGLE-COLUMN CARD LIST ─────────────────────────────────── */}
          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : fetchError ? (
              <div className="border-[3px] border-black bg-brutal-pink p-6 text-center">
                <p className="font-heading text-[10px] font-black uppercase tracking-widest text-black">
                  {fetchError}
                </p>
                <p className="font-heading text-[8px] text-black/60 font-bold uppercase tracking-wider mt-1">
                  CHECK_CONNECTION // RETRY LATER
                </p>
              </div>
            ) : routes.length === 0 ? (
              <div className="border-[3px] border-dashed border-black p-10 text-center bg-white/60">
                <p className="font-heading text-[10px] font-black uppercase tracking-widest text-black">
                  NO_ROUTES_YET
                </p>
                <p className="font-heading text-[8px] text-black/40 font-bold uppercase tracking-wider mt-1">
                  BE THE FIRST TO SUGGEST ONE
                </p>
              </div>
            ) : (
              routes.map((route, i) => (
                <div
                  key={route.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CommunityCard
                    data={route}
                    onVote={handleVote}
                    onClick={() => setSelectedRoute(route)}
                  />
                </div>
              ))
            )}
          </div>

          {/* CTA FOOTER ─────────────────────────────────────────────────── */}
          {!loading && (
            <div className="mt-4 border-[3px] border-black border-dashed bg-white/60 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-heading text-[9px] text-black uppercase tracking-widest font-black">
                  KNOW A BETTER ROUTE?
                </p>
                <p className="font-heading text-[7px] text-black/40 uppercase tracking-wider font-bold mt-0.5">
                  TAP TO SHARE YOUR LOCAL KNOWLEDGE
                </p>
              </div>
              <button
                onClick={handleAddClick}
                className="shrink-0 bg-brutal-yellow border-[3px] border-black shadow-neo px-4 py-2 font-heading text-[9px] font-black uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                ADD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING ADD BTN ─────────────────────────────────────────────── */}
      <button
        onClick={handleAddClick}
        className="fixed bottom-24 right-6 z-60 h-14 w-14 bg-brutal-yellow border-[3px] border-black shadow-neo flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer group"
        aria-label="Suggest a route"
      >
        <Plus className="h-7 w-7 text-black group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
      </button>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      {selectedRoute && (
        <CommunityDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {/* ── LOGIN REQUIRED ────────────────────────────────────────────────── */}
      {showLoginRequired && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowLoginRequired(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background border-[3px] border-black shadow-neo-lg p-10 max-w-sm w-full text-center space-y-6"
          >
            <div className="h-16 w-16 bg-brutal-yellow border-2 border-black shadow-neo mx-auto flex items-center justify-center">
              <LogIn className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-black font-heading text-sm uppercase tracking-widest font-black">
                LOGIN_REQUIRED
              </h3>
              <p className="text-black/60 text-[9px] font-heading font-bold uppercase tracking-wider leading-relaxed">
                SIGN IN TO SUGGEST A ROUTE<br />AND JOIN THE COMMUNITY.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowLoginRequired(false); setShowAuthModal(true); }}
                className="w-full bg-black text-white font-heading font-black border-[3px] border-black py-4 shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
              >
                <LogIn className="h-3.5 w-3.5" strokeWidth={3} />
                SIGN IN WITH GOOGLE
              </button>
              <button
                onClick={() => setShowLoginRequired(false)}
                className="w-full border-2 border-dashed border-black/40 py-3 font-heading text-[9px] text-black/50 uppercase tracking-widest font-bold hover:border-black hover:text-black transition-all cursor-pointer"
              >
                MAYBE LATER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMING SOON ──────────────────────────────────────────────────── */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background border-[3px] border-black shadow-neo-lg p-10 max-w-sm w-full text-center space-y-6"
          >
            <div className="h-16 w-16 bg-brutal-green border-2 border-black shadow-neo mx-auto flex items-center justify-center">
              <Plus className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-black font-heading text-sm uppercase tracking-widest font-black">
                COMING_SOON
              </h3>
              <p className="text-black/60 text-[9px] font-heading font-bold uppercase tracking-wider leading-relaxed">
                THE SQUAD IS STILL CALIBRATING<br />THIS FEATURE. CHECK BACK SOON.
              </p>
            </div>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-brutal-yellow font-heading font-black text-black border-[3px] border-black py-4 shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] text-xs"
            >
              COGNIZED
            </button>
          </div>
        </div>
      )}

      {/* ── AUTH MODAL ───────────────────────────────────────────────────── */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
