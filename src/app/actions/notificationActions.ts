"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createNotification(userId: string, actorId: string, type: string, postId?: string) {
  if (userId === actorId) return; // Don't notify yourself

  try {
    await prisma.notification_miyu.create({
      data: {
        userId,
        actorId,
        type,
        postId
      }
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export async function getNotifications() {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const notifications = await prisma.notification_miyu.findMany({
      where: { userId: session },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    // Also fetch the actors' details so we can show their name/username
    const actorIds = [...new Set(notifications.map((n: any) => n.actorId))];
    const actors = await prisma.user_miyu.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, username: true, name: true }
    });
    
    const actorMap = actors.reduce((acc: any, actor: any) => {
      acc[actor.id] = actor;
      return acc;
    }, {});
    
    const enhancedNotifications = notifications.map((n: any) => ({
      ...n,
      actor: actorMap[n.actorId]
    }));

    return { success: true, notifications: enhancedNotifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationsRead() {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    await prisma.notification_miyu.updateMany({
      where: { userId: session, read: false },
      data: { read: true }
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return { success: false, error: "Failed to mark notifications read" };
  }
}
