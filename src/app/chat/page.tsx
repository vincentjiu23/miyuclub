import { getUserChats } from "@/app/actions/chatActions";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatInboxPage() {
  const res = await getUserChats();
  
  if (!res.success) {
    redirect("/auth/login");
  }

  const chats = res.chats || [];

  return (
    <main className="min-h-screen bg-white md:bg-[url('/images/grid.png')] p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white border-2 border-electric-navy p-6 sticky-note">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-electric-navy/20">
          <h1 className="font-handwriting text-headline-md text-electric-navy">Messages</h1>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-electric-navy/20 mb-4">forum</span>
            <p className="font-handwriting text-xl text-electric-navy/50">No messages yet.</p>
            <p className="font-label-bold text-sky-blue text-sm mt-2">Visit someone's profile to start a chat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map(chat => (
              <Link href={`/chat/${chat.roomId}`} key={chat.roomId} className="block group">
                <div className={`p-4 border-2 transition-colors flex items-center gap-4 sticky-note ${chat.unreadCount > 0 ? 'border-sky-blue bg-sky-blue/5' : 'border-electric-navy bg-white group-hover:bg-sunny-yellow/10'}`}>
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 border-2 border-electric-navy bg-sunny-yellow shrink-0 flex items-center justify-center">
                    <span className="font-handwriting text-xl text-electric-navy uppercase">
                      {chat.otherUser.username.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-handwriting text-lg text-electric-navy truncate">@{chat.otherUser.username}</h3>
                      <span className="text-[10px] font-label-bold text-sky-blue shrink-0">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-bold text-electric-navy' : 'text-electric-navy/60'}`}>
                      {chat.lastMessage ? chat.lastMessage.content : "Start chatting!"}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {chat.unreadCount > 0 && (
                    <div className="shrink-0 bg-racing-red text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-label-bold border-2 border-electric-navy">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
