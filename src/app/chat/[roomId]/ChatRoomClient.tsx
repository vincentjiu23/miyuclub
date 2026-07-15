"use client";

import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage } from "@/app/actions/chatActions";
import Link from "next/link";
import { useRouter } from "next/navigation";

const POPULAR_EMOJIS = ["😀","😂","🤣","😊","🥰","😍","😘","😭","😅","🥺","😎","🤩","😏","😬","😔","😡","🤯","🥳","❤️","🔥","✨","👍","👎","👏","🙏","💀","👽","👻","💯"];
const STICKERS = ["sticker-1.png", "sticker-2.png", "sticker-3.png", "sticker-4.png", "sticker-5.png"];
const GIFS = [
  "https://media.tenor.com/71jC94X9PZcAAAAi/milk-and-mocha-bear.gif",
  "https://media.tenor.com/YwN9-w6y8oUAAAAi/milk-and-mocha-bear.gif",
  "https://media.tenor.com/L-R-B9aC1-UAAAAi/milk-and-mocha.gif",
  "https://media.tenor.com/Z4cO3X7H90QAAAAi/mocha-bear.gif",
  "https://media.tenor.com/V7RSTV-8NfQAAAAi/mocha-milk-and-mocha.gif",
  "https://media.tenor.com/M6LgO-F_WtkAAAAi/cute.gif",
  "https://media.tenor.com/V66D9P6264MAAAAi/dance-milk-and-mocha.gif",
  "https://media.tenor.com/yv-65d8vE-QAAAAi/milk-and-mocha.gif",
];

const isOnlyEmojis = (str: string) => {
  if (!str.trim()) return false;
  return /^[\p{Extended_Pictographic}\s]+$/u.test(str);
};

export default function ChatRoomClient({ roomId, currentUserId, otherUsername }: { roomId: string, currentUserId: string, otherUsername: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activePicker, setActivePicker] = useState<'none'|'emoji'|'sticker'|'gif'>('none');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await getMessages(roomId);
    if (res.success && res.messages) {
      setMessages(res.messages);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMedia = async (type: 'sticker'|'gif', val: string) => {
    if (isSending) return;
    setActivePicker('none');
    
    const content = type === 'sticker' ? `[STICKER]${val}` : `[GIF]${val}`;
    await sendContent(content);
  };

  const sendContent = async (content: string) => {
    setIsSending(true);
    setInput("");
    
    const tempMsg = {
      id: 'temp-' + Date.now(),
      roomId,
      senderId: currentUserId,
      content,
      createdAt: new Date(),
      isRead: false,
      sender: { id: currentUserId, username: "You" }
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await sendMessage(roomId, content);
    if (!res.success) alert("Failed to send message");
    
    await fetchMessages();
    setIsSending(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    sendContent(input.trim());
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith("[STICKER]")) {
      const filename = content.replace("[STICKER]", "");
      return <img src={`/images/sticker/${filename}`} alt="sticker" className="w-48 h-48 object-contain filter drop-shadow-xl animate-[bounce_3s_ease-in-out_infinite]" style={{animation: 'bounce 3s infinite'}} />;
    }
    if (content.startsWith("[GIF]")) {
      const url = content.replace("[GIF]", "");
      return <img src={url} alt="gif" className="w-48 h-auto object-contain border-2 border-electric-navy" />;
    }
    if (isOnlyEmojis(content)) {
      return <p className="text-5xl py-2">{content}</p>;
    }
    return <p className="font-sans text-sm">{content}</p>;
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col bg-white border-x-2 border-electric-navy md:border-y-2 md:sticky-note md:h-[calc(100vh-8rem)] h-[calc(100vh-4rem)] relative">
      
      {/* Chat Header */}
      <div className="border-b-2 border-electric-navy p-4 flex items-center gap-4 bg-sunny-yellow sticky top-0 z-10">
        <Link href="/chat" className="material-symbols-outlined text-electric-navy hover:text-white transition-colors">
          arrow_back
        </Link>
        <Link href={`/profile/${otherUsername}`}>
          <h2 className="font-handwriting text-2xl text-electric-navy m-0 leading-none">@{otherUsername}</h2>
        </Link>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 pb-32">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-electric-navy/50 font-handwriting text-xl">
            Say hi to @{otherUsername}!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUserId;
            const isMedia = msg.content.startsWith("[STICKER]") || msg.content.startsWith("[GIF]") || isOnlyEmojis(msg.content);
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMedia ? '' : 'p-3 border-2 border-electric-navy'} ${isMe ? (isMedia ? '' : 'bg-electric-navy text-white sticky-note sticker-rotate-1') : (isMedia ? '' : 'bg-white text-electric-navy sticky-note -rotate-1')}`}>
                  {renderMessageContent(msg.content)}
                  <div className={`text-[9px] mt-1 font-label-bold uppercase ${isMe ? (isMedia ? 'text-sky-blue text-right' : 'text-white/70') : 'text-sky-blue'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pickers Popover */}
      {activePicker !== 'none' && (
        <div className="absolute bottom-20 left-0 right-0 bg-white border-y-2 border-electric-navy p-4 shadow-lg z-20 h-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-electric-navy">
            <h3 className="font-label-bold text-sky-blue uppercase">
              {activePicker === 'emoji' ? 'Choose Emoji' : activePicker === 'sticker' ? 'Choose Sticker' : 'Choose GIF'}
            </h3>
            <button onClick={() => setActivePicker('none')} className="material-symbols-outlined text-electric-navy">close</button>
          </div>
          
          {activePicker === 'emoji' && (
            <div className="grid grid-cols-7 gap-2">
              {POPULAR_EMOJIS.map((emoji, idx) => (
                <button key={idx} onClick={() => setInput(prev => prev + emoji)} className="text-3xl hover:bg-sunny-yellow/30 p-2 rounded hover:scale-125 transition-transform">
                  {emoji}
                </button>
              ))}
            </div>
          )}
          
          {activePicker === 'sticker' && (
            <div className="grid grid-cols-3 gap-4">
              {STICKERS.map((sticker, idx) => (
                <button key={idx} onClick={() => sendMedia('sticker', sticker)} className="hover:bg-sunny-yellow/30 p-2 border-2 border-transparent hover:border-electric-navy transition-all hover:scale-110">
                  <img src={`/images/sticker/${sticker}`} alt={`Sticker ${idx}`} className="w-full h-auto object-contain drop-shadow-md" />
                </button>
              ))}
            </div>
          )}

          {activePicker === 'gif' && (
            <div className="grid grid-cols-2 gap-2">
              {GIFS.map((gif, idx) => (
                <button key={idx} onClick={() => sendMedia('gif', gif)} className="hover:opacity-80 border-2 border-transparent hover:border-electric-navy transition-all">
                  <img src={gif} alt={`GIF ${idx}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t-2 border-electric-navy p-2 bg-white flex flex-col z-30">
        <div className="flex gap-2 mb-2 px-2">
          <button type="button" onClick={() => setActivePicker(activePicker === 'emoji' ? 'none' : 'emoji')} className={`material-symbols-outlined p-1 transition-colors ${activePicker === 'emoji' ? 'text-sky-blue' : 'text-electric-navy hover:text-sky-blue'}`}>mood</button>
          <button type="button" onClick={() => setActivePicker(activePicker === 'sticker' ? 'none' : 'sticker')} className={`material-symbols-outlined p-1 transition-colors ${activePicker === 'sticker' ? 'text-sky-blue' : 'text-electric-navy hover:text-sky-blue'}`}>sticky_note_2</button>
          <button type="button" onClick={() => setActivePicker(activePicker === 'gif' ? 'none' : 'gif')} className={`material-symbols-outlined p-1 transition-colors ${activePicker === 'gif' ? 'text-sky-blue' : 'text-electric-navy hover:text-sky-blue'}`}>gif_box</button>
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border-2 border-electric-navy font-sans text-sm focus:outline-none focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-electric-navy text-white px-4 py-2 border-2 border-electric-navy font-label-bold hover:bg-sky-blue hover:border-sky-blue transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
