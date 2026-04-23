'use client';

import { useState, useEffect } from 'react';
import { Announcement, AttendanceEvent } from '@/types';
import { getAllActiveAnnouncements } from '@/data/mockData';
import { getAllSampleAnnouncements } from '@/data/sampleData';
import AnnouncementCard from '@/components/AnnouncementCard';
import LucideIcon from '@/components/LucideIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function LatestNews() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const INITIAL_COUNT = 3;

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('announcements-updated', handleUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('announcements');
      bc.onmessage = () => handleUpdate();
    } catch {}
    return () => {
      window.removeEventListener('announcements-updated', handleUpdate);
      try {
        if (bc) bc.close();
      } catch {}
    };
  }, []);

  const [allData, setAllData] = useState<(Announcement | AttendanceEvent)[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const mockAnnouncements = await getAllActiveAnnouncements();
      const sampleAnnouncements = getAllSampleAnnouncements();
      
      // Fetch attendance events from API
      let attendanceEvents: AttendanceEvent[] = [];
      try {
        const res = await fetch('/api/attendance/events');
        if (res.ok) {
          attendanceEvents = await res.json();
        }
      } catch (error) {
        console.error('Failed to fetch attendance events:', error);
      }
      
      setAllData([...mockAnnouncements, ...sampleAnnouncements, ...attendanceEvents]);
    };
    fetchData();
  }, [refreshTrigger]);

  const latestNewsItems = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    return allData.filter((item) => {
      // Handle both announcements and attendance events
      const createdAt = new Date(item.createdAt);
      createdAt.setHours(0, 0, 0, 0);

      const isUploadedToday = createdAt.getTime() === today.getTime();
      const isUploadedRecently = createdAt >= oneWeekAgo && createdAt <= today;

      // Check if it's an attendance event
      const isAttendanceEvent = 'eventDate' in item && 'eventTime' in item;
      
      // Upcoming event is exact to that date (for attendance events)
      const isEventToday = isAttendanceEvent && item.eventDate && (() => {
        const eventDate = new Date(item.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      })();

      // For regular announcements with category 'events'
      const isRegularEventToday = !isAttendanceEvent && 'category' in item && item.category !== undefined && item.category === 'events' && item.eventDate && (() => {
        const eventDate = new Date(item.eventDate);
        if (Number.isNaN(eventDate.getTime())) return false;
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      })();

      return isUploadedToday || isUploadedRecently || isEventToday || isRegularEventToday;
    }).sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return aDate.getTime() - bDate.getTime();
    });
  })();

  const visibleItems = isExpanded ? latestNewsItems : latestNewsItems.slice(0, INITIAL_COUNT);
  const hasMoreItems = latestNewsItems.length > INITIAL_COUNT;

  if (latestNewsItems.length === 0) return null;

  return (
    <section id="latest-news" className="py-12 bg-white/5 border-y border-white/10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ed1c24] rounded-xl blur-md opacity-20 animate-pulse" />
              <div className="relative w-10 h-10 bg-[#ed1c24]/10 rounded-xl flex items-center justify-center border border-[#ed1c24]/20 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-[#ed1c24]/20 to-transparent" />
                <LucideIcon name="zap" className="w-5 h-5 text-[#ed1c24] relative z-10" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wider uppercase">Latest Updates</h2>
              <p className="text-base text-white/60 font-medium">Updates from today and this week</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) => {
              const itemId = 'id' in item ? item.id : item._id;
              return (
                <motion.div
                  key={itemId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    delay: isExpanded ? 0 : index * 0.1 
                  }}
                >
                  <AnnouncementCard announcement={item as any} variant="compact" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {hasMoreItems && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-10"
          >
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              className="group h-12 px-8 rounded-full border-2 border-gray-200 hover:border-[#ed1c24] hover:bg-[#ed1c24] hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-xs gap-2 shadow-sm"
            >
              {isExpanded ? (
                <>
                  See Less
                  <LucideIcon name="arrow-right" className="w-4 h-4 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
                </>
              ) : (
                <>
                  See All Latest News
                  <LucideIcon name="arrow-right" className="w-4 h-4 rotate-90 group-hover:translate-y-0.5 transition-transform" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
