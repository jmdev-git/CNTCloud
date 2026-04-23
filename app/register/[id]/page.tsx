"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, QrCode, User, Mail, ArrowLeft, Loader2, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import LucideIcon from "@/components/LucideIcon";
import { getEmployeeEmail, setEmployeeEmail } from "@/utils/ackStore";

export default function EventRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: getEmployeeEmail() || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [accessError, setAccessError] = useState<{ title: string; desc: string } | null>(null);

  const stripLeadingEmoji = (text: string) =>
    text.replace(/^\p{Extended_Pictographic}\s*/u, "");

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      setError("Could not load event details.");
    }
  }, [eventId]);

  const verifyAccess = useCallback(async (email: string, eventData: any) => {
    if (!email) return true;

    // Always fetch profile to auto-fill name
    setIsVerifyingAccess(true);
    try {
      const res = await fetch(`/api/company-emails/find?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        // Only show error for restricted events
        if (eventData?.registrationType && eventData.registrationType !== 'GENERAL') {
          setAccessError({
            title: "Profile Not Found",
            desc: "We couldn't find your company profile. Please make sure you are using your registered corporate email."
          });
          return false;
        }
        return true;
      }
      const profile = await res.json();
      setUserProfile(profile);

      // Always auto-fill name from profile
      if (profile.name) {
        setFormData(prev => ({ ...prev, name: profile.name }));
      }

      // Skip access checks for GENERAL events
      if (!eventData?.registrationType || eventData.registrationType === 'GENERAL') return true;

      if (eventData.registrationType === 'BU_ONLY') {
        const allowedBUs = eventData.allowedBusinessUnits || [];
        if (!allowedBUs.includes(profile.businessUnit)) {
          setAccessError({
            title: "Access Restricted",
            desc: `This event is only open to members of ${allowedBUs.join(', ')}. Your Business Unit: ${profile.businessUnit}`
          });
          return false;
        }
      }

      if (eventData.registrationType === 'INVITE_ONLY') {
        const invitedUsers = eventData.invitedUsers || [];
        if (!invitedUsers?.some((e: string) => e.toLowerCase() === email.toLowerCase())) {
          setAccessError({
            title: "Exclusive Invite",
            desc: "This is a private event. Only invited guests are allowed to register."
          });
          return false;
        }
      }

      if (eventData.registrationType === 'RULE_BASED' && eventData.ruleConfig?.type === 'BIRTHDAY') {
        const birthDateStr = profile.birthdate; 
        if (birthDateStr) {
          const birthDate = new Date(birthDateStr);
          if (birthDate.getMonth() !== eventData.ruleConfig.month) {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            setAccessError({
              title: "Rule-Based Access",
              desc: `This event is only for users with birthdays in ${months[eventData.ruleConfig.month]}.`
            });
            return false;
          }
        } else {
          setAccessError({
            title: "Incomplete Profile",
            desc: "Your birthday information is missing. This event requires birthday verification."
          });
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Access verification error:", err);
      return false;
    } finally {
      setIsVerifyingAccess(false);
    }
  }, []);

  const checkExistingRegistration = useCallback(async (email: string) => {
    if (!email || !event) return;
    try {
      // If it's an attendance event, use the attendance registration API
      const registrationApi = event.attendanceEventId 
        ? `/api/attendance/register?eventId=${event.attendanceEventId}`
        : `/api/events/${eventId}/attendance`;
        
      const res = await fetch(registrationApi);
      if (res.ok) {
        const data = await res.json();
        const myRegistration = data.find(
          (r: any) => (r.employeeEmail || r.userEmail).toLowerCase() === email.toLowerCase()
        );
        if (myRegistration) {
          setRegistration(myRegistration);
          const qrData = myRegistration.qrCodeData || JSON.stringify({
            eventId: event.attendanceEventId || eventId,
            userEmail: email.toLowerCase()
          });
          
          // Generate QR code directly on the client
          const dataUrl = await QRCode.toDataURL(qrData, {
            width: 1000,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          setQrCodeUrl(dataUrl);
          // Pre-fill form with the name from the registration if available
          setFormData(prev => ({ ...prev, name: myRegistration.employeeName || myRegistration.userName }));
        }
      }
    } catch (err) {
      console.error("Failed to check existing registration:", err);
    }
  }, [eventId, event]);

  useEffect(() => {
    const init = async () => {
      await fetchEvent();
    };
    init();
  }, [fetchEvent]);

  useEffect(() => {
    if (event) {
      // Check for email in URL (Magic Link)
      const urlParams = new URLSearchParams(window.location.search);
      const urlEmail = urlParams.get('email');
      
      const savedEmail = urlEmail || getEmployeeEmail();
      
      if (savedEmail) {
        if (urlEmail) {
          // If coming from magic link, save it for persistence
          setEmployeeEmail(urlEmail.toLowerCase());
          // Also update formData
          setFormData(prev => ({ ...prev, email: urlEmail.toLowerCase() }));
        }
        checkExistingRegistration(savedEmail);
        verifyAccess(savedEmail, event);
      } else {
        // No email saved, need to verify
        router.push(`/verify?next=${encodeURIComponent(window.location.pathname)}`);
      }
      setLoading(false);
    }
  }, [event, checkExistingRegistration, verifyAccess, router]);

  const isDeadlinePassed = (() => {
    if (!event?.registrationDeadline) return false;
    const deadline = new Date(event.registrationDeadline);
    if (event.registrationDeadlineTime) {
      const [hours, minutes] = event.registrationDeadlineTime.split(':').map(Number);
      deadline.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      deadline.setHours(23, 59, 59, 999);
    }
    return new Date() > deadline;
  })();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || isDeadlinePassed) return;

    setRegistering(true);
    setError(null);

    try {
      const isAttendanceEvent = !!event.attendanceEventId;
      const registrationApi = isAttendanceEvent 
        ? "/api/attendance/register" 
        : `/api/events/${eventId}/attendance`;
        
      const payload = isAttendanceEvent 
        ? { eventId: event.attendanceEventId, userEmail: formData.email, userName: formData.name }
        : { employeeEmail: formData.email, employeeName: formData.name };

      const res = await fetch(registrationApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setRegistration(data);
        setEmployeeEmail(formData.email);
        
        const qrData = data.qrCodeData || JSON.stringify({
          eventId: event.attendanceEventId || eventId,
          userEmail: formData.email.toLowerCase()
        });

        // Generate QR client-side so it works even after browser close/reopen
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 1000,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: { dark: "#000000", light: "#ffffff" },
        });
        setQrCodeUrl(dataUrl);

      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred during registration.");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-4">
        <p className="text-white/60 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-red-500/30">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-20">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="mb-4">
              <Image 
                src="/GOC.png" 
                alt="Logo" 
                width={100} 
                height={40} 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
              Event Registration
            </div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none">
              {stripLeadingEmoji(event.title)}
            </h1>
            <div className="flex flex-wrap gap-6 pt-2">
              {event.eventDate && (
                <div className="flex items-center gap-2 text-white/40">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-white/40">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">{event.location}</span>
                </div>
              )}
            </div>

            {event.imageUrl && (
              <div className="relative w-full aspect-[1920/760] bg-white/5 rounded-3xl overflow-hidden border border-white/10 mt-8">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {event.content && (
              <div className="pt-4">
                <p className="text-white/70 text-lg leading-relaxed whitespace-pre-wrap font-medium tracking-tight italic">
                  &quot;{event.content}&quot;
                </p>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {accessError ? (
              <motion.div
                key="access-error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-6"
              >
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <LucideIcon name="shield-off" className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">{accessError.title}</h2>
                  <p className="text-white/60 text-sm font-medium leading-relaxed">
                    {accessError.desc}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Pulse
                </button>
              </motion.div>
            ) : !registration ? (
              isDeadlinePassed ? (
                <motion.div
                  key="deadline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                    <LucideIcon name="alert-circle" className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">Registration Closed</h2>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">
                      We&apos;re sorry, but the registration deadline for this event has already passed. 
                      <br />
                      <span className="text-rose-400 font-bold mt-2 block uppercase tracking-widest text-[10px]">
                        Deadline: {event?.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : ''} 
                        {event?.registrationDeadlineTime ? ` at ${event.registrationDeadlineTime}` : ''}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl"
                >
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          required
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-white/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                          Corporate Email
                        </label>
                        <span className="text-[8px] font-bold text-red-500/60 uppercase tracking-widest">
                          Required: Registered Company Email
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          required
                          type="email"
                          disabled
                          placeholder="yourname@cntgroup.ph"
                          value={formData.email}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-white/10 opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                        {error}
                      </p>
                    )}

                    <button
                      disabled={registering}
                      className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-2xl shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {registering ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Confirm Attendance
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )
            ) : (
              <motion.div
                key="qr"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-8"
              >
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Registration Complete</h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    You are already registered for this event. Your unique entry pass is shown below.
                  </p>
                </div>

                <div className="space-y-6 pt-4">
                  {qrCodeUrl && (
                    <div className="relative aspect-square w-64 mx-auto bg-white rounded-2xl overflow-hidden p-4 shadow-2xl shadow-emerald-500/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="Registration QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Registered For</p>
                    <p className="text-xl font-black uppercase tracking-tight">{registration.employeeName || registration.userName}</p>
                    <p className="text-xs font-bold text-white/60">{registration.employeeEmail || registration.userEmail}</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mt-4">
                    <QrCode className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Show this QR code at the event entrance for quick check-in.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
