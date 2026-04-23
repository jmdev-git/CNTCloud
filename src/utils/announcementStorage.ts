import { Announcement } from '@/types';

const STORAGE_KEY = 'digital_bulletin_board_announcements';

export const loadAnnouncements = (): Announcement[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const serializedAnnouncements = localStorage.getItem(STORAGE_KEY);
    if (serializedAnnouncements === null) {
      return [];
    }
    const parsedAnnouncements: Announcement[] = JSON.parse(serializedAnnouncements);
    // Convert date strings back to Date objects
    return parsedAnnouncements.map(announcement => ({
      ...announcement,
      createdAt: new Date(announcement.createdAt),
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : undefined,
      eventDate: announcement.eventDate ? new Date(announcement.eventDate) : undefined,
    }));
  } catch (error) {
    console.error("Error loading announcements from localStorage:", error);
    return [];
  }
};

export const saveAnnouncements = (announcements: Announcement[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Convert Date objects to ISO strings for serialization
    const serializableAnnouncements = announcements.map(announcement => ({
      ...announcement,
      createdAt: announcement.createdAt.toISOString(),
      expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString() : undefined,
      eventDate: announcement.eventDate ? announcement.eventDate.toISOString() : undefined,
    }));
    const serializedAnnouncements = JSON.stringify(serializableAnnouncements);
    localStorage.setItem(STORAGE_KEY, serializedAnnouncements);
    
    // Dispatch custom event for real-time updates across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('announcements-updated'));
      try {
        // Also notify other tabs/windows via BroadcastChannel if available
        const bc = new BroadcastChannel('announcements');
        bc.postMessage({ type: 'updated' });
        bc.close();
      } catch {
        // Silently ignore if BroadcastChannel is unavailable
      }
    }
  } catch (error) {
    console.error("Error saving announcements to localStorage:", error);
  }
};
