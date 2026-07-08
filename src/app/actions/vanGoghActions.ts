"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notificationActions";

export async function createVanGoghPost(imageUrl: string, caption: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const post = await prisma.van_gogh_post_miyu.create({
      data: {
        imageUrl,
        caption,
        authorId: session,
      },
    });
    return { success: true, post };
  } catch (error) {
    console.error("Error creating Van Gogh post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

export async function getVanGoghPosts() {
  const session = cookies().get("miyu_session")?.value;
  try {
    const posts = await prisma.van_gogh_post_miyu.findMany({
      where: {
        isArchived: false
      },
      include: {
        author: {
          select: { username: true }
        },
        likedBy: session ? {
          where: { userId: session },
          select: { userId: true }
        } : false
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, posts };
  } catch (error) {
    console.error("Error fetching Van Gogh posts:", error);
    return { success: false, error: "Failed to fetch posts", posts: [] };
  }
}

export async function likeVanGoghPost(postId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const existingLike = await prisma.van_gogh_like_miyu.findUnique({
      where: {
        userId_postId: {
          userId: session,
          postId: postId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.van_gogh_like_miyu.delete({
          where: { id: existingLike.id }
        }),
        prisma.van_gogh_post_miyu.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } }
        })
      ]);
      return { success: true, liked: false };
    } else {
      // Like
      const result = await prisma.$transaction([
        prisma.van_gogh_like_miyu.create({
          data: {
            userId: session,
            postId: postId
          }
        }),
        prisma.van_gogh_post_miyu.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
          select: { authorId: true }
        })
      ]);
      
      if (result[1].authorId) {
        await createNotification(result[1].authorId, session, 'LIKE_VANGOGH', postId);
      }
      
      revalidatePath("/draw");
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}
