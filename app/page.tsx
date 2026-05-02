"use client";

import { useState, useEffect, useCallback } from "react";
import SearchContainer from "@/components/search/SearchContainer";
import LocationSystem from "@/components/location/LocationSystem";
import BottomDock, { NavItem } from "@/components/navigation/BottomDock";
import PersonalizeModal from "@/components/personalization/PersonalizeModal";
import CommunityTab from "@/components/community/CommunityTab";
import AuthModal from "@/components/auth/AuthModal";

export default function Home() {
  const [fromStation, setFromStation] = useState("");
  const [toStation,   setToStation]   = useState("");
  const [activeTab,   setActiveTab]   = useState<NavItem>("home");
  const [showPersonalizeModal, setShowPersonalizeModal] = useState(false);
  const [showCommunity,        setShowCommunity]        = useState(false);
  const [showAuthModal,        setShowAuthModal]        = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleTabChange = useCallback((tab: NavItem) => {
    setActiveTab((prev) => {
      const target = tab === prev && tab !== "home" ? "home" : tab;
      if (target === "home") {
        setShowPersonalizeModal(false);
        setShowCommunity(false);
      } else if (target === "community") {
        setShowPersonalizeModal(false);
        setShowCommunity(true);
      } else if (target === "personalize") {
        setShowCommunity(false);
        setShowPersonalizeModal(true);
      }
      return target;
    });
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });

    let t: NodeJS.Timeout | null = null;
    if (!localStorage.getItem("libre_personalized")) {
      t = setTimeout(() => handleTabChange("personalize"), 800);
    }
    return () => {
      cancelAnimationFrame(raf);
      if (t) clearTimeout(t);
    };
  }, [handleTabChange]);

  const closePersonalizeModal = () => {
    localStorage.setItem("libre_personalized", "true");
    handleTabChange("home");
  };

  return (
    <div className="flex flex-col items-center pb-[120px] pt-4 px-4 w-full nb-stagger">

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-[500px] mb-4 nb-anim-up">

        {/* Main title block */}
        <div className="nb-card-accent relative overflow-hidden p-5 pb-4">
          {/* Corner tag */}
          <div className="absolute top-0 right-0 bg-black px-2.5 py-1 border-l-[3px] border-b-[3px] border-black">
            <span className="font-heading text-[7px] text-white tracking-[0.2em]">DMRC // LIVE</span>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 bg-black rounded-full nb-pulse-dot" />
            <span className="font-heading text-[7px] text-black/55 tracking-[0.18em]">
              SYSTEM_ONLINE // 230 STATIONS
            </span>
          </div>

          {/* Big title */}
          <div className="font-heading text-[28px] leading-[1.05] font-black text-black tracking-[0.04em] uppercase">
            LIBRE<br />
            <span className="text-white" style={{ WebkitTextStroke: "2px #000" }}>METRO</span>
          </div>

          <div className="font-heading text-[7px] mt-2.5 text-black/45 tracking-[0.15em]">
            SHORTEST_PATH · DIJKSTRA · FREE · OPEN_SOURCE
          </div>

          {/* Decorative bars (bottom right) */}
          <div className="absolute bottom-2 right-4 flex gap-[3px] items-end opacity-20">
            {[14,8,18,10,20,12,16].map((h, i) => (
              <div key={i} className="w-[5px] bg-black" style={{ height: h }} />
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex border-[3px] border-t-0 border-black shadow-neo bg-white">
          {[
            { label: "LINES",    value: "11" },
            { label: "STATIONS", value: "230" },
            { label: "ALGO",     value: "DIJKSTRA" },
          ].map((item, i) => (
            <div key={i} className={`flex-1 p-2.5 flex flex-col items-center bg-white ${i < 2 ? 'border-r-[3px] border-black' : ''}`}>
              <span className="font-heading text-[6px] text-black/30 tracking-[0.15em] uppercase">{item.label}</span>
              <span className="font-heading text-[11px] text-black font-black mt-0.5">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH ──────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[500px] nb-anim-up" style={{ animationDelay: '80ms' }}>
        <SearchContainer
          from={fromStation}
          setFrom={setFromStation}
          to={toStation}
          setTo={setToStation}
        />
      </div>

      {/* ── LOCATION ────────────────────────────────────────────────────── */}
      <div className="nb-anim-up" style={{ animationDelay: '160ms' }}>
        <LocationSystem onStationFound={(s) => setFromStation(s.toUpperCase())} />
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div 
        className="w-full max-w-[500px] mt-10 border-[3px] border-black bg-black p-[14px_16px] flex items-center justify-between nb-anim-up shadow-[4px_4px_0_var(--accent,#FF2E88)]"
        style={{ animationDelay: '240ms' }}
      >
        <div>
          <div className="font-heading text-[8px] text-white/60 tracking-[0.15em]">
            MADE BY{" "}
            <a href="https://github.com/otzua/LIBRE-METRO" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 text-[var(--accent,#FF2E88)] hover:text-white transition-colors">
              KRISH
            </a>{" "}
            & SHUBHAM
          </div>
          <div className="font-heading text-[6px] text-white/20 mt-1 tracking-[0.15em]">
            LIBRE_METRO · OPEN SOURCE
          </div>
        </div>
        {/* LIVE pill */}
        <div className="border-2 border-white/30 px-2.5 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: "var(--accent, #FF2E88)" }}>
          <span className="w-1.5 h-1.5 bg-black rounded-full inline-block nb-pulse-dot" />
          <span className="font-heading text-[7px] text-black font-black tracking-[0.15em]">LIVE</span>
        </div>
      </div>

      {/* ── DOCK ────────────────────────────────────────────────────────── */}
      <BottomDock
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {mounted && showPersonalizeModal && (
        <PersonalizeModal onClose={closePersonalizeModal} onSave={() => closePersonalizeModal()} />
      )}
      {mounted && showCommunity && (
        <CommunityTab onClose={() => handleTabChange("home")} />
      )}
      {mounted && showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
