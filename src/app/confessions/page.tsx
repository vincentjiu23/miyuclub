"use client";

import { useState, useEffect } from "react";
import { getConfessions, createConfession, toggleConfessionLike, toggleConfessionSupport, getPolls, createPoll, votePoll, closePoll } from "@/app/actions/clubActions";
import { useRouter } from "next/navigation";

type PollOption = { id: string; text: string; votes: number, voters?: { userId: string }[] };
type Poll = {
  id: string;
  title: string;
  options: PollOption[];
  authorId: string;
  createdAt: string;
  isClosed: boolean;
  totalViews: number;
  author?: { username: string };
};

type Confession = {
  id: string;
  text: string;
  likes: number;
  supports: number;
  authorId: string;
  createdAt: string;
  author?: { username: string };
  likedBy?: { userId: string }[];
  supportedBy?: { userId: string }[];
  isLiked?: boolean;
  isSupported?: boolean;
};

export default function ConfessionsPage() {
  const [mounted, setMounted] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  
  const [showSpillModal, setShowSpillModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  
  const [newConfession, setNewConfession] = useState("");
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  const currentUserId = "current-user"; // Simulated current user

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check local session cookie equivalent for UI state
    const user = localStorage.getItem("miyu_user");
    setCurrentUser(user);

    const fetchData = async () => {
      const [pollsRes, confRes] = await Promise.all([getPolls(), getConfessions()]);
      
      if (pollsRes.success && pollsRes.polls) {
         setPolls(pollsRes.polls as any);
      }
      
      if (confRes.success && confRes.confessions) {
        // Find current user's session from cookie or pass to action
        // For client side, we use the returned arrays to see if they liked it.
        // Wait, the action didn't filter by user, it returned all likedBy.
        // Actually, let's just let the server action filter it if we update it, or check locally.
        const session = document.cookie.split('; ').find(row => row.startsWith('miyu_session='))?.split('=')[1];
        
        const mappedConfessions = confRes.confessions.map((c: any) => ({
          ...c,
          isLiked: c.likedBy?.some((l: any) => l.userId === session),
          isSupported: c.supportedBy?.some((s: any) => s.userId === session)
        }));
        setConfessions(mappedConfessions);
      }
    };
    
    fetchData();
  }, []);

  const pushNotification = (type: string, targetId: string, targetTitle: string) => {
    const saved = localStorage.getItem('miyu_notifications');
    let notifs = saved ? JSON.parse(saved) : [];
    notifs.push({
      id: Date.now().toString(),
      type,
      targetId,
      targetTitle: targetTitle.substring(0, 30) + (targetTitle.length > 30 ? '...' : ''),
      date: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('miyu_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new Event("miyu_notif_update"));
  };

  const submitConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first");
      return;
    }
    if (newConfession.trim() !== "") {
      const res = await createConfession(newConfession);
      if (res.success && res.confession) {
        setConfessions(prev => [{
          ...res.confession,
          isLiked: false,
          isSupported: false
        } as Confession, ...prev]);
        setNewConfession("");
        setShowSpillModal(false);
      } else {
        alert(res.error || "Failed to create confession");
      }
    }
  };

  const handleLikeConfession = async (confId: string, type: 'like' | 'support') => {
    if (!currentUser) {
      alert("Please login first");
      return;
    }

    const conf = confessions.find(c => c.id === confId);
    if (!conf) return;

    const isCurrentlyActive = type === 'like' ? conf.isLiked : conf.isSupported;

    // Optimistic UI update
    setConfessions(prev => prev.map(c => {
      if (c.id === confId) {
        return {
          ...c,
          likes: type === 'like' ? (isCurrentlyActive ? Math.max(0, c.likes - 1) : c.likes + 1) : c.likes,
          supports: type === 'support' ? (isCurrentlyActive ? Math.max(0, c.supports - 1) : c.supports + 1) : c.supports,
          isLiked: type === 'like' ? !isCurrentlyActive : c.isLiked,
          isSupported: type === 'support' ? !isCurrentlyActive : c.isSupported
        };
      }
      return c;
    }));

    let result;
    if (type === 'like') {
      result = await toggleConfessionLike(confId);
    } else {
      result = await toggleConfessionSupport(confId);
    }

    if (!result.success) {
      // Revert if failed
      alert(result.error || `Failed to toggle ${type}`);
      const fetchRes = await getConfessions();
      if (fetchRes.success && fetchRes.confessions) {
        const session = document.cookie.split('; ').find(row => row.startsWith('miyu_session='))?.split('=')[1];
        setConfessions(fetchRes.confessions.map((c: any) => ({
          ...c,
          isLiked: c.likedBy?.some((l: any) => l.userId === session),
          isSupported: c.supportedBy?.some((s: any) => s.userId === session)
        })));
      }
    }
  };

  const submitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first");
      return;
    }
    const validOptions = pollOptions.filter(o => o.trim() !== "");
    if (pollTitle.trim() !== "" && validOptions.length >= 2) {
      const res = await createPoll(pollTitle, validOptions);
      if (res.success && res.poll) {
        setPolls(prev => [{
          ...res.poll,
          options: res.poll.options.map((o: any) => ({ ...o, votes: 0 })),
          totalViews: 0
        } as Poll, ...prev]);
        setPollTitle("");
        setPollOptions(["", ""]);
        setShowPollModal(false);
      } else {
        alert(res.error || "Failed to create poll");
      }
    } else {
      alert("Please provide a question and at least 2 options.");
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser) {
      alert("Please login first");
      return;
    }

    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    // Determine current vote state to do optimistic UI update
    const session = document.cookie.split('; ').find(row => row.startsWith('miyu_session='))?.split('=')[1];
    let previousVotedOptionId: string | null = null;
    poll.options.forEach(o => {
      if (o.voters?.some(v => v.userId === session)) previousVotedOptionId = o.id;
    });

    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return {
          ...p,
          options: p.options.map(o => {
            let votes = o.votes;
            let voters = o.voters ? [...o.voters] : [];
            
            if (previousVotedOptionId === optionId) {
               // Toggling off the same vote
               if (o.id === optionId) {
                 votes = Math.max(0, votes - 1);
                 voters = voters.filter(v => v.userId !== session);
               }
            } else {
               // Changing vote or new vote
               if (o.id === previousVotedOptionId) {
                 votes = Math.max(0, votes - 1);
                 voters = voters.filter(v => v.userId !== session);
               } else if (o.id === optionId) {
                 votes += 1;
                 voters.push({ userId: session! });
               }
            }
            return { ...o, votes, voters };
          })
        };
      }
      return p;
    }));

    const result = await votePoll(optionId);
    if (!result.success) {
      alert(result.error || "Failed to vote");
      // Revert if failed
      const fetchRes = await getPolls();
      if (fetchRes.success && fetchRes.polls) {
        setPolls(fetchRes.polls as any);
      }
    }
  };

  const closePollHandler = async (pollId: string) => {
    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isClosed: true } : p));
    const result = await closePoll(pollId);
    if (!result.success) {
       alert(result.error || "Failed to close poll");
       setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isClosed: false } : p));
    }
  };

  if (!mounted) return null;

  return (
    <main className="px-margin-mobile pt-8 max-w-7xl mx-auto relative">
      <div className="absolute -top-4 -left-10 opacity-40 hidden lg:block animate-float">
        <svg fill="none" height="150" viewBox="0 0 200 200" width="150" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 50C30 20 80 20 100 50C120 80 170 80 190 50" stroke="#00A8E8" strokeLinecap="round" strokeWidth="4"></path>
          <path d="M50 100L80 130L110 100" stroke="#FF3E41" strokeLinecap="round" strokeWidth="4"></path>
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Voting Section */}
        <section className="lg:col-span-5 space-y-8">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="font-handwriting text-headline-md text-electric-navy uppercase">Hot Takes</h2>
            <div className="h-[2px] flex-grow bg-electric-navy opacity-20"></div>
          </div>

          <button 
            onClick={() => setShowPollModal(true)}
            className="w-full bg-sunny-yellow text-electric-navy font-label-md px-6 py-4 border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform mb-4"
          >
            + CREATE POLL
          </button>

          {polls.map((poll, idx) => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            
            const session = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('miyu_session='))?.split('=')[1] : null;
            const hasVoted = poll.options.some(o => o.voters?.some(v => v.userId === session));
            const votedOptionId = poll.options.find(o => o.voters?.some(v => v.userId === session))?.id;
            
            const isAuthor = poll.author?.username === currentUser;
            const colors = ['bg-sunny-yellow', 'bg-sky-blue', 'bg-racing-red', 'bg-electric-navy'];

            return (
              <div key={poll.id} className={`bg-white border-2 border-electric-navy p-6 sticky-note transition-transform relative overflow-hidden group mb-6 ${idx % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'}`}>
                {poll.isClosed ? (
                  <div className="absolute top-0 right-0 bg-electric-navy text-white px-3 py-1 border-b-2 border-l-2 border-electric-navy font-label-md z-10">CLOSED</div>
                ) : (
                  <div className="absolute top-0 right-0 bg-racing-red text-white px-3 py-1 border-b-2 border-l-2 border-electric-navy font-label-md z-10">LIVE</div>
                )}
                <h3 className="font-handwriting text-xl text-electric-navy mb-6 pr-12">{poll.title}</h3>
                
                <div className="space-y-4">
                  {poll.options.map((opt, oIdx) => {
                    const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                    const colorClass = colors[oIdx % colors.length];
                    
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        disabled={poll.isClosed}
                        className="w-full text-left relative cursor-pointer group/btn"
                      >
                        <div className="flex justify-between font-label-md text-electric-navy mb-1 relative z-10 mix-blend-difference group-hover/btn:text-white transition-colors">
                          <span>{opt.text}</span>
                          <span>{hasVoted || isAuthor || poll.isClosed ? `${percent}%` : ''}</span>
                        </div>
                        <div className="h-8 w-full bg-white border-2 border-electric-navy p-0.5 absolute top-0 left-0 -z-10">
                          <div className={`h-full ${colorClass} transition-all duration-1000`} style={{ width: (hasVoted || isAuthor || poll.isClosed) ? `${percent}%` : '0%' }}></div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                <div className="mt-8 flex justify-between items-center border-t-2 border-dashed border-electric-navy/20 pt-4">
                  <div className="flex flex-col">
                    <span className="text-electric-navy opacity-60 font-label-sm uppercase">{totalVotes + (isAuthor ? poll.totalViews : 0)} Views</span>
                    <span className="text-electric-navy opacity-60 font-label-sm uppercase">{totalVotes} Votes</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {hasVoted && <span className="text-racing-red font-handwriting">Voted!</span>}
                    {isAuthor && !poll.isClosed && (
                      <button onClick={() => closePollHandler(poll.id)} className="text-[10px] bg-electric-navy text-white px-2 py-1 sticky-note">CLOSE POLL</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Confessions Section */}
        <section className="lg:col-span-7 space-y-8 mt-16 lg:mt-0">
          <div className="flex items-baseline gap-3 mb-8">
            <div className="h-[2px] w-12 bg-racing-red opacity-40 -rotate-3"></div>
            <h2 className="font-handwriting text-headline-md text-electric-navy uppercase">Confessions</h2>
            <div className="h-[2px] flex-grow bg-racing-red opacity-20 rotate-1"></div>
          </div>

          <div className="bg-white border-2 border-electric-navy p-1 sticky-note mb-8 transform -rotate-0.5">
            <div className="bg-white border-2 border-dashed border-sky-blue/50 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 opacity-60">
                <span className="material-symbols-outlined text-2xl">masks</span>
                <span className="font-label-bold tracking-widest uppercase">INCOGNITO</span>
                <span className="font-handwriting text-electric-navy text-lg hidden sm:block">Write a secret...</span>
              </div>
              <button 
                onClick={() => setShowSpillModal(true)}
                className="bg-racing-red text-white font-label-md px-6 py-2 border-2 border-electric-navy sticky-note hover:bg-electric-navy transition-colors">
                SPILL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {confessions.map((conf, idx) => {
              const hasLiked = localStorage.getItem(`miyu_acted_like_${conf.id}`) === "true";
              const hasSupported = localStorage.getItem(`miyu_acted_support_${conf.id}`) === "true";
              
              return (
                <article key={conf.id} className={`bg-white border-2 border-electric-navy p-6 sticky-note relative transition-all flex flex-col justify-between ${idx % 2 === 0 ? 'transform rotate-1 hover:rotate-0' : 'transform -rotate-1 hover:rotate-0'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-sky-blue text-white p-2 border-2 border-electric-navy">
                      <span className="material-symbols-outlined text-sm">masks</span>
                    </div>
                    <span className="text-electric-navy/50 text-xs font-label-sm">{new Date(conf.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <p className="font-handwriting text-electric-navy leading-relaxed mb-6">"{conf.text}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleLikeConfession(conf.id, 'like')}
                      disabled={hasLiked}
                      className={`flex items-center gap-1 px-3 py-1 border-2 border-electric-navy transition-colors ${hasLiked ? 'bg-racing-red text-white' : 'bg-white text-electric-navy hover:bg-sunny-yellow'}`}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: hasLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      <span className="text-xs">{conf.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleLikeConfession(conf.id, 'support')}
                      disabled={hasSupported}
                      className={`flex items-center gap-1 border-2 border-electric-navy transition-colors px-3 py-1 ${hasSupported ? 'bg-sky-blue text-white' : 'bg-white text-electric-navy hover:bg-sky-blue hover:text-white'}`}>
                      <span className="material-symbols-outlined text-sm">emoji_people</span>
                      <span className="text-xs">{conf.supports}</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      {/* Spill Modal */}
      {showSpillModal && (
        <div className="fixed inset-0 bg-electric-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-electric-navy p-8 sticky-note sticker-rotate-neg-1 max-w-lg w-full">
            <h2 className="font-handwriting text-headline-md text-electric-navy mb-4">Spill your secret...</h2>
            <form onSubmit={submitConfession}>
              <textarea 
                rows={5}
                value={newConfession}
                onChange={(e) => setNewConfession(e.target.value)}
                placeholder="Nobody will know it's you. Write it down." 
                className="w-full p-4 border-2 border-electric-navy font-handwriting text-lg focus:outline-none focus:ring-2 focus:ring-sunny-yellow mb-4 resize-none"
                required
              />
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowSpillModal(false)} className="px-6 py-2 border-2 border-electric-navy font-label-md text-electric-navy hover:bg-gray-100 sticky-note">CANCEL</button>
                <button type="submit" className="bg-racing-red text-white font-label-md px-6 py-2 border-2 border-electric-navy sticky-note hover:bg-electric-navy transition-colors">POST</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-electric-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-electric-navy p-8 sticky-note sticker-rotate-1 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-handwriting text-headline-md text-electric-navy mb-4">Create Poll</h2>
            <form onSubmit={submitPoll} className="flex flex-col gap-4">
              <div>
                <label className="font-label-bold text-electric-navy text-sm">QUESTION</label>
                <input 
                  type="text"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="e.g. Should we host a 24h Retro Gaming Marathon?" 
                  className="w-full p-3 border-2 border-electric-navy font-handwriting text-lg focus:outline-none focus:ring-2 focus:ring-sunny-yellow"
                  required
                />
              </div>
              
              <div>
                <label className="font-label-bold text-electric-navy text-sm mb-2 block">OPTIONS</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`} 
                      className="w-full p-2 border-2 border-electric-navy font-handwriting focus:outline-none focus:ring-2 focus:ring-sky-blue"
                      required={idx < 2}
                    />
                    {idx >= 2 && (
                      <button 
                        type="button" 
                        onClick={() => setPollOptions(opts => opts.filter((_, i) => i !== idx))}
                        className="bg-racing-red text-white px-3 border-2 border-electric-navy font-bold hover:bg-electric-navy sticky-note"
                      >X</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button 
                    type="button" 
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-sm font-label-bold text-sky-blue hover:text-electric-navy mt-1"
                  >+ ADD OPTION (MAX 4)</button>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setShowPollModal(false)} className="px-6 py-2 border-2 border-electric-navy font-label-md text-electric-navy hover:bg-gray-100 sticky-note">CANCEL</button>
                <button type="submit" className="bg-sunny-yellow text-electric-navy font-label-md px-6 py-2 border-2 border-electric-navy sticky-note hover:bg-electric-navy hover:text-white transition-colors">CREATE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button 
        onClick={() => setShowSpillModal(true)}
        className="fixed bottom-24 right-6 bg-electric-navy text-white p-4 rounded-full border-2 border-electric-navy sticky-note z-40 active:scale-95 transition-transform hover:scale-110">
        <span className="material-symbols-outlined text-3xl font-bold">edit</span>
      </button>

    </main>
  );
}
