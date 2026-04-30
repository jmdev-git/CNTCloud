import { z } from "zod";

// Announcement schema
export const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().max(5000, "Content too long").optional(),
  category: z.enum([
    "events", "company-news", "urgent-notices",
    "policy", "birthday-celebrants", "food-menu"
  ]),
  businessUnit: z.string().min(1, "Business unit required").max(100),
  link: z.string().url("Invalid URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  requiresAcknowledgment: z.boolean().optional(),
  eventDate: z.string().optional(),
  location: z.string().max(200).optional(),
  memoUid: z.string().max(50).optional(),
});

// User creation schema
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100)
    .regex(/^[a-zA-Z0-9._@-]+$/, "Invalid characters in username"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().min(1).max(100).optional(),
  businessUnits: z.array(z.string()).optional(),
  allowedCategories: z.array(z.string()).optional(),
  isScannerOnly: z.boolean().optional(),
});

// Company email schema
export const CompanyEmailSchema = z.object({
  email: z.string().email("Invalid email address").max(200),
  name: z.string().min(1, "Name is required").max(100),
  businessUnit: z.string().min(1, "Business unit required").max(100),
});

// Acknowledgment schema
export const AcknowledgmentSchema = z.object({
  memo_id: z.string().min(1).max(100),
  memo_title: z.string().max(200),
  memo_link: z.string().optional(),
  employee_email: z.string().email(),
  employee_name: z.string().max(100),
});

// Business unit schema
export const BusinessUnitSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(20),
  image: z.string().optional(),
});
