"use client";

export default function PlaylistsPage() {
  // Hardcoded for MVP based on user input
  const defaultPlaylistId = '12ov2Gc5CVzfusANG3ScQ7';
  
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
                title="Spotify Embed: Recommendation Playlist"
                src={`https://open.spotify.com/embed/playlist/${defaultPlaylistId}?utm_source=generator&theme=0`}
                width="100%"
                height="500"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="bg-black"
              />
            </div>
          </div>
        </div>

        {/* Interaction Sidebar (Right/Small Column) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
          
          {/* Submit Form */}
          <div className="bg-sunny-yellow border-4 border-electric-navy p-6 sticky-note sticker-rotate-neg-1 shadow-[8px_8px_0px_#224870]">
            <h3 className="font-handwriting text-3xl text-electric-navy mb-2">Drop a Track</h3>
            <p className="font-handwriting text-lg text-electric-navy mb-6">
              Share your vibe with the club. Paste a Spotify link to add it to our review queue.
            </p>
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); alert("Thanks! Track added to queue."); (e.target as HTMLFormElement).reset(); }}>
              <input 
                type="url" 
                placeholder="https://open.spotify.com/track/..." 
                className="w-full px-4 py-4 bg-white border-4 border-electric-navy font-handwriting text-xl focus:ring-4 focus:ring-white outline-none placeholder-electric-navy/40"
                required
              />
              <button 
                type="submit"
                className="w-full py-4 bg-electric-navy text-white font-handwriting text-2xl border-4 border-electric-navy transition-transform hover:-translate-y-1 active:translate-y-1 tape-effect"
              >
                SUBMIT
              </button>
            </form>
          </div>

          {/* API Box */}
          <div className="bg-white border-4 border-electric-navy p-6 sticky-note sticker-rotate-1 shadow-[8px_8px_0px_#224870]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-handwriting text-2xl text-electric-navy">Top Tracks API</h3>
              <div className="w-3 h-3 bg-racing-red rounded-full animate-pulse border-2 border-electric-navy"></div>
            </div>
            <p className="font-handwriting text-lg text-electric-navy mb-4">
              Your Spotify Developer API integration is saved and ready. Top 10 automated recommendation feature coming soon.
            </p>
            <div className="bg-surface-container border-2 border-electric-navy p-4 overflow-x-auto">
                <code className="text-sm font-mono text-electric-navy whitespace-nowrap">
                    const top = await getTopTracks();<br/>
                    // Coming in next update
                </code>
            </div>
          </div>
          
        </div>
      </section>

    </main>
  );
}
