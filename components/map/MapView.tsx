"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LMap, Polyline, CircleMarker } from "leaflet";
import { METRO_LINES, loadStopCoords, type StopCoord, type MetroLine } from "@/lib/metro-lines";

// ── Interchange stations (multi-line hubs) ───────────────────────────────────
const INTERCHANGE_NAMES = new Set([
  "kashmere gate","rajiv chowk","central secretariat","hauz khas",
  "janakpuri west","inderlok","mandi house","kirti nagar",
  "sikanderpur","botanical garden","yamuna bank","punjabi bagh west",
  "netaji subash place","azadpur","welcome","new delhi",
  "shivaji stadium","anand vihar","karkarduma","mayur vihar-i",
  "lajpat nagar","rajouri garden","dilli haat - ina",
]);

// All Delhi Metro line colors for legend
const LEGEND_LINES = [
  { id: "red",     name: "Red",     color: "#E53935" },
  { id: "yellow",  name: "Yellow",  color: "#FDD835" },
  { id: "blue",    name: "Blue",    color: "#1E88E5" },
  { id: "violet",  name: "Violet",  color: "#7B1FA2" },
  { id: "pink",    name: "Pink",    color: "#EC407A" },
  { id: "magenta", name: "Magenta", color: "#CC0066" },
  { id: "green",   name: "Green",   color: "#388E3C" },
  { id: "orange",  name: "Airport", color: "#EF6C00" },
  { id: "aqua",    name: "Aqua",    color: "#00ACC1" },
  { id: "grey",    name: "Grey",    color: "#757575" },
];

interface MapViewProps {
  highlightedPath?: string[];
  activeLine?: string;
  className?: string;
}

export default function MapView({ highlightedPath = [], activeLine, className = "" }: MapViewProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<LMap | null>(null);
  const linesRef      = useRef<Map<string, { poly: Polyline; markers: CircleMarker[] }>>(new Map());
  const pathPolyRef   = useRef<any[]>([]);
  const radarRef      = useRef<any>(null);
  const [ready, setReady]          = useState(false);
  const [coords, setCoords]        = useState<{ lat: string; lng: string }>({ lat: "28.6139", lng: "77.2090" });
  const [zoom, setZoom]            = useState(11);
  const [showLegend, setShowLegend] = useState(false);
  const [routeStats, setRouteStats]  = useState<{ stops: number; lineColor: string; lineName: string } | null>(null);

  // ── Initialize map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      // Kill default icon lookup
      // @ts-expect-error private
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

      const map = L.map(containerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        maxZoom: 18,
        minZoom: 9,
      });

      // ── Dark, high-contrast tile layer ──────────────────────────────────────
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, attribution: "© OpenStreetMap © CARTO" }
      ).addTo(map);

      // ── Custom zoom control ─────────────────────────────────────────────────
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // ── Live coordinate display ─────────────────────────────────────────────
      map.on("mousemove", (e) => {
        setCoords({
          lat: e.latlng.lat.toFixed(4),
          lng: e.latlng.lng.toFixed(4),
        });
      });
      map.on("zoomend", () => setZoom(map.getZoom()));

      // ── Radar pulse (idle animation at Delhi center) ────────────────────────
      const radarLayers: any[] = [];
      const delhiCenter: [number, number] = [28.6139, 77.2090];
      for (let i = 1; i <= 3; i++) {
        const ring = L.circleMarker(delhiCenter, {
          radius: i * 14,
          color: "#FDD835",
          weight: 1.5,
          fillOpacity: 0,
          opacity: 0,
          className: `radar-ring radar-ring-${i}`,
        }).addTo(map);
        radarLayers.push(ring);
      }
      // center dot
      const centerDot = L.circleMarker(delhiCenter, {
        radius: 4,
        color: "#FDD835",
        weight: 2,
        fillColor: "#FDD835",
        fillOpacity: 1,
        opacity: 1,
        className: "radar-center",
      }).addTo(map);
      radarLayers.push(centerDot);
      radarRef.current = radarLayers;

      // ── Load all metro lines ────────────────────────────────────────────────
      const coordMap = await loadStopCoords();
      if (cancelled) return;

      for (const line of METRO_LINES) {
        const coords: [number, number][] = line.stopIds
          .map(id => coordMap.get(id))
          .filter((s): s is StopCoord => !!s)
          .map(s => [s.lat, s.lon]);

        if (coords.length < 2) continue;

        const poly = L.polyline(coords, {
          color: line.color,
          weight: 4,
          opacity: 0.5,
          smoothFactor: 1.2,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        const markers: CircleMarker[] = line.stopIds
          .map(id => coordMap.get(id))
          .filter((s): s is StopCoord => !!s)
          .map(s => {
            const isHub = INTERCHANGE_NAMES.has(s.name.toLowerCase());
            return L.circleMarker([s.lat, s.lon], {
              radius: isHub ? 7 : 3,
              color: "#fff",
              weight: isHub ? 2 : 1,
              fillColor: isHub ? "#fff" : line.color,
              fillOpacity: 1,
              opacity: isHub ? 0.9 : 0.5,
              className: isHub ? "hub-marker" : "stop-marker",
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

      mapRef.current = map;
      setReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Highlight active route path ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;
      const coordMap = await loadStopCoords();

      const byName = new Map<string, StopCoord>();
      for (const s of coordMap.values()) {
        byName.set(s.name.toLowerCase(), s);
      }

      // Clear previous highlights
      pathPolyRef.current.forEach((layer: any) => layer.remove());
      pathPolyRef.current = [];

      // Show/hide radar
      const radarVisible = highlightedPath.length === 0;
      radarRef.current?.forEach((r: any) => {
        if (radarVisible) {
          r.setStyle({ opacity: 1, fillOpacity: r.options.className?.includes("center") ? 1 : 0 });
        } else {
          r.setStyle({ opacity: 0, fillOpacity: 0 });
        }
      });

      if (!highlightedPath.length) {
        // Restore lines
        linesRef.current.forEach(({ poly, markers }) => {
          poly.setStyle({ opacity: 0.5, weight: 4 });
          markers.forEach(m => m.setStyle({ opacity: m.options.className?.includes("hub") ? 0.9 : 0.5, fillOpacity: 1 }));
        });
        setRouteStats(null);
        return;
      }

      // Resolve coords for path
      const pathCoords: [number, number][] = highlightedPath
        .map(name => byName.get(name.toLowerCase()))
        .filter((s): s is StopCoord => !!s)
        .map(s => [s.lat, s.lon]);

      if (pathCoords.length < 2) return;

      const matchedLine = METRO_LINES.find(l => l.id === activeLine) ?? METRO_LINES[0];
      const color = matchedLine.color;

      // Dim all background lines
      linesRef.current.forEach(({ poly, markers }) => {
        poly.setStyle({ opacity: 0.08, weight: 3 });
        markers.forEach(m => m.setStyle({ opacity: 0.08, fillOpacity: 0.1 }));
      });

      // ── Route layers ─────────────────────────────────────────────────────
      const newLayers: any[] = [];

      // Outer glow halo
      newLayers.push(L.polyline(pathCoords, {
        color,
        weight: 22,
        opacity: 0.12,
        lineCap: "round",
        lineJoin: "round",
        className: "route-outer-glow",
      }).addTo(map));

      // Mid glow
      newLayers.push(L.polyline(pathCoords, {
        color,
        weight: 12,
        opacity: 0.25,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map));

      // Dark border (makes it pop on dark map)
      newLayers.push(L.polyline(pathCoords, {
        color: "#000",
        weight: 9,
        opacity: 0.6,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map));

      // Core line
      const core = L.polyline(pathCoords, {
        color,
        weight: 6,
        opacity: 1,
        lineCap: "square",
        lineJoin: "miter",
        className: "route-core",
      }).addTo(map);
      newLayers.push(core);

      // Animated white dashes
      newLayers.push(L.polyline(pathCoords, {
        color: "#fff",
        weight: 2,
        opacity: 0.9,
        className: "metro-animated-dash",
      }).addTo(map));

      // ── Station dots along route ──────────────────────────────────────────
      pathCoords.forEach((coord, i) => {
        const isStart = i === 0;
        const isEnd   = i === pathCoords.length - 1;
        const isTerminal = isStart || isEnd;

        // Outer ring for terminals
        if (isTerminal) {
          newLayers.push(L.circleMarker(coord, {
            radius: 18,
            color: isStart ? "#88D498" : "#FF6B6B",
            weight: 2,
            fillOpacity: 0,
            opacity: 0.3,
            className: "terminal-ring-outer",
          }).addTo(map));
          newLayers.push(L.circleMarker(coord, {
            radius: 12,
            color: isStart ? "#88D498" : "#FF6B6B",
            weight: 2,
            fillOpacity: 0,
            opacity: 0.6,
          }).addTo(map));
        }

        // Main dot
        newLayers.push(L.circleMarker(coord, {
          radius: isTerminal ? 8 : 4,
          color: "#fff",
          weight: 2,
          fillColor: isStart ? "#88D498" : isEnd ? "#FF6B6B" : color,
          fillOpacity: 1,
        }).addTo(map));

        // Label tags for start/end
        if (isTerminal) {
          const stationName = highlightedPath[i];
          const iconHtml = `
            <div style="
              background:${isStart ? "#88D498" : "#FF6B6B"};
              border:2px solid #000;
              padding:3px 8px;
              font-family:monospace;
              font-size:9px;
              font-weight:900;
              letter-spacing:0.2em;
              text-transform:uppercase;
              color:#000;
              box-shadow:2px 2px 0 #000;
              white-space:nowrap;
              transform:translate(12px,-20px);
              line-height:1.2;
            ">
              <div style="font-size:7px;opacity:0.7">${isStart ? "▶ FROM" : "■ TO"}</div>
              ${stationName?.toUpperCase() ?? ""}
            </div>
          `;
          newLayers.push(L.marker(coord, {
            icon: L.divIcon({ html: iconHtml, className: "", iconSize: [0, 0] }),
          }).addTo(map));
        }
      });

      pathPolyRef.current = newLayers;

      // Update stats
      setRouteStats({
        stops: highlightedPath.length,
        lineColor: color,
        lineName: matchedLine.name,
      });

      // Fit map with padding
      map.fitBounds(core.getBounds(), { padding: [70, 70], animate: true, duration: 0.8 });
    })();
  }, [ready, highlightedPath, activeLine]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* ── Neo-Brutalist Map Frame ─────────────────────────────────────────── */}
      <div className="border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

        {/* ── Header Bar ───────────────────────────────────────────────────── */}
        <div className="h-9 bg-black flex items-center px-3 justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 bg-[#FDD835] shrink-0 animate-pulse" />
            <span className="font-heading text-[8px] text-white tracking-widest uppercase truncate">
              {highlightedPath.length > 0
                ? `ROUTE // ${highlightedPath[0]?.toUpperCase()} → ${highlightedPath[highlightedPath.length - 1]?.toUpperCase()}`
                : "SYSTEM_MAP // DELHI_METRO_NETWORK"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Legend toggle */}
            <button
              onClick={() => setShowLegend(v => !v)}
              className="h-5 px-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading text-[7px] tracking-widest uppercase transition-colors"
            >
              LINES
            </button>
            {/* Zoom level pill */}
            <span className="font-numbers text-[8px] text-white/40 tabular-nums">Z{zoom}</span>
          </div>
        </div>

        {/* ── Map Canvas ───────────────────────────────────────────────────── */}
        <div className="relative">
          <div ref={containerRef} style={{ width: "100%", height: "460px", background: "#1a1a2e" }} />

          {/* ── Floating Legend Overlay ───────────────────────────────────── */}
          {showLegend && (
            <div className="absolute top-2 left-2 z-[500] bg-black/90 border-2 border-white/20 p-3 backdrop-blur-sm">
              <div className="font-heading text-[7px] text-white/50 tracking-widest mb-2 uppercase">Lines</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {LEGEND_LINES.map(line => (
                  <div key={line.id} className="flex items-center gap-1.5">
                    <div className="h-2 w-5 shrink-0" style={{ backgroundColor: line.color, border: "1px solid rgba(255,255,255,0.2)" }} />
                    <span className="font-heading text-[7px] text-white/70 uppercase tracking-wide">{line.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Coordinate Readout (bottom-left) ─────────────────────────── */}
          <div className="absolute bottom-8 left-2 z-[500] bg-black/70 border border-white/10 px-2 py-1 pointer-events-none">
            <span className="font-numbers text-[7px] text-white/50 tabular-nums tracking-wider">
              {coords.lat}°N {coords.lng}°E
            </span>
          </div>

          {/* ── Route Stats Badge (top-right when route active) ───────────── */}
          {routeStats && (
            <div
              className="absolute top-2 right-2 z-[500] border-2 border-black p-2 flex flex-col gap-1"
              style={{ backgroundColor: routeStats.lineColor }}
            >
              <span className="font-heading text-[7px] text-black/60 uppercase tracking-widest">Active Route</span>
              <span className="font-heading text-sm font-black text-black leading-none tabular-nums">
                {routeStats.stops}
                <span className="text-[8px] font-normal ml-1">STOPS</span>
              </span>
              <span className="font-heading text-[7px] text-black uppercase tracking-widest">{routeStats.lineName}</span>
            </div>
          )}
        </div>

        {/* ── Footer Bar ───────────────────────────────────────────────────── */}
        <div className="h-7 bg-black flex items-center px-3 justify-between">
          <span className="font-heading text-[6px] text-white/30 uppercase tracking-widest">
            © OPENSTREETMAP © CARTO // CC-BY-SA
          </span>
          {/* Line color dots */}
          <div className="flex items-center gap-1">
            {LEGEND_LINES.slice(0, 8).map(l => (
              <div key={l.id} className="h-1.5 w-1.5" style={{ backgroundColor: l.color }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── CSS ─────────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Tooltip ─────────────────────────────── */
        .metro-tooltip {
          background: #111 !important;
          border: 2px solid #fff !important;
          border-radius: 0 !important;
          color: #fff !important;
          font-family: monospace !important;
          font-size: 9px !important;
          font-weight: 900 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          padding: 3px 8px !important;
          box-shadow: 3px 3px 0 #000 !important;
          white-space: nowrap !important;
        }
        .metro-tooltip::before { display: none !important; }
        .leaflet-container { outline: none; }

        /* ── Dark tile enhancement ────────────────── */
        .leaflet-tile-pane {
          filter: saturate(0.9) brightness(0.85);
        }

        /* ── Marching ants dash ───────────────────── */
        .metro-animated-dash {
          stroke-dasharray: 10 14;
          stroke-linecap: round;
          animation: metro-dash 8s linear infinite;
        }
        @keyframes metro-dash {
          to { stroke-dashoffset: -960; }
        }

        /* ── Radar pulse rings ────────────────────── */
        .radar-ring {
          animation: pulse-ring 3s ease-out infinite;
        }
        .radar-ring-1 { animation-delay: 0s; }
        .radar-ring-2 { animation-delay: 1s; }
        .radar-ring-3 { animation-delay: 2s; }
        @keyframes pulse-ring {
          0%   { opacity: 0.6; stroke-width: 2px; }
          80%  { opacity: 0; stroke-width: 0.5px; }
          100% { opacity: 0; }
        }

        /* ── Terminal ring pulse ──────────────────── */
        .terminal-ring-outer {
          animation: terminal-pulse 2s ease-in-out infinite;
        }
        @keyframes terminal-pulse {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.7; }
        }

        /* ── Zoom controls ────────────────────────── */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
          margin-bottom: 32px !important;
          margin-right: 8px !important;
        }
        .leaflet-control-zoom a {
          background: #000 !important;
          border: 2px solid #fff !important;
          border-radius: 0 !important;
          font-weight: 900 !important;
          color: #fff !important;
          box-shadow: 3px 3px 0 rgba(255,255,255,0.2) !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 24px !important;
          font-size: 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .leaflet-control-zoom a:hover {
          background: #FDD835 !important;
          color: #000 !important;
          border-color: #FDD835 !important;
        }
        .leaflet-control-zoom-in { border-bottom: 1px solid #333 !important; }
        .leaflet-control-attribution { display: none !important; }

        /* ── Hub marker pop on hover ──────────────── */
        .leaflet-interactive:hover { cursor: crosshair !important; }
      `}</style>
    </div>
  );
}
