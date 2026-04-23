"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Footer from "../components/Footer";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  ShieldCheck,
  Zap,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Cloud,
  MessageSquare,
  Newspaper,
  Monitor,
  LayoutDashboard,
  Building,
} from "lucide-react";
import CloudspaceHeader from "../components/CloudspaceHeader";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";

const fadeIn = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
};

interface BusinessUnit {
  _id: string;
  name: string;
  label: string;
  image: string;
  color: string;
}

export default function AboutPage() {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBUs = async () => {
      try {
        const res = await fetch("/api/admin/business-units");
        if (res.ok) {
          const data = await res.json();
          setBusinessUnits(data);
        }
      } catch (error) {
        console.error("Failed to fetch business units:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBUs();
  }, []);

  return (
    <main className="min-h-screen bg-[#000] text-white selection:bg-[#ed1c24]/30 overflow-x-hidden">
      <CloudspaceHeader />

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ed1c24]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#1E40AF]/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* 🚀 Hero Section */}
        <section id="hero" className="pt-24 sm:pt-36">
          <div className="container px-4 sm:px-6 mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-[#000]/80 via-slate-950 to-[#000]/80 border border-white/5 shadow-[0_0_80px_-20px_rgba(59,110,220,0.2)]"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#ed1c24]/10 rounded-full blur-[80px] sm:blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-[#ed1c24]/5 rounded-full blur-[60px] sm:blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse delay-700" />

              <div className="relative z-10 pb-16 sm:pb-24 pt-10 sm:pt-14 px-6 sm:px-8 text-center ">
                <motion.h1
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.2] sm:leading-[1.1] tracking-tighter uppercase"
                >
                  <span className="text-white font-black">WE </span>
                  <span className="text-[#ed1c24] font-black">ENHANCE WORKFLOWS AND </span>
                  <br className="hidden sm:block" />
                  <span className="text-[#ed1c24] font-black">EMPLOYEE EXPERIENCE </span>
                  <br className="hidden sm:block" />
                  <span className="text-white font-black">WITH CNT CLOUDSPACE</span>
                </motion.h1>
              </div>
            </motion.div>

            {/* 🏷️ Business Units Section - Overlapping the Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative z-20 bg-[#000] -mt-6 sm:-mt-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] sm:shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5)] max-w-6xl mx-auto border border-white/5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-[#ed1c24] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative h-32 sm:h-40 md:h-56 flex flex-col items-center justify-center overflow-hidden">
                  {/* Root Logo: CNT GROUP - Fixed in the center with a masking background */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    {/* Central Masking Area: Hides logos passing through the middle */}
                    <div className="absolute inset-y-0 w-[180px] sm:w-[220px] md:w-[280px] bg-[#000] flex items-center justify-center">
                      {/* Left Gradient Shadow for the mask */}
                      <div className="absolute -left-10 sm:-left-20 inset-y-0 w-10 sm:w-20 bg-gradient-to-r from-transparent to-[#000] pointer-events-none" />
                      
                      {/* Right Gradient Shadow for the mask */}
                      <div className="absolute -right-10 sm:-right-20 inset-y-0 w-10 sm:w-20 bg-gradient-to-l from-transparent to-[#000] pointer-events-none" />

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex flex-col items-center gap-1 sm:gap-2 group pointer-events-auto relative z-30"
                      >
                        <div className="relative w-24 h-10 sm:w-32 sm:h-14 md:w-48 md:h-20 flex items-center justify-center bg-[#000] rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/10 shadow-[0_0_30px_-10px_rgba(59,110,220,0.3)] sm:shadow-[0_0_50px_-12px_rgba(59,110,220,0.3)] group-hover:bg-[#ed1c24]/10 group-hover:border-[#ed1c24]/30 transition-all duration-300">
                          <Image
                            src="/CNTGROUP.png"
                            alt="CNT GROUP"
                            fill
                            className="object-contain p-1.5 sm:p-2 brightness-110 group-hover:brightness-125 transition-all"
                          />
                        </div>
                        <span className="text-[8px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center transition-colors">
                          GROUP of Companies
                        </span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Other Business Units with Infinite Slider - Sliding behind the center logo */}
                  <div className="w-full relative overflow-hidden z-10 py-6 sm:py-10">
                    <InfiniteSlider gap={30} speed={40} speedOnHover={20}>
                      {businessUnits
                        .filter(
                          (bu) =>
                            bu.name.toUpperCase() !== "CNT GROUP" &&
                            bu.name.toUpperCase() !== "CNT GROUP OF COMPANIES"
                        )
                        .map((bu) => (
                          <motion.div
                            key={bu._id}
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center gap-1.5 sm:gap-2 group shrink-0"
                          >
                            <div className="relative w-20 h-8 sm:w-24 sm:h-10 md:w-36 md:h-16 flex items-center justify-center bg-[#000]/40 rounded-lg sm:rounded-2xl p-2 sm:p-3 border border-white/5 shadow-xl group-hover:bg-[#ed1c24]/10 group-hover:border-[#ed1c24]/30 transition-all duration-300">
                              {bu.image ? (
                                <Image
                                  src={bu.image}
                                  alt={bu.name}
                                  fill
                                  className="object-contain p-1.5 sm:p-2 brightness-90 group-hover:brightness-110 transition-all opacity-80 group-hover:opacity-100"
                                />
                              ) : (
                                <Building className="w-5 h-5 sm:w-8 h-8 text-[#ed1c24]/40 group-hover:text-[#ed1c24]" />
                              )}
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-white/40 group-hover:text-white/80 uppercase tracking-widest text-center max-w-[80px] sm:max-w-[100px] leading-tight transition-colors">
                              {bu.name}
                            </span>
                          </motion.div>
                        ))}
                    </InfiniteSlider>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* 🛠️ Purpose & Transformation Section */}
        <section className="py-8 sm:py-12 mt-6 sm:mt-10 bg-white/[0.02] border-y border-white/5">
          <div className="container px-4 sm:px-6 mx-auto">
            <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 sm:space-y-4"
              >
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter leading-tight">
                  REPLACING <span className="text-[#ed1c24]">CHAOS</span> WITH CLARITY.
                  <br />
                  <span className="text-[#ed1c24]">FRAGMENTATION</span> WITH UNITY.
                </h2>
                <p className="text-[#ed1c24] text-[10px] sm:text-sm md:text-base font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase px-4">
                  CNT CloudSpace was born from a mission to solve the challenges that held us back.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-base sm:text-xl md:text-2xl text-slate-300 font-medium leading-relaxed tracking-tight px-2 sm:px-0">
                    From the frustration of <span className="text-white font-bold">lost files</span> and <span className="text-white font-bold">fragmented systems</span> to the silence of <span className="text-white font-bold">disconnected communication</span>—these gaps weren't just hurdles; they were barriers to our growth. We recognized that the future of CNT required more than just an upgrade; it demanded a <span className="text-[#ed1c24] font-bold">strategic revolution</span>.
                  </p>
                  
                  <p className="text-sm sm:text-base md:text-xl text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto px-2 sm:px-0">
                    By creating a centralized, secure, and infinitely scalable digital ecosystem, we've transformed how we operate. This is where every department connects, every file is found, and every voice is heard. <span className="text-white font-bold uppercase tracking-tight">CNT CloudSpace</span> is our unified foundation for innovation, collaboration, and a more secure future.
                  </p>
                </div>

                <div className="w-16 sm:w-20 h-1 bg-[#ed1c24] mx-auto rounded-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="pt-10 sm:pt-16 pb-10 sm:pb-16 relative overflow-hidden">
          <div className="container px-4 sm:px-6 mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <motion.h2
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tighter"
              >
                CORE <span className="text-[#ed1c24]">CAPABILITIES.</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureDetail
                icon={LayoutDashboard}
                title="Unified Workspace"
                description="A centralized gateway that consolidates all CNT systems, applications, and resources into a single, intuitive interface—accessible across devices."
              />
              <FeatureDetail
                icon={Monitor}
                title="IT Helpdesk System"
                description="A structured support system enabling real-time ticket submission and tracking, direct communication with IT personnel, and faster issue resolution with accountability."
              />
              <FeatureDetail
                icon={MessageSquare}
                title="Secure Enterprise Chat"
                description="A private, encrypted communication platform featuring department-based channels and real-time messaging for seamless team collaboration."
              />
              <FeatureDetail
                icon={Newspaper}
                title="Pulse"
                description="The official communication hub of CNT for company-wide announcements, real-time updates, and organizational visibility across all branches."
              />
              <FeatureDetail
                icon={Cloud}
                title="Cloud Storage System"
                description="A secure and scalable repository for company documents and files with controlled access, permissions, and reliable backup and availability."
              />
              <FeatureDetail
                icon={ShieldCheck}
                title="Enterprise-Grade Security"
                description="Built with strict security standards to ensure end-to-end data protection, controlled system access, and secure collaboration across all departments."
              />
            </div>
          </div>
        </section>

        {/* Why CNT CloudSpace? Section */}
        <section className="py-10 sm:py-16 bg-[#000] border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="text-center mb-8 sm:mb-12">
              <motion.h2
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white uppercase tracking-tighter"
              >
                Why <span className="text-[#ed1c24]">CNT CloudSpace?</span>
              </motion.h2>
              <motion.p
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
                className="mt-3 sm:mt-4 text-slate-400 font-medium text-[13px] sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed px-4"
              >
                Built to bridge the gaps in communication, security, and accessibility, 
                our platform is the backbone of CNT's digital transformation.
              </motion.p>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Data Storage - Full Width with Background Image */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-[#000]/50 backdrop-blur-md border border-white/5 hover:border-[#ed1c24]/30 transition-all group min-h-[350px] sm:min-h-[250px] flex flex-col md:flex-row"
              >
                {/* Text Content */}
                <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center space-y-3 sm:space-y-4 order-2 md:order-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] shrink-0">
                    <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                      DATA <span className="text-[#ed1c24]">STORAGE</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-medium text-[13px] sm:text-sm md:text-base">
                      A secure and centralized repository for all organizational data, ensuring
                      information is never lost and always accessible. We empower every CNT employee
                      through a unified digital ecosystem.
                    </p>
                  </div>
                </div>

                {/* Background/Side Image (B1.png) */}
                <div className="relative w-full md:w-1/2 min-h-[180px] sm:min-h-[200px] md:min-h-full overflow-hidden order-1 md:order-2">
                  <Image
                    src="/B1.png"
                    alt="Data Storage"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient Overlay to fade text into image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#000] via-transparent to-transparent hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-transparent to-transparent md:hidden" />
                </div>
              </motion.div>

              {/* Enterprise Security - Full Width with Background Image */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-[#000]/50 backdrop-blur-md border border-white/5 hover:border-[#ed1c24]/30 transition-all group min-h-[350px] sm:min-h-[250px] flex flex-col md:flex-row-reverse"
              >
                {/* Text Content */}
                <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center space-y-3 sm:space-y-4 order-2 md:order-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                      ENTERPRISE <span className="text-[#ed1c24]">SECURITY</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-medium text-[13px] sm:text-sm md:text-base">
                      Protecting our digital assets with advanced encryption and access controls 
                      to maintain data integrity and secure collaboration across all departments.
                    </p>
                  </div>
                </div>

                {/* Background/Side Image (B2.png) */}
                <div className="relative w-full md:w-1/2 min-h-[180px] sm:min-h-[200px] md:min-h-full overflow-hidden order-1 md:order-2">
                  <Image
                    src="/B2.png"
                    alt="Enterprise Security"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient Overlay to fade text into image */}
                  <div className="absolute inset-0 bg-gradient-to-l from-[#000] via-transparent to-transparent hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-transparent to-transparent md:hidden" />
                </div>
              </motion.div>

              {/* Seamless Collaboration - Full Width with Background Image */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-[#000]/50 backdrop-blur-md border border-white/5 hover:border-[#ed1c24]/30 transition-all group min-h-[350px] sm:min-h-[250px] flex flex-col md:flex-row"
              >
                {/* Text Content */}
                <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center space-y-3 sm:space-y-4 order-2 md:order-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                      SEAMLESS <span className="text-[#ed1c24]">COLLABORATION</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-medium text-[13px] sm:text-sm md:text-base">
                      Breaking down departmental silos through real-time communication and shared digital workspaces, ensuring every voice is heard.
                    </p>
                  </div>
                </div>

                {/* Background/Side Image (B3.png) */}
                <div className="relative w-full md:w-1/2 min-h-[180px] sm:min-h-[200px] md:min-h-full overflow-hidden order-1 md:order-2">
                  <Image
                    src="/B3.png"
                    alt="Seamless Collaboration"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient Overlay to fade text into image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#000] via-transparent to-transparent hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-transparent to-transparent md:hidden" />
                </div>
              </motion.div>

              {/* Global Accessibility - Full Width with Background Image */}
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-[#000]/50 backdrop-blur-md border border-white/5 hover:border-[#ed1c24]/30 transition-all group min-h-[350px] sm:min-h-[250px] flex flex-col md:flex-row-reverse"
              >
                {/* Text Content */}
                <div className="relative z-10 w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center space-y-3 sm:space-y-4 order-2 md:order-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24] shrink-0">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
                      GLOBAL <span className="text-[#ed1c24]">ACCESSIBILITY</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-medium text-[13px] sm:text-sm md:text-base">
                      Connecting every CNT branch and employee across the globe. Our unified platform
                      provides a seamless experience, accessible anytime, 24/7.
                    </p>
                  </div>
                </div>

                {/* Background/Side Image (B4.png) */}
                <div className="relative w-full md:w-1/2 min-h-[180px] sm:min-h-[200px] md:min-h-full overflow-hidden order-1 md:order-2">
                  <Image
                    src="/B4.png"
                    alt="Global Accessibility"
                    fill
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient Overlay to fade text into image */}
                  <div className="absolute inset-0 bg-gradient-to-l from-[#000] via-transparent to-transparent hidden md:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-transparent to-transparent md:hidden" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Vision Section */}
        <section className="py-10 sm:py-16 bg-white/5 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#ed1c24]/5 pointer-events-none" />
          <div className="container px-4 sm:px-6 mx-auto max-w-4xl relative z-10 text-center">
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="space-y-4 sm:space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter">
                Our <span className="text-[#ed1c24]">Vision</span>
              </h2>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-300 leading-tight tracking-tight px-4 sm:px-0">
                To empower every CNT employee through a unified digital
                ecosystem—driving efficiency, innovation, and operational
                excellence.
              </p>
            </motion.div>
          </div>
        </section>


        <Footer showSupportInfo={false} />
      </div>
    </main>
  );
}

function FeatureDetail({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="p-8 rounded-[2.5rem] bg-[#000]/50 backdrop-blur-md border border-white/5 hover:border-[#ed1c24]/30 transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#ed1c24] mb-6 group-hover:bg-[#ed1c24] group-hover:text-white transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium text-sm md:text-base">{description}</p>
    </motion.div>
  );
}

