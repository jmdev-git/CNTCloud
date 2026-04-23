import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport = {
  themeColor: "#ed1c24",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "CNT CloudSpace",
  description:
    "Your Digital Workspace for faster, smarter, and safer collaboration.",
  icons: {
    icon: "/CloudSpace_Logo.png", 
  },
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { TooltipProvider } from "@/components/ui/tooltip";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers session={session}>
          <TooltipProvider delayDuration={0}>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
