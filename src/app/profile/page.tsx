import { getProfile } from "@/app/actions/profileActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfilePostManager from "@/components/ProfilePostManager";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfile();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="pb-32 max-w-screen-md mx-auto px-margin-mobile pt-12 relative">
      <div className="bg-white border-2 border-electric-navy p-8 sticky-note sticker-rotate-1 relative max-w-lg mx-auto">
        
        {/* Tape Effect */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-sky-blue/30 backdrop-blur-sm -rotate-2 border border-sky-blue/20 z-10"></div>

        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 border-4 border-electric-navy overflow-hidden bg-sunny-yellow mb-6 rotate-2 sticky-note relative">
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-6xl text-electric-navy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
            )}
          </div>
          
          <h2 className="font-handwriting text-headline-lg text-electric-navy leading-none mb-2">
            {user.name || user.username}
          </h2>
          <p className="font-label-bold text-sky-blue mb-2">@{user.username}</p>
          
          {(user.pronouns || user.gender) && (
            <div className="flex gap-2 justify-center mb-6">
              {user.pronouns && <span className="bg-electric-navy text-white px-3 py-1 text-xs font-label-bold">{user.pronouns}</span>}
              {user.gender && <span className="bg-sunny-yellow text-electric-navy px-3 py-1 text-xs font-label-bold">{user.gender}</span>}
            </div>
          )}

          <div className="w-full border-t-2 border-dashed border-electric-navy/30 my-4"></div>

          <p className="font-handwriting text-lg text-electric-navy leading-relaxed mb-6">
            {user.bio || "No bio yet. Still a mystery..."}
          </p>

          <div className="flex gap-4 justify-center mb-8">
            {user.igLink && (
              <a href={user.igLink} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-electric-navy p-2 hover:bg-sky-blue hover:text-white transition-colors sticky-note flex items-center justify-center">
                IG
              </a>
            )}
            {user.xLink && (
              <a href={user.xLink} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-electric-navy p-2 hover:bg-sky-blue hover:text-white transition-colors sticky-note flex items-center justify-center">
                X
              </a>
            )}
          </div>

          <Link href="/profile/edit" className="w-full bg-racing-red text-white font-label-bold py-3 border-2 border-electric-navy sticky-note hover:-translate-y-1 transition-transform inline-block mb-12">
            EDIT PROFILE
          </Link>
        </div>
      </div>
      
      {/* Post Management Grid */}
      <ProfilePostManager />
      
      {/* Decorative Scribbles */}
      <div className="absolute top-32 -left-10 opacity-20 hidden md:block">
        <span className="text-electric-navy font-handwriting text-5xl transform -rotate-12 block">WHOAMI</span>
      </div>
    </main>
  );
}
