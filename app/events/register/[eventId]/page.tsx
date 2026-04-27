"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { sileo } from "sileo";
import { ATTENDANCE_CATEGORIES } from "@/types";
import LucideIcon from "@/components/LucideIcon";
import Image from "next/image";

interface AttendanceEvent {
  _id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  eventTime: string;
  location: string;
  maxAttendees?: number;
  registrationDeadline?: string;
  registrationDeadlineTime?: string;
  businessUnit?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Registration {
  _id: string;
  eventId: string;
  userEmail: string;
  userName: string;
  qrCodeData: string;
  registeredAt: string;
  attended: boolean;
  attendedAt?: string;
}

export default function EventRegistrationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<AttendanceEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      checkExistingRegistration();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/attendance/events`);
      if (response.ok) {
        const events = await response.json();
        const foundEvent = events.find((e: AttendanceEvent) => e._id === eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          setError("Event not found");
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    try {
      const response = await fetch(`/api/attendance/register?eventId=${eventId}`);
      if (response.ok) {
        const registrations = await response.json();
        const userRegistration = registrations.find((reg: Registration) => 
          reg.userEmail === session?.user?.email
        );
        if (userRegistration) {
          setRegistration(userRegistration);
        }
      }
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

  const handleRegister = async () => {
    if (!session?.user || !event) return;

    setRegistering(true);
    setError("");

    try {
      const response = await fetch("/api/attendance/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          userEmail: session.user.email || "",
          userName: session.user.name || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register for event");
      }

      setRegistration(data);
      sileo.success({
        title: "Registration Successful",
        description: "You have been registered for this event",
      });
    } catch (error) {
      console.error("Error registering for event:", error);
      setError(error instanceof Error ? error.message : "Please try again");
      sileo.error({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setRegistering(false);
    }
  };

  const isRegistrationOpen = () => {
    if (!event?.isActive) return false;
    if (event?.registrationDeadline) {
      return new Date() <= new Date(event.registrationDeadline);
    }
    return true;
  };

  const canUserRegister = () => {
    if (!session?.user || !event) return false;
    if (registration) return false;
    if (!isRegistrationOpen()) return false;

    // Check business unit validation
    const userBusinessUnits = (session.user as any)?.businessUnits || [];
    if (event.businessUnit && !userBusinessUnits.includes(event.businessUnit)) {
      return false;
    }

    return true;
  };

  const getCategoryInfo = (category: string) => {
    return ATTENDANCE_CATEGORIES[category] || ATTENDANCE_CATEGORIES['company-party'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <LucideIcon name="alert-circle" className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Event Not Found</h3>
          <p className="text-slate-400 mb-6">{error || "This event doesn't exist or has been removed"}</p>
          <button
            onClick={() => router.push("/events")}
            className="px-6 py-2 bg-[#ed1c24] hover:bg-[#d41a21] text-white font-medium rounded-lg transition-all duration-200"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(event.category);
  const canRegister = canUserRegister();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#ed1c24] to-[#b71c1c] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4 leading-tight">EVENT REGISTRATION: {event.title.toUpperCase()}</h1>
          <p className="text-white/80 text-sm sm:text-lg">
            Register for this event and get your QR code for attendance
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>
              
              <div className="space-y-4">
                {/* Category Badge */}
                {event.category && (
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                      <LucideIcon name={categoryInfo.icon || 'calendar'} className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      {categoryInfo.displayName}
                    </span>
                  </div>
                )}

                {/* Event Title */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-slate-300">{event.description}</p>
                  )}
                </div>

                {/* Event Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <LucideIcon name="calendar" className="w-4 h-4 text-[#ed1c24]" />
                    <span className="text-slate-300">
                      {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <LucideIcon name="map-pin" className="w-4 h-4 text-[#ed1c24]" />
                    <span className="text-slate-300">{event.location}</span>
                  </div>
                  {event.registrationDeadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <LucideIcon name="clock" className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-300">
                        Registration closes: {new Date(event.registrationDeadline).toLocaleDateString()}
                        {event.registrationDeadlineTime && ` at ${event.registrationDeadlineTime}`}
                      </span>
                    </div>
                  )}
                  {event.businessUnit && (
                    <div className="flex items-center gap-3 text-sm">
                      <LucideIcon name="building" className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">{event.businessUnit}</span>
                    </div>
                  )}
                  {event.maxAttendees && (
                    <div className="flex items-center gap-3 text-sm">
                      <LucideIcon name="users" className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300">Maximum attendees: {event.maxAttendees}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Registration Information</h2>
              
              {!registration ? (
                <div className="space-y-6">
                  {/* User Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={session?.user?.name && session.user.name !== session.user.email ? session.user.name : (session?.user?.email || "")}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        value={session?.user?.email || ""}
                        disabled
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
                        placeholder="Your corporate email"
                      />
                    </div>
                  </div>

                  {/* Registration Status */}
                  {!canRegister && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <LucideIcon name="alert-circle" className="w-5 h-5 text-rose-400" />
                        <div>
                          <p className="text-rose-400 font-medium">Registration Not Available</p>
                          <p className="text-rose-300 text-sm mt-1">
                            {!event.isActive ? "Event is not active" :
                             event.registrationDeadline && new Date() > new Date(event.registrationDeadline) ? "Registration deadline has passed" :
                             event.businessUnit && !((session?.user as any)?.businessUnits || []).includes(event.businessUnit) ? "This event is for a different business unit" :
                             "You are already registered"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    onClick={handleRegister}
                    disabled={!canRegister || registering}
                    className={`w-full px-6 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      canRegister && !registering
                        ? 'bg-[#ed1c24] hover:bg-[#d41a21] text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {registering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <LucideIcon name="user-plus" className="w-5 h-5" />
                        Register for Event
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* QR Code Display */
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <LucideIcon name="check-circle" className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-emerald-400 font-semibold text-lg">Registration Complete</p>
                        <p className="text-emerald-300 text-sm">
                          Registered on: {new Date(registration.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-white font-semibold text-lg mb-4">Your QR Code</h3>
                    <div className="bg-white p-4 sm:p-6 rounded-xl inline-block">
                      <img 
                        src={registration.qrCodeData} 
                        alt="Event QR Code" 
                        className="w-48 h-48 sm:w-64 sm:h-64"
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-4">
                      Show this QR code at the event entrance for attendance verification
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
