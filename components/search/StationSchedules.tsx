"use client";

import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";

interface ScheduleItem {
  route: string;
  first: string;
  last: string;
  all: string[];
}

interface StationScheduleProps {
  stationName: string;
  className?: string;
}

export default function StationSchedule({ stationName, className = "" }: StationScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationName) return;

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dmrc?type=schedule&station=${encodeURIComponent(stationName)}`);
        const data = await res.json();
        if (data.status === 200) {
          setSchedule(data.schedule);
        } else {
          setError(data.message || "Failed to load schedule");
        }
      } catch {
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [stationName]);

  const getNextTrain = (times: string[]) => {
    const now = new Date();
    const currentStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const next = times.find(t => t > currentStr);
    return next || times[0]; // If no more trains today, show first train tomorrow
  };

  if (loading) return (
    <div className="animate-pulse bg-white/50 border-2 border-black p-4 h-24 flex items-center justify-center">
      <span className="font-heading text-[10px] uppercase">Retrieving Timings...</span>
    </div>
  );

  if (error || !schedule || schedule.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Info className="h-3 w-3" />
        <span className="font-heading text-[9px] uppercase tracking-widest font-black">
          Station Timing // {stationName}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {schedule.slice(0, 2).map((item, idx) => {
          const nextTrain = getNextTrain(item.all);
          return (
            <div key={idx} className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-black/5 -rotate-12 translate-x-4 -translate-y-4 group-hover:bg-brutal-pink/20 transition-colors" />
              
              <div className="relative z-10">
                <span className="block font-heading text-[7px] text-black/50 uppercase mb-1 leading-tight truncate">
                  Towards {item.route.split(" to ")[1] || "Destination"}
                </span>
                
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <span className="block font-heading text-[18px] leading-none mb-1">
                      {nextTrain.substring(0, 5)}
                    </span>
                    <span className="font-heading text-[8px] bg-black text-white px-1 py-0.5 uppercase">
                      Next Train
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-numbers text-[9px] font-black">
                        <span className="opacity-40 mr-1">1ST:</span>{item.first.substring(0, 5)}
                      </span>
                      <span className="font-numbers text-[9px] font-black">
                        <span className="opacity-40 mr-1">LST:</span>{item.last.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
