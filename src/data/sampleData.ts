import { Announcement } from '@/types';

export const sampleAnnouncements: Announcement[] = [];

export const getSampleAnnouncementsByCategory = (category: string) => {
  return sampleAnnouncements.filter(announcement => 
    announcement.category === category && announcement.isActive
  );
};

export const getAllSampleAnnouncements = () => {
  return sampleAnnouncements.filter(announcement => announcement.isActive);
};
