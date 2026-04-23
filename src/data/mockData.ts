import { Announcement } from '@/types';
import { filterActiveAnnouncements } from '@/utils/autoHide';

const mapAnnouncementFromApi = (ann: Announcement & { _id: string }): Announcement => ({
  ...ann,
  id: ann._id,
  createdAt: new Date(ann.createdAt),
  expiresAt: ann.expiresAt ? new Date(ann.expiresAt) : undefined,
  eventDate: ann.eventDate ? new Date(ann.eventDate) : undefined,
});

const mapAttendanceEventToAnnouncement = (evt: any): Announcement => ({
  id: evt._id,
  title: evt.title,
  content: evt.description || "",
  category: "events", // Map attendance events to the 'events' category for Pulse display
  isActive: evt.isActive ?? true,
  createdAt: new Date(evt.createdAt),
  eventDate: new Date(evt.eventDate),
  location: evt.location || "",
  createdBy: evt.createdBy || "Admin",
  requiresAcknowledgment: true, // Attendance events always require registration/attendance
});

// Fetch all announcements and attendance events from MongoDB
export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const response = await fetch('/api/announcements');

    if (response.ok) {
      const data = await response.json();
      return data.map((ann: any) => mapAnnouncementFromApi(ann));
    }

    return [];
  } catch (error) {
    console.error('Error in getAnnouncements:', error);
    return [];
  }
};

// Add a new announcement to MongoDB
export const addAnnouncement = async (newAnnouncement: Omit<Announcement, 'id'>): Promise<Announcement> => {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAnnouncement),
    });
    if (!response.ok) throw new Error('Failed to add announcement');
    const created = (await response.json()) as Announcement & { _id: string };
    return mapAnnouncementFromApi(created);
  } catch (error) {
    console.error('Error in addAnnouncement:', error);
    throw error;
  }
};

// Update an existing announcement in MongoDB
export const updateAnnouncement = async (id: string, updatedAnnouncement: Partial<Announcement>) => {
  try {
    const response = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAnnouncement),
    });
    if (!response.ok) throw new Error('Failed to update announcement');
    return await response.json();
  } catch (error) {
    console.error('Error in updateAnnouncement:', error);
    throw error;
  }
};

// Delete an announcement from MongoDB
export const deleteAnnouncement = async (id: string) => {
  try {
    const response = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete announcement');
    return await response.json();
  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    throw error;
  }
};

// Helper for category filtering (still client-side for now to keep it simple, or can be moved to API)
export const getAnnouncementsByCategory = async (category: string) => {
  const announcements = await getAnnouncements();
  const categoryAnnouncements = announcements.filter(announcement => 
    announcement.category === category && announcement.isActive
  );
  return filterActiveAnnouncements(categoryAnnouncements);
};

// Helper for active announcements
export const getAllActiveAnnouncements = async () => {
  const announcements = await getAnnouncements();
  const activeAnnouncements = announcements.filter(announcement => announcement.isActive);
  return filterActiveAnnouncements(activeAnnouncements);
};
