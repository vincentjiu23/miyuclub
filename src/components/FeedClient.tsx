"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { likePost } from "@/app/actions/postActions";
import CreatePostModal from "@/components/CreatePostModal";

type Post = {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  createdAt: Date;
  likedBy?: { userId: string }[];
};

export default function FeedClient({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Local state for optimistic likes - store both count and if current user liked it
  const [localLikes, setLocalLikes] = useState<Record<string, { count: number, isLiked: boolean }>>(
    posts.reduce((acc, p) => ({ 
      ...acc, 
      [p.id]: { 
        count: p.likes, 
        isLiked: p.likedBy && p.likedBy.length > 0 
      } 
    }), {})
  );

  useEffect(() => {
    const checkUser = () => {
      const user = localStorage.getItem("miyu_user");
      setIsLoggedIn(!!user);
      // For MVP testing, if user is 'admin', they are moderator
      if (user === "admin") {
        setIsModerator(true);
      } else if (user) {
        setIsModerator(false);
      } else {
        setIsModerator(false);
      }
    };
    
    checkUser();
    
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      alert("Please login to like this post!");
      router.push("/auth/login");
      return;
    }
    
    const currentState = localLikes[postId] || { count: 0, isLiked: false };
    const isCurrentlyLiked = currentState.isLiked;
    
    // Optimistic update
    setLocalLikes(prev => ({ 
      ...prev, 
      [postId]: {
        count: isCurrentlyLiked ? Math.max(0, currentState.count - 1) : currentState.count + 1,
        isLiked: !isCurrentlyLiked
      }
    }));
    
    // Server update
    const result = await likePost(postId);
    
    if (!result.success) {
       // Revert if failed
       setLocalLikes(prev => ({ 
         ...prev, 
         [postId]: {
           count: isCurrentlyLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1),
           isLiked: isCurrentlyLiked
         }
       }));
       alert(result.error || "Failed to toggle like");
    }
  };

  const toggleRole = () => {
    if (!isLoggedIn) {
      localStorage.setItem("miyu_user", "true");
      setIsLoggedIn(true);
      setIsModerator(false);
      alert("Switched to Normal User");
    } else if (isLoggedIn && !isModerator) {
      localStorage.setItem("miyu_user", "admin");
      setIsModerator(true);
      alert("Switched to Moderator");
    } else {
      localStorage.removeItem("miyu_user");
      setIsLoggedIn(false);
      setIsModerator(false);
      alert("Switched to Guest");
    }
    window.dispatchEvent(new Event("storage"));
    router.refresh();
  };

  const [activeTab, setActiveTab] = useState<'feed' | 'vangogh'>('feed');
  const [vanGoghPosts, setVanGoghPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchVanGogh = async () => {
      const { getVanGoghPosts } = await import('@/app/actions/vanGoghActions');
      const result = await getVanGoghPosts();
      if (result.success && result.posts) {
        // Map the likedBy array into a boolean for easier client rendering
        const postsWithLikeStatus = result.posts.map((p: any) => ({
          ...p,
          isLiked: p.likedBy && p.likedBy.length > 0
        }));
        setVanGoghPosts(postsWithLikeStatus);
      }
    };
    if (activeTab === 'vangogh') {
      fetchVanGogh();
    }
  }, [activeTab]);

  const handleVanGoghLike = async (postId: string) => {
    if (!isLoggedIn) {
      alert("Please login to like this post!");
      router.push("/auth/login");
      return;
    }

    const post = vanGoghPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isCurrentlyLiked = post.isLiked;

    // Optimistic UI update
    const updatedPosts = vanGoghPosts.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          likes: isCurrentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
          isLiked: !isCurrentlyLiked
        };
      }
      return p;
    });

    setVanGoghPosts(updatedPosts);

    const { likeVanGoghPost } = await import('@/app/actions/vanGoghActions');
    const result = await likeVanGoghPost(postId);
    
    if (!result.success) {
      alert(result.error || "Failed to like post");
      // Revert if failed
      setVanGoghPosts(vanGoghPosts);
    }
  };

  return (
    <>
      {/* Secret Dev Switch Role Button */}
      <button 
        onClick={toggleRole}
        className="fixed top-4 right-20 z-50 bg-black text-white text-[10px] px-2 py-1 font-mono rounded opacity-50 hover:opacity-100 transition-opacity"
      >
        Dev: Role ({!isLoggedIn ? 'Guest' : isModerator ? 'Mod' : 'User'})
      </button>

      {!isLoggedIn && (
        <div className="bg-sunny-yellow p-4 border-2 border-electric-navy sticky-note sticker-rotate-1 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-handwriting text-electric-navy text-lg text-center md:text-left">
            Welcome to MIYU CLUB! You are viewing as a guest. Create an account to interact with the community.
          </p>
          <div className="flex gap-2">
            <Link href="/auth/login" className="bg-white text-electric-navy border-2 border-electric-navy font-label-md px-4 py-2 sticky-note hover:bg-sky-blue hover:text-white transition-all">LOGIN</Link>
            <Link href="/auth/register" className="bg-electric-navy text-white border-2 border-electric-navy font-label-md px-4 py-2 sticky-note hover:bg-racing-red transition-all">REGISTER</Link>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar p-4 pb-8 -mx-4 md:mx-0">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`shrink-0 whitespace-nowrap px-6 py-2 border-2 border-electric-navy font-label-bold text-lg transform rotate-1 sticky-note hover:translate-y-px hover:shadow-none transition-all ${activeTab === 'feed' ? 'bg-sunny-yellow text-electric-navy' : 'bg-white text-electric-navy'}`}
        >
          FEED
        </button>
        <button 
          onClick={() => setActiveTab('vangogh')}
          className={`shrink-0 whitespace-nowrap px-6 py-2 border-2 border-electric-navy font-label-bold text-lg transform -rotate-2 sticky-note hover:translate-y-px hover:shadow-none transition-all ${activeTab === 'vangogh' ? 'bg-sunny-yellow text-electric-navy' : 'bg-white text-electric-navy'}`}
        >
          OUR VAN GOGH
        </button>
      </section>

      {/* Feed List */}
      <div className="space-y-16 relative">
        
        {activeTab === 'feed' ? (
          <>
            {posts.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-electric-navy">
                <p className="font-handwriting text-xl text-electric-navy opacity-50">No posts yet. The club is quiet.</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <article key={post.id} className={`tape-effect relative max-w-[95%] mx-auto ${index % 2 === 0 ? 'sticker-rotate-neg-2' : 'sticker-rotate-1'}`}>
                  <div className="bg-white p-[12px_12px_48px_12px] shadow-[4px_4px_0px_rgba(34,72,112,0.1)] border-2 border-electric-navy">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 border-2 border-electric-navy overflow-hidden bg-sky-blue">
                      </div>
                      <div>
                        <h3 className="font-handwriting text-lg leading-none text-electric-navy">@moderator_miyu</h3>
                        <p className="text-[10px] text-sky-blue font-bold uppercase tracking-widest font-label-bold">
                          {new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4 relative border-2 border-electric-navy overflow-hidden bg-gray-100 flex items-center justify-center min-h-[300px]">
                      <img className="w-full h-auto max-h-[600px] object-contain" src={post.imageUrl} alt="post" />
                    </div>
                    
                    <p className="font-handwriting text-electric-navy mb-6 leading-relaxed text-lg whitespace-pre-wrap">
                      {post.caption}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 font-body-md transition-all ${localLikes[post.id]?.isLiked ? 'text-racing-red' : 'hover:text-racing-red text-electric-navy'}`}
                      >
                        <span className={`material-symbols-outlined ${localLikes[post.id]?.isLiked ? 'font-bold' : ''}`} style={{ fontVariationSettings: localLikes[post.id]?.isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        <span className="font-handwriting text-sm">{localLikes[post.id]?.count ?? post.likes}</span>
                      </button>
                      <button className="ml-auto material-symbols-outlined text-electric-navy opacity-50 hover:opacity-100">share</button>
                    </div>
                  </div>
                </article>
              ))
            )}

            {posts.length < 2 && (
               <article className="sticker-rotate-1 relative mx-4 mt-16 opacity-70">
               <div className="bg-sunny-yellow p-6 border-2 border-electric-navy sticky-note transform rotate-1">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 border-2 border-electric-navy overflow-hidden bg-electric-navy"></div>
                   <div>
                     <h3 className="font-handwriting text-lg text-electric-navy leading-none">@neo_tokyo_art</h3>
                     <p className="text-[10px] text-electric-navy opacity-60 font-bold uppercase font-label-bold">Sample Post</p>
                   </div>
                 </div>
                 <p className="font-handwriting text-electric-navy mb-6 leading-relaxed">
                   Waiting for moderators to drop the first real post! 🎨⚡️
                 </p>
                 <div className="absolute -top-4 left-1/4 w-12 h-6 bg-sky-blue/40 backdrop-blur-sm -rotate-12 border border-sky-blue/20"></div>
               </div>
             </article>
            )}
          </>
        ) : (
          /* Van Gogh Feed */
          <>
            {vanGoghPosts.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-electric-navy">
                <p className="font-handwriting text-xl text-electric-navy opacity-50">The exhibition is empty. Go draw something!</p>
                <Link href="/draw" className="inline-block mt-4 bg-sky-blue text-white px-6 py-2 font-label-bold sticky-note border-2 border-electric-navy hover:bg-electric-navy transition-colors">START DRAWING</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {vanGoghPosts.map((post) => {
                  return (
                    <article key={post.id} className="bg-white p-4 shadow-[8px_8px_0px_rgba(34,72,112,1)] border-4 border-electric-navy sticky-note transform hover:-translate-y-1 transition-transform flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-electric-navy">brush</span>
                          <h3 className="font-handwriting text-lg leading-none text-electric-navy">
                            {typeof post.author === 'object' && post.author !== null 
                              ? `@${post.author.username}` 
                              : post.author === 'true' || post.author === 'admin' 
                                ? '@creative_member' 
                                : `@${post.author}`}
                          </h3>
                        </div>
                        <p className="text-[10px] text-sky-blue font-bold uppercase tracking-widest font-label-bold shrink-0 text-right">
                          {new Date(post.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="relative border-2 border-dashed border-electric-navy/30 overflow-hidden bg-[url('/images/grid.png')] mb-4 grow flex items-center justify-center">
                        <img className="w-full h-auto max-h-[300px] object-contain" src={post.imageUrl} alt="Artwork" />
                      </div>
                      
                      {post.caption && (
                        <p className="font-handwriting text-electric-navy mb-4 leading-relaxed text-sm whitespace-pre-wrap">
                          {post.caption}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-auto">
                        <button 
                          onClick={() => handleVanGoghLike(post.id)}
                          className={`flex items-center gap-1 transition-transform ${post.isLiked ? 'text-racing-red' : 'text-electric-navy hover:text-racing-red hover:scale-110'}`}
                        >
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: post.isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          <span className="font-handwriting text-sm">{post.likes || 0}</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB (Moderator Only) */}
      {isLoggedIn && isModerator && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-sky-blue text-white border-2 border-electric-navy rounded-full flex items-center justify-center sticky-note active:translate-y-1 active:shadow-none transition-all z-40"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      )}

      {showModal && <CreatePostModal onClose={() => setShowModal(false)} />}
    </>
  );
}
