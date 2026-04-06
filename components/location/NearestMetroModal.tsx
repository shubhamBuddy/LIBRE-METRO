"use client";

import { useEffect, useState } from "react";

interface NearestMetroModalProps {
  station: { name: string; distance: number; isHighAccuracy: boolean } | null;
  error: string | null;
  onClose: () => void;
}

export default function NearestMetroModal({ station, error, onClose }: NearestMetroModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}>
      <div 
        className={`w-full max-w-sm mx-4 bg-white border-2 border-black shadow-neo-lg transition-transform duration-300 transform ${isAnimating ? "scale-100" : "scale-95"}`}
      >
        <div className="bg-black p-4 flex justify-between items-center">
          <h2 className="text-white font-heading text-[10px] tracking-widest uppercase">
            {error ? "SYSTEM ERROR" : "NEAREST METRO"}
          </h2>
          <button onClick={onClose} className="text-brutal-pink hover:text-white font-heading text-[10px] cursor-pointer">
            [X]
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          {error ? (
            <div className="space-y-4">
              <div className="h-12 w-12 bg-brutal-pink border-2 border-black flex items-center justify-center shadow-neo mx-auto mb-6">
                <span className="font-heading text-black text-xl">!</span>
              </div>
              <p className="font-body text-black font-bold uppercase">{error}</p>
            </div>
          ) : station ? (
            <div className="space-y-4 w-full">
              <div className="h-12 w-12 bg-brutal-green border-2 border-black flex items-center justify-center shadow-neo mx-auto mb-6">
                <div className="h-4 w-4 bg-black rounded-full" />
              </div>
              <div className="p-4 border-2 border-black bg-white shadow-neo w-full text-left">
                <label className="system-text block font-heading text-[8px] opacity-60 mb-2">STATION FOUND</label>
                <p className="font-heading text-sm text-black uppercase leading-relaxed">{station.name}</p>
              </div>
              
              <div className="p-4 border-2 border-black bg-white shadow-neo w-full text-left relative overflow-hidden">
                <label className="system-text block font-heading text-[8px] opacity-60 mb-2">PROXIMITY</label>
                <p className="font-body text-black font-bold uppercase">{station.distance} KM</p>
                {station.isHighAccuracy && (
                   <span className="absolute top-4 right-4 bg-black text-brutal-yellow font-heading text-[7px] px-2 py-1 uppercase tracking-wider">
                     ACCURACY: HIGH
                   </span>
                )}
              </div>
            </div>
          ) : null}

          <div className="pt-4 w-full">
            <button
              onClick={onClose}
              className="w-full bg-brutal-yellow font-heading text-[10px] text-black border-2 border-black py-4 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer uppercase tracking-widest"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

