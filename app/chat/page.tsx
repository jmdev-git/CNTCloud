"use client";

import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../components/ui/cloudspace-carousel";
import {
  Download,
  Rocket,
  Globe,
  MessageSquare,
  Users,
  Search,
  Shield,
  Smartphone,
  Zap,
  LifeBuoy,
  Mail,
  Phone,
  Reply,
  Bell,
  BarChart2,
  Forward,
  CalendarClock,
  Monitor,
} from "lucide-react";
import CloudspaceHeader from "../components/CloudspaceHeader";
import HeroSection from "../components/HeroSection";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-[#000] text-white selection:bg-[#ed1c24]/30 overflow-x-hidden">
      <CloudspaceHeader />
      <HeroSection
        backgroundClassName="bg-[#000]"
        kicker="CNT CloudSpace Chat"
        heading={
          <>
            CONNECT <span className="text-[#ed1c24]">INSTANTLY.</span>
            <br />
            WORK BETTER.
          </>
        }
        description="Communicate easily and securely with CNT CloudSpace Chat — your all-in-one private cloud messaging service."
        primaryCta={{
          label: "Download for Windows",
          href: "https://gofile-37456a334e.tw3.quickconnect.to/sharing/zcCKuW4nl",
          target: "_blank",
          rel: "noopener noreferrer",
          icon: Download,
          className: "w-full sm:w-auto",
          iconClassName: "w-6 h-6 group-hover:scale-110 transition-transform",
        }}
        secondaryCta={{
          label: "Open in Browser",
          href: "https://cntcloudspace.tw3.quickconnect.to/?launchApp=SYNO.SDS.Chat.Application",
          target: "_blank",
          rel: "noopener noreferrer",
          icon: Globe,
          className: "w-full sm:w-auto",
          iconClassName: "w-6 h-6 group-hover:scale-110 transition-transform",
        }}
      />

      {/* 2️⃣ High-Density Interface Zone */}
      <section className="py-10 sm:py-16 bg-[#000] text-white border-y border-white/5">
        <div className="container px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
            {/* Visual: Carousel with Phone Frame */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative w-full max-w-5xl mx-auto lg:mx-0"
            >
              <div className="bg-[#000] p-2 md:p-3 rounded-[2.75rem] shadow-[0_50px_100px_-25px_rgba(0,0,0,0.6)] border border-white/5">
                <Carousel
                  opts={{ align: "center", loop: true }}
                  plugins={[Autoplay({ delay: 4000 })]}
                  className="w-full"
                >
                  <CarouselContent>
                    {[
                      "a1.png",
                      "a2.png",
                      "a3.png",
                      "a4.png",
                      "a5.png",
                      "a6.png",
                    ].map((img, i) => (
                      <CarouselItem key={i} className="basis-full">
                        <div className="relative h-[200px] sm:h-[320px] md:h-[500px] rounded-[2.25rem] overflow-hidden bg-white/5">
                          <Image
                            src={`/${img}`}
                            alt={`Interface ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              <div className="absolute -z-10 -bottom-10 -left-10 w-64 h-64 bg-[#ed1c24]/10 rounded-full blur-3xl" />
            </motion.div>

            {/* Content: Features Grid */}
            <div className="space-y-6 sm:space-y-10">
              <div>
                <h2 className="text-3xl xl:text-5xl font-bold uppercase tracking-tight leading-tight mb-4 sm:mb-5">
                  Structured{" "}
                  <span className="text-[#ed1c24]">Communication.</span>
                </h2>
                <p className="text-base sm:text-lg xl:text-xl text-gray-400 font-medium max-w-md">
                  No more messy threads or lost files. Everything where it
                  belongs.
                </p>
              </div>

              <div className="grid gap-4 sm:gap-5">
                {[
                  {
                    title: "Smart Channels",
                    desc: "Organize by projects, teams, or topics.",
                    icon: MessageSquare,
                  },
                  {
                    title: "Instant Search",
                    desc: "Find any file or message in milliseconds.",
                    icon: Search,
                  },
                  {
                    title: "Global Sync",
                    desc: "Desktop to mobile, zero lag communication.",
                    icon: Smartphone,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 sm:gap-6 p-5 sm:p-6 bg-white/5 backdrop-blur-md rounded-3xl hover:bg-[#ed1c24]/5 transition-colors border-l-8 border-[#ed1c24] border-y border-r border-white/5"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#ed1c24] border border-white/10 shrink-0">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg mb-1 uppercase tracking-tight text-white">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-[#000] border-y border-white/5">
        <div className="container px-6 mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-6xl font-bold text-white uppercase tracking-tighter">
                How CNT Chat helps your{" "}
                <span className="text-[#ed1c24]">team communicate</span>
              </h2>
              <p className="text-lg text-gray-400 font-medium max-w-xl">
                Empower CNT teams to communicate in the way that fits their work
                style—without sacrificing security or accessibility.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">
                  Maximum flexibility
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Start one-to-one conversations or create public and private
                  channels for teams, projects, and departments.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">
                  Complete privacy
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Ensure confidentiality with optional end-to-end encryption for
                  sensitive conversations and channels.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 sm:col-span-2">
                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">
                  Multi-platform access
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Chat from the browser, Windows, macOS, Linux, iOS, or Android
                  so CNT employees stay connected wherever they work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ Performance & Tools Grid */}
      <section className="py-16 bg-[#000]">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white uppercase tracking-tighter">
              <span className="text-[#ed1c24]">EMPOWER</span> CNT EMPLOYEES
            </h2>
            <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-[#ed1c24] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {empowerFeatures.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl hover:shadow-[#ed1c24]/10 transition-all border border-white/10 hover:border-[#ed1c24]/20"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#ed1c24]/10 rounded-2xl flex items-center justify-center text-[#ed1c24] mb-6">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 uppercase tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-[13px] sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4️⃣ High-Density Support */}
      <section className="bg-[#000] relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          }}
        />

        <div className="relative z-10 py-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#000] overflow-hidden shadow-[0_50px_110px_-35px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row border border-white/5"
          >
            <div className="lg:w-1/2 relative min-h-[220px] lg:min-h-full overflow-hidden">
              <Image
                src="/Contacts.jpg"
                alt="Contacts"
                fill
                className="object-cover transition-all duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#000] via-transparent to-transparent lg:from-transparent" />
              <div className="absolute inset-0 bg-[#ed1c24]/10 mix-blend-overlay" />
            </div>

            <div className="lg:w-2/3 p-8 md:p-10 space-y-6 flex flex-col justify-center">
              <div className="space-y-3">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "40px" }}
                  viewport={{ once: true }}
                  className="h-1 bg-[#ed1c24] rounded-full"
                />
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight uppercase tracking-tighter">
                  Instant <span className="text-[#ed1c24]">IT Support.</span>
                </h2>
                <p className="text-gray-400 text-sm font-medium max-w-sm">
                  Our team is standing by to resolve your technical challenges
                  in seconds.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    label: "Helpdesk Portal",
                    value: "Submit Ticket",
                    icon: Monitor,
                    href: "https://itcntpromoads.on.spiceworks.com/portal",
                  },
                  {
                    label: "Email Support",
                    value: "help@itcntpromoads.on.spiceworks.com",
                    icon: Mail,
                    href: "mailto:help@itcntpromoads.on.spiceworks.com",
                  },
                  { label: "Local Hotline", value: "Ext. 122", icon: Phone },
                ].map((contact, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 8 }}
                    className="flex items-center gap-4 group cursor-pointer"
                    onClick={() => {
                      if (contact.href) {
                        window.open(
                          contact.href,
                          contact.href.startsWith("http") ? "_blank" : "_self",
                        );
                      }
                    }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#ed1c24] blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                      <div className="relative w-11 h-11 bg-white/5 rounded-2xl flex items-center justify-center text-[#ed1c24] border border-white/10 group-hover:bg-[#ed1c24] group-hover:text-white transition-all duration-500">
                        <contact.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.18em] block mb-0.5">
                        {contact.label}
                      </span>
                      <span className="text-white font-bold text-lg tracking-tight group-hover:text-[#ed1c24] transition-colors">
                        {contact.label === "Email Support" ? (
                          <>
                            help@itcntpromoads.on.
                            <br className="sm:hidden" />
                            spiceworks.com
                          </>
                        ) : (
                          contact.value
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer showSupportInfo={false} />
    </main>
  );
}

const smartFeatures = [
  {
    title: "Manage Messages",
    description:
      "Keep your conversations organized with channels, threads, and direct messages.",
    icon: MessageSquare,
  },
  {
    title: "Keep Everyone in Loop",
    description:
      "Ensure important updates reach the right people with @mentions and announcements.",
    icon: Users,
  },
  {
    title: "Find What Matters",
    description:
      "Powerful search capabilities to instantly retrieve files, messages, and people.",
    icon: Search,
  },
];

const transformFeatures = [
  {
    title: "Maximum Flexibility",
    description:
      "Work the way you want with customizable notifications, themes, and integrations.",
    icon: Zap,
  },
  {
    title: "Complete Privacy",
    description:
      "Enterprise-grade encryption and security protocols to keep your data safe.",
    icon: Shield,
  },
  {
    title: "Multi-platform Access",
    description:
      "Seamlessly switch between desktop, web, and mobile without missing a beat.",
    icon: Smartphone,
  },
];

const empowerFeatures = [
  {
    title: "Threads",
    description: "Keep conversations tidy by replying to messages in a thread.",
    icon: Reply,
  },
  {
    title: "Reminders",
    description: "Stay on top of what matters with message reminders.",
    icon: Bell,
  },
  {
    title: "Polls",
    description: "Get feedback from your team by creating polls.",
    icon: BarChart2,
  },
  {
    title: "Forwarding",
    description: "Save time by forwarding messages and large files.",
    icon: Forward,
  },
  {
    title: "Scheduling",
    description: "Plan work ahead by scheduling messages in advance.",
    icon: CalendarClock,
  },
];
