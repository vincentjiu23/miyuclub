import prisma from "@/lib/prisma";
import FeedClient from "@/components/FeedClient";
import { cookies } from "next/headers";

// Opt out of caching for testing
export const dynamic = "force-dynamic";

export default async function FeedLandingPage() {
  const session = cookies().get("miyu_session")?.value;
  
  let posts: any[] = [];
  try {
    posts = await prisma.post_miyu.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        likedBy: session ? {
          where: { userId: session },
          select: { userId: true }
        } : false
      }
    });
  } catch (e) {
    // Database not available during build
  }

  return (
    <main className="pb-32 max-w-screen-md mx-auto px-margin-mobile pt-6 relative">
      <FeedClient posts={posts} />
      
      {/* Visual Polish Elements */}
      <div className="fixed top-32 left-8 pointer-events-none opacity-[0.05] transform -rotate-12 select-none z-[-1]">
        <span className="text-electric-navy font-handwriting text-7xl">NOTEBOOK</span>
      </div>
      <div className="fixed bottom-40 left-10 pointer-events-none opacity-[0.05] transform rotate-45 select-none z-[-1]">
        <span className="text-sky-blue font-handwriting text-6xl">GRID</span>
      </div>
    </main>
  );
}
