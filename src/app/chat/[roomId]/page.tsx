import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChatRoomClient from "./ChatRoomClient";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const session = cookies().get("miyu_session")?.value;
  if (!session) redirect("/auth/login");

  const room = await prisma.chat_room_miyu.findUnique({
    where: { id: params.roomId },
    include: {
      participant1: { select: { id: true, username: true } },
      participant2: { select: { id: true, username: true } }
    }
  });

  if (!room) {
    redirect("/chat");
  }

  // Ensure current user is part of the room
  if (room.participant1Id !== session && room.participant2Id !== session) {
    redirect("/chat");
  }

  const otherUser = room.participant1Id === session ? room.participant2 : room.participant1;

  return (
    <main className="min-h-screen bg-white md:bg-[url('/images/grid.png')] flex flex-col pt-0 md:pt-4">
      <ChatRoomClient roomId={params.roomId} currentUserId={session} otherUsername={otherUser.username} />
    </main>
  );
}
