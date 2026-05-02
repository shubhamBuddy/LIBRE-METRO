"use client";

import { useEffect, useState } from "react";
import { Ticket, CreditCard } from "lucide-react";

interface FareBreakdownProps {
  stopsCount: number;
}

export default function FareBreakdown({ stopsCount }: FareBreakdownProps) {
  const [dayName, setDayName] = useState("");
  const [isOffPeak, setIsOffPeak] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const date = new Date();
      setDayName(date.toLocaleDateString("en-US", { weekday: "long" }));
      
      // Check if off peak (before 8 AM, 12-5 PM, after 9 PM)
      const hour = date.getHours();
      if (hour < 8 || (hour >= 12 && hour < 17) || hour >= 21) {
        setIsOffPeak(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Distance estimate: (stops - 1) intervals × ~1.1km avg Delhi Metro inter-station spacing
  // e.g. 10 stops = 9 intervals × 1.1 = ~9.9km → slab 5–12 km → ₹32
  const intervals = Math.max(1, stopsCount - 1);
  const distance = intervals * 1.1;
  
  const isHoliday = dayName === "Sunday";
  
  // Base fare logic from Delhi Metro fare chart (2026 Latest Data)
  let baseFare = 11;
  if (distance <= 2) {
    baseFare = 11;
  } else if (distance <= 5) {
    baseFare = isHoliday ? 11 : 21;
  } else if (distance <= 12) {
    baseFare = isHoliday ? 21 : 32;
  } else if (distance <= 21) {
    baseFare = isHoliday ? 32 : 43;
  } else if (distance <= 32) {
    baseFare = isHoliday ? 43 : 54;
  } else {
    baseFare = isHoliday ? 54 : 64;
  }

  // Determine discount percentage
  // Smart Card: 10% off generally
  // Off-peak (Mon-Sat): 20% off
  let discountPercent = 10;
  if (!isHoliday && isOffPeak) {
    discountPercent = 20;
  }

  const smartCardFare = Math.floor(baseFare * (1 - discountPercent / 100));
  const savings = baseFare - smartCardFare;

  return (
    <div className="bg-white border-[3px] border-black shadow-neo relative overflow-hidden flex flex-col w-full">
      {/* SYSTEM HEADER */}
      <div className="h-9 bg-black flex items-center px-3 justify-between">
        <span className="font-heading text-[8px] text-white tracking-[0.1em]">
          DATA // FARE_ESTIMATION
        </span>
        <div className="flex items-center gap-2">
          {!isHoliday && isOffPeak && (
            <span className="text-brutal-yellow text-[8px] font-heading font-bold tracking-widest uppercase">
              OFF-PEAK ACTIVE
            </span>
          )}
          {isHoliday && (
             <span className="text-brutal-green text-[8px] font-heading font-bold tracking-widest uppercase">
               HOLIDAY FARE
             </span>
          )}
          <div className="h-2 w-2 bg-brutal-yellow" />
        </div>
      </div>
      
      {/* CONTENT BLOCK */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row gap-3 md:gap-4 relative">
        <div className="absolute left-[38px] top-6 bottom-0 w-[2px] bg-black/10 z-0 hidden md:block" />

        {/* TOKEN / QR CARD */}
        <div className="flex-1 border-[3px] border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative z-10 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
          <div className="font-heading text-[9px] md:text-[10px] tracking-widest uppercase mb-1.5 flex items-center gap-1.5 opacity-80 text-black">
            <Ticket className="h-3 w-3" /> TOKEN / QR
          </div>
          <div className="text-2xl md:text-3xl font-black font-numbers tracking-tighter text-black">
            ₹{baseFare}
          </div>
        </div>

        {/* SMART CARD CARD */}
        <div className="flex-1 border-[3px] border-black bg-brutal-yellow p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden z-10 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between">
          <div>
            <div className="font-heading text-[9px] md:text-[10px] tracking-widest uppercase mb-1.5 flex items-center gap-1.5 text-black">
              <CreditCard className="h-3 w-3" /> SMART CARD / NCMC
            </div>
            <div className="text-2xl md:text-3xl font-black font-numbers tracking-tighter text-black flex items-center gap-2">
              ₹{smartCardFare}
              <span className="text-[9px] bg-black text-white px-1.5 py-0.5 tracking-widest leading-none align-middle font-heading font-medium transform -translate-y-1">
                -{discountPercent}%
              </span>
            </div>
          </div>
          
          <div className="absolute right-0 bottom-0 bg-white border-t-[3px] border-l-[3px] border-black px-2 py-1 flex items-center gap-1">
            <span className="font-heading text-[8px] font-black tracking-widest text-black">
              SAVE ₹{savings}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

