import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Rocket, type LucideIcon } from "lucide-react";

export type HeroCta = {
  label: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (e: any) => void;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
};

export type HeroSectionProps = {
  backgroundClassName?: string;
  kicker?: string;
  heading?: React.ReactNode;
  description?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta | null;
};

const defaultPrimaryCta: HeroCta = {
  label: "LATEST UPDATES",
  href: "#latest-news",
  icon: Rocket,
  onClick: (e: any) => {
    // Keep the existing Pulse behavior: smooth scroll to "latest-news"
    e.preventDefault();
    const el = document.getElementById("latest-news");
    if (el) {
      const headerOffset = 100;
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }
};

export default function HeroSection({
  backgroundClassName = "bg-[#000]",
  kicker = "CNT PULSE",
  heading = (
    <>
      ONE <span className="text-[#ed1c24]">SOURCE.</span>ONE{" "}
      <span className="text-[#ed1c24]">VOICE.</span>
      <br />
      ONE <span className="text-[#ed1c24]">ORGANIZATION.</span>
    </>
  ),
  description =
    "It is not just a bulletin board - it is the living communication heartbeat of CNT.",
  primaryCta = defaultPrimaryCta,
  secondaryCta = null,
}: HeroSectionProps) {
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

  const renderCta = (cta: HeroCta, variant: "primary" | "secondary") => {
    const isAnchor = Boolean(cta.href);

    if (isAnchor) {
      return (
        <a
          href={cta.href}
          target={cta.target}
          rel={cta.rel}
          onClick={cta.onClick}
          className={
            variant === "primary"
              ? `group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-5 bg-[#ed1c24] hover:bg-red-800 text-white font-black rounded-xl text-base sm:text-xl transition-all duration-300 shadow-2xl hover:shadow-[#ed1c24]/50 transform hover:-translate-y-1 uppercase tracking-tighter ${
                  cta.className || ""
                }`
              : `inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black rounded-xl text-base sm:text-xl transition-all duration-300 border border-white/20 uppercase tracking-tight ${
                  cta.className || ""
                }`
          }
        >
          {cta.label}
          {cta.icon ? (
            <cta.icon
              className={
                cta.iconClassName ||
                "w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              }
            />
          ) : null}
        </a>
      );
    }

    // Button (no href)
    return (
      <button
        type="button"
        onClick={cta.onClick}
        className={
          variant === "primary"
            ? `group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-5 bg-[#ed1c24] hover:bg-red-800 text-white font-black rounded-xl text-base sm:text-xl transition-all duration-300 shadow-2xl hover:shadow-[#ed1c24]/50 transform hover:-translate-y-1 uppercase tracking-tighter ${
                cta.className || ""
              }`
            : `inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-black rounded-xl text-base sm:text-xl transition-all duration-300 border border-white/20 uppercase tracking-tight ${
                cta.className || ""
              }`
        }
      >
        {cta.label}
        {cta.icon ? (
          <cta.icon
            className={
              cta.iconClassName ||
              "w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            }
          />
        ) : null}
      </button>
    );
  };

  return (
    <>
      {/* 1️⃣ Hero Section */}
      <section
        className={`relative w-full min-h-[80vh] sm:min-h-screen flex flex-col items-center justify-center overflow-hidden py-12 sm:py-20 ${backgroundClassName}`}
      >
        {/* Decorative Light Flares */}
        <div className="absolute top-0 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#ed1c24]/10 rounded-full blur-[80px] sm:blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#ed1c24]/5 rounded-full blur-[70px] sm:blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

        {/* Background GIF with Overlay */}
        <div className={`absolute inset-0 z-0 ${backgroundClassName}`}>
          <Image
            src="/IT_Banner.gif"
            alt="IT Banner"
            fill
            className="object-cover opacity-10 scale-105"
            priority
          />
          <div className="absolute inset-0 " />
        </div>

        <div className="max-w-8xl relative z-10 px-6 mx-auto pt-12 sm:pt-20 pb-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center space-y-6 sm:space-y-8"
          >
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-1.5 sm:py-2 bg-white/5 rounded-xl border border-white/10 text-[#ed1c24] text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] shadow-2xl"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ed1c24] rounded-full animate-ping" />
              {kicker}
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[1.1] sm:leading-[0.9] uppercase text-white"
            >
              {heading}
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-sm sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium tracking-tight leading-relaxed px-4 sm:px-0"
            >
              {description}
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4"
            >
              {renderCta(primaryCta, "primary")}
              {secondaryCta ? renderCta(secondaryCta, "secondary") : null}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

