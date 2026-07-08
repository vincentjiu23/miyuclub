"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Simple check for MVP purposes
    const checkLoginStatus = () => {
      const user = localStorage.getItem("miyu_user");
      setIsLoggedIn(!!user);
    };
    
    checkLoginStatus();
    
    // Listen to native storage events for immediate cross-component sync
    window.addEventListener("storage", checkLoginStatus);
    return () => window.removeEventListener("storage", checkLoginStatus);
  }, [pathname]);

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path + '/'));

  const handleRestrictedClick = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      alert("Please Login or Register to access this feature.");
      router.push("/auth/login");
    }
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 border-t-2 border-electric-navy bg-white">
      <div className="flex justify-around items-center h-20 px-2 pb-safe w-full">
        <Link 
          href="/" 
          className={`flex flex-col items-center justify-center transition-colors ${isActive('/') ? 'text-sky-blue' : 'text-electric-navy/60 hover:text-sky-blue'}`}
        >
          <span className="material-symbols-outlined">dynamic_feed</span>
          <span className="font-handwriting text-xs uppercase">Feed</span>
        </Link>
        <Link 
          href="/marketplace" 
          className={`flex flex-col items-center justify-center transition-colors ${isActive('/marketplace') ? 'bg-sky-blue text-white border-2 border-electric-navy px-6 py-1 transform -rotate-1 sticky-note' : 'text-electric-navy/60 hover:text-sky-blue'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/marketplace') ? "'FILL' 1" : "'FILL' 0" }}>storefront</span>
          <span className="font-handwriting text-xs uppercase">Shop</span>
        </Link>
        <Link 
          href="/playlists" 
          onClick={(e) => handleRestrictedClick(e, "/playlists")}
          className={`flex flex-col items-center justify-center transition-colors ${isActive('/playlists') ? 'text-sky-blue' : 'text-electric-navy/60 hover:text-sky-blue'}`}
        >
          <span className="material-symbols-outlined">queue_music</span>
          <span className="font-handwriting text-xs uppercase">Mix</span>
        </Link>
        <Link 
          href="/draw" 
          onClick={(e) => handleRestrictedClick(e, "/draw")}
          className={`flex flex-col items-center justify-center transition-colors ${isActive('/draw') ? 'text-sky-blue' : 'text-electric-navy/60 hover:text-sky-blue'}`}
        >
          <span className="material-symbols-outlined">palette</span>
          <span className="font-handwriting text-xs uppercase">Draw</span>
        </Link>
        <Link 
          href="/confessions" 
          onClick={(e) => handleRestrictedClick(e, "/confessions")}
          className={`flex flex-col items-center justify-center transition-colors ${isActive('/confessions') ? 'bg-tertiary text-primary border-2 border-primary px-4 py-1 transform -rotate-2 sticky-note' : 'text-electric-navy/60 hover:text-sky-blue'}`}
        >
          <span className="material-symbols-outlined">groups</span>
          <span className="font-handwriting text-xs uppercase">Club</span>
        </Link>
      </div>
    </nav>
  );
}
