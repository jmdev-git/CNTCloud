"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  LifeBuoy,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  Info,
  Activity,
} from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);

  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000] border-b border-white/5">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/CloudSpace_Logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1.5">
            CNT <span className="text-[#ed1c24]">CloudSpace</span>
          </h2>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-black text-white/60">
          {!(session && isAdmin) && (
            <>
              <Link
                href="https://cloud-space-five.vercel.app/"
                className="group flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest text-[10px]"
              >
                <span>Home</span>
                <span className="block h-[2px] w-0 group-hover:w-full bg-[#ed1c24] transition-all duration-300" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setFeaturesOpen((v) => !v)}
                  className="group flex items-center gap-2 hover:text-white transition-colors text-white/60 uppercase tracking-widest text-[10px]"
                >
                  <span>Features</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${featuresOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {featuresOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-[#000] shadow-2xl p-2">
                    <Link
                      href="https://cloud-space-five.vercel.app/helpdesk"
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <LifeBuoy className="w-4 h-4 text-[#ed1c24]" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-white/90">
                        Helpdesk
                      </span>
                    </Link>
                    <Link
                      href="https://cloud-space-five.vercel.app/chat"
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-[#ed1c24]" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-white/90">Chat</span>
                    </Link>
                    <a
                      href="https://digital-bulletin.vercel.app/"
                      onClick={() => setFeaturesOpen(false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Activity className="w-4 h-4 text-[#ed1c24]" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-white/90">Pulse</span>
                    </a>
                  </div>
                )}
              </div>
              <Link
                href="#"
                className="group flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest text-[10px]"
              >
                <span>About</span>
                <span className="block h-[2px] w-0 group-hover:w-full bg-[#ed1c24] transition-all duration-300" />
              </Link>
            </>
          )}
          {session && isAdmin ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="ml-2 inline-flex items-center justify-center px-5 py-2 rounded-full bg-rose-500/20 text-rose-200 font-bold hover:bg-rose-500/30 transition-colors shadow-2xl border border-rose-500/30"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/admin/login"
              className="ml-2 inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#ed1c24] text-white font-bold hover:bg-red-800 transition-colors shadow-2xl"
            >
              Login
            </Link>
          )}
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#000]/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4 grid gap-3">
            {!(session && isAdmin) && (
              <>
                <Link
                  href="https://cloud-space-five.vercel.app/"
                  className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-semibold">Home</span>
                </Link>
                <button
                  onClick={() => setMobileFeaturesOpen((v) => !v)}
                  className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
                >
                  <span className="font-semibold">Features</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mobileFeaturesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileFeaturesOpen && (
                  <div className="grid gap-2 pl-8">
                    <Link
                      href="https://cloud-space-five.vercel.app/helpdesk"
                      className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <LifeBuoy className="w-4 h-4 text-[#ed1c24]" />
                      <span>Helpdesk</span>
                    </Link>
                    <Link
                      href="https://cloud-space-five.vercel.app/chat"
                      className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4 text-[#ed1c24]" />
                      <span>Chat</span>
                    </Link>
                    <a
                      href="https://digital-bulletin.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <Activity className="w-4 h-4 text-[#ed1c24]" />
                      <span>Pulse</span>
                    </a>
                  </div>
                )}
              </>
            )}
            {session && isAdmin ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-6 py-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 font-bold uppercase tracking-widest text-[10px] hover:bg-rose-500/20 transition-all shadow-xl active:scale-95"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/admin/login"
                className="px-6 py-2.5 bg-white/5 text-white rounded-xl border border-white/10 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 hover:border-white/20 transition-all shadow-xl active:scale-95"
                onClick={() => setOpen(false)}
              >
                Portal Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
