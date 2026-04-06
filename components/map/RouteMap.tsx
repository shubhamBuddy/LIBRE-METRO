"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { LINE_COLORS } from "@/lib/metro";

// Dynamic import with no SSR for Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

// Helper to keep Leaflet work correctly with custom icons in Next.js
let LInstance: any;
if (typeof window !== 'undefined') {
  LInstance = require('leaflet');
}

const getPixelIcon = () => {
    if (!LInstance) return null;
    return new LInstance.DivIcon({
        className: 'custom-pixel-marker',
        html: `
            <div style="
                width: 24px; 
                height: 32px; 
                background-color: #E53935; 
                border: 2px solid black; 
                position: relative;
                box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
            ">
                <div style="
                    position: absolute; 
                    bottom: -6px; 
                    left: 6px; 
                    width: 0; 
                    height: 0; 
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 6px solid black;
                "></div>
            </div>
        `,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
        popupAnchor: [0, -32],
    });
};

interface Station {
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

interface RouteMapProps {
    path: string[];
    line1?: string[];
    line2?: string[];
    interchange?: string[];
}

export default function RouteMap({ path, line1, line2, interchange }: RouteMapProps) {
    const [stations, setStations] = useState<Station[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!path || path.length === 0) return;

        async function fetchStationCoords() {
            try {
                setIsLoading(true);
                // Fetch the stations in the path to get coordinates
                const namesQuery = encodeURIComponent(path.join(","));
                const response = await fetch(`/api/stations?names=${namesQuery}`);
                const data = await response.json();

                if (data.status === 200 && Array.isArray(data.data)) {
                    // Map back to path order to ensure the line is drawn correctly
                    const coordMap = new Map();
                    data.data.forEach((s: Station) => {
                        coordMap.set(s.stop_name.toLowerCase(), {
                            lat: s.stop_lat,
                            lon: s.stop_lon
                        });
                    });

                    const orderedStations: Station[] = path.map(name => {
                        const coords = coordMap.get(name.toLowerCase());
                        return {
                            stop_name: name,
                            stop_lat: coords?.lat || 0,
                            stop_lon: coords?.lon || 0
                        };
                    }).filter(s => s.stop_lat !== 0);

                    setStations(orderedStations);
                }
            } catch (error) {
                console.error("Error loading map stations:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchStationCoords();
    }, [path]);

    if (isLoading || stations.length === 0) {
        return (
            <div className="h-[400px] bg-gray-100 border-2 border-black flex items-center justify-center font-heading text-[10px] uppercase">
                {isLoading ? "CALCULATING GEOMETRY..." : "COORDINATES UNAVAILABLE"}
            </div>
        );
    }

    const polylinePositions = stations.map(s => [s.stop_lat, s.stop_lon] as [number, number]);
    const center = polylinePositions[Math.floor(polylinePositions.length / 2)];

    // Segment the path into line sections based on interchanges
    const getSegments = () => {
        if (stations.length < 2) return [];
        
        const segments: { positions: [number, number][]; color: string }[] = [];
        const interchangeNames = (interchange || []).map(s => s.toLowerCase());
        
        // Find split index
        let splitIdx = -1;
        if (interchangeNames.length > 0) {
            splitIdx = stations.findIndex(s => interchangeNames.includes(s.stop_name.toLowerCase()));
        }

        const color1 = LINE_COLORS[(line1?.[0] || 'blue').toLowerCase()] || '#0052A5';
        const color2 = LINE_COLORS[(line2?.[0] || line1?.[0] || 'blue').toLowerCase()] || '#0052A5';

        if (splitIdx === -1) {
            // Single segment
            segments.push({ positions: polylinePositions, color: color1 });
        } else {
            // Two segments split at interchange
            segments.push({ 
                positions: polylinePositions.slice(0, splitIdx + 1), 
                color: color1 
            });
            segments.push({ 
                positions: polylinePositions.slice(splitIdx), 
                color: color2 
            });
        }
        
        return segments;
    };

    return (
        <div className="h-[400px] border-2 border-black shadow-neo relative z-0 overflow-hidden">
            <MapContainer 
                center={center} 
                zoom={12} 
                className="h-full w-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    opacity={0.8}
                />
                
                {getSegments().map((segment, idx) => (
                    <Polyline 
                        key={idx}
                        positions={segment.positions} 
                        color={segment.color}
                        weight={5}
                        opacity={0.8}
                    />
                ))}
                {stations.map((s, idx) => {
                    const icon = getPixelIcon();
                    return (
                        <Marker 
                            key={idx} 
                            position={[s.stop_lat, s.stop_lon]}
                            icon={icon || undefined}
                        >
                            <Popup>
                                <div className="font-heading text-[10px] uppercase font-bold">{s.stop_name}</div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
