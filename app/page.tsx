"use client";

import SearchContainer from "@/components/search/SearchContainer";
import LocationSystem from "@/components/location/LocationSystem";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] py-12">
      <SearchContainer />
      
      {/* Location feature below the main control panel */}
      <LocationSystem />
      
      {/* Optional: Subtle Welcome Text beneath */}
      <div className="mt-12 space-y-4 text-center animate-in fade-in slide-in-from-top-2">
        <h1 className="text-4xl font-heading opacity-80 tracking-tighter uppercase text-white/90">
          Libre Metro
        </h1>
        <p className="font-heading text-xs uppercase tracking-widest text-[#FFD23F] opacity-80">
          Intelligence in Transit // Delhi NCR
        </p>
      </div>
    </div>
  );
}





