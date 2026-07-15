"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/authActions";
import { getNotifications, markNotificationsRead } from "@/app/actions/notificationActions";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check login and fetch notifications
    setIsLoggedIn(!!localStorage.getItem("miyu_user"));
    const fetchNotifs = async () => {
      if (!localStorage.getItem("miyu_user")) return;
      const res = await getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    };
    fetchNotifs();
    
    // Listen to native storage events for immediate cross-component sync
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("miyu_user"));
      fetchNotifs();
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Custom event to force update when within the same window
    window.addEventListener("miyu_notif_update", fetchNotifs);
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("miyu_notif_update", fetchNotifs);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logoutAction();
    localStorage.removeItem("miyu_user");
    window.dispatchEvent(new Event("storage"));
    setIsLoggedIn(false);
    setShowDropdown(false);
    window.location.href = "/auth/login";
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    } else {
      setShowDropdown(!showDropdown);
      setShowNotifs(false);
    }
  };

  const handleNotifClick = async () => {
    setShowNotifs(!showNotifs);
    setShowDropdown(false);
    // Mark all as read when opened
    if (!showNotifs && notifications.some(n => !n.read)) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      await markNotificationsRead();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="w-full top-0 sticky z-50 border-b-2 border-electric-navy bg-white/95 backdrop-blur-sm">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-electric-navy hover:text-sky-blue transition-colors p-1">menu</button>
          <Link href="/">
            <h1 className="font-handwriting text-headline-md md:text-headline-lg tracking-tighter text-electric-navy uppercase">MIYU CLUB</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 relative">
          <span className="hidden md:block font-label-bold text-label-bold bg-sunny-yellow text-electric-navy px-4 py-1 sticky-note sticker-rotate-1 mr-2">CATALOG_2024</span>
          
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={handleNotifClick}
              className={`material-symbols-outlined text-electric-navy hover:text-sky-blue transition-colors p-1 relative ${showNotifs ? 'text-sky-blue' : ''}`}
            >
              notifications
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-racing-red text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white border-2 border-electric-navy shadow-[4px_4px_0px_rgba(34,72,112,1)] flex flex-col z-50">
                <div className="p-3 bg-electric-navy text-white font-label-bold border-b-2 border-electric-navy">NOTIFICATIONS</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm font-handwriting text-electric-navy/60">No notifications yet.</div>
                ) : (
                  notifications.map((notif, idx) => (
                    <Link href={
                      notif.type === 'CHAT' ? `/chat/${notif.postId || ''}` : 
                      notif.type === 'FOLLOW' ? `/profile/${notif.actor?.username}` : 
                      notif.type === 'NEW_CONFESSION' ? `/confessions` : 
                      notif.type === 'NEW_POLL' ? `/club` : 
                      `/`
                    } key={notif.id || idx} className={`p-3 border-b border-electric-navy/10 hover:bg-sky-blue/5 flex flex-col gap-1 ${notif.read ? 'opacity-70' : 'bg-sunny-yellow/10'} block`}>
                      <span className="text-xs font-label-bold text-sky-blue">
                        {notif.type === 'LIKE_POST' && 'FEED LIKE'}
                        {notif.type === 'LIKE_VANGOGH' && 'VAN GOGH LIKE'}
                        {notif.type === 'LIKE_CONFESSION' && 'CONFESSION LIKE'}
                        {notif.type === 'FOLLOW' && 'NEW FOLLOWER'}
                        {notif.type === 'CHAT' && 'NEW MESSAGE'}
                        {notif.type === 'NEW_POST' && 'NEW POST'}
                        {notif.type === 'NEW_CONFESSION' && 'NEW CONFESSION'}
                        {notif.type === 'NEW_POLL' && 'NEW POLL'}
                      </span>
                      <p className="text-sm font-handwriting text-electric-navy leading-tight">
                        <span className="font-bold">{notif.actor?.username || 'Someone'}</span>
                        {notif.type === 'LIKE_POST' && ` liked your feed post.`}
                        {notif.type === 'LIKE_VANGOGH' && ` liked your Van Gogh artwork.`}
                        {notif.type === 'LIKE_CONFESSION' && ` liked your confession.`}
                        {notif.type === 'FOLLOW' && ` started following you.`}
                        {notif.type === 'CHAT' && ` sent you a message.`}
                        {notif.type === 'NEW_POST' && ` published a new post.`}
                        {notif.type === 'NEW_CONFESSION' && ` dropped a new confession.`}
                        {notif.type === 'NEW_POLL' && ` created a new poll.`}
                      </p>
                      <span className="text-[10px] text-electric-navy/50">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Link href="/explore" className="material-symbols-outlined text-electric-navy hover:text-sky-blue transition-colors p-1">
            explore
          </Link>

          <Link href="/chat" className="material-symbols-outlined text-electric-navy hover:text-sky-blue transition-colors p-1">
            chat
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleProfileClick}
              className={`material-symbols-outlined text-electric-navy hover:text-sky-blue transition-colors p-1 ${showDropdown ? 'text-sky-blue' : ''}`}
            >
              account_circle
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-electric-navy shadow-[4px_4px_0px_rgba(34,72,112,1)] py-2 flex flex-col z-50">
                <Link 
                  href="/profile" 
                  onClick={() => setShowDropdown(false)}
                  className="px-4 py-2 text-electric-navy hover:bg-sunny-yellow font-label-bold transition-colors text-left"
                >
                  VIEW PROFILE
                </Link>
                <Link 
                  href="/profile/edit" 
                  onClick={() => setShowDropdown(false)}
                  className="px-4 py-2 text-electric-navy hover:bg-sunny-yellow font-label-bold transition-colors text-left"
                >
                  EDIT PROFILE
                </Link>
                <div className="h-[2px] w-full bg-electric-navy/20 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-racing-red hover:bg-racing-red hover:text-white font-label-bold transition-colors text-left"
                >
                  LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
