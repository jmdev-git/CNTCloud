"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllActiveAnnouncements } from "@/data/mockData";
import { getAllSampleAnnouncements } from "@/data/sampleData";
import { findCompanyEmailByEmail } from "@/data/companyEmails";
import { AcknowledgmentRecord, Announcement } from "@/types";
import {
  hasAcknowledged,
  recordAcknowledgment,
  setEmployeeEmail,
  getEmployeeEmail,
} from "@/utils/ackStore";
import LucideIcon from "@/components/LucideIcon";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export default function MemoAcknowledgePage() {
  const params = useParams();
  const router = useRouter();
  const memoId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [memo, setMemo] = useState<Announcement | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!mounted) return;
      setLoading(true);
      const mock = await getAllActiveAnnouncements();
      const sample = getAllSampleAnnouncements();
      const all = [...mock, ...sample];
      if (!cancelled) {
        setMemo(all.find((a) => a.id === memoId));
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [memoId, mounted]);

  useEffect(() => {
    setMounted(true);
    const saved = getEmployeeEmail();
    if (saved) {
      // Auto-redirect if already acknowledged
      if (memo && hasAcknowledged(memo.id, saved)) {
        if (memo.link) {
          window.location.href = memo.link;
        } else {
          router.push("/");
        }
      }
    }
  }, [memo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!memo) {
      setError("Memorandum not found.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your company email.");
      return;
    }
    const employee = await findCompanyEmailByEmail(email);
    if (!employee) {
      setError("Email is not recognized as a company email.");
      return;
    }
    const normalizeBU = (s?: string) => {
      const v = (s || "").trim();
      if (!v) return "";
      const clean = v.toUpperCase().replace(/[^A-Z0-9]+/g, ""); // Remove all spaces and symbols
      if (clean.startsWith("FRONT")) return "FRONTIER";
      if (clean.startsWith("LYFELAN")) return "LYFE LAND";
      if (
        clean.includes("PROMO") &&
        (clean.includes("ADS") || clean.includes("AD"))
      )
        return "CNT PROMO & ADS SPECIALISTS";
      return v.toUpperCase();
    };
    const memoBU = normalizeBU(memo.businessUnit || "");
    const employeeBU = normalizeBU(employee.businessUnit || "");

    // CNT GROUP can access all memorandums
    if (
      employeeBU !== "CNT GROUP" &&
      memoBU &&
      employeeBU &&
      memoBU !== employeeBU
    ) {
      setError(
        "Your company email is not assigned to this memorandum’s business unit.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Save to Database (MongoDB)
      try {
        await fetch("/api/acknowledgments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memo_id: memo.id,
            memo_title: memo.memoUid || memo.title,
            memo_link: memo.link,
            employee_email: email.trim().toLowerCase(),
            employee_name: employee.name,
          }),
        });
      } catch (dbError) {
        console.error("Failed to save acknowledgment to database:", dbError);
        // We continue even if DB fails to let user access the file, but in a real app you might want to retry
      }

      // 2. Save locally and send email (Legacy flow)
      if (!hasAcknowledged(memo.id, email)) {
        const rec: AcknowledgmentRecord = {
          memo_id: memo.id,
          memo_title: memo.memoUid || memo.title,
          memo_link: memo.link,
          employee_email: email.trim(),
          employee_name: employee.name,
          acknowledged_at: new Date().toISOString(),
        };
        recordAcknowledgment(rec);
        setEmployeeEmail(email.trim());
        try {
          await fetch("/api/send-ack-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email.trim(),
              name: employee.name,
              memoTitle: memo.title,
              link: memo.link ?? "",
              acknowledgedAt: rec.acknowledged_at,
            }),
          });
        } catch {
          /* ignore email errors */
        }
      }
      if (memo.link) {
        window.location.href = memo.link;
      } else {
        router.push("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60 text-sm font-bold uppercase tracking-widest animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000] p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-10 rounded-2xl border border-white/10 bg-[#000]/80 backdrop-blur-md shadow-2xl max-w-sm relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-lg">
              <LucideIcon
                name="alert-triangle"
                className="w-7 h-7 text-rose-500"
              />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
              Memo Not Found
            </h2>
            <p className="text-white/40 text-[10px] mb-8 font-bold leading-relaxed uppercase tracking-[0.15em]">
              This link may be expired or the memorandum has been removed from
              the bulletin board.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-white/10 active:scale-95"
            >
              Return to Bulletin
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131B30] p-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#000] shadow-2xl p-10 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="mb-10 text-center">
            <div className="mb-4">
              <Image
                src="/CloudSpace_Logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="w-10 h-10 m-auto"
              />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1.5">
              CNT <span className="text-[#ed1c24]">CloudSpace</span>
            </h2>
            <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
              Please enter your company email to acknowledge and access this
              memorandum.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] ml-1">
                Company Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LucideIcon
                    name="mail"
                    className="w-4 h-4 text-white/20 group-focus-within:text-[#ed1c24] transition-colors"
                  />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-12 pl-11 pr-6 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/10 font-medium focus:outline-none focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all text-sm"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3"
                >
                  <LucideIcon
                    name="alert-circle"
                    className="w-4 h-4 text-rose-500 shrink-0"
                  />
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full h-14 rounded-xl bg-[#ed1c24] hover:bg-red-800 text-white font-bold uppercase tracking-[0.25em] text-[11px] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <span>Acknowledge & Open</span>
                    <LucideIcon
                      name="arrow-right"
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>
          </form>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-[10px] font-bold text-white/20 hover:text-white/50 uppercase tracking-[0.3em] transition-all inline-flex items-center gap-2 group/cancel"
            >
              <LucideIcon
                name="chevron-left"
                className="w-3 h-3 transition-transform group-hover/cancel:-translate-x-1"
              />
              Cancel & Return
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
