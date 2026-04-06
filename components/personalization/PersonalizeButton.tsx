"use client";

interface PersonalizeButtonProps {
  onClick: () => void;
}

export default function PersonalizeButton({ onClick }: PersonalizeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 bg-foreground text-background border-2 border-background px-6 py-3 font-black uppercase tracking-widest shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
    >
      PERSONALIZE
    </button>
  );
}
