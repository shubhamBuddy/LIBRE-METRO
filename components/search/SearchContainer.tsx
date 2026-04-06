"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUpDown, Clock, MapPin, ArrowRight, TriangleAlert, Train } from "lucide-react";
import FareBreakdown from "./FareBreakdown";

interface MetroRouteResponse {
  status: number;
  line1?: string[];
  line2?: string[];
  interchange?: string[];
  lineEnds?: string[];
  path?: string[];
  time?: number;
  message?: string;
}

// Metro line color mapping for the route display
const LINE_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  blue:    { bg: 'bg-[#0052A5]', text: 'text-white',    border: 'border-[#0052A5]', accent: '#0052A5' },
  yellow:  { bg: 'bg-[#FFCB05]', text: 'text-black',    border: 'border-[#FFCB05]', accent: '#FFCB05' },
  magenta: { bg: 'bg-[#CC0066]', text: 'text-white',    border: 'border-[#CC0066]', accent: '#CC0066' },
  violet:  { bg: 'bg-[#7B1FA2]', text: 'text-white',    border: 'border-[#7B1FA2]', accent: '#7B1FA2' },
  red:     { bg: 'bg-[#E53935]', text: 'text-white',    border: 'border-[#E53935]', accent: '#E53935' },
  green:   { bg: 'bg-[#388E3C]', text: 'text-white',    border: 'border-[#388E3C]', accent: '#388E3C' },
  pink:    { bg: 'bg-[#E91E63]', text: 'text-white',    border: 'border-[#E91E63]', accent: '#E91E63' },
  orange:  { bg: 'bg-[#EF6C00]', text: 'text-white',    border: 'border-[#EF6C00]', accent: '#EF6C00' },
  aqua:    { bg: 'bg-[#00ACC1]', text: 'text-white',    border: 'border-[#00ACC1]', accent: '#00ACC1' },
  grey:    { bg: 'bg-[#757575]', text: 'text-white',    border: 'border-[#757575]', accent: '#757575' },
  rapid:   { bg: 'bg-[#EF6C00]', text: 'text-white',    border: 'border-[#EF6C00]', accent: '#EF6C00' },
};

function getLineColor(lines: string[] | undefined) {
  if (!lines || lines.length === 0) return LINE_COLORS.blue;
  return LINE_COLORS[lines[0]] || LINE_COLORS.blue;
}


export default function SearchContainer({ 
  from, 
  setFrom, 
  to, 
  setTo 
}: { 
  from: string; 
  setFrom: (s: string) => void; 
  to: string; 
  setTo: (s: string) => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<MetroRouteResponse | null>(null);

  // Autocomplete states
  const [stationList, setStationList] = useState<string[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<"from" | "to" | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load station list from API for accurate autocomplete
    setStationsLoading(true);
    fetch("/api/dmrc?type=all-stations")
      .then(res => res.json())
      .then(data => {
        if (data.stations && Array.isArray(data.stations)) {
          setStationList(data.stations);
        }
      })
      .catch(err => console.error("Could not load stations for autocomplete", err))
      .finally(() => setStationsLoading(false));
      
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
    setActiveDropdown(null);
  };

  const handleSearch = useCallback(async () => {
    setActiveDropdown(null);
    if (!from.trim() || !to.trim()) {
      setError("Please enter both source and destination stations.");
      setRouteResult(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch(`/api/dmrc?type=route&from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}`);
      const data: MetroRouteResponse = await response.json();

      if (data.status !== 200) {
        setError(data.message || "Unable to fetch route. Check station names.");
      } else {
        setRouteResult(data);
        // Scroll to results after a brief delay
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const getFilteredStations = (query: string) => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return stationList.filter(s => s.toLowerCase().includes(lowerQuery)).slice(0, 6);
  };

  /**
   * Determines which metro line a station belongs to in the route path,
   * based on the line1, line2, and interchange data.
   */
  const getStationLineInfo = (stationName: string, idx: number, route: MetroRouteResponse) => {
    const interchangeStations = route.interchange || [];
    const isInterchange = interchangeStations.map(s => s.toLowerCase()).includes(stationName.toLowerCase());
    
    // Find the first interchange index to split line1 / line2
    let firstInterchangeIdx = -1;
    if (route.path && interchangeStations.length > 0) {
      firstInterchangeIdx = route.path.findIndex(p => 
        interchangeStations.map(s => s.toLowerCase()).includes(p.toLowerCase())
      );
    }
    
    let currentLine: string;
    if (firstInterchangeIdx === -1 || idx <= firstInterchangeIdx) {
      currentLine = route.line1?.[0] || 'blue';
    } else {
      currentLine = route.line2?.[0] || route.line1?.[0] || 'blue';
    }
    
    return { currentLine, isInterchange };
  };

  // Titlecase helper for display
  const titleCase = (str: string) => {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div ref={dropdownRef} className="mx-auto w-full max-w-[500px] mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-6">
      {/* MAIN SEARCH CONTAINER */}
      <div className="bg-white border-2 border-black shadow-neo relative shrink-0">
        <div className="h-8 bg-black flex items-center px-3 justify-between">
          <span className="font-heading text-[8px] text-white tracking-widest">
            SYSTEM // CONTROL_PANEL_v<span className="font-numbers">1.0</span>
          </span>
          <div className="h-2 w-2 bg-brutal-yellow" />
        </div>

        <div className="p-8 space-y-8 relative">
          {/* STRUCTURAL CONNECTOR */}
          <div className="absolute left-[54px] top-40 h-12 w-1 bg-black z-0 transition-all duration-300" />

          {/* 1. FROM STATION */}
          <div className="relative z-30">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black" />
              <label className="system-text block font-heading text-[9px] opacity-60">FROM STATION</label>
            </div>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4 relative focus-within:shadow-neo transition-all">
              <input 
                type="text" 
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActiveDropdown("from");
                }}
                onFocus={() => setActiveDropdown("from")}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={stationsLoading ? "LOADING STATIONS..." : "E.G. RAJIV CHOWK"}
                className="w-full h-full bg-transparent outline-none font-heading text-xs uppercase tracking-widest text-black placeholder:text-black/30 placeholder:opacity-50"
              />
            </div>
            
            {/* FROM AUTOCOMPLETE */}
            {activeDropdown === "from" && from.length > 0 && (
              <div className="absolute top-[80px] left-0 w-full bg-white border-2 border-black shadow-neo flex flex-col z-50 max-h-[200px] overflow-y-auto">
                {getFilteredStations(from).length > 0 ? (
                  getFilteredStations(from).map((station, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-3 border-b-2 border-black hover:bg-brutal-blue cursor-pointer font-heading text-[10px] uppercase text-black last:border-b-0 transition-colors"
                      onClick={() => {
                        setFrom(station);
                        setActiveDropdown(null);
                      }}
                    >
                      {station}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 font-heading text-[10px] uppercase text-black/50">NO MATCHES FOUND</div>
                )}
              </div>
            )}
          </div>

          {/* 2. SWAP BUTTON */}
          <div className="flex justify-start pl-[30px] relative z-20">
            <button 
              onClick={handleSwap}
              className="h-12 w-12 bg-brutal-blue border-2 border-black flex items-center justify-center shadow-neo hover:-translate-x-px hover:-translate-y-px active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer group"
            >
              <ArrowUpDown className="h-5 w-5 text-black group-hover:scale-110 group-active:scale-90 transition-transform" />
            </button>
          </div>

          {/* 3. TO STATION */}
          <div className="relative z-20">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black" />
              <label className="system-text block font-heading text-[9px] opacity-60">TO STATION</label>
            </div>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4 focus-within:shadow-neo transition-all relative">
              <input 
                type="text" 
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActiveDropdown("to");
                }}
                onFocus={() => setActiveDropdown("to")}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={stationsLoading ? "LOADING STATIONS..." : "E.G. HAUZ KHAS"}
                className="w-full h-full bg-transparent outline-none font-heading text-xs uppercase tracking-widest text-black placeholder:text-black/30 placeholder:opacity-50"
              />
            </div>
            
            {/* TO AUTOCOMPLETE */}
            {activeDropdown === "to" && to.length > 0 && (
              <div className="absolute top-[80px] left-0 w-full bg-white border-2 border-black shadow-neo flex flex-col z-50 max-h-[200px] overflow-y-auto">
                {getFilteredStations(to).length > 0 ? (
                  getFilteredStations(to).map((station, i) => (
                    <div 
                      key={i} 
                      className="px-4 py-3 border-b-2 border-black hover:bg-brutal-blue cursor-pointer font-heading text-[10px] uppercase text-black last:border-b-0 transition-colors"
                      onClick={() => {
                        setTo(station);
                        setActiveDropdown(null);
                      }}
                    >
                      {station}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 font-heading text-[10px] uppercase text-black/50">NO MATCHES FOUND</div>
                )}
              </div>
            )}
          </div>

          {/* 4. FIND ROUTE BUTTON */}
          <div className="pt-4 relative z-10">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="h-16 w-full bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-px active:translate-y-px active:shadow-none disabled:opacity-75 disabled:cursor-not-allowed transition-all cursor-pointer group"
            >
              <span className="font-heading text-[10px] tracking-widest text-black group-hover:scale-105 transition-transform">
                {loading ? "SEARCHING..." : "FIND ROUTE"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
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

      {/* ═══════════════════════════════════════════════════ */}
      {/*  ROUTE RESULT — FULL PATH DISPLAY                 */}
      {/* ═══════════════════════════════════════════════════ */}
      {routeResult && !loading && (
        <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">

          {/* ── FARE BREAKDOWN CARD ── */}
          <FareBreakdown stopsCount={routeResult.path?.length || 1} />

          {/* ── HEADER CARD: Summary stats ── */}
          <div className="bg-white border-2 border-black shadow-neo relative overflow-hidden">
            <div className="h-8 bg-black flex items-center px-3 justify-between">
              <span className="font-heading text-[8px] text-white tracking-widest">
                RESULT // ROUTE_CALCULATED
              </span>
              <div className="h-2 w-2 bg-brutal-green animate-pulse" />
            </div>
            
            <div className="p-6 space-y-4">
              {/* FROM → TO summary */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-heading text-[10px] bg-brutal-green border-2 border-black px-3 py-1.5 shadow-neo uppercase tracking-wider">
                  {from}
                </span>
                <ArrowRight className="h-4 w-4 text-black shrink-0" />
                <span className="font-heading text-[10px] bg-brutal-pink border-2 border-black px-3 py-1.5 shadow-neo uppercase tracking-wider">
                  {to}
                </span>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-brutal-yellow border-2 border-black shadow-neo p-3 flex flex-col items-center justify-center">
                  <Clock className="h-4 w-4 mb-1 opacity-70" />
                  <span className="font-heading text-[7px] opacity-70 mb-0.5">TIME</span>
                  <span className="font-heading text-lg leading-tight">{routeResult.time ? Math.round(routeResult.time) : 0}<span className="text-[8px] ml-0.5">MIN</span></span>
                </div>
                <div className="bg-brutal-blue border-2 border-black shadow-neo p-3 flex flex-col items-center justify-center">
                  <MapPin className="h-4 w-4 mb-1 opacity-70" />
                  <span className="font-heading text-[7px] opacity-70 mb-0.5">STOPS</span>
                  <span className="font-heading text-lg leading-tight">{routeResult.path?.length || 0}</span>
                </div>
                <div className="bg-brutal-lavender border-2 border-black shadow-neo p-3 flex flex-col items-center justify-center">
                  <Train className="h-4 w-4 mb-1 opacity-70" />
                  <span className="font-heading text-[7px] opacity-70 mb-0.5">LINES</span>
                  <span className="font-heading text-lg leading-tight">
                    {((routeResult.line1?.length || 0) + (routeResult.line2?.length || 0)) || 1}
                  </span>
                </div>
              </div>

              {/* Line badges */}
              <div className="flex flex-wrap gap-2">
                {routeResult.line1?.map((line, i) => {
                  const colors = LINE_COLORS[line] || LINE_COLORS.blue;
                  return (
                    <span key={`l1-${i}`} className={`${colors.bg} ${colors.text} font-heading text-[8px] uppercase tracking-widest px-3 py-1 border-2 border-black shadow-neo`}>
                      {line} LINE
                    </span>
                  );
                })}
                {routeResult.line2 && routeResult.line2.length > 0 && routeResult.line2.map((line, i) => {
                  const colors = LINE_COLORS[line] || LINE_COLORS.blue;
                  return (
                    <span key={`l2-${i}`} className={`${colors.bg} ${colors.text} font-heading text-[8px] uppercase tracking-widest px-3 py-1 border-2 border-black shadow-neo`}>
                      {line} LINE
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── FULL ROUTE PATH CARD ── */}
          <div className="bg-white border-2 border-black shadow-neo relative overflow-hidden">
            <div className="h-8 bg-black flex items-center px-3 justify-between">
              <span className="font-heading text-[8px] text-white tracking-widest">
                TRAJECTORY // STATION_PATH
              </span>
            </div>
            
            <div className="p-6">
              <div className="relative">
                {routeResult.path?.map((stationName, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (routeResult.path?.length || 0) - 1;
                  const { currentLine, isInterchange } = getStationLineInfo(stationName, idx, routeResult);
                  const lineColor = LINE_COLORS[currentLine] || LINE_COLORS.blue;

                  return (
                    <div key={idx} className="flex items-stretch relative group">
                      {/* Left: Line + Node */}
                      <div className="flex flex-col items-center w-8 shrink-0 relative">
                        {/* Top connector line */}
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
                            ${isFirst || isLast ? 'h-5 w-5' : isInterchange ? 'h-5 w-5 rounded-full' : 'h-3 w-3 rounded-full'}
                          `}
                          style={{ 
                            backgroundColor: isFirst ? '#88D498' : isLast ? '#FF6B6B' : isInterchange ? '#FFD23F' : '#FFFFFF',
                          }}
                        >
                          {isInterchange && <div className="h-1.5 w-1.5 bg-black rounded-full" />}
                        </div>

                        {/* Bottom connector line */}
                        {!isLast && (
                          <div 
                            className="w-[3px] flex-1"
                            style={{ 
                              backgroundColor: isInterchange 
                                ? (LINE_COLORS[routeResult.line2?.[0] || currentLine] || lineColor).accent 
                                : lineColor.accent 
                            }}
                          />
                        )}
                        {isLast && <div className="flex-1" />}
                      </div>

                      {/* Right: Station details */}
                      <div className={`flex-1 flex items-center min-h-[44px] pl-4 pr-2 transition-all
                        ${isFirst || isLast || isInterchange ? 'py-2' : 'py-1'}
                      `}>
                        <div className="flex-1">
                          <span className={`font-heading uppercase tracking-wider block
                            ${isFirst || isLast ? 'text-[11px] font-black text-black' 
                              : isInterchange ? 'text-[11px] font-bold text-black' 
                              : 'text-[10px] text-gray-600 group-hover:text-black transition-colors'}
                          `}>
                            {titleCase(stationName)}
                          </span>
                          
                          {/* Tags */}
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
                              <span className="font-heading text-[7px] bg-brutal-yellow border border-black px-1.5 py-0.5 uppercase tracking-wider">
                                ⇄ INTERCHANGE
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
                                className="font-heading text-[7px] border border-black px-1.5 py-0.5 uppercase tracking-wider text-white"
                                style={{ backgroundColor: (LINE_COLORS[routeResult.line2[0]] || lineColor).accent }}
                              >
                                → {routeResult.line2[0]} LINE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direction info footer */}
            {routeResult.lineEnds && routeResult.lineEnds.length > 0 && (
              <div className="border-t-2 border-black bg-gray-50 px-6 py-3">
                <p className="font-heading text-[8px] uppercase tracking-widest text-black/60">
                  BOARD TOWARDS → <span className="text-black font-bold">{titleCase(routeResult.lineEnds.join(' / '))}</span>
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
