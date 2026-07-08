"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
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
      return { success: false, error: "User not found" };
    }

    // MVP Note: In a real app, use bcrypt to compare passwords
    if (user.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    // Set HTTP-only cookie
    cookies().set("miyu_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function registerAction(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!username || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user_miyu.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return { success: false, error: "Email or username already exists" };
    }

    // Create user (MVP Note: In a real app, hash the password with bcrypt)
    const user = await prisma.user_miyu.create({
      data: {
        username,
        email,
        password,
      }
    });

    // Auto-login after register
    cookies().set("miyu_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    console.error("Register error:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function logoutAction() {
  cookies().delete("miyu_session");
  return { success: true };
}
