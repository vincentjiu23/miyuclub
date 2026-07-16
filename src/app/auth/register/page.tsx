"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/authActions";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);

    if (result.success) {
      localStorage.setItem("miyu_user", result.userId || "");
      window.dispatchEvent(new Event("storage"));
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-white border-2 border-electric-navy p-8 sticky-note sticker-rotate-neg-1 max-w-md w-full mt-10">
        <h2 className="font-handwriting text-headline-lg text-electric-navy mb-6 text-center">Join the Club</h2>
        
        {error && (
          <div className="bg-racing-red text-white p-3 mb-4 font-label-bold text-sm border-2 border-electric-navy transform -rotate-1">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input 
            type="text" 
            name="username"
            placeholder="Username" 
            required 
            className="w-full px-4 py-3 border-2 border-electric-navy font-body-md focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
          <input 
            type="email" 
            name="email"
            placeholder="Email" 
            required 
            className="w-full px-4 py-3 border-2 border-electric-navy font-body-md focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            required 
            className="w-full px-4 py-3 border-2 border-electric-navy font-body-md focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-racing-red text-white font-handwriting text-xl py-3 border-2 border-electric-navy sticky-note hover:-translate-y-1 hover:bg-electric-navy transition-all mt-4 disabled:opacity-50"
          >
            {isLoading ? "REGISTERING..." : "REGISTER"}
          </button>
        </form>
        <p className="mt-6 text-center font-body-md text-electric-navy">
          Already have an account? <Link href="/auth/login" className="text-sky-blue hover:underline font-label-bold">Login here</Link>
        </p>
      </div>
    </main>
  );
}
