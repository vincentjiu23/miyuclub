"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification, broadcastNotificationToFollowers } from "./notificationActions";

// --- CONFESSIONS ---

export async function getConfessions() {
  try {
    const confessions = await prisma.confession_miyu.findMany({
      include: {
        author: { select: { username: true } },
        likedBy: { select: { userId: true } },
        supportedBy: { select: { userId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, confessions };
  } catch (error) {
    console.error("Error fetching confessions:", error);
    return { success: false, error: "Failed to fetch confessions", confessions: [] };
  }
}

export async function createConfession(text: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const confession = await prisma.confession_miyu.create({
      data: {
        text,
        authorId: session
      }
    });

    await broadcastNotificationToFollowers(session, 'NEW_CONFESSION', confession.id);

    return { success: true, confession };
  } catch (error) {
    console.error("Error creating confession:", error);
    return { success: false, error: "Failed to create confession" };
  }
}

export async function toggleConfessionLike(confessionId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const existing = await prisma.confession_like_miyu.findUnique({
      where: { userId_confessionId: { userId: session, confessionId } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.confession_like_miyu.delete({ where: { id: existing.id } }),
        prisma.confession_miyu.update({ where: { id: confessionId }, data: { likes: { decrement: 1 } } })
      ]);
      return { success: true, liked: false };
    } else {
      const result = await prisma.$transaction([
        prisma.confession_like_miyu.create({ data: { userId: session, confessionId } }),
        prisma.confession_miyu.update({ 
          where: { id: confessionId }, 
          data: { likes: { increment: 1 } },
          select: { authorId: true }
        })
      ]);
      
      if (result[1].authorId) {
        await createNotification(result[1].authorId, session, 'LIKE_CONFESSION', confessionId);
      }
      
      revalidatePath("/confessions");
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Error toggling confession like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function toggleConfessionSupport(confessionId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const existing = await prisma.confession_support_miyu.findUnique({
      where: { userId_confessionId: { userId: session, confessionId } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.confession_support_miyu.delete({ where: { id: existing.id } }),
        prisma.confession_miyu.update({ where: { id: confessionId }, data: { supports: { decrement: 1 } } })
      ]);
      return { success: true, supported: false };
    } else {
      await prisma.$transaction([
        prisma.confession_support_miyu.create({ data: { userId: session, confessionId } }),
        prisma.confession_miyu.update({ where: { id: confessionId }, data: { supports: { increment: 1 } } })
      ]);
      return { success: true, supported: true };
    }
  } catch (error) {
    console.error("Error toggling confession support:", error);
    return { success: false, error: "Failed to toggle support" };
  }
}

// --- POLLS ---

export async function getPolls() {
  try {
    const polls = await prisma.poll_miyu.findMany({
      include: {
        author: { select: { username: true } },
        options: {
          include: {
            voters: { select: { userId: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, polls };
  } catch (error) {
    console.error("Error fetching polls:", error);
    return { success: false, error: "Failed to fetch polls", polls: [] };
  }
}

export async function createPoll(title: string, options: string[]) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const poll = await prisma.poll_miyu.create({
      data: {
        title,
        authorId: session,
        options: {
          create: options.map(opt => ({ text: opt }))
        }
      },
      include: {
        options: true,
        author: { select: { username: true } }
      }
    });

    await broadcastNotificationToFollowers(session, 'NEW_POLL', poll.id);

    return { success: true, poll };
  } catch (error) {
    console.error("Error creating poll:", error);
    return { success: false, error: "Failed to create poll" };
  }
}

export async function votePoll(optionId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    const option = await prisma.poll_option_miyu.findUnique({
      where: { id: optionId },
      include: { poll: { include: { options: true } } }
    });

    if (!option) return { success: false, error: "Option not found" };

    // Check if user already voted in this poll
    const pollOptions = option.poll.options.map(o => o.id);
    const existingVote = await prisma.vote_miyu.findFirst({
      where: {
        userId: session,
        optionId: { in: pollOptions }
      }
    });

    if (existingVote) {
      if (existingVote.optionId === optionId) {
        // Toggle off vote (remove vote)
        await prisma.$transaction([
          prisma.vote_miyu.delete({ where: { id: existingVote.id } }),
          prisma.poll_option_miyu.update({ where: { id: optionId }, data: { votes: { decrement: 1 } } })
        ]);
        return { success: true, voted: false };
      } else {
        // Change vote
        await prisma.$transaction([
          prisma.vote_miyu.delete({ where: { id: existingVote.id } }),
          prisma.poll_option_miyu.update({ where: { id: existingVote.optionId }, data: { votes: { decrement: 1 } } }),
          prisma.vote_miyu.create({ data: { userId: session, optionId } }),
          prisma.poll_option_miyu.update({ where: { id: optionId }, data: { votes: { increment: 1 } } })
        ]);
        return { success: true, voted: true };
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.vote_miyu.create({ data: { userId: session, optionId } }),
        prisma.poll_option_miyu.update({ where: { id: optionId }, data: { votes: { increment: 1 } } })
      ]);
      return { success: true, voted: true };
    }
  } catch (error) {
    console.error("Error voting:", error);
    return { success: false, error: "Failed to vote" };
  }
}

export async function closePoll(pollId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    await prisma.poll_miyu.update({
      where: { id: pollId, authorId: session }, // ensures only author can close
      data: { isClosed: true }
    });
    return { success: true };
  } catch (error) {
    console.error("Error closing poll:", error);
    return { success: false, error: "Failed to close poll" };
  }
}

export async function deletePoll(pollId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    await prisma.poll_miyu.delete({
      where: { id: pollId, authorId: session }
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting poll:", error);
    return { success: false, error: "Failed to delete poll" };
  }
}

export async function deleteConfession(confessionId: string) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) return { success: false, error: "Not authenticated" };

  try {
    await prisma.confession_miyu.delete({
      where: { id: confessionId, authorId: session }
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting confession:", error);
    return { success: false, error: "Failed to delete confession" };
  }
}
