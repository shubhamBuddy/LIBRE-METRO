"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Check, Train, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lineId: string;
  sequence: number;
}

interface RouteSegment {
  from: string;
  to: string;
  stations: string[];
}

interface LocalRoute {
  id: string;
  title: string;
  route: string[];
  votes: number;
  tag: string;
  tip: string;
}

interface AddRouteModalProps {
  onClose: () => void;
  onSubmit: (route: LocalRoute) => void;
  user: User | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/gi, "").trim();
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const INTERCHANGE_NAMES = new Set([
  "Kashmere Gate","Rajiv Chowk","Central Secretariat","Hauz Khas",
  "Janakpuri West","Inderlok","Mandi House","INA","Kirti Nagar",
  "Sikandarpur","Botanical Garden","Yamuna Bank","Punjabi Bagh West",
  "Netaji Subhash Park","Azadpur","Welcome","Dilshad Garden",
  "New Delhi","Shivaji Stadium","Anand Vihar ISBT","Karkarduma",
  "Mayur Vihar - I","Lajpat Nagar","Rajouri Garden",
]);

// ─── Station Autocomplete ──────────────────────────────────────────────────────

function StationInput({
  placeholder, stations, value, onChange, onSelect, excludeNames = [],
}: {
  placeholder: string;
  stations: Station[];
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: Station) => void;
  excludeNames?: string[];
}) {
  const [filtered, setFiltered] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [userInput, setUserInput] = useState(true);
  const excludeKey = excludeNames.join(",");

  useEffect(() => {
    if (!userInput || !value.trim()) { setFiltered([]); setOpen(false); return; }
    const q = normalize(value);
    const results = stations
      .filter((s) => !excludeNames.includes(s.name))
      .filter((s) => normalize(s.name).includes(q));
    const exact = results.find((r) => normalize(r.name) === q);
    if (exact && results.length === 1) { setOpen(false); setFiltered([]); }
    else { setFiltered(results.slice(0, 6)); setOpen(results.length > 0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, stations, excludeKey, userInput]);

  const handleSelect = (s: Station) => {
    setUserInput(false); onSelect(s); setOpen(false); setFiltered([]);
  };

  return (
    <div className="text-black">
      <input
        type="text" value={value}
        onChange={(e) => { setUserInput(true); onChange(e.target.value); }}
        onKeyDown={(e) => { if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0]); }}
        placeholder={placeholder}
        className="w-full border-[4px] border-black bg-white px-5 py-4 font-heading text-[14px] uppercase tracking-wider text-black placeholder:text-black/30 focus:outline-none focus:bg-brutal-yellow/10 transition-colors"
      />
      {open && (
        <div className="border-[4px] border-t-0 border-black bg-white divide-y-2 divide-black/10 overflow-hidden">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => handleSelect(s)} className="w-full text-left px-5 py-4 font-heading text-[11px] uppercase tracking-wider hover:bg-brutal-yellow transition-colors flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-bold">{s.name}</span>
              {INTERCHANGE_NAMES.has(s.name) && (
                <span className="text-[9px] bg-black text-brutal-yellow px-2 py-1 font-black tracking-widest shrink-0">XCHG</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

export default function AddRouteModal({ onClose, onSubmit, user }: AddRouteModalProps) {
  const [visible, setVisible]               = useState(false);
  // uniqueStations: for search UI (de-duped by name)
  const [uniqueStations, setUniqueStations] = useState<Station[]>([]);
  const [adjList, setAdjList]               = useState<Map<string, string[]>>(new Map());
  const [loadingStations, setLoadingStations] = useState(true);

  const [originQuery, setOriginQuery]     = useState("");
  const [originStation, setOriginStation] = useState<Station | null>(null);
  const [segments, setSegments]           = useState<RouteSegment[]>([]);
  const [nextQuery, setNextQuery]         = useState("");
  const [nextStation, setNextStation]     = useState<Station | null>(null);
  const [tip, setTip]                     = useState("");
  const [error, setError]                 = useState<string | null>(null);
  const [pathfinding, setPathfinding]     = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  // ── Load stops.txt ───────────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    (async () => {
      try {
        const text = await (await fetch("/stops.txt")).text();
        const lines = text.split("\n").filter(l => l.trim());
        lines.shift(); // remove header

        const allStops: Station[] = [];
        lines.forEach((line, i) => {
          const f = line.split(",");
          const name = (f[2] ?? "").trim();
          const lat  = parseFloat(f[4]);
          const lon  = parseFloat(f[5]);
          if (!name || isNaN(lat) || isNaN(lon)) return;
          allStops.push({
            id: (f[0] ?? `s${i}`).trim(),
            lineId: (f[1] ?? "").trim(),
            name,
            lat,
            lon,
            sequence: i,
          });
        });

        // De-dupe by name for the search UI
        const seen = new Map<string, Station>();
        allStops.forEach(s => { if (!seen.has(normalize(s.name))) seen.set(normalize(s.name), s); });
        setUniqueStations(Array.from(seen.values()));

        // BUILD GRAPH
        const graph = new Map<string, string[]>();
        const addEdge = (u: string, v: string) => {
          const nu = normalize(u), nv = normalize(v);
          if (nu === nv) return;
          if (!graph.has(nu)) graph.set(nu, []);
          if (!graph.has(nv)) graph.set(nv, []);
          if (!graph.get(nu)!.includes(nv)) graph.get(nu)!.push(nv);
          if (!graph.get(nv)!.includes(nu)) graph.get(nv)!.push(nu);
        };
        const removeEdge = (u: string, v: string) => {
          const nu = normalize(u), nv = normalize(v);
          if (graph.has(nu)) graph.set(nu, graph.get(nu)!.filter(x => x !== nv));
          if (graph.has(nv)) graph.set(nv, graph.get(nv)!.filter(x => x !== nu));
        };

        // pass 1: Sequence Edges
        for (let i = 0; i < allStops.length - 1; i++) {
          const s1 = allStops[i];
          const s2 = allStops[i+1];
          // Fix: Prevent false cross-line jump in the CSV which creates fake topological links
          if (normalize(s1.name) === normalize("Shivaji Stadium") && normalize(s2.name) === normalize("Delhi Gate")) continue;

          // Connect consecutive stations ONLY if distance < 4km (prevents false cross-line linking)
          if (getDistance(s1.lat, s1.lon, s2.lat, s2.lon) < 4.0) {
            addEdge(s1.name, s2.name);
          }
        }

        // Fix: Violet Line incorrectly terminates at Lal Quila without reaching Kashmere Gate in the csv sequence
        addEdge("Lal Quila", "Kashmere Gate");

        // pass 2: Geometric Interchange Injection
        // Identifies where the Metro lines cross an implicit intersection omitted in the CSV
        for (let i = 0; i < allStops.length - 1; i++) {
          const A = allStops[i], B = allStops[i+1];
          if (normalize(A.name) === normalize("Shivaji Stadium") && normalize(B.name) === normalize("Delhi Gate")) continue;

          const dDirect = getDistance(A.lat, A.lon, B.lat, B.lon);
          
          if (dDirect > 0.1 && dDirect < 2.8) {
            let bestX: Station | null = null;
            let minDetour = 0.2; // Max 200m spatial detour 
            
            for (const X of allStops) {
              if (X.name === A.name || X.name === B.name) continue;
              const d1 = getDistance(A.lat, A.lon, X.lat, X.lon);
              const d2 = getDistance(X.lat, X.lon, B.lat, B.lon);
              
              if (d1 + d2 < dDirect + minDetour && d1 > 0.1 && d2 > 0.1 && d1 < dDirect && d2 < dDirect) {
                 minDetour = (d1 + d2) - dDirect;
                 bestX = X;
              }
            }
            if (bestX) {
              // Replace the straight jump with an intersection routing
              removeEdge(A.name, B.name);
              addEdge(A.name, bestX.name);
              addEdge(bestX.name, B.name);
            }
          }
        }
        setAdjList(graph);
      } catch (e) {
        console.error(e);
        setError("Failed to load station data.");
      }
      setLoadingStations(false);
    })();
  }, []);

  // ── Graph Pathfinder ─────────────────────────────────────────────────────────
  const findPath = useCallback((startName: string, endName: string): string[] | null => {
    const sn = normalize(startName);
    const en = normalize(endName);
    if (sn === en) return [startName];

    const queue: [string, string[]][] = [[sn, [startName]]];
    const visited = new Set<string>([sn]);

    while (queue.length > 0) {
      const [curNorm, path] = queue.shift()!;
      
      const neighbors = adjList.get(curNorm) || [];
      for (const nbNorm of neighbors) {
        // Find the proper display name
        const nbName = uniqueStations.find(s => normalize(s.name) === nbNorm)?.name || nbNorm;
        
        if (nbNorm === en) {
          return [...path, nbName];
        }

        if (!visited.has(nbNorm)) {
          visited.add(nbNorm);
          queue.push([nbNorm, [...path, nbName]]);
        }
      }
    }

    return null; // No path found
  }, [adjList, uniqueStations]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const fullRoute = (() => {
    if (!originStation) return [];
    const all: string[] = [];
    for (const seg of segments) all.push(...(all.length === 0 ? seg.stations : seg.stations.slice(1)));
    return all;
  })();
  const lastStation = fullRoute[fullRoute.length - 1] ?? originStation?.name ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAddSegment = async () => {
    if (!nextStation || !lastStation) return;
    setPathfinding(true); setError(null);
    await new Promise(r => setTimeout(r, 80));
    const path = findPath(lastStation, nextStation.name);
    if (!path) {
      setError(`No metro path found between "${lastStation}" and "${nextStation.name}". Try an intermediate station first.`);
      setPathfinding(false);
      return;
    }
    setSegments(prev => [...prev, { from: lastStation, to: nextStation.name, stations: path }]);
    setNextQuery(""); setNextStation(null); setPathfinding(false);
  };

  const handleRemoveLast = () => { setSegments(prev => prev.slice(0, -1)); setError(null); };

  const handleSubmit = async () => {
    if (!user) { setError("You must be signed in to post."); return; }
    if (segments.length === 0) { setError("Add at least one hop first."); return; }
    setSubmitting(true);

    // Always fetch fresh user data to ensure we have Google's full_name and avatar_url
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    const meta = freshUser?.user_metadata ?? {};
    const authorName = meta.full_name || meta.name || freshUser?.email?.split('@')[0] || "COMMUNITY_USER";
    const authorAvatar = meta.avatar_url || meta.picture || null;

    const { data, error } = await supabase.from("suggestions").insert([{
      origin: fullRoute[0],
      destination: fullRoute[fullRoute.length - 1],
      full_route: fullRoute,
      tip: tip.trim(),
      votes: 0,
      hashtags: [],
      user_id: freshUser?.id ?? user.id,
      author_name: authorName,
      author_avatar: authorAvatar,
    }]).select().single();
    if (error) { setError("Save failed. Try again."); setSubmitting(false); return; }
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({ id: data.id, title: `${fullRoute[0]} → ${fullRoute[fullRoute.length - 1]}`, route: fullRoute, votes: 0, tag: "Community", tip: tip.trim() });
      onClose();
    }, 1200);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`w-full max-w-xl bg-white border-[4px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[92vh] transition-all duration-300 ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>

        {/* ── HEADER ── */}
        <div className="bg-black p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brutal-yellow border-2 border-white/20"><Train className="h-5 w-5 text-black" /></div>
            <div>
              <h2 className="font-heading text-base text-white font-black tracking-tighter uppercase">ADD COMMUNITY ROUTE</h2>
              <p className="font-heading text-[9px] text-white/40 uppercase tracking-widest">BUILD // VERIFY // SHARE</p>
            </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:translate-x-px active:translate-y-px active:shadow-none"><X className="h-6 w-6 text-black" /></button>
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          {submitted ? (
            <div className="py-20 text-center space-y-4">
              <div className="h-20 w-20 bg-brutal-green border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto flex items-center justify-center"><Check className="h-12 w-12" /></div>
              <p className="font-heading text-xl font-black uppercase">ROUTE_SYNCED!</p>
              <p className="font-heading text-xs text-black/40 uppercase tracking-widest">Thanks for contributing to the community</p>
            </div>
          ) : loadingStations ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-black" />
              <p className="font-heading text-xs uppercase tracking-widest text-black/40">Loading metro network...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: ORIGIN STATION */}
              <div className="space-y-3">
                <p className="font-heading text-xs font-black uppercase tracking-widest bg-black text-brutal-yellow inline-block px-3 py-1">ORIGIN STATION</p>
                {!originStation ? (
                  <StationInput
                    placeholder="Search origin station..."
                    stations={uniqueStations}
                    value={originQuery}
                    onChange={setOriginQuery}
                    onSelect={s => { setOriginStation(s); setOriginQuery(s.name); }}
                  />
                ) : (
                  <div className="border-[4px] border-black p-5 flex items-center justify-between bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div>
                      <p className="font-heading font-black text-xl leading-tight">{originStation.name}</p>
                      <p className="font-heading text-[9px] text-black/50 uppercase font-black mt-1">ORIGIN LOCKED</p>
                    </div>
                    <button onClick={() => { setOriginStation(null); setOriginQuery(""); setSegments([]); setError(null); }} className="text-[10px] font-black border-2 border-black px-2 py-1 hover:bg-black hover:text-white transition-all cursor-pointer">CHANGE</button>
                  </div>
                )}
              </div>

              {/* STEP 2: BUILD HOPS */}
              {originStation && (
                <div className="space-y-6">
                  {/* Confirmed segments */}
                  {segments.map((seg, i) => (
                    <div key={i} className="border-[4px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                      <div className="bg-brutal-green border-b-[3px] border-black p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-black" strokeWidth={3} />
                          <p className="font-heading font-black text-sm uppercase">{seg.from} → {seg.to}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] bg-black text-white px-2 py-0.5 font-black uppercase">{seg.stations.length} STOPS</span>
                          <button onClick={handleRemoveLast} className="h-8 w-8 bg-brutal-pink border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {seg.stations.slice(1,-1).map((s, j) => (
                          <span key={j} className="text-[10px] bg-black/5 px-2 py-1 border-[2px] border-black/15 font-bold uppercase tracking-wide">{s}</span>
                        ))}
                        {seg.stations.length <= 2 && <span className="text-[10px] text-black/30 italic uppercase">Direct connection</span>}
                      </div>
                    </div>
                  ))}

                  {/* Next hop input */}
                  <div className="border-[4px] border-dashed border-black bg-black/[0.03] p-5 space-y-4">
                    <p className="font-heading text-xs font-black uppercase text-black/40 tracking-widest">
                      {lastStation} → NEXT STATION?
                    </p>
                    <StationInput
                      placeholder="Search next destination..."
                      stations={uniqueStations}
                      value={nextQuery}
                      onChange={setNextQuery}
                      onSelect={s => { setNextStation(s); setNextQuery(s.name); setError(null); }}
                      excludeNames={fullRoute}
                    />
                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-brutal-pink/10 border-[3px] border-brutal-pink">
                        <AlertTriangle className="h-4 w-4 text-brutal-pink shrink-0 mt-0.5" strokeWidth={3} />
                        <p className="text-[10px] font-black text-brutal-pink uppercase tracking-wide">{error}</p>
                      </div>
                    )}
                    <button
                      onClick={handleAddSegment}
                      disabled={!nextStation || pathfinding}
                      className={`w-full py-5 border-[4px] border-black font-heading font-black uppercase text-base shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 ${nextStation && !pathfinding ? "bg-black text-white cursor-pointer" : "bg-black/10 text-black/20 opacity-50 cursor-not-allowed"}`}
                    >
                      {pathfinding ? <><Loader2 className="h-5 w-5 animate-spin" /> TRACING METRO PATH...</> : <><Plus className="h-5 w-5" /> ADD HOP</>}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: TIP */}
              {fullRoute.length >= 2 && (
                <div className="space-y-3">
                  <p className="font-heading text-xs font-black uppercase tracking-widest bg-black text-brutal-yellow inline-block px-3 py-1">COMMUTER TIP (OPTIONAL)</p>
                  <textarea
                    value={tip}
                    onChange={e => setTip(e.target.value)}
                    placeholder="Exit gate, platform tip, any local knowledge..."
                    className="w-full border-[4px] border-black p-5 font-heading text-sm uppercase resize-none focus:bg-brutal-yellow/5 outline-none h-24"
                    maxLength={140}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!submitted && !loadingStations && (
          <div className="p-5 border-t-[4px] border-black bg-white shrink-0">
            <button
              onClick={handleSubmit}
              disabled={segments.length === 0 || submitting}
              className={`w-full py-6 border-[4px] border-black font-heading font-black text-xl uppercase shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-1.5 active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center gap-3 ${segments.length > 0 && !submitting ? "bg-brutal-green cursor-pointer" : "bg-black/10 opacity-50 cursor-not-allowed"}`}
            >
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> UPLOADING...</> : <><Train className="h-5 w-5" /> POST TO COMMUNITY</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
