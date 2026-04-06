"use client";

interface LocationButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export default function LocationButton({ onClick, isLoading }: LocationButtonProps) {
  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`group relative flex items-center justify-center gap-2 bg-white border-2 border-black font-heading text-[9px] uppercase tracking-widest text-black px-6 py-3 shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
          isLoading ? "opacity-70 cursor-wait" : ""
        }`}
      >
        <div className={`h-2 w-2 bg-black ${isLoading ? "animate-ping" : ""}`} />
        <span>{isLoading ? "DETECTING LOCATION..." : "USE MY LOCATION"}</span>
      </button>
    </div>
  );
}
