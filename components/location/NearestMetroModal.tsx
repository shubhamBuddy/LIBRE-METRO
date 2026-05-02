"use client";

import { useEffect, useState } from "react";
import { RefreshCw, MapPin, Crosshair, AlertTriangle, CheckCircle, X } from "lucide-react";

interface StationResult {
  name: string;
  distance: number;
  accuracy: number;
  isHighAccuracy: boolean;
}

interface NearestMetroModalProps {
  station: StationResult | null;
  error: string | null;
  isRefreshing?: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  onRefresh: () => void;
}

export default function NearestMetroModal({
  station,
  error,
  isRefreshing = false,
  onClose,
  onSelect,
  onRefresh,
}: NearestMetroModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const accuracyLabel = station
    ? station.accuracy <= 20
      ? { text: "GPS · HIGH", color: "bg-brutal-green text-black" }
      : station.accuracy <= 100
      ? { text: "NETWORK · MED", color: "bg-brutal-yellow text-black" }
      : { text: "ROUGH · LOW", color: "bg-brutal-pink text-black" }
    : null;

  return (
    /* BACKDROP — click outside to close */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-[#FFFDF5] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="bg-black flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brutal-green border-2 border-white/20">
              <Crosshair className="h-3.5 w-3.5 text-black" strokeWidth={3} />
            </div>
            <span className="font-heading text-[10px] text-white tracking-[0.2em] uppercase font-black">
              NEAREST METRO
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* REFRESH */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 flex items-center justify-center border-2 border-white/20 hover:bg-white/10 active:bg-white/20 transition-all cursor-pointer disabled:opacity-40"
              aria-label="Refresh location"
              title="Re-detect my location"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-brutal-yellow ${isRefreshing ? "animate-spin" : ""}`}
                strokeWidth={3}
              />
            </button>
            {/* CLOSE */}
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center bg-brutal-pink border-2 border-black/20 hover:brightness-95 active:scale-95 transition-all cursor-pointer font-heading text-black text-xs font-black"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-black" strokeWidth={4} />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 space-y-4">
          {isRefreshing ? (
            /* Refreshing state */
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="h-14 w-14 bg-brutal-yellow border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <Crosshair className="h-6 w-6 text-black animate-pulse" strokeWidth={3} />
              </div>
              <p className="font-heading text-[9px] text-black/60 uppercase tracking-widest font-bold animate-pulse">
                ACQUIRING GPS SIGNAL...
              </p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-brutal-pink/20 border-[3px] border-black p-4">
                <AlertTriangle className="h-4 w-4 text-black shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <p className="font-heading text-[9px] text-black uppercase tracking-widest font-black">
                    LOCATION_ERROR
                  </p>
                  <p className="font-heading text-[8px] text-black/60 uppercase tracking-wider font-bold mt-1 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={onRefresh}
                className="w-full flex items-center justify-center gap-2 bg-white border-[3px] border-black py-3 font-heading text-[9px] uppercase tracking-widest font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={3} />
                RETRY
              </button>
            </div>
          ) : station ? (
            /* Success state */
            <div className="space-y-3">
              {/* Station name */}
              <div className="border-[3px] border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-heading text-[7px] text-black/40 uppercase tracking-widest font-bold mb-1.5">
                  STATION FOUND
                </p>
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 bg-brutal-green border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-black" strokeWidth={3} />
                  </div>
                  <p className="font-heading text-sm text-black font-black uppercase leading-snug">
                    {station.name}
                  </p>
                </div>
              </div>

              {/* Distance + Accuracy row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-heading text-[7px] text-black/40 uppercase tracking-widest font-bold mb-1">
                    DISTANCE
                  </p>
                  <p className="font-heading text-base text-black font-black">
                    {station.distance} KM
                  </p>
                </div>
                <div className="border-[3px] border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-heading text-[7px] text-black/40 uppercase tracking-widest font-bold mb-1">
                    GPS ACCURACY
                  </p>
                  <p className="font-heading text-base text-black font-black">
                    ±{station.accuracy}m
                  </p>
                </div>
              </div>

              {/* Accuracy badge */}
              {accuracyLabel && (
                <div className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black ${accuracyLabel.color}`}>
                  <CheckCircle className="h-3 w-3 shrink-0" strokeWidth={3} />
                  <p className="font-heading text-[8px] font-black uppercase tracking-widest">
                    {accuracyLabel.text}
                  </p>
                  {station.accuracy > 100 && (
                    <p className="font-heading text-[7px] font-bold ml-auto opacity-70">
                      RESULT MAY VARY
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* ACTION BUTTONS */}
          {!isRefreshing && (
            <div className="flex flex-col gap-2.5 pt-1">
              {station && !error && (
                <button
                  onClick={() => onSelect(station.name)}
                  className="w-full bg-black text-white font-heading text-[10px] border-[3px] border-black py-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer uppercase tracking-[0.2em] font-black"
                >
                  USE THIS STATION
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full border-[2px] border-dashed border-black/40 py-2.5 font-heading text-[9px] text-black/50 uppercase tracking-widest font-bold hover:border-black hover:text-black transition-all cursor-pointer"
              >
                {error ? "DISMISS" : "CLOSE"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
