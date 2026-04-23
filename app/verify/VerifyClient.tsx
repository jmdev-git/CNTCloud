"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LucideIcon from "@/components/LucideIcon";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { setEmployeeEmail } from "@/utils/ackStore";

export default function VerifyClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });

      const data = await res.json();

      if (data.ok) {
        // Store email in localStorage for acknowledgment tracking
        setEmployeeEmail(email.toLowerCase().trim());
        window.location.href = next;
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to verify email");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("An error occurred. Please try again.");
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#000]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="mb-4">
              <Image
                src="/CloudSpace_Logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-10 h-10"
              />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1.5">
              CNT <span className="text-[#ed1c24]">CloudSpace</span>
            </h2>

            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] max-w-xs leading-relaxed">
              Verify your identity with your company email to access the
              internal platform.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2.5">
              <label
                htmlFor="email"
                className="block text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1"
              >
                Company Email
              </label>
              <div className="relative group">
                <LucideIcon
                  name="mail"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#ed1c24] transition-colors duration-300"
                />
                <input
                  id="email"
                  type="email"
                  placeholder="name@cnt.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-6 py-3 border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/10 focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all duration-300 text-sm font-medium"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="flex items-center gap-3 text-rose-400 text-[9px] bg-rose-400/5 border border-rose-400/20 p-4 rounded-xl"
                >
                  <LucideIcon
                    name="alert-circle"
                    className="w-4 h-4 shrink-0"
                  />
                  <p className="font-bold uppercase tracking-widest">
                    {errorMessage}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={status === "sending"}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group w-full py-3.5 bg-[#ed1c24] text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-800 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {status === "sending" ? (
                  <>
                    <LucideIcon
                      name="loader-2"
                      className="w-4 h-4 animate-spin"
                    />
                    Verifying Identity...
                  </>
                ) : (
                  <>
                    Verify and Access
                    <LucideIcon
                      name="arrow-right"
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </motion.button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-2.5 border-t border-white/5 text-center">
            <span className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-bold">
              if your email is not registered in the system, <br /> please
              submit a request through the{" "}
              <a
                href="https://itcntpromoads.on.spiceworks.com/portal"
                target="_blank"
                className="text-red-500 font-black"
              >
                IT Helpdesk
              </a>{" "}
              for assistance.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
