"use client";

import { Home, Users, Sliders } from "lucide-react";
import { motion } from "framer-motion";
import ProfileButton from "@/components/auth/ProfileButton";

export type NavItem = "home" | "community" | "personalize";

interface BottomDockProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  onOpenAuth: () => void;
}

export default function BottomDock({ activeTab, onTabChange, onOpenAuth }: BottomDockProps) {
  const navItems: { id: NavItem; label: string; Icon: React.ElementType }[] = [
    { id: "home",        label: "HOME", Icon: Home },
    { id: "community",  label: "COMM", Icon: Users },
    { id: "personalize", label: "PERS", Icon: Sliders },
  ];

  const handleClick = (id: NavItem) => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) window.navigator.vibrate(5);
    onTabChange(id);
  };

  const activeIdx = navItems.findIndex(i => i.id === activeTab);
  const totalCols  = navItems.length + 1; // 3 nav + 1 account

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[480px] z-[500]">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 28 }}
        className="flex bg-white border-[3px] border-black shadow-[6px_6px_0_#000] relative overflow-visible"
      >
        {/* Sliding accent indicator */}
        <motion.div
          initial={false}
          animate={{ x: `${activeIdx * 100}%` }}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute top-0 bottom-0 z-0 pointer-events-none"
          style={{ width: `${100 / totalCols}%` }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--accent, #FF2E88)" }}
          />
        </motion.div>

        {/* Nav buttons */}
        {navItems.map((item, i) => {
          const { Icon } = item;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`dock-${item.id}`}
              onClick={() => handleClick(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer bg-transparent border-none relative z-10 select-none ${i !== 0 ? 'border-l-[3px] border-black' : ''}`}
            >
              <motion.div
                animate={isActive ? { scale: 1.2, y: -1 } : { scale: 1, y: 0 }}
                whileTap={{ scale: 0.85 }}
              >
                <Icon size={16} strokeWidth={isActive ? 3 : 2} color="#000" />
              </motion.div>
              <span className={`font-heading text-[6px] tracking-[0.15em] uppercase font-black text-black transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Account button — overflow visible so dropdown can escape */}
        <div className="flex-1 border-l-[3px] border-black relative z-10 bg-white overflow-visible">
          <ProfileButton onOpenAuth={onOpenAuth} />
        </div>
      </motion.div>
    </div>
  );
}
