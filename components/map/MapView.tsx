"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Polyline, CircleMarker } from "leaflet";
import { METRO_LINES, loadStopCoords, type StopCoord } from "@/lib/metro-lines";
import { ArrowRight } from "lucide-react";

// ── Interchange stations (multi-line hubs)
const INTERCHANGE_NAMES = new Set([
  "kashmere gate","rajiv chowk","central secretariat","hauz khas",
  "janakpuri west","inderlok","mandi house","kirti nagar",
  "sikanderpur","botanical garden","yamuna bank","punjabi bagh west",
  "netaji subash place","azadpur","welcome","new delhi",
  "shivaji stadium","anand vihar","karkarduma","mayur vihar-i",
  "lajpat nagar","rajouri garden","dilli haat - ina",
]);

interface MapViewProps {
  /** Station names from active route result, e.g. from SearchContainer */
  highlightedPath?: string[];
  /** Line color from active route (e.g. "blue", "yellow") */
  activeLine?: string;
  className?: string;
}

export default function MapView({ highlightedPath = [], activeLine, className = "" }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LMap | null>(null);
  const linesRef     = useRef<Map<string, { poly: Polyline; markers: CircleMarker[] }>>(new Map());
  const pathPolyRef  = useRef<Polyline | null>(null);
  const [ready, setReady] = useState(false);

  // ── Initialize map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      // Suppress Leaflet's default icon lookup (avoids 404s in Next.js)
      // @ts-expect-error private field
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

      const map = L.map(containerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      // ── Minimal tile layer ────────────────────────────────
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          attribution: "© OpenStreetMap © CARTO",
        }
      ).addTo(map);

      // Attribution badge (tiny, bottom-right)
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      // Zoom controls (custom position)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // ── Load shapes then draw all lines ─────────────
      try {
        const [shapeRes, coordMap] = await Promise.all([
          fetch("/line-shapes.json").then(res => res.json()),
          loadStopCoords()
        ]);
        if (cancelled) return;

        for (const line of METRO_LINES) {
          const shapeCoords: [number, number][] = shapeRes[line.id] || [];
          const stationCoords: [number, number][] = line.stopIds
            .map(id => coordMap.get(id))
            .filter((s): s is StopCoord => !!s)
            .map(s => [s.lat, s.lon]);

          if (stationCoords.length < 2) continue;

          // Ghost polyline: Use curvy path if available, otherwise straight
          const poly = L.polyline(shapeCoords.length > 0 ? shapeCoords : stationCoords, {
            color: line.color,
            weight: 5,
            opacity: 0.35,
            smoothFactor: 1.5,
          }).addTo(map);

          // Station markers
          const markers: CircleMarker[] = line.stopIds
            .map(id => coordMap.get(id))
            .filter((s): s is StopCoord => !!s)
            .map(s => {
              const isHub = INTERCHANGE_NAMES.has(s.name.toLowerCase());
              return L.circleMarker([s.lat, s.lon], {
                radius: isHub ? 6 : 3.5,
                color: "#000",
                weight: isHub ? 2 : 1,
                fillColor: isHub ? "#fff" : line.color,
                fillOpacity: 1,
                opacity: 0.4,
              })
              .addTo(map)
              .bindTooltip(s.name, {
                permanent: false,
                direction: "top",
                className: "metro-tooltip",
                offset: [0, -6],
              });
            });

          linesRef.current.set(line.id, { poly, markers });
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      }

      mapRef.current = map;
      setReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Highlight active route path ────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;
      const coordMap = await loadStopCoords();

      // Build name→coord map for fast lookup
      const byName = new Map<string, StopCoord>();
      for (const s of coordMap.values()) {
        byName.set(s.name.toLowerCase(), s);
      }

      // Remove previous highlight
      if (pathPolyRef.current) {
        pathPolyRef.current.remove();
        pathPolyRef.current = null;
      }

      if (!highlightedPath.length) {
        // Restore all lines to normal
        linesRef.current.forEach(({ poly, markers }) => {
          poly.setStyle({ opacity: 0.35 });
          markers.forEach(m => m.setStyle({ opacity: 0.4, fillOpacity: 1 }));
        });
        return;
      }

      // Resolve highlighted path coords
      const pathCoords: [number, number][] = highlightedPath
        .map(name => byName.get(name.toLowerCase()))
        .filter((s): s is StopCoord => !!s)
        .map(s => [s.lat, s.lon]);

      if (pathCoords.length < 2) return;

      // Detect line color from activeLine prop or default to yellow
      const matchedLine = METRO_LINES.find(l => l.id === activeLine) ?? METRO_LINES[0];
      const color = matchedLine.color;

      // Dim all background lines
      linesRef.current.forEach(({ poly, markers }) => {
        poly.setStyle({ opacity: 0.12 });
        markers.forEach(m => m.setStyle({ opacity: 0.15, fillOpacity: 0.25 }));
      });

      // Draw glowing highlight
      // Outer glow (thick, very transparent)
      L.polyline(pathCoords, { color, weight: 18, opacity: 0.12, lineCap: "round" }).addTo(map);
      // Mid glow
      L.polyline(pathCoords, { color, weight: 10, opacity: 0.25, lineCap: "round" }).addTo(map);
      // Core line
      const core = L.polyline(pathCoords, {
        color,
        weight: 6,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      pathPolyRef.current = core;

      // Fit map to path
      map.fitBounds(core.getBounds(), { padding: [48, 48], animate: true, duration: 0.6 });
    })();
  }, [ready, highlightedPath, activeLine]);

  return (
    <div className={`relative w-full z-0 ${className}`} style={{ fontFamily: "inherit" }}>
      {/* ── Neo-Brutalist Map Frame ───────────────────────────────────── */}
      <div className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden isolate">
        {/* Header bar */}
        <div className="h-8 bg-black flex items-center px-3 justify-between shrink-0">
          <span className="font-heading text-[8px] text-white tracking-widest uppercase">
            SYSTEM_MAP // DELHI_METRO
          </span>
          <div className="flex items-center gap-2">
            {/* Live line legend dots */}
            {["#E53935","#FDD835","#1E88E5","#7B1FA2","#CC0066","#EC407A","#388E3C"].map(c => (
              <div key={c} className="h-2 w-2 rounded-full border border-white/30" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div ref={containerRef} className="w-full h-[300px] sm:h-[380px] bg-[#f0ede8]" />

        {/* Attribution footer */}
        <div className="h-6 bg-black/5 border-t-[2px] border-black flex items-center px-3">
          <span className="font-heading text-[7px] text-black/40 uppercase tracking-widest">
            © OPENSTREETMAP © CARTO // CC-BY-SA
          </span>
        </div>
      </div>

      {/* ── Highlighted route label ───────────────────────────────────── */}
      {highlightedPath.length > 0 && (
        <div className="mt-2 bg-black text-white border-[3px] border-black px-4 py-2 flex items-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
          <div className="h-3 w-3 shrink-0 border-2 border-white" style={{ backgroundColor: METRO_LINES.find(l => l.id === activeLine)?.color ?? "#FDD835" }} />
          <span className="font-heading text-[9px] uppercase tracking-widest font-black">
            {highlightedPath[0]} <ArrowRight className="h-2.5 w-2.5 inline-block mx-1" /> {highlightedPath[highlightedPath.length - 1]}
          </span>
          <span className="ml-auto font-numbers text-[9px] text-white/50 font-black">
            {highlightedPath.length} STOPS
          </span>
        </div>
      )}

      {/* Tooltip custom CSS */}
      <style>{`
        .metro-tooltip {
          background: #000 !important;
          border: 2px solid #000 !important;
          border-radius: 0 !important;
          color: #fff !important;
          font-family: var(--font-heading, monospace) !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          padding: 3px 7px !important;
          box-shadow: 2px 2px 0 #000 !important;
          white-space: nowrap !important;
        }
        .metro-tooltip::before { display: none !important; }
        .leaflet-container { outline: none; }
        .leaflet-control-zoom a {
          background: #fff !important;
          border: 2px solid #000 !important;
          border-radius: 0 !important;
          font-weight: 900 !important;
          color: #000 !important;
          box-shadow: 2px 2px 0 #000 !important;
        }
        .leaflet-control-zoom a:hover { background: #FDD835 !important; }
        .leaflet-control-attribution { display: none; }
        
        /* ── FIX: OVERFLOW / OVERSHOWING ─────────────────────────────────── */
        /* Leaflet defaults to very high z-indexes (400-1000+) which covers 
           our UI modals. We force them lower so our modals (z-50, z-70, z-100) 
           always win. */
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 2 !important; }
        .leaflet-map-pane { z-index: 1 !important; }
        .leaflet-container { z-index: 1 !important; }
        
        /* Force zoom controls to be slightly higher than panes but still below UI (z-50) */
        .leaflet-control-container .leaflet-top, 
        .leaflet-control-container .leaflet-bottom { 
          z-index: 10 !important; 
        }
        
        .isolate { isolation: isolate; }
      `}</style>
    </div>
  );
}
