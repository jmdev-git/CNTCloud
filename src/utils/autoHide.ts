import { Announcement, CATEGORIES } from '@/types';

export const calculateExpirationDate = (announcement: Announcement): Date | null => {
  const category = CATEGORIES[announcement.category];
  const createdAt = new Date(announcement.createdAt);
  if (announcement.expiresAt) {
    return new Date(announcement.expiresAt);
  }
  if (announcement.category === 'events' && announcement.eventDate) {
    const endOfDay = new Date(announcement.eventDate);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }
  if (category.rules.autoHideDays > 0) {
    const expirationDate = new Date(createdAt);
    expirationDate.setDate(expirationDate.getDate() + category.rules.autoHideDays);
    return expirationDate;
  }
  
  return null;
};

export const isAnnouncementExpired = (announcement: Announcement): boolean => {
  const expirationDate = calculateExpirationDate(announcement);
  
  if (!expirationDate) {
    return false; // No expiration set
  }
  
  const now = new Date();
  return now > expirationDate;
};

export const shouldDisplayAnnouncement = (announcement: Announcement): boolean => {
  // Check if announcement is active and not expired
  if (!announcement.isActive) {
    return false;
  }
  
  return !isAnnouncementExpired(announcement);
};

export const filterActiveAnnouncements = (announcements: Announcement[]): Announcement[] => {
  return announcements.filter(shouldDisplayAnnouncement);
};

export const getTimeUntilExpiration = (announcement: Announcement): string => {
  const expirationDate = calculateExpirationDate(announcement);
  
  if (!expirationDate) {
    return 'No expiration';
  }
  
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    return `Expires in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
};

export const getDaysUntilExpiration = (announcement: Announcement): number | null => {
  const expirationDate = calculateExpirationDate(announcement);
  if (!expirationDate) return null;
  
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const isEndingSoon = (announcement: Announcement): boolean => {
  const daysLeft = getDaysUntilExpiration(announcement);
  return daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
};

export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
};
