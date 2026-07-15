"use client";

import { useState, useEffect } from "react";
import { searchUsers } from "@/app/actions/exploreActions";
import Link from "next/link";
import { useDebounce } from "@/lib/useDebounce"; // Ensure this exists, or I will write it inline

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Simple debounce inline for MVP
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() === "") {
        setResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await searchUsers(query);
      if (res.success && res.users) {
        setResults(res.users);
      }
      setHasSearched(true);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="min-h-screen bg-white md:bg-[url('/images/grid.png')] p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white border-2 border-electric-navy p-6 sticky-note">
        <h1 className="font-handwriting text-headline-md text-electric-navy mb-6">Explore MiyuClub</h1>
        
        <div className="relative mb-8">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-electric-navy/50">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full border-2 border-electric-navy p-4 pl-10 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="text-center font-handwriting text-electric-navy animate-pulse py-8">
              Searching the club...
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div className="text-center font-handwriting text-electric-navy/50 text-xl py-12">
              No club members found for "{query}"
            </div>
          )}

          {!loading && results.map(user => (
            <Link href={`/profile/${user.username}`} key={user.id} className="block group">
              <div className="p-4 border-2 border-electric-navy bg-white hover:bg-sunny-yellow/10 transition-colors flex items-center gap-4 sticky-note sticker-rotate-1 group-hover:-rotate-1">
                
                {/* Avatar */}
                <div className="w-14 h-14 border-2 border-electric-navy bg-sunny-yellow shrink-0 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-handwriting text-2xl text-electric-navy uppercase">
                      {user.username.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-handwriting text-xl text-electric-navy truncate">@{user.username}</h3>
                  {user.name && <p className="font-label-bold text-sky-blue text-xs uppercase truncate">{user.name}</p>}
                  {user.bio && <p className="text-sm text-electric-navy/70 truncate mt-1">{user.bio}</p>}
                </div>
                
                <div className="shrink-0">
                  <span className="material-symbols-outlined text-electric-navy group-hover:text-sky-blue transition-colors">chevron_right</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
