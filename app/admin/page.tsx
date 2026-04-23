import AdminDashboard from "@/components/AdminDashboard";
import AdminActivityTracker from "@/components/AdminActivityTracker";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#000] flex flex-col">
      <AdminActivityTracker />
      <div className="flex-1">
        <AdminDashboard />
      </div>
      <footer className="bg-[#000] text-white/60 py-12 text-center text-sm border-t border-white/10 w-full mt-auto">
        <p>
          &copy; {new Date().getFullYear()} CNT CloudSpace. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
