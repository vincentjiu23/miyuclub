"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getProfile() {
  const sessionId = cookies().get("miyu_session")?.value;
  
  if (!sessionId) {
    return null;
  }

  const user = await prisma.user_miyu.findUnique({
    where: { id: sessionId }
  });

  return user;
}

export async function updateProfile(formData: FormData) {
  const sessionId = cookies().get("miyu_session")?.value;
  if (!sessionId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const pronouns = formData.get("pronouns") as string;
    const bio = formData.get("bio") as string;
    const igLink = formData.get("igLink") as string;
    const xLink = formData.get("xLink") as string;
    const gender = formData.get("gender") as string;
    const file = formData.get("avatar") as File | null;

    let avatarUrl = undefined;

    // Handle avatar upload if provided
    if (file && file.size > 0 && file.name !== 'undefined') {
      const uploadsDir = join(process.cwd(), "public", "uploads");
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (e) {
        // Ignore if exists
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-avatar-${file.name.replace(/\s+/g, '_')}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      avatarUrl = `/uploads/${filename}`;
    }

    await prisma.user_miyu.update({
      where: { id: sessionId },
      data: {
        ...(name && { name }),
        ...(username && { username }),
        ...(pronouns !== null && { pronouns }),
        ...(bio !== null && { bio }),
        ...(igLink !== null && { igLink }),
        ...(xLink !== null && { xLink }),
        ...(gender !== null && { gender }),
        ...(avatarUrl && { avatar: avatarUrl })
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { success: false, error: error.message };
  }
}
