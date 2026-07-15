"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function cmsLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const user = await prisma.user_miyu.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: "Account not found" };
    }

    if (user.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    if (user.role !== "admin") {
      return { success: false, error: "You do not have admin privileges" };
    }

    if (user.suspended) {
      return { success: false, error: "Your account has been suspended" };
    }

    // Set admin session cookie
    cookies().set("miyu_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookies().set("miyu_admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true, username: user.username };
  } catch (error: any) {
    console.error("CMS login error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function cmsLogoutAction() {
  cookies().delete("miyu_session");
  cookies().delete("miyu_admin");
  return { success: true };
}

export async function isAdminSession() {
  const adminCookie = cookies().get("miyu_admin");
  const sessionCookie = cookies().get("miyu_session");
  return !!(adminCookie?.value === "true" && sessionCookie?.value);
}

export async function getCmsStats() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    const [userCount, postCount, vanGoghCount, confessionCount, pollCount] = await Promise.all([
      prisma.user_miyu.count(),
      prisma.post_miyu.count(),
      prisma.van_gogh_post_miyu.count(),
      prisma.confession_miyu.count(),
      prisma.poll_miyu.count(),
    ]);

    return {
      success: true,
      stats: { userCount, postCount, vanGoghCount, confessionCount, pollCount }
    };
  } catch (error: any) {
    console.error("CMS stats error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

export async function getCmsPosts() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    const posts = await prisma.post_miyu.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch posts" };
  }
}

export async function getCmsUsers() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    const users = await prisma.user_miyu.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            vanGoghPosts: true,
            confessions: true,
          }
        }
      }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function cmsDeletePost(postId: string) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.post_miyu.delete({ where: { id: postId } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete post" };
  }
}

export async function cmsToggleUserSuspend(userId: string, suspend: boolean) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.user_miyu.update({
      where: { id: userId },
      data: { suspended: suspend }
    });
    return { success: true };
  } catch (error: any) {
    console.error("cmsToggleUserSuspend error:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function cmsChangeUserRole(userId: string, role: string) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.user_miyu.update({
      where: { id: userId },
      data: { role }
    });
    return { success: true };
  } catch (error: any) {
    console.error("cmsChangeUserRole error:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function getCmsVanGoghPosts() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    const posts = await prisma.van_gogh_post_miyu.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch Van Gogh posts" };
  }
}

export async function cmsDeleteVanGoghPost(postId: string) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.van_gogh_post_miyu.delete({ where: { id: postId } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete Van Gogh post" };
  }
}

export async function getCmsConfessions() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    const confessions = await prisma.confession_miyu.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true } } }
    });
    return { success: true, confessions };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch confessions" };
  }
}

export async function cmsDeleteConfession(confessionId: string) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) return { success: false, error: "Unauthorized" };

  try {
    await prisma.confession_miyu.delete({ where: { id: confessionId } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to delete confession" };
  }
}
