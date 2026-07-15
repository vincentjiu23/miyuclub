"use client";

import { useState } from "react";
import Link from "next/link";

export default function PublicPostGrid({ feedPosts, vanGoghPosts, confessions }: { feedPosts: any[], vanGoghPosts: any[], confessions: any[] }) {
  const [activeTab, setActiveTab] = useState<'feed' | 'vangogh' | 'confession'>('feed');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const activePosts = activeTab === 'feed' ? feedPosts : activeTab === 'vangogh' ? vanGoghPosts : confessions;

  const openModal = (post: any) => setSelectedPost(post);
  const closeModal = () => setSelectedPost(null);

  return (
    <div className="w-full mt-12 max-w-4xl mx-auto">
      <div className="flex border-b-2 border-electric-navy mb-6">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 font-handwriting text-xl text-center border-r-2 border-electric-navy transition-colors ${activeTab === 'feed' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          POSTS
        </button>
        <button 
          onClick={() => setActiveTab('vangogh')}
          className={`flex-1 py-3 font-handwriting text-xl text-center border-r-2 border-electric-navy transition-colors ${activeTab === 'vangogh' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          VAN GOGH
        </button>
        <button 
          onClick={() => setActiveTab('confession')}
          className={`flex-1 py-3 font-handwriting text-xl text-center transition-colors ${activeTab === 'confession' ? 'bg-electric-navy text-white' : 'bg-white text-electric-navy hover:bg-sky-blue/10'}`}
        >
          CONFESSIONS
        </button>
      </div>

      {activePosts.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-electric-navy sticky-note sticker-rotate-1 bg-white">
          <p className="font-handwriting text-xl text-electric-navy opacity-50">No posts here yet.</p>
        </div>
      ) : (
        <div className={activeTab === 'feed' || activeTab === 'vangogh' ? "grid grid-cols-3 gap-1 md:gap-4" : "flex flex-col gap-4"}>
          {activePosts.map(post => (
            activeTab === 'feed' || activeTab === 'vangogh' ? (
              <div 
                key={post.id} 
                onClick={() => openModal(post)}
                className="aspect-square relative cursor-pointer group bg-gray-100 border-2 border-transparent hover:border-electric-navy overflow-hidden"
              >
                <img src={post.imageUrl} alt="Post thumbnail" className="w-full h-full object-cover" />
                
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
                className="p-4 border-2 border-electric-navy bg-white sticky-note"
              >
                <p className="font-handwriting text-lg text-electric-navy mb-2">{post.text}</p>
                <div className="flex gap-4 text-sky-blue text-sm font-label-bold">
                  <span>{post.likes} Likes</span>
                  <span>{post.supports} Supports</span>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Post View Modal */}
      {selectedPost && (activeTab === 'feed' || activeTab === 'vangogh') && (
        <div className="fixed inset-0 bg-electric-navy/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white border-4 border-electric-navy p-4 md:p-6 max-w-lg w-full sticky-note sticker-rotate-1 relative flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-2 right-2 md:top-4 md:right-4 text-electric-navy hover:text-racing-red z-10 bg-white rounded-full">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <div className="h-64 sm:h-80 md:h-96 bg-gray-100 border-2 border-electric-navy relative overflow-hidden flex items-center justify-center shrink-0 mb-4">
              <img src={selectedPost.imageUrl} alt="Selected Post" className="max-w-full max-h-full object-contain" />
            </div>
            
            {selectedPost.caption && (
              <div className="bg-sunny-yellow/30 border-2 border-electric-navy p-3 font-handwriting text-lg text-electric-navy mb-4">
                {selectedPost.caption}
              </div>
            )}
            
            <div className="flex items-center gap-2 font-label-bold text-sky-blue uppercase">
              <span className="material-symbols-outlined text-racing-red" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span>{selectedPost.likes} likes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
