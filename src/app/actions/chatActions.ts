"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { createNotification } from "./notificationActions";

export async function getOrCreateRoom(targetUserId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };
  if (session === targetUserId) return { success: false, error: "Cannot chat with yourself" };

  try {
    // Sort IDs to ensure consistent participant order in DB query
    const [p1, p2] = [session, targetUserId].sort();

    let room = await prisma.chat_room_miyu.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id: p1,
          participant2Id: p2
        }
      }
    });

    if (!room) {
      room = await prisma.chat_room_miyu.create({
        data: {
          participant1Id: p1,
          participant2Id: p2
        }
      });
    }

    return { success: true, roomId: room.id };
  } catch (error: any) {
    console.error("Error creating/getting room:", error);
    return { success: false, error: "Failed to initialize chat" };
  }
}

export async function getMessages(roomId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const messages = await prisma.chat_message_miyu.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, username: true }
        }
      }
    });
    
    // Mark messages as read
    await prisma.chat_message_miyu.updateMany({
      where: {
        roomId,
        senderId: { not: session },
        isRead: false
      },
      data: { isRead: true }
    });

    return { success: true, messages };
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function sendMessage(roomId: string, content: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  if (!content.trim()) return { success: false, error: "Empty message" };

  try {
    const message = await prisma.chat_message_miyu.create({
      data: {
        roomId,
        senderId: session,
        content
      },
      include: {
        sender: { select: { id: true, username: true } }
      }
    });

    // Update room's updatedAt
    const updatedRoom = await prisma.chat_room_miyu.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    const recipientId = updatedRoom.participant1Id === session ? updatedRoom.participant2Id : updatedRoom.participant1Id;
    await createNotification(recipientId, session, 'CHAT', roomId);

    return { success: true, message };
  } catch (error: any) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function getUserChats() {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const rooms = await prisma.chat_room_miyu.findMany({
      where: {
        OR: [
          { participant1Id: session },
          { participant2Id: session }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participant1: { select: { id: true, username: true } },
        participant2: { select: { id: true, username: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session },
                isRead: false
              }
            }
          }
        }
      }
    });

    const formattedChats = rooms.map(room => {
      const otherUser = room.participant1Id === session ? room.participant2 : room.participant1;
      return {
        roomId: room.id,
        otherUser,
        lastMessage: room.messages[0] || null,
        unreadCount: room._count.messages,
        updatedAt: room.updatedAt
      };
    });

    return { success: true, chats: formattedChats };
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}
