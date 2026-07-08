"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/profileActions";

export default function EditProfileForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialData.avatar || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    // If no new file was selected, remove the empty file from formData
    const file = formData.get("avatar") as File;
    if (file && file.size === 0) {
      formData.delete("avatar");
    }

    const result = await updateProfile(formData);
    setIsSubmitting(false);

    if (result.success) {
      alert("Profile updated successfully!");
      router.push("/profile");
    } else {
      alert("Failed to update profile: " + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Profile Picture */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-24 h-24 border-2 border-electric-navy overflow-hidden bg-sky-blue mb-2 relative">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">face</span>
          )}
        </div>
        <label className="font-label-bold text-xs bg-sunny-yellow text-electric-navy px-3 py-1 border-2 border-electric-navy cursor-pointer hover:bg-sky-blue hover:text-white transition-colors sticky-note">
          UPLOAD PHOTO
          <input type="file" name="avatar" accept="image/jpeg, image/png" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {/* Username */}
      <div>
        <label className="block font-label-bold text-electric-navy mb-1 text-sm">Username (without @)</label>
        <input 
          type="text" 
          name="username" 
          defaultValue={initialData.username || ""} 
          className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md" 
        />
      </div>

      {/* Name */}
      <div>
        <label className="block font-label-bold text-electric-navy mb-1 text-sm">Display Name</label>
        <input 
          type="text" 
          name="name" 
          defaultValue={initialData.name || ""} 
          className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md" 
        />
      </div>

      {/* Pronouns */}
      <div>
        <label className="block font-label-bold text-electric-navy mb-1 text-sm">Pronouns</label>
        <input 
          type="text" 
          name="pronouns" 
          defaultValue={initialData.pronouns || ""} 
          placeholder="e.g. they/them"
          className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md" 
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block font-label-bold text-electric-navy mb-1 text-sm">Gender</label>
        <select 
          name="gender" 
          defaultValue={initialData.gender || ""} 
          className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md bg-white"
        >
          <option value="">Prefer not to say</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Bio */}
      <div>
        <label className="block font-label-bold text-electric-navy mb-1 text-sm">Bio</label>
        <textarea 
          name="bio" 
          defaultValue={initialData.bio || ""} 
          rows={3}
          className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-handwriting text-lg resize-none" 
        />
      </div>

      {/* Social Links */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-label-bold text-electric-navy mb-1 text-sm">IG Link</label>
          <input 
            type="url" 
            name="igLink" 
            defaultValue={initialData.igLink || ""} 
            placeholder="https://instagram.com/..."
            className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md" 
          />
        </div>
        <div>
          <label className="block font-label-bold text-electric-navy mb-1 text-sm">X (Twitter) Link</label>
          <input 
            type="url" 
            name="xLink" 
            defaultValue={initialData.xLink || ""} 
            placeholder="https://x.com/..."
            className="w-full px-3 py-2 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sky-blue font-body-md" 
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full mt-4 bg-sky-blue text-white font-label-bold py-3 border-2 border-electric-navy sticky-note hover:-translate-y-1 hover:bg-electric-navy transition-all disabled:opacity-50"
      >
        {isSubmitting ? "SAVING..." : "SAVE PROFILE"}
      </button>
    </form>
  );
}
