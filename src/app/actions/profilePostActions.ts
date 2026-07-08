"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getUserPosts() {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const feedPosts = await prisma.post_miyu.findMany({
      where: { authorId: session },
      orderBy: { createdAt: 'desc' }
    });

    const vanGoghPosts = await prisma.van_gogh_post_miyu.findMany({
      where: { authorId: session },
      orderBy: { createdAt: 'desc' }
    });

    const confessions = await prisma.confession_miyu.findMany({
      where: { authorId: session },
      orderBy: { createdAt: 'desc' }
    });

    const polls = await prisma.poll_miyu.findMany({
      where: { authorId: session },
      include: {
        options: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return { 
      success: true, 
      feedPosts,
      vanGoghPosts,
      confessions,
      polls
    };
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return { success: false, error: "Failed to fetch posts" };
  }
}

export async function updatePostCaption(postId: string, type: 'feed' | 'vangogh', newCaption: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    if (type === 'feed') {
      await prisma.post_miyu.update({
        where: { id: postId, authorId: session },
        data: { caption: newCaption }
      });
    } else {
      await prisma.van_gogh_post_miyu.update({
        where: { id: postId, authorId: session },
        data: { caption: newCaption }
      });
    }
    
    revalidatePath("/profile");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating caption:", error);
    return { success: false, error: "Failed to update caption" };
  }
}

export async function toggleArchivePost(postId: string, type: 'feed' | 'vangogh', currentStatus: boolean) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    if (type === 'feed') {
      await prisma.post_miyu.update({
        where: { id: postId, authorId: session },
        data: { isArchived: !currentStatus }
      });
    } else {
      await prisma.van_gogh_post_miyu.update({
        where: { id: postId, authorId: session },
        data: { isArchived: !currentStatus }
      });
    }
    
    revalidatePath("/profile");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error archiving post:", error);
    return { success: false, error: "Failed to archive post" };
  }
}

export async function deletePost(postId: string, type: 'feed' | 'vangogh' | 'confession' | 'poll') {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    if (type === 'feed') {
      await prisma.post_miyu.delete({
        where: { id: postId, authorId: session }
      });
    } else if (type === 'vangogh') {
      await prisma.van_gogh_post_miyu.delete({
        where: { id: postId, authorId: session }
      });
    } else if (type === 'confession') {
      await prisma.confession_miyu.delete({
        where: { id: postId, authorId: session }
      });
    } else if (type === 'poll') {
      await prisma.poll_miyu.delete({
        where: { id: postId, authorId: session }
      });
    }
    
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
