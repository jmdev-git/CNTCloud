import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/admin");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Loading…</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
