"use client";

import { useState, useEffect, useRef } from "react";
import { CircleUser, LogOut, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AuthModal from "./AuthModal";

export default function ProfileButton() {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes (e.g. after OAuth redirect)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowModal(false);
        // Clear the hash from URL after successful sign-in
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    });

    // Specific check for hash tokens if session is not yet established
    if (window.location.hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setUser(session.user);
      });
    }

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    setShowDropdown(false);
  };

  const getInitials = (u: User) => {
    const name = u.user_metadata?.full_name || u.email || "";
    return name
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0].toUpperCase())
      .join("");
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      {user ? (
        /* ── LOGGED-IN STATE ── */
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-2.5 py-1.5 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
            aria-label="Account menu"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-6 w-6 border-2 border-black object-cover"
              />
            ) : (
              <div className="h-6 w-6 bg-brutal-yellow border-2 border-black flex items-center justify-center">
                <span className="font-heading text-[8px] font-black text-black">
                  {getInitials(user)}
                </span>
              </div>
            )}
            <ChevronDown
              className={`h-3 w-3 text-black transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
              strokeWidth={3}
            />
          </button>

          {/* DROPDOWN */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-background border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-90">
              {/* User info */}
              <div className="px-4 py-3 border-b-2 border-black bg-black/5">
                <p className="font-heading text-[8px] text-black/40 uppercase tracking-widest font-bold truncate">
                  SIGNED IN AS
                </p>
                <p className="font-heading text-[9px] text-black font-black uppercase tracking-wider truncate mt-0.5">
                  {user.user_metadata?.full_name || user.email}
                </p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-4 py-3 font-heading text-[9px] text-black uppercase tracking-widest font-black hover:bg-brutal-pink/20 active:bg-brutal-pink/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loggingOut ? (
                  <div className="h-3 w-3 border-2 border-black border-t-transparent animate-spin" />
                ) : (
                  <LogOut className="h-3 w-3" strokeWidth={3} />
                )}
                {loggingOut ? "SIGNING OUT..." : "LOGOUT"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── LOGGED-OUT STATE ── */
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center border-2 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
          aria-label="Sign in"
          title="Sign in"
        >
          <CircleUser className="h-5 w-5 text-black" strokeWidth={2.5} />
        </button>
      )}

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
