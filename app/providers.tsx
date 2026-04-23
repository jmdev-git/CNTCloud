'use client';

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sileo";

export default function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster
        position="top-right"
        offset={{ top: 24, right: 24 }}
        theme="dark"
        options={{
          fill: "#020617",
          roundness: 14,
          styles: {
            title: "text-emerald-400!",
            description: "text-white!",
            badge: "bg-white/10! text-white!",
            button: "bg-white/10! hover:bg-white/20! text-white!",
          },
        }}
      />
    </SessionProvider>
  );
}
