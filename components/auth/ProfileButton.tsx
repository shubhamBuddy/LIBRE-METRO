"use client";

import { useState, useEffect, useRef } from "react";
import { CircleUser, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";

interface ProfileButtonProps {
  inDock?: boolean;
  onOpenAuth: () => void;
}

export default function ProfileButton({ onOpenAuth }: ProfileButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showDropdown]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    setShowDropdown(false);
  };

  const getInitials = (u: User) => {
    const name = u.user_metadata?.full_name || u.email || "";
    return name.split(/[\s@]/).filter(Boolean).slice(0, 2).map((s: string) => s[0].toUpperCase()).join("");
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    /* Use a portal-like wrapper with HIGH z-index so dropdown escapes the dock */
    <div ref={wrapRef} className="relative w-full h-full" style={{ zIndex: 200 }}>
      {user ? (
        <>
          {/* Logged-in button */}
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="w-full h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none active:scale-90 transition-transform"
            aria-label="Account menu"
          >
            {/* Avatar */}
            <div className="h-7 w-7 border-[2px] border-black overflow-hidden flex items-center justify-center bg-brutal-yellow shrink-0 shadow-[2px_2px_0_#000]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl as string}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span className="font-heading text-[7px] font-black text-black">{getInitials(user)}</span>
              )}
            </div>
            <span className="font-heading text-[6px] tracking-widest uppercase text-black/50 font-black">ACCT</span>
          </button>

          {/* Dropdown — renders upward, high z-index, NOT clipped by dock */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 w-48 bg-white border-[3px] border-black shadow-[4px_4px_0_#000]"
                style={{
                  bottom: "calc(100% + 12px)",
                  zIndex: 9999,
                }}
              >
                {/* User info header */}
                <div className="bg-black px-3 py-2">
                  <p className="font-heading text-[6px] text-white/40 uppercase tracking-widest">SIGNED IN AS</p>
                  <p className="font-heading text-[8px] text-white font-black uppercase tracking-wider truncate mt-0.5">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-3 font-heading text-[8px] text-black uppercase tracking-widest font-black hover:bg-brutal-red hover:text-white transition-colors cursor-pointer disabled:opacity-50 border-t-[2px] border-black"
                >
                  {loggingOut
                    ? <div className="h-3 w-3 border-[2px] border-black border-t-transparent animate-spin" />
                    : <LogOut size={11} strokeWidth={3} />
                  }
                  {loggingOut ? "EXITING..." : "LOG OUT"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* Logged-out button */
        <button
          onClick={onOpenAuth}
          className="w-full h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none active:scale-90 transition-transform"
          aria-label="Sign in"
        >
          <div className="h-7 w-7 border-[2px] border-black bg-white flex items-center justify-center shrink-0 shadow-[2px_2px_0_#000]">
            <CircleUser size={14} className="text-black" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-[6px] tracking-widest uppercase text-black/50 font-black">LOGIN</span>
        </button>
      )}
    </div>
  );
}
