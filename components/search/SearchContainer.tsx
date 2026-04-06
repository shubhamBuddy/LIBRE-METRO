"use client";

export default function SearchContainer() {
  return (
    <div className="mx-auto w-full max-w-[500px] mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 
        MAIN CONTAINER: 
        Raw Neo-Brutalist "Floating Panel".
      */}
      <div className="bg-white border-2 border-black shadow-neo relative overflow-hidden">
        {/* Progress/System Bar */}
        <div className="h-8 bg-black flex items-center px-3 justify-between">
          <span className="font-heading text-[8px] text-white tracking-[0.1em]">
            SYSTEM // CONTROL_PANEL_v<span className="font-numbers">1.0</span>
          </span>
          <div className="h-2 w-2 bg-brutal-yellow" />
        </div>

        <div className="p-8 space-y-8 relative">
          {/* 
            ORIGINAL BRUTALIST CONNECTOR: 
            A solid, structural link from the top station to the swap unit.
          */}
          <div className="absolute left-[54px] top-40 h-12 w-1 bg-black z-0" />

          {/* 1. TOP BLOCK - "FROM STATION" Placeholder */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black" />
              <label className="system-text block font-heading text-[9px] opacity-60">FROM STATION</label>
            </div>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4 relative">
              <div className="h-4 w-1/3 bg-black/10 animate-pulse" />
            </div>
          </div>

          {/* 2. MIDDLE BLOCK - "SWAP" Placeholder */}
          <div className="flex justify-start pl-[30px] relative z-20">
            <div className="h-12 w-12 bg-brutal-blue border-2 border-black flex items-center justify-center shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              <div className="h-4 w-4 border-2 border-black rounded-none" />
            </div>
          </div>

          {/* 3. BOTTOM BLOCK - "TO STATION" Placeholder */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 bg-black" />
              <label className="system-text block font-heading text-[9px] opacity-60">TO STATION</label>
            </div>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4">
              <div className="h-4 w-1/2 bg-black/10 animate-pulse" />
            </div>
          </div>

          {/* 4. BUTTON AREA - "FIND ROUTE" Placeholder */}
          <div className="pt-4 relative z-10">
            <div className="h-16 w-full bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group">
              <span className="font-heading text-[10px] tracking-widest text-black group-hover:scale-105 transition-transform">FIND ROUTE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







