"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

export interface CommunityRoute {
  id: number;
  title: string;
  route: string;
  tag: string;
  tip: string;
  votes: number;
  userVote: "up" | "down" | null;
}

interface CommunityCardProps {
  data: CommunityRoute;
  onVote: (id: number, direction: "up" | "down") => void;
  onClick: () => void;
}

const TAG_STYLES: Record<string, string> = {
  "Less crowded": "bg-brutal-green",
  "Fastest":      "bg-brutal-yellow",
  "No interchange": "bg-brutal-blue",
};

export default function CommunityCard({ data, onVote, onClick }: CommunityCardProps) {
  const tagStyle = TAG_STYLES[data.tag] ?? "bg-brutal-lavender";

  return (
    <div
      onClick={onClick}
      className="group w-full bg-white border-[3px] border-black shadow-neo p-5 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none mb-2"
    >
      {/* TOP ROW — tag + votes */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* TAG */}
        <span
          className={`inline-block text-[10px] font-heading uppercase tracking-widest px-3 py-1.5 border-2 border-black font-black ${tagStyle}`}
        >
          {data.tag}
        </span>

        {/* VOTE CONTROLS */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onVote(data.id, "up")}
            className={`h-9 w-9 flex items-center justify-center border-2 border-black transition-all active:scale-95 cursor-pointer ${
              data.userVote === "up" ? "bg-brutal-green shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
            }`}
            aria-label="Upvote"
          >
            <ChevronUp className="h-5 w-5 text-black" strokeWidth={3} />
          </button>

          <span
            className={`font-numbers text-sm font-black min-w-[34px] text-center tabular-nums text-black`}
          >
            {data.votes > 0 ? `+${data.votes}` : data.votes}
          </span>

          <button
            onClick={() => onVote(data.id, "down")}
            className={`h-9 w-9 flex items-center justify-center border-2 border-black transition-all active:scale-95 cursor-pointer ${
              data.userVote === "down" ? "bg-brutal-pink shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
            }`}
            aria-label="Downvote"
          >
            <ChevronDown className="h-5 w-5 text-black" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ROUTE TITLE */}
      <h3 className="text-black font-heading text-xs uppercase tracking-widest leading-relaxed font-black mb-2">
        {data.title}
      </h3>

      {/* HINT */}
      <div className="flex items-center gap-2">
        <div className="h-[2px] flex-1 bg-black opacity-10" />
        <span className="text-black/40 font-heading text-[8px] uppercase tracking-[0.2em] font-bold">
          PATH_DETAILS // v1.0
        </span>
      </div>
    </div>
  );
}
