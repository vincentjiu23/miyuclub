"use server";

import prisma from "@/lib/prisma";

export async function searchUsers(query: string) {
  if (!query || query.trim() === "") {
    return { success: true, users: [] };
  }

  try {
    const users = await prisma.user_miyu.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true
      },
      take: 20
    });

    return { success: true, users };
  } catch (error: any) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
  }
}
