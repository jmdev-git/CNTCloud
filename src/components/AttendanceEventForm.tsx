"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { sileo } from "sileo";
import { ATTENDANCE_CATEGORIES } from "@/types";
import LucideIcon from "./LucideIcon";

interface AttendanceEventFormProps {
  businessUnits: { _id: string; name: string }[];
  onSuccess: () => void;
}

export default function AttendanceEventForm({ businessUnits, onSuccess }: AttendanceEventFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "company-party",
    eventDate: "",
    eventTime: "",
    location: "",
    registrationDeadline: "",
    registrationDeadlineTime: "",
    businessUnit: "",
    maxAttendees: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        createdBy: session?.user?.name || session?.user?.email,
      };

      const response = await fetch("/api/attendance/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "company-party",
        eventDate: "",
        eventTime: "",
        location: "",
        registrationDeadline: "",
        registrationDeadlineTime: "",
        businessUnit: "",
        maxAttendees: "",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating event:", error);
      sileo.error({
        title: "Failed to create event",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
            placeholder="Enter event title"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Event Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          >
            {Object.entries(ATTENDANCE_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key} className="bg-[#0a0a0a]">
                {category.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Event Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Event Date *
          </label>
          <input
            type="date"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          />
        </div>

        {/* Event Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Event Time *
          </label>
          <input
            type="time"
            name="eventTime"
            value={formData.eventTime}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
            placeholder="Enter event location"
          />
        </div>

        {/* Business Unit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Business Unit *
          </label>
          <select
            name="businessUnit"
            value={formData.businessUnit}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          >
            <option value="" className="bg-[#0a0a0a]">Select business unit</option>
            {businessUnits.map((bu: { _id: string; name: string }) => (
              <option key={bu._id} value={bu.name} className="bg-[#0a0a0a]">
                {bu.name}
              </option>
            ))}
          </select>
        </div>

        {/* Registration Deadline Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Registration Deadline Date
          </label>
          <input
            type="date"
            name="registrationDeadline"
            value={formData.registrationDeadline}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          />
        </div>

        {/* Registration Deadline Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Registration Deadline Time
          </label>
          <input
            type="time"
            name="registrationDeadlineTime"
            value={formData.registrationDeadlineTime}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
          />
        </div>

        {/* Max Attendees */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Maximum Attendees (Optional)
          </label>
          <input
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all"
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ed1c24] focus:border-transparent transition-all resize-none"
          placeholder="Enter event description (optional)"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-[#ed1c24] hover:bg-[#d41a21] text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Event...
                </>
          ) : (
            <>
              <LucideIcon name="plus-circle" className="w-4 h-4" />
              Create Event
            </>
          )}
        </button>
      </div>
    </form>
  );
}
