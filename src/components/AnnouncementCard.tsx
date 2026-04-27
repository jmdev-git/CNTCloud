"use client";

import { Announcement, CATEGORIES, CategoryType } from "@/types";
import LucideIcon from "./LucideIcon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
  CarouselIndicator,
} from "@/components/motion-primitives/carousel";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Confetti, ConfettiRef } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { getEmployeeEmail, hasAcknowledged, setEmployeeEmail } from "@/utils/ackStore";
import { isEndingSoon as checkEndingSoon, getTimeAgo, getDaysUntilExpiration } from "@/utils/autoHide";

interface AnnouncementCardProps {
  announcement: Announcement;
  triggerId?: string;
  variant?: "default" | "compact";
}

export default function AnnouncementCard({
  announcement,
  triggerId,
  variant = "default",
}: AnnouncementCardProps) {
  const [businessUnits, setBusinessUnits] = useState<{ _id: string; name: string; label: string; color: string; image: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchBUs = async () => {
      try {
        const res = await fetch('/api/admin/business-units');
        if (res.ok) {
          const data = await res.json();
          setBusinessUnits(data);
        }
      } catch (error) {
        console.error('Failed to fetch business units:', error);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchBUs();
    fetchCategories();
  }, []);

  const getCategoryInfo = useCallback((catName: string) => {
    const known = CATEGORIES[catName as CategoryType];
    if (known) return known;
    
    const dynamic = categories.find(c => c.name === catName);
    if (dynamic) {
      return {
        id: dynamic._id,
        name: dynamic.name,
        displayName: dynamic.name,
        description: "",
        color: dynamic.color || "bg-blue-600",
        rules: {
          hasText: true,
          hasLink: true,
          hasFile: true,
          hasImage: true,
          hasDate: true,
          autoHideDays: 30
        }
      };
    }
    
    return {
      id: catName,
      name: catName,
      displayName: catName,
      description: "",
      color: "bg-blue-600",
      rules: {
        hasText: true,
        hasLink: true,
        hasFile: true,
        hasImage: true,
        hasDate: true,
        autoHideDays: 30
      }
    };
  }, [categories]);

  const category = getCategoryInfo(announcement.category);
  const confettiRef = useRef<ConfettiRef>(null);
  const isCompact = variant === "compact";
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registration, setRegistration] = useState<{ isPresent: boolean; qrCodeData?: string; employeeName?: string; employeeEmail?: string; registeredAt?: string | Date } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [currentAckStatus, setCurrentAckStatus] = useState(false);

  const isEvent = announcement.category === "events" || categories.some(c => c.name === announcement.category && c.type === 'attendance');

  const fetchRegistration = useCallback(async () => {
    const email = getEmployeeEmail();
    if (!isEvent || !email) return;

    try {
      const res = await fetch(`/api/events/${announcement.id}/attendance`);
      if (res.ok) {
        const data = await res.json();
        const myRegistration = data.find((r: any) => r.employeeEmail.toLowerCase() === email.toLowerCase());
        if (myRegistration) {
          setRegistration(myRegistration);
          if (myRegistration.qrCodeData) {
            // Generate QR code directly on the client
            const dataUrl = await QRCode.toDataURL(myRegistration.qrCodeData, {
              width: 1000,
              margin: 1,
              errorCorrectionLevel: 'H',
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            });
            setQrCodeUrl(dataUrl);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch registration:", error);
    }
  }, [isEvent, announcement.id]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const handleRegister = async () => {
    const email = getEmployeeEmail();
    if (!email) {
      // If no email, redirect to verify
      window.location.href = `/verify?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsRegistering(true);
    try {
      // Try to fetch employee profile first for the real name
      let employeeName = email.split("@")[0].toUpperCase(); // Fallback name
      try {
        const profileRes = await fetch(`/api/company-emails/find?email=${encodeURIComponent(email)}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.name) {
            employeeName = profile.name;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch profile during registration, using fallback name.");
      }

      const res = await fetch(`/api/events/${announcement.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeEmail: email,
          employeeName: employeeName,
        }),
      });

      if (res.ok) {
        // Save email for future events
        setEmployeeEmail(email);
        await fetchRegistration();
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    const updateStatus = () => {
      const email = getEmployeeEmail();
      if (email) {
        setCurrentAckStatus(hasAcknowledged(announcement.id, email));
      }
    };

    updateStatus();
    window.addEventListener('acknowledgments-updated', updateStatus);
    return () => window.removeEventListener('acknowledgments-updated', updateStatus);
  }, [announcement.id]);

  const needsAck =
    announcement.category === "policy" &&
    !!announcement.requiresAcknowledgment;

  const handleAccessFile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (announcement.link) {
      if (needsAck) {
        window.open(`/memo/${announcement.id}`, "_blank");
      } else {
        // Use the secure bulletin route instead of the direct link
        window.open(`/bulletin/${announcement.id}`, "_blank");
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (needsAck && currentAckStatus && announcement.link) {
      handleAccessFile(e);
    }
  };
 
  function ShowMoreText({
    text,
    className,
    center,
  }: {
    text: string;
    className?: string;
    center?: boolean;
  }) {
    const pRef = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);
    useEffect(() => {
      const el = pRef.current;
      if (!el) return;
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }, [text, expanded]);
    return (
      <div className={center ? "text-center" : "text-left"}>
        <p ref={pRef} className={cn(className, !expanded && "line-clamp-2")}>
          {text}
        </p>
        {clamped && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "mt-2 text-[10px] font-black uppercase tracking-widest text-[#ed1c24] hover:text-white transition-colors",
              center && "mx-auto"
            )}
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    );
  }

  // Auto-slide effect for birthday carousel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isDialogOpen &&
      announcement.category === "birthday-celebrants" &&
      announcement.imageUrls &&
      announcement.imageUrls.length > 1
    ) {
      interval = setInterval(() => {
        setCarouselIndex((prevIndex) =>
          prevIndex === (announcement.imageUrls?.length || 1) - 1
            ? 0
            : prevIndex + 1,
        );
      }, 3000); // Slide every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDialogOpen, announcement.category, announcement.imageUrls]);
 
  const stripAllEmojis = (text: string) =>
    text.replace(/\p{Extended_Pictographic}/gu, "").trim();

  const isEmployeeOfMonth =
    announcement.category === "company-news" &&
    (announcement.imageUrl?.includes("EmployeeOfTheMonth") ||
      announcement.imageUrl?.includes("EmployeeOfMonth"));

  const cleanTitle = (title: string) => {
    let text = stripAllEmojis(title);
    if (isEmployeeOfMonth) {
      text = text.replace(/Employee of the Month:\s*/i, "");
    }
    return text;
  };

  const getTitleIconName = () => {
    switch (announcement.category) {
      case "events":
        return "calendar";
      case "company-news":
        return "bar-chart";
      case "urgent-notices":
        return "alert-circle";
      case "policy":
        return "file-text";
      case "birthday-celebrants":
        return "cake";
      case "food-menu":
        return "utensils";
      default:
        return "file-text";
    }
  };

  const getCategorySurfaceClasses = () => {
    // If it's a dynamic category with a color, we might want to use it
    // But for now let's stick to the themed styles for known categories
    const map: Record<string, string> = {
      events: "bg-red-950/40 border-red-500/30",
      "company-news": "bg-emerald-950/40 border-emerald-500/30",
      "urgent-notices": "bg-rose-950/40 border-rose-500/30",
      policy: "bg-violet-950/40 border-violet-500/30",
      "birthday-celebrants": "bg-amber-950/40 border-amber-500/30",
      "food-menu": "bg-zinc-950 border-zinc-900/30",
    };
    
    // If it's a dynamic category, use a neutral theme or derive from color
    return map[announcement.category] || "bg-zinc-900/40 border-zinc-500/30";
  };

  const getCategoryGlowClasses = () => {
    const map: Record<string, string> = {
      events: "from-red-500/20 via-red-500/10 to-transparent",
      "company-news": "from-emerald-500/20 via-emerald-500/10 to-transparent",
      "urgent-notices": "from-rose-500/20 via-rose-500/10 to-transparent",
      policy: "from-violet-500/20 via-violet-500/10 to-transparent",
      "birthday-celebrants": "from-amber-500/20 via-amber-500/10 to-transparent",
      "food-menu": "from-zinc-500/20 via-zinc-500/10 to-transparent",
    };
    return map[announcement.category] || "from-blue-500/20 via-blue-500/10 to-transparent";
  };

  const getImageOverlayGradient = () => {
    const map: Record<string, string> = {
      events: "from-red-950/30 via-red-950/10 to-transparent",
      "company-news": "from-emerald-950/28 via-emerald-950/10 to-transparent",
      "urgent-notices": "from-rose-950/28 via-rose-950/10 to-transparent",
      policy: "from-violet-950/28 via-violet-950/10 to-transparent",
      "birthday-celebrants": "from-amber-950/25 via-amber-950/10 to-transparent",
      "food-menu": "from-zinc-950/25 via-zinc-950/10 to-transparent",
    };
    return map[announcement.category] || "from-zinc-950/25 via-zinc-950/10 to-transparent";
  };

  const getModalHeaderGradient = () => {
    const map: Record<string, string> = {
      events: "bg-gradient-to-r from-red-600/20 to-transparent",
      "company-news": "bg-gradient-to-r from-emerald-600/20 to-transparent",
      "urgent-notices": "bg-gradient-to-r from-rose-600/20 to-transparent",
      policy: "bg-gradient-to-r from-violet-600/20 to-transparent",
      "birthday-celebrants": "bg-gradient-to-r from-amber-600/20 to-transparent",
      "food-menu": "bg-gradient-to-r from-zinc-600/20 to-transparent",
    };
    return map[announcement.category] || "bg-gradient-to-r from-white/10 to-transparent";
  };

  const getModalBorderClasses = () => {
    const map: Record<string, string> = {
      events: "border-red-500/30 shadow-[0_0_40px_-10px_rgba(239,68,68,0.2)]",
      "company-news": "border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]",
      "urgent-notices": "border-rose-500/30 shadow-[0_0_40px_-10px_rgba(244,63,94,0.2)]",
      policy: "border-violet-500/30 shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]",
      "birthday-celebrants": "border-amber-500/30 shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)]",
      "food-menu": "border-zinc-500/30 shadow-[0_0_40px_-10px_rgba(113,113,122,0.2)]",
    };
    return map[announcement.category] || "border-white/10 shadow-2xl";
  };

  const isEndingSoon = checkEndingSoon(announcement);

  const getCardStyle = (isInteractive: boolean = false) => {
    const baseStyle = cn(
      "rounded-xl shadow-lg transition-all duration-500 border relative overflow-hidden flex flex-col w-full group isolate",
      isCompact ? "h-64 p-5" : "h-[320px] p-5",
      isInteractive
        ? "hover:shadow-2xl hover:-translate-y-1 cursor-pointer z-10"
        : "hover:shadow-xl hover:scale-[1.005]",
      bgSrc && !isCompact ? "border-none" : "",
      isEndingSoon && "border-rose-500/40 shadow-rose-500/10",
    );

    if (bgSrc && !isCompact) return baseStyle;

    return cn(
      baseStyle,
      "text-white",
      getCategorySurfaceClasses(),
      "shadow-xl",
    );
  };

  const getCategoryBadgeStyle = () => {
    return "bg-white/5 text-white border border-white/10 shadow-none hover:bg-white/10 transition-all";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const isBirthday = announcement.category === "birthday-celebrants";
  const isFoodMenu = announcement.category === "food-menu";
  const isUrgent = announcement.category === "urgent-notices";
  const isPolicy = announcement.category === "policy";
  const isCompanyNews = announcement.category === "company-news";

  const daysLeft = getDaysUntilExpiration(announcement);

  const normalizeBU = (s?: string) => {
    const v = (s || "").trim();
    if (!v) return "";
    const clean = v.toUpperCase().replace(/[^A-Z0-9]+/g, ""); // Remove all spaces and symbols
    if (clean.startsWith("FRONT")) return "FRONTIER";
    if (clean.startsWith("LYFELAN")) return "LYFE LAND";
    if (clean.includes("PROMO") && (clean.includes("ADS") || clean.includes("AD"))) return "CNT PROMO & ADS SPECIALISTS";
    return v.toUpperCase();
  };

  const buConfig = useMemo(() => {
    const currentBU = announcement.businessUnit || "CNT GROUP";

    const normBU = normalizeBU(currentBU);
    // Find in dynamic business units from DB first
    const buData = businessUnits.find(b => normalizeBU(b.name) === normBU);

    if (buData) {
      return {
        label: buData.label,
        color: buData.color,
        image: buData.image
      };
    }

    // Default fallback based on schema defaults for known units
    const defaults: Record<string, string> = {
      "CNT GROUP": "/CNT_PROMO_ADS_SPECIALISTS.png",
      "CNT GROUPS": "/CNT_PROMO_ADS_SPECIALISTS.png",
      "CNT PROMO & ADS SPECIALIST": "/CNT_PROMO_ADS_SPECIALISTS.png",
      "CNT INTERNATIONAL": "/CNT_INTERNATIONAL.png",
      "SYNERGY": "/SYNERGY.png",
      "LYFE MARKETING": "/LYFE_MARKETING.png",
      "Frontier": "/FRONTIER.png",
      "Lyfe Land": "/LYFE_LAND.png",
    };
    
    // Check if normalized name exists in defaults, or use the normalized name itself
    const lookupName = Object.keys(defaults).find(k => normalizeBU(k) === normBU) || normBU;
    
    return {
      label: currentBU.substring(0, 4).toUpperCase(),
      color: "#ed1c24",
      image: defaults[lookupName] || "/CNT_PROMO_ADS_SPECIALISTS.png"
    };
  }, [businessUnits, announcement]);

  const isInteractive =
    isBirthday ||
    isEmployeeOfMonth ||
    isFoodMenu ||
    isUrgent ||
    isPolicy ||
    isEvent ||
    isCompanyNews ||
    needsAck ||
    !!announcement.link;

  const initialCardImage =
    announcement.imageUrl ||
    (announcement.imageUrls && announcement.imageUrls[0]) ||
    null;
  const [bgSrc, setBgSrc] = useState<string | null>(initialCardImage);

  // Sync bgSrc when announcement image changes
  useEffect(() => {
    setBgSrc(announcement.imageUrl || (announcement.imageUrls && announcement.imageUrls[0]) || null);
  }, [announcement.imageUrl, announcement.imageUrls]);

  const currentMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(announcement.createdAt);

  const CardBody = (
    <>
      {/* Modern Decorative Glows for Compact Cards */}
      {isCompact && (
        <>
          <div 
            className={cn(
              "absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-20 z-0",
              (announcement.category === "events" || categories.some(c => c.name === announcement.category && c.type === 'attendance')) && "bg-red-500",
              announcement.category === "company-news" && "bg-emerald-500",
              announcement.category === "urgent-notices" && "bg-rose-500",
              announcement.category === "policy" && "bg-purple-500",
              announcement.category === "birthday-celebrants" && "bg-amber-500",
              announcement.category === "food-menu" && "bg-slate-500",
            )}
          />
        </>
      )}

      {!bgSrc && (
        <>
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className={cn("absolute -left-24 -top-24 w-[420px] h-[420px] rounded-full blur-[110px] opacity-30", "bg-gradient-to-br", getCategoryGlowClasses())} />
            <div className="absolute inset-0 bg-white/[0.02]" />
          </div>
        </>
      )}

      {/* BU Watermark */}
      {(!bgSrc || isCompact) && buConfig?.image && (
        <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center pointer-events-none">
          <Image
            src={buConfig.image}
            alt={`${buConfig.label} logo`}
            fill
            className="object-fit opacity-5"
          />
        </div>
      )}

      {bgSrc && !isCompact && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgSrc}
            alt={announcement.title}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110",
              !announcement.imageUrl && !announcement.imageUrls && "opacity-80"
            )}
            onError={() => {
              setBgSrc(null);
            }}
          />
          <div className="absolute inset-0 bg-white/5" />
          <div className={cn("absolute inset-0 bg-gradient-to-t", getImageOverlayGradient())} />
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {/* Header: Category + Time */}
        <div
          className={cn(
            "flex items-start justify-between shrink-0 relative z-10",
            isCompact ? "mb-5" : "mb-8",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center font-bold rounded-lg uppercase tracking-widest transition-all duration-500",
              isCompact 
                ? "px-2.5 py-1 text-[9px] bg-white text-[#000] border border-white/10 shadow-md hover:bg-white/90" 
                : "px-3.5 py-1 text-[10px]",
              !isCompact && getCategoryBadgeStyle(),
            )}
          >
            {category.displayName}
          </span>
          <div className="flex items-center gap-2">
            <div className="text-right">
              {isEndingSoon ? (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-tighter shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                      Ending Soon
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest drop-shadow-md">
                      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                    </span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                      {getTimeAgo(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <span
                  className={cn(
                    "text-[10px] font-bold leading-none uppercase tracking-widest",
                    bgSrc && !isCompact ? "text-white/60" : "text-gray-400",
                  )}
                >
                  {getTimeAgo(announcement.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div
          className={cn(
            "flex items-center gap-4 shrink-0 relative z-10",
            isCompact ? "mb-4" : "mb-6",
          )}
        >
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-xl shrink-0 shadow-lg transition-all duration-700 group-hover:scale-110 group-hover:rotate-6",
              "w-12 h-12 md:w-16 md:h-16 bg-white/5 border border-white/10",
            )}
          >
            <LucideIcon
              name={getTitleIconName()}
              className={cn(
                isCompact ? "w-6 h-6" : "w-8 h-8",
                "text-white/80",
              )}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h3
              className={cn(
                "font-black leading-[1.1] tracking-tighter line-clamp-2 text-left transition-all duration-500",
                "text-white",
                isCompact ? "text-2xl" : isBirthday ? "text-4xl" : "text-3xl",
              )}
            >
              {cleanTitle(announcement.title)}
            </h3>
            {needsAck && !currentAckStatus && (
              <div
                className={cn(
                  "mt-2 w-fit inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg transition-all",
                  "bg-white/10 text-white border border-white/20 animate-pulse",
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full mr-2", "bg-white shadow-[0_0_8px_white]")} />
                Priority Action
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="flex-1 overflow-hidden text-left relative z-10 pr-2">
          {announcement.content && (
            <div
              className={cn(
                "leading-relaxed text-left transition-opacity duration-500",
                "text-white/70",
                isCompact ? "text-lg font-bold pr-8" : "text-xl mb-8",
              )}
            >
              <p
                className={cn(
                  "text-left",
                  isCompact ? "line-clamp-2" : "line-clamp-3",
                )}
              >
                {announcement.content}
              </p>
            </div>
          )}

          {/* Event Image Preview - Hidden in card-bg mode or compact mode */}
          {isEvent && !isCompact && !bgSrc && announcement.imageUrl && (
            <div className="mb-3 relative w-full h-24 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={announcement.imageUrl}
                alt="Event Image"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Meta - Hidden in compact mode */}
          {(announcement.eventDate ||
            announcement.eventTime ||
            announcement.location) &&
            !isCompact && (
              <div
                className={cn(
                  "rounded-lg text-left shadow-sm backdrop-blur-sm",
                  "bg-white/10 border border-white/10",
                  isCompact ? "p-2 space-y-1.5 mt-1" : "p-2.5 space-y-1.5 mb-3",
                )}
              >
                {announcement.eventDate && (
                  <div
                    className={cn(
                      "flex items-center text-left",
                      "text-white/90",
                      isCompact ? "text-xs" : "text-xs",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-md bg-blue-600 text-white mr-2 shrink-0 shadow-sm",
                        isCompact ? "w-4 h-4" : "w-5 h-5",
                      )}
                    >
                      <LucideIcon
                        name="calendar"
                        className={cn(
                          isCompact ? "w-2.5 h-2.5" : "w-3 h-3",
                          "text-white",
                        )}
                      />
                    </span>
                    {!isCompact && (
                      <span className="font-medium shrink-0 text-left">
                        Date:
                      </span>
                    )}
                    <span className="ml-1 truncate text-left">
                      {formatDate(announcement.eventDate)}
                    </span>
                  </div>
                )}
                {announcement.location && (
                  <div
                    className={cn(
                      "flex items-center text-left",
                      "text-white/90",
                      isCompact ? "text-xs" : "text-xs",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-md bg-emerald-600 text-white mr-2 shrink-0 shadow-sm",
                        isCompact ? "w-4 h-4" : "w-5 h-5",
                      )}
                    >
                      <LucideIcon
                        name="map-pin"
                        className={cn(
                          isCompact ? "w-2.5 h-2.5" : "w-3 h-3",
                          "text-white",
                        )}
                      />
                    </span>
                    {!isCompact && (
                      <span className="font-medium shrink-0 text-left">
                        Location:
                      </span>
                    )}
                    <span className="ml-1 truncate text-left">
                      {announcement.location}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Action Buttons - Hidden in compact mode */}
          {!isCompact &&
            !announcement.category.includes("birthday-celebrants") &&
            !isEmployeeOfMonth && (
              <div className="flex items-center space-x-3 mb-2">
                {announcement.link && (
                  <button
                    onClick={() => handleAccessFile()}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1 uppercase tracking-wider shadow-md hover:scale-105 transition-transform",
                      bgSrc
                        ? "bg-white text-[#1a2438]"
                        : "bg-[#1a2438] text-white",
                    )}
                  >
                    <LucideIcon name="external-link" className="w-3 h-3" />
                    <span>Access File</span>
                  </button>
                )}

                {announcement.fileUrl &&
                  announcement.category !== "company-news" && (
                    <a
                      href={announcement.fileUrl}
                      download
                      className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg flex items-center space-x-1 uppercase tracking-wider shadow-md hover:scale-105 transition-transform"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LucideIcon name="file-text" className="w-3 h-3" />
                      <span>File</span>
                    </a>
                  )}
              </div>
            )}
        </div>
      </div>

      {/* Expiration Info - Hidden in compact mode or if ending soon */}
      {announcement.expiresAt && !isCompact && !isEndingSoon && (
        <div
          className={cn(
            "mt-auto pt-3 shrink-0 relative z-10",
            bgSrc ? "border-t border-white/10" : "border-t border-gray-200/50",
          )}
        >
          <div
            className={cn(
              "flex items-center text-xs font-bold",
              bgSrc ? "text-white/60" : "text-gray-500",
            )}
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Expires: {formatDate(announcement.expiresAt)}</span>
          </div>
        </div>
      )}
    </>
  );

  let mainContent;

  if (needsAck && currentAckStatus && announcement.link) {
    mainContent = (
      <div id={triggerId} onClick={handleCardClick} className={getCardStyle(true)}>
        {CardBody}
      </div>
    );
  } else if (isUrgent || isPolicy) {
    mainContent = (
      <Dialog
        onOpenChange={setIsDialogOpen}
      >
        <DialogTrigger id={triggerId} className={getCardStyle(true)}>
          {CardBody}
        </DialogTrigger>
        <DialogContent className={cn(
          "w-[95vw] max-w-4xl bg-[#000] rounded-2xl p-0 border overflow-hidden z-[100] max-h-[90vh] flex flex-col",
          getModalBorderClasses()
        )}>
          <div className="flex flex-col overflow-y-auto corporate-scrollbar">
            <div
              className={cn(
                "p-6 md:p-8 pr-12 md:pr-16 text-white shrink-0 relative overflow-hidden",
                getModalHeaderGradient()
              )}
            >
              {/* Large background icon for depth */}
              <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 pointer-events-none">
                <LucideIcon
                  name={getTitleIconName()}
                  className="w-32 h-32 md:w-48 md:h-48 text-white"
                />
              </div>

              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 relative z-10">
                <span className="inline-flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                  <LucideIcon
                    name={getTitleIconName()}
                    className="w-5 h-5 md:w-7 md:h-7 text-white"
                  />
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] opacity-80 leading-none mb-1">
                    {category.displayName}
                  </span>
                  <div className="h-0.5 md:h-1 w-8 md:w-10 bg-white/30 rounded-full" />
                </div>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight relative z-10 uppercase">
                {cleanTitle(announcement.title)}
              </h2>
            </div>

            {announcement.content && (
              <div className="p-6 md:p-10 bg-[#000] overflow-y-auto max-h-[60vh] text-left">
                <div className="max-w-4xl mx-auto">
                  <ShowMoreText
                    text={stripAllEmojis(announcement.content)}
                    className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-left font-medium tracking-tight"
                  />

                  {/* Links/Files in full view */}
                  {(announcement.link || announcement.fileUrl) && (
                    <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-white/10 flex flex-wrap gap-4 md:gap-6">
                      {announcement.link && announcement.category !== "company-news" && (
                        <button
                          onClick={() => handleAccessFile()}
                          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#ed1c24] text-white text-[10px] md:text-[12px] font-black rounded-xl hover:bg-red-800 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl hover:shadow-[#ed1c24]/40 active:scale-95 group uppercase tracking-[0.2em]"
                        >
                          <LucideIcon
                            name="external-link"
                            className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12"
                          />
                          Access Official File
                        </button>
                      )}
                      {announcement.fileUrl &&
                        announcement.category !== "company-news" && (
                          <a
                            href={announcement.fileUrl}
                            download
                            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-emerald-600 text-white text-[10px] md:text-[12px] font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl hover:shadow-emerald-600/40 active:scale-95 group uppercase tracking-[0.2em]"
                          >
                            <LucideIcon
                              name="file-down"
                              className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-y-0.5"
                            />
                            {announcement.category === "policy"
                              ? "Download Policy"
                              : "Download File"}
                          </a>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] px-6 md:px-12 gap-2">
              <div className="flex items-center gap-2">
                <LucideIcon name="calendar" className="w-3 h-3 md:w-4 md:h-4" />
                <span>Published: {formatDate(announcement.createdAt)}</span>
              </div>
              {announcement.expiresAt && (
                <div className="flex items-center gap-2">
                  <LucideIcon name="clock" className="w-3 h-3 md:w-4 md:h-4" />
                  <span className={cn(
                    "font-bold",
                    isEndingSoon ? "text-rose-400" : "text-white/20"
                  )}>
                    {isEndingSoon ? "Ending Soon" : `Valid until: ${formatDate(announcement.expiresAt)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  } else if (isEvent) {
    const qrViewerUrl = registration 
      ? `/qr-code-viewer?data=${encodeURIComponent(registration.qrCodeData || '')}&eventTitle=${encodeURIComponent(announcement.title)}&description=${encodeURIComponent(announcement.content || "")}&employeeName=${encodeURIComponent(registration.employeeName || '')}&employeeEmail=${encodeURIComponent(registration.employeeEmail || '')}&eventDate=${encodeURIComponent(announcement.eventDate?.toString() || "")}&location=${encodeURIComponent(announcement.location || "")}&registeredAt=${encodeURIComponent(registration.registeredAt?.toString() || "")}`
      : `/register/${announcement.id}`;

    mainContent = (
      <a 
        id={triggerId} 
        href={qrViewerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={getCardStyle(true)}
      >
        {CardBody}
      </a>
    );
  } else if (isInteractive) {
    mainContent = (
      <Dialog
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setCarouselIndex(0); // Reset index when closed
          if (open && isBirthday) {
            setTimeout(() => {
              confettiRef.current?.fire({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [
                  "#ff0000",
                  "#ffa500",
                  "#ffff00",
                  "#008000",
                  "#0000ff",
                  "#4b0082",
                  "#ee82ee",
                ],
              });
            }, 300);
          }
        }}
      >
        <DialogTrigger id={triggerId} className={getCardStyle(true)}>
          {CardBody}
        </DialogTrigger>
        <DialogContent
          className={cn(
            "w-[95vw] max-w-4xl bg-[#000] rounded-2xl p-0 border overflow-hidden z-[100] max-h-[90vh] flex flex-col",
            getModalBorderClasses()
          )}
        >
          <div className="relative flex-1 overflow-y-auto corporate-scrollbar">
            {isBirthday && (
              <Confetti
                ref={confettiRef}
                className="absolute left-0 top-0 z-50 size-full pointer-events-none"
                manualstart
              />
            )}
            {isBirthday &&
            announcement.imageUrls &&
            announcement.imageUrls.length > 0 ? (
              <div className="flex flex-col bg-[#000] overflow-hidden">
                {/* Top Title Section - Corporate Header */}
                <div className={cn("p-6 md:p-8 pb-3 md:pb-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 gap-4", getModalHeaderGradient())}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/20 text-amber-400 shadow-xl border border-amber-500/30 backdrop-blur-md">
                      <LucideIcon name="cake" className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Happy <span className="text-amber-400">Birthday!</span>
                      </h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-amber-400/60 uppercase tracking-[0.3em] mt-1">
                        Celebrating our team members
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-[10px] md:text-[12px] font-black text-white/40 uppercase tracking-[0.2em]">
                      {currentMonthYear}
                    </p>
                  </div>
                </div>

                {/* Middle Image Section (Clean Corporate 1920x760) */}
                <div className="relative w-full aspect-[1920/760] bg-black/40 overflow-hidden group/hero">
                  <Carousel
                    index={carouselIndex}
                    onIndexChange={setCarouselIndex}
                    className="w-full h-full"
                  >
                    <CarouselContent className="h-full">
                      {announcement.imageUrls.map((url, index) => (
                        <CarouselItem key={index} className="relative h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Birthday ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselNavigation
                      alwaysShow
                      className="left-4 md:left-6 right-4 md:right-6 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] justify-between z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300"
                      classNameButton="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 shadow-2xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center pointer-events-auto text-white rounded-xl transition-all hover:scale-110"
                    />
                    <CarouselIndicator className="bottom-4 md:bottom-6 z-30" />
                  </Carousel>
                </div>

                {/* Bottom Info Bar */}
                <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-6 md:px-10 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <LucideIcon name="calendar" className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Published: {formatDate(announcement.createdAt)}</span>
                  </div>
                  {announcement.expiresAt && (
                    <div className="flex items-center gap-2">
                      <LucideIcon name="clock" className="w-3 h-3 md:w-4 md:h-4" />
                      <span className={cn(
                        "font-bold",
                        isEndingSoon ? "text-rose-400" : "text-white/20"
                      )}>
                        {isEndingSoon ? "Ending Soon" : `Valid until: ${formatDate(announcement.expiresAt)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : isFoodMenu && announcement.imageUrl ? (
              <div className="flex flex-col max-h-[90vh] bg-[#000]">
                {/* Top Title Section - Corporate Header */}
                <div className={cn("p-6 md:p-8 pb-3 md:pb-4 border-b border-white/5 shrink-0", getModalHeaderGradient())}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 text-white shadow-xl border border-white/10 backdrop-blur-md">
                        <LucideIcon
                          name="utensils-cross-over"
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                      </span>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                          Food <span className="text-[#ed1c24]">Menu</span>
                        </h2>
                        <p className="text-white/40 text-[9px] md:text-[10px] font-bold mt-1 uppercase tracking-[0.3em]">
                          {currentMonthYear} • Cafeteria Service
                        </p>
                      </div>
                    </div>
                    <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-[0.2em] shadow-inner">
                      Weekly Specials
                    </div>
                  </div>
                </div>

                {/* Middle Image Section (Standardized Corporate 1920x760) */}
                <div className="relative w-full aspect-[1920/760] bg-black/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={announcement.imageUrl!}
                    alt="Food Menu"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="px-6 py-4 md:px-10 md:py-6 bg-[#000] flex-1 overflow-y-auto corporate-scrollbar">
                  <div className="max-w-3xl mx-auto text-center">
                    <ShowMoreText
                      text={stripAllEmojis(announcement.content)}
                      className="text-white/90 text-lg md:text-xl font-medium italic mb-4 leading-relaxed tracking-tight"
                      center
                    />
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-6 md:px-10 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <LucideIcon name="calendar" className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Published: {formatDate(announcement.createdAt)}</span>
                  </div>
                  {announcement.expiresAt && (
                    <div className="flex items-center gap-2">
                      <LucideIcon name="clock" className="w-3 h-3 md:w-4 md:h-4" />
                      <span className={cn(
                        "font-bold",
                        isEndingSoon ? "text-rose-400" : "text-white/20"
                      )}>
                        {isEndingSoon ? "Ending Soon" : `Valid until: ${formatDate(announcement.expiresAt)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : isEvent ? (
              <div className="flex flex-col bg-[#000] overflow-hidden">
                {/* Top Title Section - Corporate Header */}
                <div className={cn("p-6 md:p-8 pb-3 md:pb-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center relative border-b border-white/5 gap-4", getModalHeaderGradient())}>
                  <div className="flex gap-4 md:gap-5 items-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-red-500/20 text-red-400 shadow-xl border border-red-500/30 backdrop-blur-md shrink-0">
                      <LucideIcon name="calendar" className="w-6 h-6 md:w-7 md:h-7" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="mb-2">
                        <Image 
                          src="/GOC.png" 
                          alt="Logo" 
                          width={60} 
                          height={24} 
                          className="h-6 w-auto object-contain"
                        />
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none truncate">
                        {cleanTitle(announcement.title)}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
                        <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/20">
                          <LucideIcon name="clock" className="w-3 md:w-3.5 md:h-3.5 text-red-400" />
                          <p className="text-[8px] md:text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                            {announcement.eventDate
                              ? formatDate(announcement.eventDate).toUpperCase()
                              : "MARK YOUR CALENDARS"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                          <LucideIcon name="map-pin" className="w-3 md:w-3.5 md:h-3.5 text-white/60" />
                          <p className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                            {announcement.location?.toUpperCase() ||
                              "VARIOUS LOCATIONS"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration / Attendance QR Section */}
                {isEvent && announcement.requiresAcknowledgment && (
                  <div className="px-6 md:px-10 py-6 bg-[#000] border-b border-white/5">
                    <div className="max-w-xl mx-auto">
                      {!registration ? (
                        <div className="text-center space-y-4">
                          {(() => {
                            const regDeadline = announcement.registrationDeadline;
                            const regDeadlineTime = announcement.registrationDeadlineTime;
                            let isDeadlinePassed = false;
                            let deadlineString = "";

                            if (regDeadline) {
                              const deadline = new Date(regDeadline);
                              if (regDeadlineTime) {
                                const [hours, minutes] = regDeadlineTime.split(':').map(Number);
                                deadline.setHours(hours || 0, minutes || 0, 0, 0);
                                deadlineString = `${new Date(regDeadline).toLocaleDateString()} at ${regDeadlineTime}`;
                              } else {
                                deadline.setHours(23, 59, 59, 999);
                                deadlineString = new Date(regDeadline).toLocaleDateString();
                              }
                              isDeadlinePassed = new Date() > deadline;
                            }

                            if (isDeadlinePassed) {
                              return (
                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                                  <LucideIcon name="alert-circle" className="w-8 h-8 text-rose-500 mx-auto" />
                                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Registration Closed</h4>
                                  <p className="text-white/60 text-sm font-medium">
                                    The deadline for registration ({deadlineString}) has already passed.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <>
                                <p className="text-white/60 text-sm font-medium">
                                  Plan to attend? Register now to get your entry QR code.
                                </p>
                                <a
                                  href={`/register/${announcement.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-xl hover:shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                >
                                  Register for Event
                                  <LucideIcon name="external-link" className="w-4 h-4" />
                                </a>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                          {qrCodeUrl ? (
                            <div className="relative group">
                              <div className="absolute -inset-4 bg-white/10 rounded-3xl blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                              <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                                <Image
                                  src={qrCodeUrl}
                                  alt="Attendance QR Code"
                                  width={200}
                                  height={200}
                                  className="w-40 h-40 md:w-48 md:h-48"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-40 h-40 bg-white/10 rounded-2xl animate-pulse" />
                          )}
                          <div className="text-center md:text-left space-y-3">
                            <div className="space-y-1">
                              <h4 className="text-xl font-black text-white uppercase tracking-tighter">
                                You&apos;re Registered!
                              </h4>
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                Scan this code at the event entrance
                              </p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                registration.isPresent 
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              )}>
                                {registration.isPresent ? "Status: Present" : "Status: Registered"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Middle Image Section (Corporate 1920x760) */}
                <div className="relative w-full aspect-[1920/760] bg-black/40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={announcement.imageUrl || "/event.png"}
                    alt="Event Image"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Description Section */}
                <div className="p-6 md:p-10 text-left bg-[#000] overflow-y-auto corporate-scrollbar max-h-[40vh]">
                  <div className="max-w-3xl mx-auto">
                    <ShowMoreText
                      text={`${stripAllEmojis(announcement.content)}`}
                      className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium italic tracking-tight"
                    />
                  </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-6 md:px-10 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <LucideIcon name="calendar" className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Published: {formatDate(announcement.createdAt)}</span>
                  </div>
                  {announcement.expiresAt && (
                    <div className="flex items-center gap-2">
                      <LucideIcon name="clock" className="w-3 h-3 md:w-4 md:h-4" />
                      <span className={cn(
                        "font-bold",
                        isEndingSoon ? "text-rose-400" : "text-white/20"
                      )}>
                        {isEndingSoon ? "Ending Soon" : `Valid until: ${formatDate(announcement.expiresAt)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col bg-[#000] overflow-hidden">
                {/* Default Corporate Dialog View */}
                <div className={cn("p-6 md:p-8 pb-3 md:pb-4 shrink-0 flex items-center justify-between border-b border-white/5", getModalHeaderGradient())}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 text-white shadow-xl border border-white/10 backdrop-blur-md">
                      <LucideIcon name={getTitleIconName()} className="w-5 h-5 md:w-6 md:h-6" />
                    </span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        {cleanTitle(announcement.title)}
                      </h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">
                        {category.displayName} • Announcement
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hero Image (Corporate 1920x760) */}
                {announcement.imageUrl && (
                  <div className="relative w-full aspect-[1920/760] bg-black/40 overflow-hidden border-y border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content Section */}
                <div className="p-6 md:p-10 bg-[#000] overflow-y-auto max-h-[50vh] corporate-scrollbar">
                  <div className="max-w-4xl mx-auto">
                    <ShowMoreText
                      text={stripAllEmojis(announcement.content)}
                      className="text-white/90 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-medium tracking-tight"
                    />
                    
                    {announcement.link && (
                      <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-white/10">
                        <button
                          onClick={() => handleAccessFile()}
                          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#ed1c24] text-white text-[10px] md:text-[12px] font-black rounded-xl hover:bg-red-800 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl hover:shadow-[#ed1c24]/40 active:scale-95 group uppercase tracking-[0.2em]"
                        >
                          <LucideIcon
                            name="external-link"
                            className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:rotate-12"
                          />
                          Access Resource
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] px-6 md:px-10 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <LucideIcon name="calendar" className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Published: {formatDate(announcement.createdAt)}</span>
                  </div>
                  {announcement.expiresAt && (
                    <div className="flex items-center gap-2">
                      <LucideIcon name="clock" className="w-3 h-3 md:w-4 md:h-4" />
                      <span className={cn(
                        "font-bold",
                        isEndingSoon ? "text-rose-400" : "text-white/20"
                      )}>
                        {isEndingSoon ? "Ending Soon" : `Valid until: ${formatDate(announcement.expiresAt)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  } else {
    mainContent = (
      <div id={triggerId} onClick={handleCardClick} className={getCardStyle(false)}>
        {CardBody}
      </div>
    );
  }

  return (
    <>
      {mainContent}
    </>
  );
}
