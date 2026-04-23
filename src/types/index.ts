export const BUSINESS_UNITS = {
  'CNT GROUP': { label: 'CNTG', color: '#ed1c24' },
  'CNT PROMO ADS & SPECIALISTS': { label: 'CPAS', color: '#ed1c24' },
  'CNT INTERNATIONAL': { label: 'CNTI', color: '#ed1c24' },
  'SYNERGY': { label: 'SYG', color: '#028711' },
  'LYFE MARKETING': { label: 'LYFM', color: '#94d707' },
  'Frontier': { label: 'FRT', color: '#00aeff' },
  'Lyfe Land': { label: 'LYFL', color: '#469a52' },
} as const;

export type BusinessUnitPreset = keyof typeof BUSINESS_UNITS;
export type BusinessUnit = string;

export interface Category {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  rules: {
    hasText: boolean;
    hasLink: boolean;
    hasFile: boolean;
    hasImage: boolean;
    hasDate: boolean;
    autoHideDays: number;
  };
}

export const CATEGORIES: Record<string, Category> = {
  events: {
    id: 'events',
    name: 'events',
    displayName: 'Events',
    description: 'Upcoming and ongoing events',
    color: 'bg-blue-600',
    rules: {
      hasText: true,
      hasLink: false,
      hasFile: false,
      hasImage: false,
      hasDate: true,
      autoHideDays: 0, // Auto-hide after event date
    },
  },
  'company-news': {
    id: 'company-news',
    name: 'company-news',
    displayName: 'Company Update',
    description: 'Latest company updates and news',
    color: 'bg-emerald-600',
    rules: {
      hasText: true,
      hasLink: false,
      hasFile: false,
      hasImage: true,
      hasDate: false,
      autoHideDays: 30,
    },
  },
  'urgent-notices': {
    id: 'urgent-notices',
    name: 'urgent-notices',
    displayName: 'Urgent Notices',
    description: 'Important and time-sensitive announcements',
    color: 'bg-red-600',
    rules: {
      hasText: true,
      hasLink: false,
      hasFile: false,
      hasImage: true,
      hasDate: false,
      autoHideDays: 15,
    },
  },
  policy: {
    id: 'policy',
    name: 'policy',
    displayName: 'Policy',
    description: 'Company policies and guidelines',
    color: 'bg-purple-600',
    rules: {
      hasText: true,
      hasLink: true,
      hasFile: false,
      hasImage: false,
      hasDate: false,
      autoHideDays: 15,
    },
  },
  'birthday-celebrants': {
    id: 'birthday-celebrants',
    name: 'birthday-celebrants',
    displayName: 'Birthday Celebrants',
    description: 'Employee birthday celebrations',
    color: 'bg-orange-500',
    rules: {
      hasText: false,
      hasLink: false,
      hasFile: false,
      hasImage: true,
      hasDate: false,
      autoHideDays: 30,
    },
  },
  'food-menu': {
    id: 'food-menu',
    name: 'food-menu',
    displayName: 'Food Menu',
    description: 'Daily and weekly food menus',
    color: 'bg-slate-700',
    rules: {
      hasText: false,
      hasLink: false,
      hasFile: false,
      hasImage: true,
      hasDate: false,
      autoHideDays: 7,
    },
  },
};

export type CategoryType = keyof typeof CATEGORIES;

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: CategoryType;
  createdAt: Date;
  createdBy?: string;
  memoUid?: string;
  businessUnit?: BusinessUnit;
  expiresAt?: Date;
  pinned?: boolean;
  link?: string;
  fileUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  eventDate?: Date;
  eventTime?: string;
  eventSubCategory?: string;
  registrationDeadline?: Date;
  registrationDeadlineTime?: string;
  registrationType?: 'GENERAL' | 'BU_ONLY' | 'INVITE_ONLY' | 'RULE_BASED';
  allowedBusinessUnits?: string[];
  invitedUsers?: string[];
  ruleConfig?: {
    type: 'BIRTHDAY';
    month?: number;
  };
  location?: string;
  maxAttendees?: number;
  isActive: boolean;
  requiresAcknowledgment?: boolean;
  requiresOtp?: boolean;
}

export interface AcknowledgmentRecord {
  memo_id: string;
  memo_title: string;
  memo_link?: string;
  employee_email: string;
  employee_name?: string;
  acknowledged_at: string;
}

// Attendance Event Types
export interface AttendanceEventCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon?: string;
}

export interface AttendanceEvent {
  _id: string;
  title: string;
  description: string;
  category: string;
  eventDate: Date;
  eventTime: string;
  location: string;
  maxAttendees?: number;
  registrationDeadline?: Date;
  registrationDeadlineTime?: string;
  businessUnit?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRegistration {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  qrCodeData: string;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
}

export interface AttendanceStats {
  eventId: string;
  totalRegistered: number;
  totalPresent: number;
  registrations: AttendanceRegistration[];
}

export const ATTENDANCE_CATEGORIES: Record<string, AttendanceEventCategory> = {
  'company-party': {
    id: 'company-party',
    name: 'company-party',
    displayName: 'Company Party',
    description: 'Company celebrations and parties',
    color: 'bg-red-600',
    icon: 'party-popper'
  },
  'conference': {
    id: 'conference',
    name: 'conference',
    displayName: 'Conference',
    description: 'Professional conferences and seminars',
    color: 'bg-blue-600',
    icon: 'presentation'
  },
  'training': {
    id: 'training',
    name: 'training',
    displayName: 'Training',
    description: 'Employee training and development',
    color: 'bg-green-600',
    icon: 'graduation-cap'
  },
  'meeting': {
    id: 'meeting',
    name: 'meeting',
    displayName: 'Meeting',
    description: 'Important company meetings',
    color: 'bg-purple-600',
    icon: 'users'
  },
  'team-building': {
    id: 'team-building',
    name: 'team-building',
    displayName: 'Team Building',
    description: 'Team building activities',
    color: 'bg-orange-600',
    icon: 'target'
  }
};

export type AttendanceCategoryType = keyof typeof ATTENDANCE_CATEGORIES;

