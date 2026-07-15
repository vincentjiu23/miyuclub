"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notificationActions";

export async function toggleFollow(targetUserId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  if (session === targetUserId) {
    return { success: false, error: "You cannot follow yourself" };
  }

  try {
    const existingFollow = await prisma.follow_miyu.findUnique({
      where: {
        followerId_followingId: {
          followerId: session,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow_miyu.delete({
        where: { id: existingFollow.id }
      });
      revalidatePath(`/profile/[username]`, 'page');
      return { success: true, isFollowing: false };
    } else {
      // Follow
      await prisma.follow_miyu.create({
        data: {
          followerId: session,
          followingId: targetUserId
        }
      });
      
      // Create notification
      await createNotification(targetUserId, session, 'FOLLOW');
      
      revalidatePath(`/profile/[username]`, 'page');
      return { success: true, isFollowing: true };
    }
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    return { success: false, error: "Failed to toggle follow" };
  }
}

export async function getFollowStats(userId: string) {
  try {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow_miyu.count({ where: { followingId: userId } }),
      prisma.follow_miyu.count({ where: { followerId: userId } })
    ]);
    return { success: true, followers: followersCount, following: followingCount };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch follow stats", followers: 0, following: 0 };
  }
}

export async function checkIsFollowing(targetUserId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return false;

  try {
    const follow = await prisma.follow_miyu.findUnique({
      where: {
        followerId_followingId: {
          followerId: session,
          followingId: targetUserId
        }
      }
    });
    return !!follow;
  } catch (error) {
    return false;
  }
}
