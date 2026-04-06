"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Compass,
  Train,
  MapPin,
  Check,
} from "lucide-react";


/* ─────────────────────────── TYPES ─────────────────────────── */
type UserType = "student" | "tourist";
type Step = 1 | 2;

/* ─────────────────────────── DATA ──────────────────────────── */
const COLLEGES = [
  { name: "Delhi University North Campus", nearest: "Vishwavidyalaya",             line: "YELLOW"  },
  { name: "Delhi University South Campus", nearest: "Durgabai Deshmukh South Campus", line: "PINK"    },
  { name: "Jamia Millia Islamia",          nearest: "Jamia Millia Islamia",          line: "MAGENTA" },
  { name: "IIT Delhi",                     nearest: "Hauz Khas",                     line: "YELLOW"  },
  { name: "Jawaharlal Nehru University",   nearest: "Munirka",                       line: "YELLOW"  },
  { name: "Ambedkar University Delhi",     nearest: "Kashmere Gate",                 line: "RED"     },
];

const LINE_TAG: Record<string, string> = {
  YELLOW:  "bg-brutal-yellow text-black",
  PINK:    "bg-brutal-pink   text-black",
  MAGENTA: "bg-brutal-lavender text-black",
  BLUE:    "bg-brutal-blue   text-black",
  RED:     "bg-brutal-pink   text-black",
};

const TOURIST_PLACES = [
  {
    name:  "India Gate",
    metro: "Central Secretariat",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=640&auto=format&fit=crop",
  },
  {
    name:  "Qutub Minar",
    metro: "Qutab Minar",
    image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=640&auto=format&fit=crop",
  },
  {
    name:  "Red Fort",
    metro: "Lal Quila",
    image: "https://images.unsplash.com/photo-1598324789736-4861f89564a0?q=80&w=640&auto=format&fit=crop",
  },
  {
    name:  "Lotus Temple",
    metro: "Okhla NSIC",
    image: "https://images.unsplash.com/photo-1600100397608-f010f41cb8ea?q=80&w=640&auto=format&fit=crop",
  },
  {
    name:  "Humayun's Tomb",
    metro: "J.L.N. Stadium",
    image: "https://images.unsplash.com/photo-1574182464526-724bc2499f57?q=80&w=640&auto=format&fit=crop",
  },
  {
    name:  "Chandni Chowk",
    metro: "Chandni Chowk",
    image: "https://images.unsplash.com/photo-1626248924040-cfcba6f83ec0?q=80&w=640&auto=format&fit=crop",
  },
];

/* ─────────────────────────── PROPS ─────────────────────────── */
interface PersonalizeModalProps {
  onClose: () => void;
  onSave:  (type: UserType) => void;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PersonalizeModal({ onClose, onSave }: PersonalizeModalProps) {
  const [step,        setStep]     = useState<Step>(1);
  const [selected,    setSelected] = useState<UserType | null>(null);
  const [college,     setCollege]  = useState<typeof COLLEGES[0] | null>(null);
  const [isAnimating, setAnim]     = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setAnim(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goNext = () => { if (selected) setStep(2); };
  const goBack = () => { setStep(1); setCollege(null); };

  const handleFinish = () => {
    if (!selected) return;
    localStorage.setItem("libre_user_type", selected);
    if (selected === "student" && college) {
      localStorage.setItem("libre_college",          college.name);
      localStorage.setItem("libre_nearest_station",  college.nearest);
    }
    onSave(selected);
  };

  /* ─── SHELL ─── */
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`w-full max-w-lg bg-background border-[3px] border-black shadow-neo-lg transition-transform duration-300 ${
          isAnimating ? "scale-100" : "scale-95"
        }`}
      >

        {/* ── SYSTEM BAR ── */}
        <div className="h-9 bg-black flex items-center px-4 justify-between shrink-0">
          <span className="font-heading text-[8px] text-white tracking-[0.18em]">
            LIBRE // PERSONALIZE_v1.0
          </span>
          {/* Step progress pills */}
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-brutal-yellow border border-white/30" />
            <div
              className={`h-[2px] w-8 transition-colors duration-300 ${
                step === 2 ? "bg-brutal-yellow" : "bg-white/20"
              }`}
            />
            <div
              className={`h-2 w-2 border border-white/30 transition-colors duration-300 ${
                step === 2 ? "bg-brutal-yellow" : "bg-white/10"
              }`}
            />
            <span className="ml-2 font-heading text-[7px] text-white/40 tracking-widest">
              {step}/2
            </span>
          </div>
        </div>

        {/* ══════════════ STEP 1 ══════════════ */}
        {step === 1 && (
          <div className="p-8 space-y-8">

            {/* Title */}
            <div className="space-y-2 border-b-[3px] border-black pb-6">
              <div className="inline-flex items-center gap-2 bg-brutal-yellow border-2 border-black px-3 py-1 shadow-neo mb-3">
                <span className="font-heading text-[8px] font-black uppercase tracking-widest text-black">
                  SYSTEM // ONBOARDING
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black leading-tight">
                WHO ARE YOU?
              </h2>
              <p className="font-heading text-[9px] text-black/50 uppercase tracking-[0.2em]">
                SELECT YOUR RIDER PROFILE BELOW
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-4">
              {[
                {
                  id:   "student" as UserType,
                  icon: GraduationCap,
                  label: "Student",
                  desc:  "Daily commute · College routes · Budget friendly",
                  accent: "bg-brutal-blue",
                },
                {
                  id:   "tourist" as UserType,
                  icon: Compass,
                  label: "Tourist",
                  desc:  "Explore Delhi · Landmarks · Food spots",
                  accent: "bg-brutal-green",
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`group relative text-left border-[3px] border-black transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-brutal-yellow shadow-none translate-x-[3px] translate-y-[3px]"
                        : "bg-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    }`}
                  >
                    <div className="flex items-stretch">
                      {/* Left accent strip */}
                      <div className={`w-14 shrink-0 flex items-center justify-center border-r-[3px] border-black ${active ? "bg-black" : opt.accent}`}>
                        <Icon
                          className={`h-6 w-6 ${active ? "text-brutal-yellow" : "text-black"}`}
                          strokeWidth={2.5}
                        />
                      </div>
                      {/* Content */}
                      <div className="p-5 flex-1">
                        <span className="block font-heading text-sm font-black uppercase tracking-wider text-black mb-1">
                          {opt.label}
                        </span>
                        <span className="font-heading text-[8px] uppercase tracking-widest text-black/50">
                          {opt.desc}
                        </span>
                      </div>
                      {/* Check */}
                      {active && (
                        <div className="pr-4 flex items-center">
                          <div className="h-6 w-6 bg-black border-2 border-black flex items-center justify-center">
                            <Check className="h-4 w-4 text-brutal-yellow" strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2">
              <button
                onClick={goNext}
                disabled={!selected}
                className={`w-full py-4 font-heading font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 border-[3px] border-black transition-all ${
                  selected
                    ? "bg-black text-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                    : "bg-black/10 text-black/20 cursor-not-allowed"
                }`}
              >
                CONTINUE
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </button>

              <button
                onClick={onClose}
                className="w-full font-heading text-[9px] uppercase tracking-[0.25em] text-black/30 hover:text-black/60 transition-colors cursor-pointer text-center py-2"
              >
                SKIP FOR NOW
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 2 — STUDENT ══════════════ */}
        {step === 2 && selected === "student" && (
          <div className="p-8 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b-[3px] border-black pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 bg-brutal-blue border-2 border-black shadow-neo flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-black" strokeWidth={2.5} />
                  </div>
                  <span className="font-heading text-[8px] text-black/40 uppercase tracking-widest">
                    STUDENT FLOW
                  </span>
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                  SELECT YOUR COLLEGE
                </h2>
                <p className="font-heading text-[8px] text-black/40 uppercase tracking-[0.2em]">
                  WE&apos;LL FIND YOUR NEAREST METRO STATION
                </p>
              </div>
              <button
                onClick={goBack}
                className="shrink-0 flex items-center gap-1.5 font-heading text-[8px] uppercase tracking-widest text-black/40 hover:text-black transition-colors cursor-pointer border-2 border-black px-3 py-2 hover:bg-black/5 shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={3} />
                BACK
              </button>
            </div>

            {/* College list */}
            <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
              {COLLEGES.map((c) => {
                const active = college?.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setCollege(c)}
                    className={`text-left border-[3px] border-black transition-all duration-100 cursor-pointer ${
                      active
                        ? "bg-brutal-blue shadow-none translate-x-[2px] translate-y-[2px]"
                        : "bg-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 gap-3">
                      <span className={`font-heading text-[9px] uppercase tracking-wider font-black ${active ? "text-black" : "text-black"}`}>
                        {c.name}
                      </span>
                      {active && (
                        <div className="h-5 w-5 bg-black flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-brutal-yellow" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nearest metro preview */}
            {college && (
              <div className="border-[3px] border-black bg-brutal-yellow shadow-neo animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="h-7 bg-black flex items-center px-3">
                  <span className="font-heading text-[7px] text-white tracking-[0.18em]">
                    RESULT // NEAREST_METRO_STATION
                  </span>
                </div>
                <div className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-black border-2 border-black flex items-center justify-center shrink-0">
                    <Train className="h-5 w-5 text-brutal-yellow" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-heading text-[7px] text-black/50 uppercase tracking-widest">
                      BOARD AT
                    </span>
                    <span className="font-heading text-sm font-black text-black uppercase tracking-wider">
                      {college.nearest}
                    </span>
                    <span className={`self-start font-heading text-[7px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black ${LINE_TAG[college.line] ?? "bg-brutal-lavender text-black"}`}>
                      {college.line} LINE
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={!college}
              className={`w-full py-4 font-heading font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 border-[3px] border-black transition-all ${
                college
                  ? "bg-black text-white shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  : "bg-black/10 text-black/20 cursor-not-allowed"
              }`}
            >
              SAVE &amp; CONTINUE
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        )}

        {/* ══════════════ STEP 2 — TOURIST ══════════════ */}
        {step === 2 && selected === "tourist" && (
          <div className="p-8 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b-[3px] border-black pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 bg-brutal-green border-2 border-black shadow-neo flex items-center justify-center">
                    <Compass className="h-4 w-4 text-black" strokeWidth={2.5} />
                  </div>
                  <span className="font-heading text-[8px] text-black/40 uppercase tracking-widest">
                    TOURIST FLOW
                  </span>
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                  EXPLORE DELHI
                </h2>
                <p className="font-heading text-[8px] text-black/40 uppercase tracking-[0.2em]">
                  TOP SPOTS — ALL METRO ACCESSIBLE
                </p>
              </div>
              <button
                onClick={goBack}
                className="shrink-0 flex items-center gap-1.5 font-heading text-[8px] uppercase tracking-widest text-black/40 hover:text-black transition-colors cursor-pointer border-2 border-black px-3 py-2 shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={3} />
                BACK
              </button>
            </div>

            {/* Places grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
              {TOURIST_PLACES.map((place) => (
                <div
                  key={place.name}
                  className="border-[3px] border-black overflow-hidden shadow-neo group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all duration-150"
                >
                  {/* Photo */}
                  <div className="relative h-24 w-full overflow-hidden border-b-[3px] border-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Info */}
                  <div className="bg-white px-3 py-2 space-y-1">
                    <p className="font-heading text-[8px] font-black uppercase tracking-wider text-black truncate">
                      {place.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 bg-black flex items-center justify-center shrink-0">
                        <MapPin className="h-2 w-2 text-white" strokeWidth={3} />
                      </div>
                      <span className="font-heading text-[7px] text-black/40 uppercase tracking-widest truncate">
                        {place.metro}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 font-heading font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 bg-black text-white border-[3px] border-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              SAVE &amp; START EXPLORING
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
