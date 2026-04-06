"use client";

import { useEffect, useState } from "react";
import PersonalizeButton from "./PersonalizeButton";
import PersonalizeModal from "./PersonalizeModal";

export default function PersonalizeSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. FIRST VISIT DETECTION
    const isPersonalized = localStorage.getItem("libre_personalized");
    
    if (isPersonalized === null) {
      // Small delay for smooth fade-in after hydrations
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // 6. OPTIONAL SKIP
    localStorage.setItem("libre_personalized", "true");
    setIsOpen(false);
  };

  const handleSave = (type: "student" | "tourist") => {
    // 5. ACTION BUTTON logic
    localStorage.setItem("libre_user_type", type);
    localStorage.setItem("libre_personalized", "true");
    setIsOpen(false);
  };

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <>
      {/* 2. PERSONALIZE BUTTON (ALWAYS VISIBLE) */}
      <PersonalizeButton onClick={() => setIsOpen(true)} />
      
      {/* 3. PERSONALIZATION MODAL (MAIN UI) */}
      {isOpen && (
        <PersonalizeModal 
          onClose={handleClose} 
          onSave={handleSave} 
        />
      )}
    </>
  );
}
