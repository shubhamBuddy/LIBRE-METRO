"use client";

import { useState, useEffect } from "react";
import { X, LogIn, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, browser redirects — no need to close modal manually
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      >
        {/* MODAL */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-sm bg-[#FFFDF5] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-200 ${
            isVisible ? "scale-100" : "scale-95"
          }`}
        >
          {/* HEADER */}
          <div className="bg-black flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brutal-yellow border-2 border-white">
                <LogIn className="h-4 w-4 text-black" strokeWidth={3} />
              </div>
              <span className="font-heading text-xs text-white tracking-[0.2em] uppercase font-black">
                ACCOUNT
              </span>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center bg-brutal-pink border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-black" strokeWidth={3} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-6">
            {/* INFO TEXT */}
            <div className="border-l-4 border-black pl-4">
              <p className="font-heading text-[9px] text-black/50 uppercase tracking-[0.2em] leading-relaxed font-bold">
                SIGN IN TO SUGGEST ROUTES &amp; JOIN THE COMMUNITY.
                <br />
                APP WORKS WITHOUT AN ACCOUNT.
              </p>
            </div>

            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-[3px] border-black py-4 px-6 font-black font-heading text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Google Icon SVG */}
              {!loading ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              ) : (
                <div className="h-4 w-4 border-[3px] border-black border-t-transparent animate-spin" />
              )}
              {loading ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}
            </button>

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-2 bg-brutal-pink/20 border-2 border-black p-3">
                <AlertTriangle className="h-4 w-4 text-black shrink-0 mt-0.5" strokeWidth={3} />
                <p className="font-heading text-[9px] text-black uppercase tracking-wider font-bold leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* DIVIDER */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-black/15" />
              <span className="font-heading text-[8px] text-black/30 uppercase tracking-[0.3em] font-black">
                OR
              </span>
              <div className="h-px flex-1 bg-black/15" />
            </div>

            {/* SKIP */}
            <button
              onClick={onClose}
              className="w-full border-[2px] border-dashed border-black/40 py-3 font-heading text-[9px] text-black/50 uppercase tracking-widest font-bold hover:border-black hover:text-black transition-all cursor-pointer"
            >
              SKIP — CONTINUE WITHOUT ACCOUNT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
