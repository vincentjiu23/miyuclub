import { getProfile } from "@/app/actions/profileActions";
import EditProfileForm from "@/components/EditProfileForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const user = await getProfile();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="pb-32 max-w-screen-md mx-auto px-margin-mobile pt-12 relative">
      <div className="bg-white border-2 border-electric-navy p-6 md:p-10 sticky-note max-w-xl mx-auto">
        <h2 className="font-handwriting text-headline-md text-electric-navy mb-8 border-b-2 border-dashed border-electric-navy pb-4">
          Edit Profile
        </h2>
        
        {/* We pass the initial data to a client component for the interactive form */}
        <EditProfileForm initialData={user} />
      </div>
    </main>
  );
}
