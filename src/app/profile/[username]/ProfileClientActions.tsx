"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/app/actions/followActions";
import { getOrCreateRoom } from "@/app/actions/chatActions";

export default function ProfileClientActions({ targetUserId, initialIsFollowing }: { targetUserId: string, initialIsFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setIsLoading(true);
    const res = await toggleFollow(targetUserId);
    if (res.success && res.isFollowing !== undefined) {
      setIsFollowing(res.isFollowing);
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleMessage = async () => {
    setIsLoading(true);
    const res = await getOrCreateRoom(targetUserId);
    if (res.success && res.roomId) {
      router.push(`/chat/${res.roomId}`);
    } else {
      alert(res.error || "Could not open chat");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 w-full">
      <button 
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex-1 py-3 font-label-bold border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform ${isFollowing ? 'bg-white text-electric-navy' : 'bg-sunny-yellow text-electric-navy'}`}
      >
        {isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
      </button>
      <button 
        onClick={handleMessage}
        disabled={isLoading}
        className="flex-1 bg-electric-navy text-white font-label-bold py-3 border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform"
      >
        MESSAGE
      </button>
    </div>
  );
}
