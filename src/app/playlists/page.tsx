"use client";

import { useState } from "react";

type SpotifyItem = {
  type: string;
  id: string;
  url: string;
};

export default function PlaylistsPage() {
  const [currentMedia, setCurrentMedia] = useState<SpotifyItem>({
    type: "playlist",
    id: "12ov2Gc5CVzfusANG3ScQ7",
    url: "https://open.spotify.com/playlist/12ov2Gc5CVzfusANG3ScQ7"
  });

  const [history, setHistory] = useState<SpotifyItem[]>([
    currentMedia
  ]);

  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Regex to match Spotify URLs
    const regex = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
    const match = inputUrl.match(regex);

    if (match && match.length >= 3) {
      const type = match[1];
      const id = match[2];
      const newItem = { type, id, url: inputUrl };
      
      setCurrentMedia(newItem);
      setHistory((prev) => [newItem, ...prev.filter(item => item.id !== id)]);
      setInputUrl("");
    } else {
      setError("Please enter a valid Spotify track, album, or playlist link.");
    }
  };

  return (
    <main className="pb-32 px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-12 min-h-screen">
      
      {/* Header Section */}
      <section className="flex flex-col items-start gap-4">
        <div className="bg-electric-navy text-white px-8 py-3 sticky-note sticker-rotate-neg-1">
          <h1 className="font-handwriting text-5xl md:text-6xl uppercase tracking-widest">Mix Tape</h1>
        </div>
        <p className="font-handwriting text-2xl text-electric-navy bg-white p-4 border-4 border-electric-navy tape-effect max-w-2xl leading-relaxed">
          The official MIYU CLUB community playlist. 
          <br/>Listen to our curated tracks or drop your favorites below.
        </p>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Playlist Embed (Left/Large Column) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="bg-sky-blue border-4 border-electric-navy p-4 md:p-6 sticky-note sticker-rotate-1 shadow-[8px_8px_0px_#224870]">
            <div className="flex justify-between items-end mb-4 border-b-2 border-electric-navy pb-4">
               <h2 className="font-handwriting text-4xl text-white uppercase tracking-tight">Now Playing</h2>
               <span className="material-symbols-outlined text-4xl text-white">queue_music</span>
            </div>
            <div className="border-4 border-electric-navy bg-black p-2 tape-effect">
              <iframe
                title="Spotify Embed"
                src={`https://open.spotify.com/embed/${currentMedia.type}/${currentMedia.id}?utm_source=generator&theme=0`}
                width="100%"
                height="500"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="bg-black transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Interaction Sidebar (Right/Small Column) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
          
          {/* Submit Form */}
          <div className="bg-sunny-yellow border-4 border-electric-navy p-6 sticky-note sticker-rotate-neg-1 shadow-[8px_8px_0px_#224870]">
            <h3 className="font-handwriting text-3xl text-electric-navy mb-2">Drop a Link</h3>
            <p className="font-handwriting text-lg text-electric-navy mb-4">
              Paste a Spotify link (track, album, or playlist) to play it immediately and add to the session list.
            </p>
            
            {error && (
              <div className="bg-racing-red text-white p-2 mb-4 font-label-bold text-sm border-2 border-electric-navy">
                {error}
              </div>
            )}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input 
                type="url" 
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..." 
                className="w-full px-4 py-4 bg-white border-4 border-electric-navy font-handwriting text-xl focus:ring-4 focus:ring-white outline-none placeholder-electric-navy/40"
                required
              />
              <button 
                type="submit"
                className="w-full py-4 bg-electric-navy text-white font-handwriting text-2xl border-4 border-electric-navy transition-transform hover:-translate-y-1 active:translate-y-1 tape-effect"
              >
                PLAY NOW
              </button>
            </form>
          </div>

          {/* History List */}
          <div className="bg-white border-4 border-electric-navy p-6 sticky-note sticker-rotate-1 shadow-[8px_8px_0px_#224870]">
            <div className="flex items-center justify-between mb-4 border-b-2 border-electric-navy pb-2">
              <h3 className="font-handwriting text-2xl text-electric-navy">Recent Links</h3>
              <span className="material-symbols-outlined text-electric-navy">history</span>
            </div>
            
            <ul className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
              {history.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <button 
                    onClick={() => setCurrentMedia(item)}
                    className={`w-full text-left p-3 border-2 border-electric-navy font-handwriting text-xl flex justify-between items-center transition-colors hover:bg-sky-blue/20 ${currentMedia.id === item.id ? 'bg-sky-blue text-white' : 'bg-surface-container text-electric-navy'}`}
                  >
                    <span className="capitalize truncate max-w-[80%]">Spotify {item.type}</span>
                    {currentMedia.id === item.id && <span className="material-symbols-outlined text-sm">play_arrow</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
        </div>
      </section>

    </main>
  );
}
