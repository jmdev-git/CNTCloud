
'use client';

import { useState, useEffect } from 'react';
import { Announcement } from '@/types';
import { getAnnouncements } from '@/data/mockData';
import AnnouncementCard from './AnnouncementCard';

export default function LatestNews() {
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const load = async () => {
      const allAnnouncements = await getAnnouncements();
      const sorted = allAnnouncements.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLatestAnnouncements(sorted.slice(0, 5));
    };
    load();
  }, []);

  return (
    <div className="bg-zinc-950 py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-tighter">Latest News</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {latestAnnouncements.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      </div>
    </div>
  );
}
