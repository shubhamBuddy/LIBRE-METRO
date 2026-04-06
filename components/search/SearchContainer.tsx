"use client";

export default function SearchContainer() {
  return (
    <div className="mx-auto w-full max-w-[500px] mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 
        MAIN CONTAINER: 
        Raw Neo-Brutalist "Floating Panel".
        Features: Sharp corners, thick borders, and hard offset shadows.
      */}
      <div className="bg-white border-2 border-black shadow-neo relative overflow-hidden">
        {/* Progress/System Bar */}
        <div className="h-6 bg-black flex items-center px-3 justify-between">
          <span className="font-mono text-[10px] text-white tracking-[0.2em] font-bold">
            SYSTEM // CONTROL_PANEL_v1.0
          </span>
          <div className="h-2 w-2 bg-brutal-yellow" />
        </div>

        <div className="p-8 space-y-8">
          {/* 1. TOP BLOCK - "FROM STATION" Placeholder */}
          <div className="relative">
            <label className="system-text mb-2 block font-black">FROM STATION</label>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4">
              <div className="h-4 w-1/3 bg-black/10 animate-pulse" />
            </div>
            {/* Brutalist Connector */}
            <div className="absolute left-8 -bottom-8 w-1 h-8 bg-black z-0" />
            <div className="absolute left-8 -bottom-8 w-4 h-1 bg-black z-0" />
          </div>

          {/* 2. MIDDLE BLOCK - "SWAP" Placeholder */}
          <div className="flex justify-start pl-4 relative z-10">
            <div className="h-12 w-12 bg-brutal-blue border-2 border-black flex items-center justify-center shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
              <div className="h-4 w-4 border-2 border-black rounded-none" />
            </div>
          </div>

          {/* 3. BOTTOM BLOCK - "TO STATION" Placeholder */}
          <div className="relative">
            <label className="system-text mb-2 block font-black">TO STATION</label>
            <div className="h-16 w-full bg-white border-2 border-black flex items-center px-4">
              <div className="h-4 w-1/2 bg-black/10 animate-pulse" />
            </div>
          </div>

          {/* 4. BUTTON AREA - "FIND ROUTE" Placeholder */}
          <div className="pt-4">
            <div className="h-16 w-full bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all cursor-pointer">
              <span className="font-black uppercase tracking-[0.2em] text-sm">FIND ROUTE</span>
            </div>
          </div>

          {/* System status dots */}
          <div className="flex gap-2 justify-center pt-2">
            <div className="h-2 w-2 bg-black" />
            <div className="h-2 w-2 bg-black/20" />
            <div className="h-2 w-2 bg-black/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

