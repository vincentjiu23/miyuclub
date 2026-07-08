"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createNotification } from "./notificationActions";

export async function createPost(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    const caption = formData.get("caption") as string;

    if (!file || !caption) {
      throw new Error("Missing file or caption");
    }

    // Ensure the uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    // Save to database
    await prisma.post_miyu.create({
      data: {
        imageUrl: `/uploads/${filename}`,
        caption: caption,
        likes: 0
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create post:", error);
    return { success: false, error: error.message };
  }
}

export async function likePost(postId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const existingLike = await prisma.post_like_miyu.findUnique({
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
        prisma.post_like_miyu.delete({
          where: { id: existingLike.id }
        }),
        prisma.post_miyu.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } }
        })
      ]);
      revalidatePath("/");
      return { success: true, liked: false };
    } else {
      // Like
      const result = await prisma.$transaction([
        prisma.post_like_miyu.create({
          data: {
            userId: session,
            postId: postId
          }
        }),
        prisma.post_miyu.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
          select: { authorId: true }
        })
      ]);
      
      if (result[1].authorId) {
        await createNotification(result[1].authorId, session, 'LIKE_POST', postId);
      }
      
      revalidatePath("/");
      return { success: true, liked: true };
    }
  } catch (error: any) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}
