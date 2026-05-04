"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowUpDown,
  Clock,
  MapPin,
  ArrowRight,
  TriangleAlert,
  Train,
  Lightbulb,
  ArrowRightLeft,
} from "lucide-react";
import FareBreakdown from "./FareBreakdown";
import { lazy, Suspense } from "react";
const MapView = lazy(() => import("@/components/map/MapView"));
import {
  buildStationIndex,
  getAutocompleteSuggestions,
  findBestMatch,
  StationRecord,
} from "@/lib/station-matcher";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetroRouteResponse {
  status: number;
  line1?: string[];
  line2?: string[];
  interchange?: string[];
  lineEnds?: string[];
  path?: string[];
  time?: number;
  message?: string;
  mode?: "fastest" | "comfort";
  interchangeCount?: number;
  pathCoords?: { station: string; lat: number | null; lon: number | null }[];
}

// ─── Metro line colors ────────────────────────────────────────────────────────

export const LINE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; accent: string }
> = {
  blue:        { bg: "bg-[#5294FF]", text: "text-white", border: "border-[#5294FF]", accent: "#5294FF" },
  bluebranch:  { bg: "bg-[#5294FF]", text: "text-white", border: "border-[#5294FF]", accent: "#5294FF" },
  yellow:      { bg: "bg-[#FACC00]", text: "text-black", border: "border-[#FACC00]", accent: "#FACC00" },
  magenta:     { bg: "bg-[#CC0066]", text: "text-white", border: "border-[#CC0066]", accent: "#CC0066" },
  violet:      { bg: "bg-[#7A83FF]", text: "text-white", border: "border-[#7A83FF]", accent: "#7A83FF" },
  red:         { bg: "bg-[#FF4D50]", text: "text-white", border: "border-[#FF4D50]", accent: "#FF4D50" },
  green:       { bg: "bg-[#05E17A]", text: "text-white", border: "border-[#05E17A]", accent: "#05E17A" },
  greenbranch: { bg: "bg-[#05E17A]", text: "text-white", border: "border-[#05E17A]", accent: "#05E17A" },
  pink:        { bg: "bg-[#FF4D50]", text: "text-white", border: "border-[#FF4D50]", accent: "#FF4D50" },
  pinkbranch:  { bg: "bg-[#FF4D50]", text: "text-white", border: "border-[#FF4D50]", accent: "#FF4D50" },
  orange:      { bg: "bg-[#FF7A05]", text: "text-white", border: "border-[#FF7A05]", accent: "#FF7A05" },
  aqua:        { bg: "bg-[#00ACC1]", text: "text-white", border: "border-[#00ACC1]", accent: "#00ACC1" },
  grey:        { bg: "bg-[#757575]", text: "text-white", border: "border-[#757575]", accent: "#757575" },
  rapid:       { bg: "bg-[#FF7A05]", text: "text-white", border: "border-[#FF7A05]", accent: "#FF7A05" },
  "1.2km Skywalk": { bg: "bg-[#9E9E9E]", text: "text-white", border: "border-[#9E9E9E]", accent: "#9E9E9E" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchContainer({
  from,
  setFrom,
  to,
  setTo,
}: {
  from: string;
  setFrom: (s: string) => void;
  to: string;
  setTo: (s: string) => void;
}) {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{
    field: "from" | "to";
    name: string;
  } | null>(null);
  const [routeResult, setRouteResult] = useState<MetroRouteResponse | null>(null);

  // Station index for client-side autocomplete + pre-validation
  const [stationIndex, setStationIndex] = useState<StationRecord[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<"from" | "to" | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const resultRef   = useRef<HTMLDivElement>(null);

  // ── Load station list on mount ──────────────────────────────────────────────
  useEffect(() => {
    setStationsLoading(true);
    fetch("/api/dmrc?type=all-stations")
      .then((res) => res.json())
      .then((data) => {
        if (data.stations && Array.isArray(data.stations)) {
          setStationIndex(buildStationIndex(data.stations));
        }
      })
      .catch((err) => console.error("Could not load stations for autocomplete", err))
      .finally(() => setStationsLoading(false));

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Suggestion: fuzzy hint when user stops typing ──────────────────────────
  // Show a "did you mean?" banner if input doesn't exactly match a station.
  const computeSuggestion = useCallback(
    (value: string, field: "from" | "to") => {
      if (!value.trim() || stationIndex.length === 0) {
        setSuggestion(null);
        return;
      }
      const match = findBestMatch(value, stationIndex);
      if (
        match &&
        match.method !== "exact" &&
        match.station.original.toLowerCase() !== value.toLowerCase()
      ) {
        setSuggestion({ field, name: match.station.original });
      } else {
        setSuggestion(null);
      }
    },
    [stationIndex]
  );

  // ── Swap ────────────────────────────────────────────────────────────────────
  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
    setActiveDropdown(null);
    setSuggestion(null);
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setActiveDropdown(null);
    setSuggestion(null);

    if (!from.trim() || !to.trim()) {
      setError("Please enter both source and destination stations.");
      setRouteResult(null);
      return;
    }

    // Client-side pre-resolve for debug logging; the server also resolves
    if (stationIndex.length > 0) {
      const mFrom = findBestMatch(from, stationIndex);
      const mTo   = findBestMatch(to,   stationIndex);
      console.debug("[Search] from:", from, "→", mFrom?.station.original ?? "NO MATCH");
      console.debug("[Search] to:  ", to,   "→", mTo?.station.original   ?? "NO MATCH");
    }

    setLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch(
        `/api/dmrc?type=route&from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}&mode=fastest`
      );
      const data: MetroRouteResponse = await response.json();

      if (data.status !== 200) {
        setError(data.message || "Unable to fetch route. Check station names.");
      } else {
        setRouteResult(data);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, [from, to, stationIndex]);

  // ── Autocomplete suggestions ─────────────────────────────────────────────
  const getFilteredStations = (query: string): StationRecord[] => {
    if (!query) return [];
    return getAutocompleteSuggestions(query, stationIndex, 6);
  };

  /**
   * Determines which metro line a station belongs to in the route path.
   */
  const getStationLineInfo = (
    stationName: string,
    idx: number,
    route: MetroRouteResponse
  ) => {
    const interchangeStations = route.interchange || [];
    const isInterchange = interchangeStations
      .map((s) => s.toLowerCase())
      .includes(stationName.toLowerCase());

    let firstInterchangeIdx = -1;
    if (route.path && interchangeStations.length > 0) {
      firstInterchangeIdx = route.path.findIndex((p) =>
        interchangeStations.map((s) => s.toLowerCase()).includes(p.toLowerCase())
      );
    }

    let currentLine: string;
    if (firstInterchangeIdx === -1 || idx <= firstInterchangeIdx) {
      currentLine = route.line1?.[0] || "blue";
    } else {
      currentLine = route.line2?.[0] || route.line1?.[0] || "blue";
    }

    return { currentLine, isInterchange };
  };

  const titleCase = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  /** Deterministic platform number (1 or 2) derived from direction string */
  const getPlatform = (direction: string): number => {
    if (!direction) return 1;
    let hash = 0;
    for (let i = 0; i < direction.length; i++) {
      hash = direction.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 2) + 1;
  };

  /** Get the boarding direction for a given segment index */
  const getBoardingInfo = (segmentIdx: number) => {
    const raw = routeResult?.lineEnds?.[segmentIdx];
    const dir = raw && String(raw) !== "0" ? titleCase(String(raw)) : null;
    return { direction: dir, platform: dir ? getPlatform(dir) : null };
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={dropdownRef}
      className="mx-auto w-full max-w-[500px] mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-4"
    >
      {/* ── MAIN SEARCH CONTAINER ── */}
      <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_#000] relative shrink-0">
        {/* Header bar — accent color */}
        <div className="bg-[var(--accent,#FF2E88)] border-b-[3px] border-black px-4 py-2.5 flex justify-between items-center">
          <span className="font-heading text-[8px] text-black tracking-[0.18em] font-black">
            ROUTE_FINDER // CTRL_PANEL
          </span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 bg-black" />
            <div className="w-3 h-3 bg-white border-2 border-black" />
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 relative">

          {/* ── 1. FROM STATION ────────────────────────────────────────────── */}
          <div className="relative z-30">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 bg-black" />
              <label className="font-heading text-[9px] tracking-widest uppercase font-black opacity-50">
                FROM STATION
              </label>
            </div>
            <div className="h-14 w-full bg-white border-[3px] border-black flex items-center px-4 relative focus-within:shadow-[4px_4px_0_#000] transition-all">
              <input
                type="text"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActiveDropdown("from");
                  computeSuggestion(e.target.value, "from");
                }}
                onFocus={() => setActiveDropdown("from")}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  stationsLoading ? "LOADING STATIONS..." : "E.G. RAJIV CHOWK"
                }
                className="w-full h-full bg-transparent outline-none font-heading text-xs uppercase tracking-widest text-black placeholder:text-black/30 placeholder:opacity-50"
              />
            </div>

            {/* FROM AUTOCOMPLETE */}
            {activeDropdown === "from" && from.length > 0 && (
              <div className="absolute top-[68px] left-0 w-full bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col z-50 max-h-[200px] overflow-y-auto">
                {getFilteredStations(from).length > 0 ? (
                  getFilteredStations(from).map((station, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b-[2px] border-black/10 cursor-pointer font-heading text-[10px] uppercase text-black last:border-b-0 transition-all hover:bg-[var(--accent-soft,#FFE0EE)] hover:pl-5"
                      onClick={() => {
                        setFrom(station.original);
                        setSuggestion(null);
                        setActiveDropdown(null);
                      }}
                    >
                      {station.original}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 font-heading text-[10px] uppercase text-black/40">
                    NO MATCHES FOUND
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 2. SWAP BUTTON ─────────────────────────────────────────────── */}
          <div className="flex justify-start pl-[28px] relative z-20">
            <button
              onClick={handleSwap}
              className="h-11 w-11 border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0_#000] hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
              style={{ backgroundColor: "var(--bg-accent)" }}
            >
              <ArrowUpDown className="h-4 w-4 text-black" />
            </button>
          </div>

          {/* ── 3. TO STATION ──────────────────────────────────────────────── */}
          <div className="relative z-20">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 bg-black" />
              <label className="font-heading text-[9px] tracking-widest uppercase font-black opacity-50">
                TO STATION
              </label>
            </div>
            <div className="h-14 w-full bg-white border-[3px] border-black flex items-center px-4 focus-within:shadow-[4px_4px_0_#000] transition-all relative">
              <input
                type="text"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActiveDropdown("to");
                  computeSuggestion(e.target.value, "to");
                }}
                onFocus={() => setActiveDropdown("to")}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  stationsLoading ? "LOADING STATIONS..." : "E.G. HAUZ KHAS"
                }
                className="w-full h-full bg-transparent outline-none font-heading text-xs uppercase tracking-widest text-black placeholder:text-black/30 placeholder:opacity-50"
              />
            </div>

            {/* TO AUTOCOMPLETE */}
            {activeDropdown === "to" && to.length > 0 && (
              <div className="absolute top-[68px] left-0 w-full bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex flex-col z-50 max-h-[200px] overflow-y-auto">
                {getFilteredStations(to).length > 0 ? (
                  getFilteredStations(to).map((station, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b-[2px] border-black/10 cursor-pointer font-heading text-[10px] uppercase text-black last:border-b-0 transition-all hover:bg-[var(--accent-soft,#FFE0EE)] hover:pl-5"
                      onClick={() => {
                        setTo(station.original);
                        setSuggestion(null);
                        setActiveDropdown(null);
                      }}
                    >
                      {station.original}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 font-heading text-[10px] uppercase text-black/40">
                    NO MATCHES FOUND
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. FIND ROUTE BUTTON ───────────────────────────────────────── */}
          <div className="pt-2 relative z-10">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="h-[52px] w-full border-[3px] border-black shadow-neo flex items-center justify-center gap-2.5 transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-neo cursor-pointer"
              style={{ backgroundColor: "var(--accent, #FF2E88)" }}
            >
              {loading ? (
                <div className="h-4 w-4 border-[3px] border-black border-t-transparent animate-spin" />
              ) : (
                <Train className="h-5 w-5 text-black" strokeWidth={3} />
              )}
              <span className="font-heading text-[11px] tracking-[0.15em] font-black uppercase text-black">
                {loading ? "SEARCHING..." : "FIND ROUTE"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── "DID YOU MEAN?" SUGGESTION BANNER ────────────────────────────────── */}
      {suggestion && (
        <div className="bg-brutal-yellow border-2 border-black shadow-neo p-4 animate-in fade-in slide-in-from-top-2">
          <p className="font-heading text-[10px] text-black uppercase tracking-widest flex items-start gap-2 flex-wrap">
            <span className="bg-black text-brutal-yellow px-2 py-1 flex items-center gap-1 shrink-0">
              <Lightbulb className="h-3 w-3" /> DID YOU MEAN?
            </span>
            <button
              className="underline underline-offset-2 hover:no-underline transition-all"
              onClick={() => {
                if (suggestion.field === "from") setFrom(suggestion.name);
                else setTo(suggestion.name);
                setSuggestion(null);
              }}
            >
              {suggestion.name}
            </button>
          </p>
        </div>
      )}

      {/* ── ERROR MESSAGE ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-brutal-pink border-2 border-black shadow-neo p-4 animate-in fade-in slide-in-from-top-2">
          <p className="font-heading text-[10px] text-black uppercase tracking-widest flex items-center gap-2">
            <span className="bg-black text-brutal-pink px-2 py-1 flex items-center gap-1">
              <TriangleAlert className="h-3 w-3" /> ERROR
            </span>
            {error}
          </p>
        </div>
      )}

      {/* ── ROUTE RESULT ──────────────────────────────────────────────────────── */}
      {routeResult && !loading && (
        <div
          ref={resultRef}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4"
        >
          {/* FARE BREAKDOWN */}
          <FareBreakdown stopsCount={routeResult.path?.length || 1} from={from} to={to} />

          {/* HEADER CARD */}
          <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_#000] overflow-hidden">
            <div className="bg-[var(--accent,#FF2E88)] border-b-[3px] border-black px-3 py-2 flex justify-between items-center">
              <span className="font-heading text-[8px] text-black font-black tracking-[0.15em] uppercase">
                RESULT // ROUTE_CALCULATED
              </span>
              <div className="h-2 w-2 bg-black rounded-full animate-pulse" />
            </div>

            <div className="p-6 space-y-4">
              {/* FROM → TO summary */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-white border-[3px] border-black px-3 py-1.5 font-heading text-[10px] font-black shadow-[4px_4px_0_#000] uppercase">
                  {from}
                </span>
                <ArrowRight size={18} strokeWidth={3} />
                <span className="bg-white border-[3px] border-black px-3 py-1.5 font-heading text-[10px] font-black shadow-[4px_4px_0_#000] uppercase">
                  {to}
                </span>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "TIME", val: `${routeResult.time ? Math.round(routeResult.time) : 0} MIN`, icon: Clock, color: "#FACC00" },
                  { label: "STOPS", val: routeResult.path?.length || 0, icon: MapPin, color: "#5294FF" },
                  { label: "LINES", val: ((routeResult.line1?.length || 0) + (routeResult.line2?.length || 0)) || 1, icon: Train, color: "#D4FF00" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white border-[3px] border-black shadow-[3px_3px_0_#000] py-2.5 px-1 flex flex-col items-center justify-center">
                    <div className="border-2 border-black p-1 mb-1" style={{ backgroundColor: stat.color }}>
                      <stat.icon size={12} strokeWidth={3} />
                    </div>
                    <span className="font-heading text-[6px] opacity-45 uppercase tracking-widest">{stat.label}</span>
                    <span className="font-heading text-[11px] font-black mt-0.5 uppercase tracking-widest">{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Line badges */}
              <div className="flex flex-wrap gap-2">
                {routeResult.line1?.map((line, i) => {
                  const colors = LINE_COLORS[line] || LINE_COLORS.blue;
                  return (
                    <span
                      key={`l1-${i}`}
                      className={`${colors.bg} ${colors.text} font-heading text-[8px] uppercase tracking-widest px-3 py-1 border-2 border-black shadow-neo`}
                    >
                      {line} LINE
                    </span>
                  );
                })}
                {routeResult.line2 &&
                  routeResult.line2.length > 0 &&
                  routeResult.line2.map((line, i) => {
                    const colors = LINE_COLORS[line] || LINE_COLORS.blue;
                    return (
                      <span
                        key={`l2-${i}`}
                        className={`${colors.bg} ${colors.text} font-heading text-[8px] uppercase tracking-widest px-3 py-1 border-2 border-black shadow-neo`}
                      >
                        {line} LINE
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* FULL ROUTE PATH CARD */}
          <div className="bg-white border-[3px] border-black shadow-neo relative overflow-hidden">
            <div className="h-9 bg-black flex items-center px-3 justify-between">
              <span className="font-heading text-[8px] text-white tracking-widest">
                TRAJECTORY // STATION_PATH
              </span>
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-white/20" />
                <div className="h-2 w-2 bg-white/40" />
                <div className="h-2 w-2 bg-[var(--accent,#FF2E88)]" />
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative">
                {routeResult.path?.map((stationName, idx) => {
                  const isFirst = idx === 0;
                  const isLast  = idx === (routeResult.path?.length || 0) - 1;
                  const { currentLine, isInterchange } = getStationLineInfo(
                    stationName,
                    idx,
                    routeResult
                  );
                  const lineColor = LINE_COLORS[currentLine] || LINE_COLORS.blue;

                  return (
                    <div key={idx} className="flex items-stretch relative group">
                      {/* Left: Line + Node */}
                      <div className="flex flex-col items-center w-8 shrink-0 relative">
                        {!isFirst && (
                          <div
                            className="w-[3px] flex-1"
                            style={{ backgroundColor: lineColor.accent }}
                          />
                        )}
                        {isFirst && <div className="flex-1" />}

                        {/* Node dot */}
                        <div
                          className={`shrink-0 border-2 border-black z-10 flex items-center justify-center transition-transform group-hover:scale-125
                            ${
                              isFirst || isLast
                                ? "h-5 w-5"
                                : isInterchange
                                ? "h-5 w-5 rounded-full"
                                : "h-3 w-3 rounded-full"
                            }
                          `}
                          style={{
                            backgroundColor: isFirst
                              ? "#88D498"
                              : isLast
                              ? "#FF6B6B"
                              : isInterchange
                              ? "#FFD23F"
                              : "#FFFFFF",
                          }}
                        >
                          {isInterchange && (
                            <div className="h-1.5 w-1.5 bg-black rounded-full" />
                          )}
                        </div>

                        {/* Bottom connector */}
                        {!isLast && (
                          <div
                            className="w-[3px] flex-1"
                            style={{
                              backgroundColor: isInterchange
                                ? (
                                    LINE_COLORS[
                                      routeResult.line2?.[0] || currentLine
                                    ] || lineColor
                                  ).accent
                                : lineColor.accent,
                            }}
                          />
                        )}
                        {isLast && <div className="flex-1" />}
                      </div>

                      {/* Right: Station details */}
                      <div
                        className={`flex-1 flex items-center min-h-[36px] sm:min-h-[44px] pl-4 pr-2 transition-all
                          ${
                            isFirst || isLast || isInterchange
                              ? "py-1.5 sm:py-2"
                              : "py-0.5 sm:py-1"
                          }
                        `}
                      >
                        <div className="flex-1">
                          <span
                            className={`font-heading uppercase tracking-wider block
                              ${
                                isFirst || isLast
                                  ? "text-[10px] sm:text-[11px] font-black text-black"
                                  : isInterchange
                                  ? "text-[10px] sm:text-[11px] font-bold text-black"
                                  : "text-[9px] sm:text-[10px] text-gray-600 group-hover:text-black transition-colors"
                              }
                            `}
                          >
                            {titleCase(stationName)}
                          </span>

                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {isFirst && (
                              <span className="font-heading text-[7px] bg-brutal-green border border-black px-1.5 py-0.5 uppercase tracking-wider">
                                START
                              </span>
                            )}
                            {isLast && (
                              <span className="font-heading text-[7px] bg-brutal-pink border border-black px-1.5 py-0.5 uppercase tracking-wider">
                                END
                              </span>
                            )}
                            {isInterchange && (
                              <span className="font-heading text-[7px] bg-brutal-yellow border border-black px-1.5 py-0.5 uppercase tracking-wider flex items-center gap-1">
                                <ArrowRightLeft className="h-2 w-2" /> INTERCHANGE
                              </span>
                            )}
                            {(isFirst || isInterchange) && (
                              <span
                                className="font-heading text-[7px] border border-black px-1.5 py-0.5 uppercase tracking-wider text-white"
                                style={{ backgroundColor: lineColor.accent }}
                              >
                                {currentLine} LINE
                              </span>
                            )}
                            {isInterchange && routeResult.line2?.[0] && (
                              <span
                                className="font-heading text-[7px] border border-black px-1.5 py-0.5 uppercase tracking-wider text-white flex items-center gap-1"
                                style={{
                                  backgroundColor: (
                                    LINE_COLORS[routeResult.line2[0]] ||
                                    lineColor
                                  ).accent,
                                }}
                              >
                                <ArrowRight className="h-2 w-2 text-white" /> {routeResult.line2[0]} LINE
                              </span>
                            )}
                          </div>

                          {/* ── START: board direction + platform ── */}
                          {isFirst && (() => {
                            const { direction, platform } = getBoardingInfo(0);
                            return (
                              <div className="mt-1.5 space-y-0.5">
                                <p className="font-heading text-[7px] uppercase tracking-wider text-black/70">
                                  Board towards: <span className="font-black text-black">{direction ?? "—"}</span>
                                </p>
                                <p className="font-heading text-[7px] uppercase tracking-wider text-black/70">
                                  Platform: <span className="font-black text-black">{platform ?? "Not available"}</span>
                                </p>
                              </div>
                            );
                          })()}

                          {/* ── INTERCHANGE: full step-by-step guidance ── */}
                          {isInterchange && (() => {
                            const seg1 = getBoardingInfo(1);
                            const nextLine = routeResult.line2?.[0];
                            return (
                              <div className="mt-2 border-t border-black/20 pt-2 space-y-1">
                                <p className="font-heading text-[7px] uppercase tracking-wider text-brutal-pink font-black">
                                  ↑ Exit {titleCase(currentLine)} Line
                                </p>
                                {nextLine && (
                                  <p className="font-heading text-[7px] uppercase tracking-wider text-black font-black flex items-center gap-1">
                                    Follow signs <ArrowRight className="h-2 w-2" /> {titleCase(nextLine)} Line
                                  </p>
                                )}
                                <p className="font-heading text-[7px] uppercase tracking-wider text-black/70">
                                  Board towards: <span className="font-black text-black">{seg1.direction ?? "—"}</span>
                                </p>
                                <p className="font-heading text-[7px] uppercase tracking-wider text-black/70">
                                  Platform: <span className="font-black text-black">{seg1.platform ?? "Not available"}</span>
                                </p>
                              </div>
                            );
                          })()}

                          {/* ── END: arrive + exit ── */}
                          {isLast && (
                            <div className="mt-1.5 space-y-0.5">
                              <p className="font-heading text-[7px] uppercase tracking-wider text-black/70">
                                Arrive at <span className="font-black text-black">{titleCase(stationName)}</span>
                              </p>
                              <p className="font-heading text-[7px] uppercase tracking-wider text-black/70 font-black">
                                ↑ Exit station
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direction info footer */}
            {routeResult.lineEnds && routeResult.lineEnds.length > 0 && (
              <div className="border-t-[3px] border-black bg-[#FAFAF5] px-6 py-3">
                <p className="font-heading text-[8px] uppercase tracking-widest text-black/60 flex items-center gap-2">
                  BOARD TOWARDS <ArrowRight className="h-2.5 w-2.5 text-black" />{" "}
                  <span className="text-black font-bold">
                    {titleCase(routeResult.lineEnds.join(" / "))}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* ── MAP VIEW (Appears directly below the valid route results) ── */}
          <div className="mt-4">
            <Suspense fallback={
              <div className="border-[3px] border-black shadow-neo h-[380px] bg-[#f0ede8] flex flex-col">
                <div className="h-9 bg-black flex items-center px-3 justify-between">
                  <span className="font-heading text-[8px] text-white tracking-widest">SYSTEM_MAP // LOADING...</span>
                  <div className="h-2 w-2 bg-[var(--accent,#FF2E88)] animate-pulse" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-4 w-4 border-[3px] border-black border-t-transparent animate-spin" />
                </div>
              </div>
            }>
              <MapView 
                highlightedPath={routeResult.path} 
                activeLine={routeResult.line1?.[0]} 
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
