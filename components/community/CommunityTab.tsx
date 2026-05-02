"use client";

import { useState, useEffect } from "react";
import { Plus, Users, X, LogIn, Zap } from "lucide-react";
import CommunityCard, { CommunityRoute, ACCENT_COLORS_LIST } from "./CommunityCard";
import CommunityDetailModal from "./CommunityModal";
import AuthModal from "@/components/auth/AuthModal";
import AddRouteModal from "./AddRouteModal";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── DB Row → CommunityRoute mapper ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
function mapDbRow(row: any, index: number, _userId: string | undefined): CommunityRoute {
  const routeArr: string[] = Array.isArray(row.full_route) ? row.full_route : [];
  const routeStr =
    routeArr.length > 0
      ? routeArr.join(" → ")
      : `${row.origin} → ${row.destination}`;
  const tag =
    Array.isArray(row.hashtags) && row.hashtags.length > 0
      ? row.hashtags[0]
      : "Less crowded";

  // Use current_user_vote if provided by the view
  const userVote = row.current_user_vote as "up" | "down" | null;

  return {
    id:          row.id as string,
    title:       `${row.origin} → ${row.destination}`,
    route:       routeStr,
    tag,
    tip:         row.tip ?? "",
    votes:       row.votes ?? 0,
    userVote:    userVote,
    author:      row.author_name ?? "COMMUNITY_USER",
    authorAvatar: row.author_avatar,
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
  const [showAddRoute, setShowAddRoute]         = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showAuthModal, setShowAuthModal]         = useState(false);
  const [isVisible, setIsVisible]                 = useState(false);
  const [user, setUser]                           = useState<User | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      setUser(freshUser ?? null);
    };
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session) {
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        setUser(freshUser ?? null);
        setShowLoginRequired(false);
        setShowAuthModal(false);
      } else {
        setUser(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch suggestions from Supabase ────────────────────────────────────────
  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from("suggestions_with_user_vote")
          .select("*")
          .order("votes", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRoutes((data ?? []).map((row: Record<string, unknown>, i: number) => mapDbRow(row, i, user?.id)));
      } catch (error: unknown) {
        console.error("fetchSuggestions error:", error);
        setFetchError("Failed to load community routes.");
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [user]);

  // ── Mount + ESC ────────────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showAuthModal)     { setShowAuthModal(false);     return; }
      if (showLoginRequired) { setShowLoginRequired(false); return; }
      if (selectedRoute)     { setSelectedRoute(null);      return; }
      if (showAddRoute)      { setShowAddRoute(false);      return; }
      onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedRoute, showAddRoute, showLoginRequired, showAuthModal]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddClick = () => {
    if (!user) setShowLoginRequired(true);
    else       setShowAddRoute(true);
  };

  const handleRouteSubmitted = (newRoute: { id: string; title: string; route: string[]; votes: number; tag: string; tip: string }) => {
    const meta = user?.user_metadata ?? {};
    const mapped: CommunityRoute = {
      id: newRoute.id,
      title: newRoute.title,
      route: newRoute.route.join(" → "),
      tag: newRoute.tag,
      tip: newRoute.tip,
      votes: 0,
      userVote: null,
      author: meta.full_name || meta.name || user?.email?.split('@')[0] || "COMMUNITY_USER",
      authorAvatar: meta.avatar_url || meta.picture || undefined,
      accentColor: ACCENT_COLORS_LIST[0],
    };
    setRoutes(prev => [mapped, ...prev]);
  };

  const handleVote = async (id: string, direction: "up" | "down") => {
    if (!user) {
      setShowLoginRequired(true);
      return;
    }

    const route = routes.find((r) => r.id === id);
    if (!route) return;

    let newVotes = route.votes;
    let newUserVote: "up" | "down" | null = direction;

    if (route.userVote === direction) {
      newVotes = direction === "up" ? route.votes - 1 : route.votes + 1;
      newUserVote = null;
    } else if (route.userVote === null) {
      newVotes = direction === "up" ? route.votes + 1 : route.votes - 1;
    } else {
      newVotes = direction === "up" ? route.votes + 2 : route.votes - 2;
    }

    setRoutes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, votes: newVotes, userVote: newUserVote } : r
      )
    );

    try {
      if (newUserVote === null) {
        await supabase
          .from("suggestion_votes")
          .delete()
          .eq("suggestion_id", id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("suggestion_votes")
          .upsert({
            suggestion_id: id,
            user_id: user.id,
            vote_type: newUserVote
          }, { onConflict: "user_id, suggestion_id" });
      }
    } catch (err) {
      console.error("Critical error updating vote:", err);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto py-4 sm:py-10 px-4 pb-32 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[600px] mx-auto transition-transform duration-300 ${
            isVisible ? "scale-100" : "scale-95"
          }`}
        >
          {/* HEADER (FIXED IN PLACE RELATIVE TO CONTENT) */}
          <div className="bg-black border-[3px] border-black mb-0 flex items-center justify-between px-5 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 border-2 border-white/20">
                <Users className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="font-heading text-[10px] text-white tracking-[0.25em] uppercase font-black">
                  COMMUNITY_HUB
                </p>
                <p className="font-heading text-[7px] text-white/40 uppercase tracking-widest font-bold">
                  STREET_KNOWLEDGE // DELHI_METRO
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddClick}
                className="h-9 px-4 flex items-center justify-center gap-2 bg-brutal-yellow border-2 border-white hover:brightness-95 active:scale-95 transition-all cursor-pointer font-heading text-[9px] font-black uppercase text-black tracking-widest shadow-neo shadow-white/20 active:shadow-none translate-y-[-1px]"
                aria-label="Add Route"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                ADD ROUTE
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center bg-brutal-pink border-2 border-white hover:brightness-95 active:scale-95 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-black" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* KICKER */}
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

          {/* SINGLE-COLUMN CARD LIST */}
          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : fetchError ? (
              <div className="border-[3px] border-black bg-brutal-pink p-6 text-center">
                <p className="font-heading text-[10px] font-black uppercase tracking-widest text-black">
                  {fetchError}
                </p>
              </div>
            ) : routes.length === 0 ? (
              <div className="border-[3px] border-dashed border-black p-10 text-center bg-white/60">
                <p className="font-heading text-[10px] font-black uppercase tracking-widest text-black">
                  NO_ROUTES_YET
                </p>
              </div>
            ) : (
              routes.map((route, i) => (
                <div key={route.id} style={{ animationDelay: `${i * 60}ms` }}>
                  <CommunityCard
                    data={route}
                    onVote={handleVote}
                    onClick={() => setSelectedRoute(route)}
                    isSignedIn={!!user}
                  />
                </div>
              ))
            )}
          </div>

          {/* CREDITS FOOTER */}
          <div className="mt-12 mb-6 text-center opacity-40">
            <p className="font-heading text-[9px] text-black uppercase tracking-[0.2em] font-black">
              DEV //{" "}
              <a 
                href="https://github.com/otzua/LIBRE-METRO" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brutal-pink hover:underline"
              >
                KRISH
              </a>{" "}
              & SHUBHAM
            </p>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedRoute && (
        <CommunityDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}

      {/* LOGIN REQUIRED */}
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

      {/* ── ADD ROUTE MODAL ───────────────────────────────────────────────── */}
      {showAddRoute && (
        <AddRouteModal
          onClose={() => setShowAddRoute(false)}
          onSubmit={handleRouteSubmitted}
          user={user}
        />
      )}

      {/* AUTH MODAL */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
