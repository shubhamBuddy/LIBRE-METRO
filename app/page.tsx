"use client";

import SearchContainer from "@/components/search/SearchContainer";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] py-12">
      <SearchContainer />
      
      {/* Optional: Subtle Welcome Text beneath */}
      <div className="mt-8 space-y-4 text-center animate-in fade-in slide-in-from-top-2">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white/90">
          Libre Metro
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-highlight opactiy-80">
          Intelligence in Transit // Delhi NCR
        </p>
      </div>
    </div>
  );
}





