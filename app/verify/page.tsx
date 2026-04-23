import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="text-white/60 text-sm font-bold uppercase tracking-widest animate-pulse">Verifying…</div>
      </div>
    }>
      <VerifyClient />
    </Suspense>
  );
}
