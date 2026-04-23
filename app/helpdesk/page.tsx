"use client";

import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Image from "next/image";
import {
  ArrowRight,
  Rocket,
  CheckCircle,
  Clock,
  List,
  Key,
  Database,
  HelpCircle,
  Monitor,
  Wifi,
  PlusCircle,
  ShieldAlert,
  AppWindow,
  Activity,
  ExternalLink,
  PlayCircle,
  Mail,
  Phone,
  LifeBuoy,
} from "lucide-react";
import CloudspaceHeader from "../components/CloudspaceHeader";
import HeroSection from "../components/HeroSection";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HelpdeskPage() {
  return (
    <main className="min-h-screen bg-[#000] text-white selection:bg-[#ed1c24]/30 overflow-x-hidden">
      <CloudspaceHeader />
      <HeroSection
        backgroundClassName="bg-[#000]"
        kicker="CNT IT Helpdesk"
        heading={
          <>
            RESOLVE <span className="text-[#ed1c24]">FAST.</span>
            <br />
            STAY PRODUCTIVE.
          </>
        }
        description="We make IT work, so you can focus on what really matters."
        primaryCta={{
          label: "Submit a Ticket Now",
          href: "https://itcntpromoads.on.spiceworks.com/portal",
          target: "_blank",
          rel: "noopener noreferrer",
          icon: Rocket,
        }}
        secondaryCta={{
          label: "Borrow IT Equipments",
          href: "https://itequipments.on.spiceworks.com/portal/",
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      />

      <section className="py-12 bg-[#000] border-y border-white/5">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <motion.h2
              variants={fadeIn}
              className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter"
            >
              What is the IT Helpdesk System?
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-base md:text-lg text-gray-400 leading-relaxed font-medium"
            >
              The IT Helpdesk System is a centralized platform that streamlines
              IT-related requests and issue resolution. It offers a structured,
              user-friendly interface to report concerns, request assistance,
              and track support tickets.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#000]">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-10">
            <motion.h2
              variants={fadeIn}
              className="text-2xl sm:text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter"
            >
              When to Use the IT Helpdesk System?
            </motion.h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            {concerns.slice(0, 10).map((concern, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                whileHover={{
                  y: -8,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
                className="w-full sm:w-[calc(50%-16px)] md:w-[calc(33.33%-16px)] lg:w-[calc(25%-16px)] xl:w-[calc(20%-16px)] bg-white/5 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-500 cursor-pointer group overflow-hidden"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ed1c24]/20 rounded-xl flex items-center justify-center text-[#ed1c24] mb-4 group-hover:bg-[#ed1c24] group-hover:text-white transition-all duration-500">
                  <concern.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight mb-2 group-hover:text-[#ed1c24] transition-colors duration-500">
                  {concern.title}
                </h3>
                <p className="text-gray-400 text-[11px] sm:text-xs leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-24 transition-all duration-500 font-medium">
                  {concern.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 2️⃣ High-Density Info Zone (Features + Access) */}
      <section
        id="how-to"
        className="py-12 sm:py-16 bg-[#000] text-white border-y border-white/5"
      >
        <div className="container px-6 mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8 sm:space-y-12">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
                  Why use the portal?
                </h2>
                <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-[#ed1c24] rounded-full" />
              </div>

              <div className="grid gap-4 sm:gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 sm:p-6 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border-b-4 border-[#ed1c24] border-x border-t border-white/5"
                  >
                    <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#ed1c24] border border-white/10">
                      <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-[13px] sm:text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#000] text-white border-b border-white/5">
        <div className="container px-6 mx-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
                How to access the IT Helpdesk System?
              </h2>
              <div className="w-20 h-2 bg-[#ed1c24] rounded-full" />
            </div>

            <div className="grid lg:grid-cols-3 gap-10 items-stretch">
              <div className="relative lg:col-span-2 h-full min-h-[260px] rounded-3xl overflow-hidden shadow-2xl border-8 border-white/5 group">
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  playsInline
                  poster="/CLOUDSPACE_BANNER.png"
                >
                  <source
                    src="https://res.cloudinary.com/dpi0c0qmg/video/upload/v1774733656/compressed-QDh1OQof_argpmi.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-[#ed1c24]/10 group-hover:bg-transparent transition-colors pointer-events-none" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                  <span className="text-4xl font-bold text-[#ed1c24]/20 mb-2 block">
                    01
                  </span>
                  <h4 className="font-bold text-lg mb-2 text-white uppercase">
                    PORTAL LINK
                  </h4>
                  <a
                    href="https://itcntpromoads.on.spiceworks.com/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ed1c24] font-bold hover:underline inline-flex items-center gap-2"
                  >
                    Access Portal <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                  <span className="text-4xl font-bold text-[#ed1c24]/20 mb-2 block">
                    02
                  </span>
                  <h4 className="font-bold text-lg mb-2 text-white uppercase">
                    Login Details
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Use your company email to submit and track your requests.
                  </p>
                </div>

                <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                  <span className="text-4xl font-bold text-[#ed1c24]/20 mb-2 block">
                    03
                  </span>
                  <h4 className="font-bold text-lg mb-2 text-white uppercase">
                    Step-by-Step Walkthrough
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Watch our IT Helpdesk video tutorial for a guided system
                    walkthrough.
                  </p>
                </div>
              </div>
            </div>
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

// Data Arrays
const features = [
  {
    title: "Ticket Tracking",
    description:
      "Monitor the status of your requests in real time from submission to resolution.",
    icon: CheckCircle,
  },
  {
    title: "Categorized Logging",
    description:
      "Classify IT concerns easily to ensure they reach the right expert for faster resolution.",
    icon: List,
  },
  {
    title: "Timely Updates",
    description:
      "Stay informed with automatic notifications on the progress of your requests.",
    icon: Clock,
  },
];

const concerns = [
  {
    title: "Account & Access Issues",
    description: "Login problems, permission adjustments, account recovery.",
    icon: Key,
  },
  {
    title: "Backup & Data Recovery",
    description: "Data restoration, backup verification, file recovery.",
    icon: Database,
  },
  {
    title: "General IT Inquiries",
    description: "IT policy questions, general tech-related concerns.",
    icon: HelpCircle,
  },
  {
    title: "Hardware Issues",
    description: "Computer malfunctions, printer/peripheral failures.",
    icon: Monitor,
  },
  {
    title: "Internet Issue",
    description: "Network access issues, Wi-Fi dropouts, bandwidth problems.",
    icon: Wifi,
  },
  {
    title: "New Equipment Requests",
    description:
      "Hardware upgrades, new device procurement, system expansions.",
    icon: PlusCircle,
  },
  {
    title: "Security Concerns",
    description: "Virus/malware detection, data breaches, security updates.",
    icon: ShieldAlert,
  },
  {
    title: "Software Issues",
    description: "Installations, updates, renewals, bugs, crashes.",
    icon: AppWindow,
  },
  {
    title: "System Performance",
    description: "Slow performance, freezing, crashes, resource optimization.",
    icon: Activity,
  },
];
