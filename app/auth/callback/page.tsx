"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The Supabase client with detectSessionInUrl:true automatically picks up
    // the code/hash from the URL and exchanges it for a session in the browser.
    // We just need to wait for onAuthStateChange to fire, then redirect home.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        router.replace("/");
      }
    });

    // Fallback: if already signed in (e.g., page refresh), go home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        router.replace("/");
      }
    });

    // Safety timeout — go home after 5s regardless
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      router.replace("/");
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 border-[3px] border-black border-t-transparent animate-spin mx-auto" />
        <p className="font-heading text-[10px] font-black uppercase tracking-[0.3em] text-black">
          AUTHENTICATING...
        </p>
        <p className="font-heading text-[8px] text-black/40 uppercase tracking-widest font-bold">
          PLEASE WAIT
        </p>
      </div>
    </div>
  );
}
