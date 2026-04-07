import React from "react";
import { ArrowDown, Repeat2, Train } from "lucide-react";
import { MetroRouteResponse, LINE_COLORS } from "./SearchContainer";

interface RoutePathDisplayProps {
  routeResult: MetroRouteResponse;
}

interface RouteSegment {
  line: string;
  color: { bg: string; text: string; border: string; accent: string };
  direction: string;
  platform: number | null;
  stations: string[];
}

const titleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function getPlatform(directionStr: string): number | null {
  if (!directionStr || directionStr === "Unknown" || directionStr === "Walk") return null;
  // Simple deterministic platform number generator (1 or 2)
  let hash = 0;
  for (let i = 0; i < directionStr.length; i++) {
    hash = directionStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 2) + 1;
}

export default function RoutePathDisplay({ routeResult }: RoutePathDisplayProps) {
  const segments: RouteSegment[] = [];
  
  if (!routeResult.path || routeResult.path.length === 0) {
    return null;
  }

  const allLines = routeResult.line1?.length 
    ? [...(routeResult.line1 || []), ...(routeResult.line2 || [])] 
    : ["blue"];

  let currentSegmentStations: string[] = [];
  let currentSegmentIdx = 0;

  routeResult.path.forEach((station) => {
    currentSegmentStations.push(station);
    
    const interchanges = routeResult.interchange || [];
    const isInterchange = interchanges.map(s => s.toLowerCase()).includes(station.toLowerCase());

    if (
      isInterchange && 
      currentSegmentIdx < interchanges.length && 
      station.toLowerCase() === interchanges[currentSegmentIdx].toLowerCase()
    ) {
      const lineName = allLines[currentSegmentIdx] || "blue";
      const rawDir = routeResult.lineEnds?.[currentSegmentIdx];
      const directionStr = rawDir !== undefined && rawDir !== null && String(rawDir) !== "0" 
        ? String(rawDir) 
        : "Unknown";
      
      segments.push({
        line: lineName,
        color: LINE_COLORS[lineName] || LINE_COLORS.blue,
        direction: directionStr === "Unknown" ? "Walk" : titleCase(directionStr),
        platform: getPlatform(directionStr === "Unknown" ? "Walk" : directionStr),
        stations: [...currentSegmentStations],
      });
      
      currentSegmentIdx++;
      currentSegmentStations = [station];
    }
  });

  if (currentSegmentStations.length > 0) {
    const lineName = allLines[currentSegmentIdx] || allLines[allLines.length - 1] || "blue";
    const rawDir = routeResult.lineEnds?.[currentSegmentIdx];
    const directionStr = rawDir !== undefined && rawDir !== null && String(rawDir) !== "0" 
      ? String(rawDir) 
      : "Unknown";

    segments.push({
      line: lineName,
      color: LINE_COLORS[lineName] || LINE_COLORS.blue,
      direction: directionStr === "Unknown" ? "Walk" : titleCase(directionStr),
      platform: getPlatform(directionStr === "Unknown" ? "Walk" : directionStr),
      stations: currentSegmentStations,
    });
  }

  return (
    <div className="bg-white border-[3px] border-black shadow-neo-lg relative overflow-hidden">
      <div className="h-10 bg-black flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
           <Train className="h-4 w-4 text-white" />
           <span className="font-heading text-[9px] text-white tracking-[0.2em] font-black uppercase">
             Live Trajectory // Route_Path
           </span>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-10">
        {segments.map((segment, segIdx) => {
          const isLastSegment = segIdx === segments.length - 1;

          return (
            <div key={`seg-${segIdx}`} className="relative">
              {/* SEGMENT HEADER CARD */}
              <div 
                className={`border-[3px] border-black p-5 shadow-neo relative z-10 ${segment.color.bg}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDown className={`h-4 w-4 ${segment.color.text}`} strokeWidth={4} />
                    <span className={`font-heading text-[13px] sm:text-[15px] uppercase tracking-widest font-black ${segment.color.text}`}>
                      {titleCase(segment.line)} Line
                    </span>
                  </div>
                </div>
                
                <div className={`mt-2 border-2 border-black/20 bg-black/10 p-3 flex flex-col gap-1`}>
                  <p className={`font-heading text-[8px] uppercase tracking-widest font-black ${segment.color.text} opacity-60`}>
                    Board towards
                  </p>
                  <p className={`font-heading text-[11px] sm:text-[12px] font-black uppercase tracking-wider ${segment.color.text}`}>
                    {segment.direction.toUpperCase()}
                  </p>
                  <p className={`font-heading text-[9px] font-bold uppercase ${segment.color.text} tracking-widest mt-1`}>
                    Platform: {segment.platform !== null ? segment.platform : 'Not available'}
                  </p>
                </div>
              </div>

              {/* STATION LIST */}
              <div className="relative pl-[22px] mt-6">
                {/* Thick Hard Rail */}
                <div 
                  className="absolute left-[29px] top-0 bottom-0 w-[8px] z-0 border-x-2 border-black" 
                  style={{ backgroundColor: segment.color.accent }} 
                />

                <div className="space-y-1">
                  {segment.stations.map((station, sIdx) => {
                    const isFirstStation = sIdx === 0;
                    const isLastStation = sIdx === segment.stations.length - 1;
                    const globalFirst = segIdx === 0 && isFirstStation;
                    const globalLast = isLastSegment && isLastStation;
                    const isInterchange = isLastStation && !isLastSegment;

                    return (
                      <div key={`st-${sIdx}`} className="flex items-center relative group min-h-[44px] sm:min-h-[52px]">
                        {/* Node point */}
                        <div className="w-[20px] shrink-0 flex justify-center z-10 mx-[-6px]">
                          <div
                            className={`border-[3px] border-black flex items-center justify-center transition-all group-hover:scale-125
                              ${globalFirst || globalLast ? "h-6 w-6" : isInterchange ? "h-5 w-5 rounded-full" : "h-4 w-4 rounded-full"}
                            `}
                            style={{
                              backgroundColor: "#FFFFFF",
                              boxShadow: (globalFirst || globalLast || isInterchange) ? "3px 3px 0 0 #000" : "none"
                            }}
                          >
                            {isInterchange && <div className="h-2 w-2 rounded-full border-2 border-black" style={{ backgroundColor: segment.color.accent }} />}
                            {(globalFirst || globalLast) && (
                              <div className={`h-full w-full border-2 border-white ${globalFirst ? "bg-brutal-green" : "bg-brutal-pink"}`} />
                            )}
                          </div>
                        </div>

                        {/* Station Name Box */}
                        <div className={`flex-1 flex items-center ml-2 sm:ml-4 px-3 py-2 border-2 border-transparent hover:border-black hover:bg-slate-50 transition-all ${isInterchange ? 'bg-amber-50/30' : ''}`}>
                          <div className="flex flex-col w-full">
                             <div className="flex flex-row items-center justify-between w-full">
                                <span
                                  className={`font-heading uppercase tracking-widest block
                                    ${globalFirst || globalLast ? "text-[11px] sm:text-[12px] font-black text-black" : 
                                      isInterchange ? "text-[11px] sm:text-[12px] font-bold text-black" : 
                                      "text-[10px] sm:text-[11px] text-gray-700 font-bold group-hover:text-black transition-colors"
                                    }
                                  `}
                                >
                                  {globalLast ? `Arrive at ${titleCase(station)}` : titleCase(station)}
                                </span>
                                
                                {globalFirst && (
                                  <span className="ml-2 font-heading text-[8px] bg-[#e2f5e6] text-[#2ebd59] px-2 py-1 uppercase tracking-[0.2em] font-black border-2 border-[#2ebd59]">
                                    START — {titleCase(segment.line)} Line
                                  </span>
                                )}
                                {globalLast && (
                                  <span className="ml-2 font-heading text-[8px] bg-[#ffeaea] text-[#d63b3b] px-2 py-1 uppercase tracking-[0.2em] font-black border-2 border-[#d63b3b]">
                                    Dest.
                                  </span>
                                )}
                             </div>
                             
                             {globalFirst && (
                               <div className="mt-2 text-left">
                                 <p className="font-heading text-[9px] uppercase tracking-widest font-bold text-black/60">
                                   Board towards: {segment.direction}
                                 </p>
                                 <p className="font-heading text-[9px] uppercase tracking-widest font-bold text-black/80">
                                   Platform: {segment.platform !== null ? segment.platform : 'Not available'}
                                 </p>
                               </div>
                             )}

                             {globalLast && (
                               <p className="font-heading text-[9px] uppercase tracking-widest font-bold text-black/60 mt-1">
                                 Exit station
                               </p>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERCHANGE BLOCK */}
              {segIdx < segments.length - 1 && (
                <div className="my-8 border-[3px] border-black bg-black p-5 flex flex-col items-center justify-center text-center shadow-neo">
                  <div className="bg-brutal-yellow border-[3px] border-white p-3 mb-4 shadow-[4px_4px_0_0_#fff]">
                    <Repeat2 className="h-6 w-6 text-black" strokeWidth={4} />
                  </div>
                  <p className="font-heading text-[12px] font-black uppercase text-white tracking-[0.2em]">
                    CHANGE HERE ↓
                  </p>
                  <p className="font-heading text-[10px] font-bold uppercase text-white/60 tracking-widest mt-1">
                    At {titleCase(segment.stations[segment.stations.length - 1])}
                  </p>
                  
                  <div className="w-full border border-white/20 p-4 mt-5 bg-white/5 space-y-2">
                    <p className="font-heading text-[9px] sm:text-[10px] font-bold uppercase text-brutal-pink tracking-widest">
                      Exit {titleCase(segment.line)} Line
                    </p>
                    <p className="font-heading text-[9px] sm:text-[10px] font-bold uppercase text-brutal-green tracking-widest">
                      Follow signs for {titleCase(segments[segIdx + 1].line)} Line
                    </p>
                  </div>

                  <div className="w-full border border-white/20 p-4 mt-3 bg-white/5 space-y-1">
                    <p className="font-heading text-[9px] sm:text-[10px] font-bold uppercase text-white/80 tracking-widest">
                      Board towards: {segments[segIdx + 1].direction.toUpperCase()}
                    </p>
                    <p className="font-heading text-[9px] sm:text-[10px] font-bold uppercase text-[#FFD23F] tracking-widest">
                      Platform: {segments[segIdx + 1].platform !== null ? segments[segIdx + 1].platform : 'Not available'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t-[3px] border-black bg-slate-50 px-8 py-5">
        <p className="font-heading text-[9px] uppercase tracking-[0.2em] text-black font-black flex items-center gap-3">
          <span className="p-1 px-2 bg-black text-white">System Protocol</span>
          Verify display boards at the platform for real-time status.
        </p>
      </div>
    </div>
  );
}
