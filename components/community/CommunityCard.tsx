"use client";

import { ChevronUp, ChevronDown, ArrowRight } from "lucide-react";
import React from "react";

export interface CommunityRoute {
  id: string;
  title: string;
  route: string;
  tag: string;
  tip: string;
  votes: number;
  userVote: "up" | "down" | null;
  author?: string;
  authorAvatar?: string;
  initials?: string;
  accentColor?: string;
}

interface CommunityCardProps {
  data: CommunityRoute;
  onVote: (id: string, direction: "up" | "down") => void;
  onClick: () => void;
  isSignedIn?: boolean;
}

const TAG_STYLES: Record<string, string> = {
  "Less crowded":   "bg-brutal-green",
  "Fastest":        "bg-brutal-yellow",
  "No interchange": "bg-brutal-blue",
  "Scenic":         "bg-brutal-lavender",
  "Budget":         "bg-brutal-pink",
};

const ACCENT_COLORS = [
  "bg-brutal-yellow",
  "bg-brutal-blue",
  "bg-brutal-green",
  "bg-brutal-lavender",
  "bg-brutal-pink",
];

export const ACCENT_COLORS_LIST = ACCENT_COLORS;

/**
 * Renders a string with "→" replaced by the ArrowRight icon.
 */
function RenderTitle({ title }: { title: string }) {
  const parts = title.split("→");
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p.trim()}
          {i < parts.length - 1 && <ArrowRight className="h-3 w-3 inline-block" />}
        </React.Fragment>
      ))}
    </span>
  );
}

export default function CommunityCard({ data, onVote, onClick }: CommunityCardProps) {
  const tagStyle = TAG_STYLES[data.tag] ?? "bg-brutal-lavender";
  // derive accent from first char of id for deterministic color
  const accentIdx = data.id.charCodeAt(0) % ACCENT_COLORS.length;
  const accent    = data.accentColor ?? ACCENT_COLORS[accentIdx];
  const initials  = data.initials ?? (data.author ? data.author.slice(0, 2).toUpperCase() : "CM");

  return (
    <div
      onClick={onClick}
      className="group w-full bg-white border-[3px] border-black shadow-neo cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      {/* ── TOP ROW: avatar + author + tag ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-[3px] border-black">
        {/* Avatar */}
        <div className={`h-9 w-9 shrink-0 ${accent} border-2 border-black flex items-center justify-center overflow-hidden`}>
          {data.authorAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.authorAvatar} alt={data.author} className="h-full w-full object-cover" />
          ) : (
            <span className="font-heading text-[9px] font-black text-black tracking-wider">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-heading text-[10px] sm:text-[9px] font-black text-black uppercase tracking-widest truncate">
            {data.author ?? "COMMUNITY_USER"}
          </p>
          <p className="font-heading text-[7px] text-black/40 uppercase tracking-widest font-bold">
            LOCAL_RIDER // VERIFIED
          </p>
        </div>

        {/* Tag */}
        <span className={`shrink-0 text-[8px] font-heading uppercase tracking-widest px-2 py-1 border-2 border-black font-black ${tagStyle}`}>
          {data.tag}
        </span>
      </div>

      {/* ── MIDDLE: title + tip (side by side on wide, stacked on narrow) ── */}
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:gap-6 border-b-[3px] border-black">
        <div className="flex-1 min-w-0 mb-1 sm:mb-0">
          <p className="font-heading text-[12px] sm:text-[11px] font-black text-black uppercase tracking-wider leading-relaxed">
            <RenderTitle title={data.title} />
          </p>
        </div>
        <p className="text-black/55 text-[10px] sm:text-[9px] font-heading uppercase tracking-wider leading-relaxed font-bold sm:max-w-[50%]">
          {data.tip}
        </p>
      </div>

      {/* ── BOTTOM ROW: route path + vote controls ───────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Route segments */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {data.route.split("→").map((seg, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <span className="font-heading text-[8px] bg-black text-white px-2 py-0.5 font-black tracking-widest uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                {seg.trim()}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight className="h-2.5 w-2.5 text-black opacity-30 shrink-0" />
              )}
            </span>
          ))}
        </div>

        {/* Vote controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={() => onVote(data.id, "up")}
            className={`h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center border-2 border-black transition-all active:scale-90 cursor-pointer ${
              data.userVote === "up"
                ? "bg-brutal-green shadow-none translate-x-[1px] translate-y-[1px]"
                : "bg-white shadow-neo hover:bg-brutal-green/30"
            }`}
            aria-label="Upvote"
          >
            <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4 text-black" strokeWidth={3} />
          </button>

          <span className="font-numbers text-sm sm:text-xs font-black min-w-[32px] text-center tabular-nums text-black">
            {data.votes > 0 ? `+${data.votes}` : data.votes}
          </span>

          <button
            onClick={() => onVote(data.id, "down")}
            className={`h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center border-2 border-black transition-all active:scale-90 cursor-pointer ${
              data.userVote === "down"
                ? "bg-brutal-pink shadow-none translate-x-[1px] translate-y-[1px]"
                : "bg-white shadow-neo hover:bg-brutal-pink/30"
            }`}
             aria-label="Downvote"
          >
            <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 text-black" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
