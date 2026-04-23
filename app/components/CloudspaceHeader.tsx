"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  LogOut,
  LayoutDashboard,
  ArrowUpRight,
  LayoutGrid,
  Monitor,
} from "lucide-react";

export default function CloudspaceHeader({
  buttonLabel,
  buttonHref,
}: {
  buttonLabel?: string;
  buttonHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-[#000] py-4 border-white/10 shadow-2xl"
          : "bg-transparent py-8 border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between gap-12">
        {/* Left: Logo */}
        <div className="shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group w-fit">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/CloudSpace_Logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-1 sm:mb-1.5">
              CNT <span className="text-[#ed1c24]">CloudSpace</span>
            </h2>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <NavLink href="/" label="Home" />

          <div className="relative">
            <button
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
                featuresOpen
                  ? "text-[#ed1c24]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-500 ${featuresOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {featuresOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 mt-4 w-72 rounded-xl border border-white/10 bg-[#000] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] p-3 z-[60]"
                >
                  <div className="grid gap-1">
                    <FeatureItem
                      href="/helpdesk"
                      icon={Monitor}
                      title="Helpdesk"
                      description="Support & Ticketing"
                    />
                    <FeatureItem
                      href="/chat"
                      icon={MessageSquare}
                      title="Chat"
                      description="Team Messaging"
                    />
                    <FeatureItem
                      href="/pulse"
                      icon={Activity}
                      title="Pulse"
                      description="Digital Bulletin"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink href="/about" label="About" />
        </div>

        {/* Right: User Menu / Login */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          {session ? (
            <div className="relative">
              <button
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 py-1.5 transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ed1c24]/10 border border-[#ed1c24]/20 flex items-center justify-center font-bold text-xs text-[#ed1c24] group-hover:bg-[#ed1c24] group-hover:text-white transition-all">
                  {session.user?.name?.charAt(0) || "A"}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                    Signed in as
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-tight leading-none">
                    {session.user?.name || "Admin"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-white/30 transition-transform duration-500 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-4 w-56 rounded-xl border border-white/10 bg-[#000] shadow-2xl p-2 z-[60]"
                  >
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all duration-300"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#ed1c24]" />
                      <span className="font-bold uppercase tracking-widest text-[10px]">
                        Dashboard
                      </span>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/pulse" })}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-500/10 text-white/60 hover:text-rose-400 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-bold uppercase tracking-widest text-[10px]">
                        Sign Out
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            buttonLabel &&
            buttonHref && (
              <a
                href={buttonHref}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#ed1c24] text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:bg-red-800 hover:shadow-lg hover:shadow-[#ed1c24]/20"
              >
                {buttonLabel} <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-[#000] overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              <MobileNavLink
                href="/"
                label="Home"
                onClick={() => setOpen(false)}
              />
              <MobileNavLink
                href="/about"
                label="About"
                onClick={() => setOpen(false)}
              />

              <div className="space-y-4">
                <button
                  onClick={() => setMobileFeaturesOpen(!mobileFeaturesOpen)}
                  className="flex items-center justify-between w-full text-white/80 font-bold uppercase tracking-widest text-lg"
                >
                  <div className="flex items-center gap-4">
                    <span>Features</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-500 ${mobileFeaturesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {mobileFeaturesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid gap-3 pl-10 overflow-hidden"
                    >
                      <MobileFeatureLink
                        href="/helpdesk"
                        label="Helpdesk"
                        onClick={() => setOpen(false)}
                      />
                      <MobileFeatureLink
                        href="/chat"
                        label="Chat"
                        onClick={() => setOpen(false)}
                      />
                      <MobileFeatureLink
                        href="/pulse"
                        label="Pulse"
                        onClick={() => setOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {session ? (
                <div className="grid gap-3 pt-4 border-t border-white/5">
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 text-white/80 font-bold uppercase tracking-widest text-lg"
                  >
                    <LayoutDashboard className="w-6 h-6 text-[#ed1c24]" />
                    <span>Admin Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/pulse" });
                      setOpen(false);
                    }}
                    className="flex items-center gap-4 text-rose-400 font-bold uppercase tracking-widest text-lg text-left"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                !session &&
                buttonLabel &&
                buttonHref && (
                  <a
                    href={buttonHref}
                    className="mt-4 flex items-center justify-center gap-3 w-full py-5 rounded-[2rem] bg-[#ed1c24] text-white font-bold uppercase tracking-[0.2em] text-lg shadow-2xl"
                  >
                    {buttonLabel} <ArrowUpRight className="w-6 h-6" />
                  </a>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.15em] text-white/60 transition-all duration-300 hover:text-white"
    >
      <span>{label}</span>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#ed1c24] transition-all duration-300 group-hover:w-8" />
    </Link>
  );
}

function FeatureItem({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-white/10"
    >
      <div className="w-12 h-12 rounded-xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] transition-all duration-500 group-hover:bg-[#ed1c24] group-hover:text-white group-hover:scale-110">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="font-bold text-white uppercase tracking-tight text-sm">
          {title}
        </div>
        <div className="text-white/40 text-[11px] font-bold uppercase tracking-tighter">
          {description}
        </div>
      </div>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 text-white/80 font-bold uppercase tracking-widest text-lg transition-colors hover:text-white"
    >
      <span>{label}</span>
    </Link>
  );
}

function MobileFeatureLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-white/50 font-bold uppercase tracking-widest text-base hover:text-[#ed1c24] transition-colors flex items-center gap-2"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
      {label}
    </Link>
  );
}
