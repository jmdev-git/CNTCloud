"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function EventsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchUserRegistrations();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/attendance/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      sileo.error({ title: "Failed to load events" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const response = await fetch("/api/attendance/register");
      if (response.ok) {
        const data = await response.json();
        setUserRegistrations(data);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const handleNavigateToRegistration = (eventId: string) => {
    router.push(`/events/register/${eventId}`);
  };

  const isUserRegistered = (eventId: string) => {
    return userRegistrations.some(reg => reg.eventId === eventId);
  };

  const isRegistrationOpen = (event: AttendanceEvent) => {
    if (!event.isActive) return false;
    if (event.registrationDeadline) {
      return new Date() <= new Date(event.registrationDeadline);
    }
    return true;
  };

  const canUserRegister = (event: AttendanceEvent) => {
    if (!session?.user) return false;
    if (isUserRegistered(event._id)) return false;
    if (!isRegistrationOpen(event)) return false;

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
          <p className="text-white">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-linear-to-r from-[#ed1c24] to-[#b71c1c] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">Event Registration</h1>
          <p className="text-white/80 text-sm sm:text-lg">
            Register for upcoming events and get your QR code for attendance
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <LucideIcon name="calendar" className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Events Available</h3>
            <p className="text-slate-400">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const categoryInfo = getCategoryInfo(event.category);
              const isRegistered = isUserRegistered(event._id);
              const canRegister = canUserRegister(event);
              const registration = userRegistrations.find(reg => reg.eventId === event._id);

              return (
                <div key={event._id} className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden hover:border-[#ed1c24]/50 transition-all duration-300">
                  {/* Event Header */}
                  <div className={`h-2 bg-gradient-to-r ${categoryInfo.color.replace('bg-', 'from-')} to-${categoryInfo.color.replace('bg-', '')}/80`}></div>
                  
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-8 h-8 ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                        <LucideIcon name={categoryInfo.icon || 'calendar'} className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {categoryInfo.displayName}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                    
                    {/* Event Description */}
                    {event.description && (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                    )}

                    {/* Event Details */}
                    <div className="space-y-3 mb-6">
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
                    </div>

                    {/* Registration Status */}
                    {isRegistered ? (
                      <div className="space-y-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <LucideIcon name="check-circle" className="w-4 h-4" />
                            Registered
                          </div>
                        </div>
                        <button
                          onClick={() => handleNavigateToRegistration(event._id)}
                          className="w-full px-4 py-2 bg-[#ed1c24] hover:bg-[#d41a21] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <LucideIcon name="qr-code" className="w-4 h-4" />
                          View QR Code
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNavigateToRegistration(event._id)}
                        disabled={!canRegister}
                        className={`w-full px-4 py-2 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          canRegister
                            ? 'bg-[#ed1c24] hover:bg-[#d41a21] text-white'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <>
                          <LucideIcon name="user-plus" className="w-4 h-4" />
                          {canRegister ? 'Register Now' : 'Registration Closed'}
                        </>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
