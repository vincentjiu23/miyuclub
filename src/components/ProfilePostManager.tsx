"use client";

import { useState, useEffect } from "react";
import { getUserPosts, updatePostCaption, toggleArchivePost, deletePost } from "@/app/actions/profilePostActions";
import Link from "next/link";

export default function ProfilePostManager() {
  const [activeTab, setActiveTab] = useState<'feed' | 'vangogh' | 'confession' | 'poll'>('feed');
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [vanGoghPosts, setVanGoghPosts] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<'feed' | 'vangogh' | 'confession' | 'poll'>('feed');
  const [editCaption, setEditCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const result = await getUserPosts();
    if (result.success) {
      setFeedPosts(result.feedPosts || []);
      setVanGoghPosts(result.vanGoghPosts || []);
      setConfessions(result.confessions || []);
      setPolls(result.polls || []);
    }
    setLoading(false);
  };

  const openModal = (post: any, type: 'feed' | 'vangogh' | 'confession' | 'poll') => {
    setSelectedPost(post);
    setSelectedType(type);
    setEditCaption(post.caption || "");
  };

  const closeModal = () => {
    setSelectedPost(null);
    setEditCaption("");
  };

  const handleSaveCaption = async () => {
    if (!selectedPost || (selectedType !== 'feed' && selectedType !== 'vangogh')) return;
    setIsSaving(true);
    const result = await updatePostCaption(selectedPost.id, selectedType, editCaption);
    if (result.success) {
      await fetchData();
      closeModal();
    } else {
      alert("Failed to save caption");
    }
    setIsSaving(false);
  };

  const handleToggleArchive = async () => {
    if (!selectedPost || (selectedType !== 'feed' && selectedType !== 'vangogh')) return;
    if (confirm(`Are you sure you want to ${selectedPost.isArchived ? 'unarchive' : 'archive'} this post?`)) {
      setIsSaving(true);
      const result = await toggleArchivePost(selectedPost.id, selectedType, selectedPost.isArchived);
      if (result.success) {
        await fetchData();
        closeModal();
      } else {
        alert("Failed to update archive status");
      }
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    if (confirm("Are you SURE you want to delete this post permanently? This cannot be undone.")) {
      setIsSaving(true);
      const result = await deletePost(selectedPost.id, selectedType);
      if (result.success) {
        await fetchData();
        closeModal();
      } else {
        alert("Failed to delete post");
      }
      setIsSaving(false);
    }
  };

  const activePosts = activeTab === 'feed' ? feedPosts : activeTab === 'vangogh' ? vanGoghPosts : activeTab === 'confession' ? confessions : polls;

  return (
    <div className="w-full mt-12 max-w-4xl mx-auto">
      <div className="flex border-b-2 border-electric-navy mb-6 flex-wrap md:flex-nowrap">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 font-handwriting text-xl text-center border-b-2 md:border-b-0 md:border-r-2 border-electric-navy transition-colors ${activeTab === 'feed' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          POSTS
        </button>
        <button 
          onClick={() => setActiveTab('vangogh')}
          className={`flex-1 py-3 font-handwriting text-xl text-center border-b-2 md:border-b-0 md:border-r-2 border-electric-navy transition-colors ${activeTab === 'vangogh' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          VAN GOGH
        </button>
        <button 
          onClick={() => setActiveTab('confession')}
          className={`flex-1 py-3 font-handwriting text-xl text-center border-r-2 border-electric-navy transition-colors ${activeTab === 'confession' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          CONFESSIONS
        </button>
        <button 
          onClick={() => setActiveTab('poll')}
          className={`flex-1 py-3 font-handwriting text-xl text-center transition-colors ${activeTab === 'poll' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          POLLS
        </button>
      </div>

      {loading ? (
        <div className="text-center p-8 font-handwriting text-electric-navy animate-pulse">Loading gallery...</div>
      ) : activePosts.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-electric-navy sticky-note sticker-rotate-1 bg-white">
          <p className="font-handwriting text-xl text-electric-navy opacity-50 mb-4">You have no posts here yet.</p>
          <Link href={activeTab === 'feed' ? "/" : "/draw"} className="bg-racing-red text-white font-label-bold px-6 py-2 sticky-note hover:-translate-y-1 inline-block transition-transform">
            CREATE ONE
          </Link>
        </div>
      ) : (
        <div className={activeTab === 'feed' || activeTab === 'vangogh' ? "grid grid-cols-3 gap-1 md:gap-4" : "flex flex-col gap-4"}>
          {activePosts.map(post => (
            activeTab === 'feed' || activeTab === 'vangogh' ? (
              <div 
                key={post.id} 
                onClick={() => openModal(post, activeTab)}
                className="aspect-square relative cursor-pointer group bg-gray-100 border-2 border-transparent hover:border-electric-navy overflow-hidden"
              >
                <img src={post.imageUrl} alt="Post thumbnail" className="w-full h-full object-cover" />
                
                {post.isArchived && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full backdrop-blur-sm">
                    <span className="material-symbols-outlined text-sm">archive</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-electric-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                  <div className="flex items-center gap-1 font-label-bold">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={post.id} 
                onClick={() => openModal(post, activeTab)}
                className="p-4 border-2 border-electric-navy bg-white hover:-translate-y-1 transition-transform cursor-pointer sticky-note"
              >
                {activeTab === 'confession' ? (
                  <>
                    <p className="font-handwriting text-lg text-electric-navy mb-2 line-clamp-3">{post.text}</p>
                    <div className="flex gap-4 text-sky-blue text-sm">
                      <span>{post.likes} Likes</span>
                      <span>{post.supports} Supports</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-handwriting text-xl text-electric-navy mb-2">{post.title}</h3>
                    <div className="flex gap-4 text-sky-blue text-sm">
                      <span className={post.isClosed ? "text-racing-red" : "text-sunny-yellow"}>{post.isClosed ? 'CLOSED' : 'LIVE'}</span>
                      <span>{post.options?.length || 0} Options</span>
                    </div>
                  </>
                )}
              </div>
            )
          ))}
        </div>
      )}

      {/* Post Edit Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-electric-navy/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border-4 border-electric-navy p-4 md:p-6 max-w-lg w-full sticky-note sticker-rotate-1 relative max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-2 right-2 md:top-4 md:right-4 text-electric-navy hover:text-racing-red z-10 bg-white rounded-full">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <h2 className="font-handwriting text-2xl md:text-3xl text-electric-navy mb-4 border-b-2 border-electric-navy pb-2 shrink-0">Manage Post</h2>
            
            <div className="flex flex-col gap-4 overflow-y-auto">
              {(selectedType === 'feed' || selectedType === 'vangogh') ? (
                <>
                  <div className="h-40 sm:h-48 md:h-56 bg-gray-100 border-2 border-electric-navy relative overflow-hidden flex items-center justify-center shrink-0">
                    <img src={selectedPost.imageUrl} alt="Selected Post" className="max-w-full max-h-full object-contain" />
                    {selectedPost.isArchived && (
                      <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-sunny-yellow border-2 border-electric-navy px-2 py-1 md:px-3 md:py-1 font-label-bold text-sm text-electric-navy transform -rotate-2">
                        ARCHIVED
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="font-label-bold text-electric-navy text-xs md:text-sm">CAPTION</label>
                    <textarea 
                      value={editCaption}
                      onChange={e => setEditCaption(e.target.value)}
                      className="w-full border-2 border-electric-navy p-2 font-handwriting text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-sky-blue resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-4 shrink-0 mt-2">
                    <button 
                      onClick={handleSaveCaption}
                      disabled={isSaving}
                      className="bg-sky-blue text-white font-label-bold py-2 md:py-3 border-2 border-electric-navy hover:bg-electric-navy transition-colors col-span-2 disabled:opacity-50 text-sm md:text-base"
                    >
                      SAVE CAPTION
                    </button>
                    
                    <button 
                      onClick={handleToggleArchive}
                      disabled={isSaving}
                      className="bg-sunny-yellow text-electric-navy font-label-bold py-2 md:py-3 border-2 border-electric-navy hover:bg-electric-navy hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">{selectedPost.isArchived ? 'unarchive' : 'archive'}</span>
                      {selectedPost.isArchived ? 'UNARCHIVE' : 'ARCHIVE'}
                    </button>
                    
                    <button 
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="bg-white text-racing-red font-label-bold py-2 md:py-3 border-2 border-racing-red hover:bg-racing-red hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-base"
                    >
                      <span className="material-symbols-outlined text-sm md:text-base">delete</span>
                      DELETE
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 border-2 border-electric-navy">
                    {selectedType === 'confession' ? (
                       <p className="font-handwriting text-lg text-electric-navy">{selectedPost.text}</p>
                    ) : (
                       <div>
                         <h3 className="font-handwriting text-xl text-electric-navy mb-2">{selectedPost.title}</h3>
                         <ul className="list-disc pl-5 font-body-md">
                           {selectedPost.options?.map((o: any) => (
                             <li key={o.id}>{o.text} ({o.votes} votes)</li>
                           ))}
                         </ul>
                       </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="w-full bg-white text-racing-red font-label-bold py-3 border-2 border-racing-red hover:bg-racing-red hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">delete</span>
                      DELETE {selectedType.toUpperCase()}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
