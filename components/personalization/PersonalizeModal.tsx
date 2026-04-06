"use client";

import { useEffect, useState } from "react";

interface Option {
  id: "student" | "tourist";
  label: string;
  description: string;
}

interface PersonalizeModalProps {
  onClose: () => void;
  onSave: (type: "student" | "tourist") => void;
}

const options: Option[] = [
  {
    id: "student",
    label: "Student",
    description: "Daily commute, college routes, budget friendly",
  },
  {
    id: "tourist",
    label: "Tourist",
    description: "Explore Delhi, landmarks, food spots",
  },
];

export default function PersonalizeModal({ onClose, onSave }: PersonalizeModalProps) {
  const [selected, setSelected] = useState<"student" | "tourist" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Light fade-in animation trigger
    setIsAnimating(true);
  }, []);

  const handleContinue = () => {
    if (selected) {
      onSave(selected);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}>
      <div 
        className={`w-full max-w-md mx-4 bg-[#111827] border-2 border-white shadow-neo-lg transition-transform duration-300 transform ${isAnimating ? "scale-100" : "scale-95"}`}
      >
        <div className="p-8 space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              PERSONALIZE YOUR EXPERIENCE
            </h2>
            <p className="text-white/60 font-medium">
              Help us customize your metro experience
            </p>
          </div>

          <div className="grid gap-4">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`group text-left p-6 border-2 transition-all cursor-pointer ${
                  selected === option.id
                    ? "bg-brutal-yellow border-black shadow-neo translate-x-[-2px] translate-y-[-2px]"
                    : "bg-surface-secondary border-white/20 hover:border-white/40"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-lg font-black uppercase ${selected === option.id ? "text-black" : "text-white"}`}>
                    {option.label}
                  </span>
                  <span className={`text-sm ${selected === option.id ? "text-black/80" : "text-white/40"}`}>
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={handleContinue}
              disabled={!selected}
              className={`w-full py-4 text-black font-black uppercase tracking-widest transition-all ${
                selected 
                  ? "bg-brutal-yellow border-2 border-black shadow-neo-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  : "bg-gray-500/50 border-2 border-transparent cursor-not-allowed grayscale"
              }`}
            >
              CONTINUE
            </button>

            <button 
              onClick={onClose}
              className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
