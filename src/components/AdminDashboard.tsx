"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CATEGORIES, CategoryType, Announcement, AcknowledgmentRecord } from "@/types";
import {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/data/mockData";
import {
  getCompanyEmails,
  createCompanyEmail,
  updateCompanyEmail,
  deleteCompanyEmail,
  type CompanyEmail,
} from "@/data/companyEmails";
import { isEndingSoon } from "@/utils/autoHide";
import * as XLSX from "xlsx";
import AdminForm from "./AdminForm";
import QRScanner from "./QRScanner";
import LucideIcon from "./LucideIcon";
import { uploadImage } from "@/app/_actions/uploadImage";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { sileo } from "sileo";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

interface AdminDashboardProps {
  onAnnouncementCreate?: (announcement: Announcement) => void;
  onAnnouncementUpdate?: (
    id: string,
    announcement: Partial<Announcement>,
  ) => void;
  onAnnouncementDelete?: (id: string) => void;
}

type AdminView =
  | "dashboard"
  | "tracking"
  | "announcement"
  | "account"
  | "users"
  | "company-emails"
  | "logs"
  | "business-units"
  | "qr-scanner";

type AdminUserRow = {
  id: string;
  username: string; // Login email
  name?: string;    // Display name
  email?: string;
  birthdate?: string;
  allowedCategories: CategoryType[];
  businessUnits?: string[];
  isScannerOnly?: boolean;
  scannerRegTypes?: string[];
  type: 'admin' | 'company-email';
};

type PendingAdmin = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password?: string;
  businessUnit: string;
  allowedCategories: CategoryType[];
  isScannerOnly: boolean;
  isAdmin: boolean;
  birthdate?: string;
};

type LogEntry = {
  _id: string;
  action: string;
  targetTitle: string;
  targetId: string;
  performedBy: string;
  timestamp: string;
};

type BusinessUnit = {
  _id: string;
  name: string;
  label: string;
  image: string;
};

export default function AdminDashboard({
  onAnnouncementCreate = () => {},
  onAnnouncementUpdate = () => {},
  onAnnouncementDelete = () => {},
}: AdminDashboardProps) {
  const { data: session } = useSession();

  const isAccountSuperAdmin = useCallback((u: { username?: string } | null | undefined) => {
    if (!u?.username) return false;
    const uname = u.username.toLowerCase().trim();
    return uname === "itadmin" || uname === "it.support@cntpromoads.com";
  }, []);

  const [activeTab, setActiveTab] = useState<AdminView>("dashboard");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>("events");
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(
    null,
  );
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(
    [],
  );
  const [allAcknowledgments, setAllAcknowledgments] = useState<AcknowledgmentRecord[]>([]);
  const [eventAttendances, setEventAttendances] = useState<any[]>([]);
  const [trackingRefreshTrigger, setTrackingRefreshTrigger] = useState(0);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [selectedScannerEventId, setSelectedScannerEventId] = useState("");
  const [scannerAttendance, setScannerAttendance] = useState<any[]>([]);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [scannerResult, setScannerResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successScanData, setSuccessScanData] = useState<any>(null);

  const fetchScannerAttendance = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setIsScannerLoading(true);
    try {
      const res = await fetch(`/api/attendance/scan?eventId=${eventId}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setScannerAttendance(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch scanner attendance:", error);
    } finally {
      setIsScannerLoading(false);
    }
  }, []);

  const handleQRScan = useCallback(async (qrData: string) => {
    if (!selectedScannerEventId) {
      setScannerResult({ success: false, message: "Please select an event first" });
      return;
    }

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData, eventId: selectedScannerEventId }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Fallback for non-JSON errors (like Vercel timeout/error pages)
        const text = await response.text();
        console.error("Non-JSON response:", text);
        setScannerResult({ success: false, message: "Server error. Please try again later." });
        return;
      }

      if (!response.ok) {
        setScannerResult({ success: false, message: data.error || "Scan failed" });
        return;
      }

      setScannerResult({ success: true, message: data.message });
      setSuccessScanData(data);
      setIsSuccessModalOpen(true);
      
      // Refresh attendance list
      if (selectedScannerEventId) {
        fetchScannerAttendance(selectedScannerEventId);
      }
      
      // Clear result after 3 seconds
      setTimeout(() => setScannerResult(null), 3000);
      // Auto-close success modal after 4 seconds if not closed manually
      setTimeout(() => setIsSuccessModalOpen(false), 4000);
    } catch (error) {
      console.error("Error processing QR code:", error);
      setScannerResult({ success: false, message: "Connection error. Check your internet." });
    }
  }, [selectedScannerEventId, fetchScannerAttendance]);

  const [newUserAllowedCategories, setNewUserAllowedCategories] = useState<
    CategoryType[]
  >([]);
  const [newUserIsScannerOnly, setNewUserIsScannerOnly] = useState(false);
  const [newUserScannerRegTypes, setNewUserScannerRegTypes] = useState<string[]>([]);
  const [newUserBusinessUnits, setNewUserBusinessUnits] = useState<string[]>([]);
  const [newUserBirthdate, setNewUserBirthdate] = useState("");
  const [accountSubTab, setAccountSubTab] = useState<"admin" | "company">("company");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserUsername, setEditingUserUsername] = useState("");
  const [editingUserFullName, setEditingUserFullName] = useState("");
  const [editingUserCategories, setEditingUserCategories] = useState<
    CategoryType[]
  >([]);
  const [editingUserIsScannerOnly, setEditingUserIsScannerOnly] = useState(false);
  const [editingUserScannerRegTypes, setEditingUserScannerRegTypes] = useState<string[]>([]);
  const [editingUserBusinessUnits, setEditingUserBusinessUnits] = useState<string[]>([]);
  const [newUserBusinessUnit, setNewUserBusinessUnit] = useState<string>("");
  const [editingUserBusinessUnit, setEditingUserBusinessUnit] =
    useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditingPassword, setShowEditingPassword] = useState(false);
  const [editingUserPassword, setEditingUserPassword] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [companyEmails, setCompanyEmails] = useState<CompanyEmail[]>([]);
  const [isLoadingCompanyEmails, setIsLoadingCompanyEmails] = useState(false);
  const [creatingCompanyEmail, setCreatingCompanyEmail] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [newFirstName, setNewFirstName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [isCreatingAll, setIsCreatingAll] = useState(false);
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyBirthdate, setNewCompanyBirthdate] = useState("");
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");
  const [editingCompanyEmail, setEditingCompanyEmail] = useState("");
  const [editingCompanyBirthdate, setEditingCompanyBirthdate] = useState("");
  const [newCompanyBusinessUnit, setNewCompanyBusinessUnit] = useState("");
  const [editingCompanyBusinessUnit, setEditingCompanyBusinessUnit] =
    useState("");
  const [editingCompanyPromoteToAdmin, setEditingCompanyPromoteToAdmin] = useState(false);
  const [editingCompanyAdminPassword, setEditingCompanyAdminPassword] = useState("");
  const [editingCompanyAllowedCategories, setEditingCompanyAllowedCategories] = useState<CategoryType[]>([]);
  const [editingCompanyIsScannerOnly, setEditingCompanyIsScannerOnly] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [isSendingInvites, setIsSendingInvites] = useState<string | null>(null);

  // Business Units State
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [isLoadingBUs, setIsLoadingBUs] = useState(false);
  const [isCreatingBU, setIsCreatingBU] = useState(false);
  const [newBUName, setNewBUName] = useState("");
  const [newBULabel, setNewBULabel] = useState("");
  const [newBUImage, setNewBUImage] = useState(
    "/CNT_PROMO_ADS_SPECIALISTS.png",
  );
  const [editingBUId, setEditingBUId] = useState<string | null>(null);
  const [editingBUName, setEditingBUName] = useState("");
  const [editingBULabel, setEditingBULabel] = useState("");
  const [editingBUImage, setEditingBUImage] = useState("");
  const [isSavingBU, setIsSavingBU] = useState(false);
  const [isUploadingBU, setIsUploadingBU] = useState(false);

  const fetchBUs = async () => {
    try {
      setIsLoadingBUs(true);
      const res = await fetch("/api/admin/business-units");
      if (res.ok) {
        const data = await res.json();
        setBusinessUnits(data);
      }
    } catch (error) {
      console.error("Failed to fetch business units:", error);
    } finally {
      setIsLoadingBUs(false);
    }
  };

  const fetchAcknowledgments = useCallback(async () => {
    try {
      const res = await fetch('/api/acknowledgments');
      if (res.ok) {
        const data = await res.json();
        // Map DB fields to the AcknowledgmentRecord type if they differ
        const mappedData: AcknowledgmentRecord[] = data.map((ack: any) => ({
          memo_id: ack.memo_id,
          memo_title: ack.memo_title,
          memo_link: ack.memo_link,
          employee_email: ack.employee_email,
          employee_name: ack.employee_name,
          acknowledged_at: ack.acknowledged_at,
        }));
        setAllAcknowledgments(mappedData);
      }
    } catch (error) {
      console.error('Failed to fetch acknowledgments:', error);
    }
  }, []);

  const fetchEventAttendances = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/event-attendances');
      if (res.ok) {
        const data = await res.json();
        setEventAttendances(data);
      }
    } catch (error) {
      console.error('Failed to fetch event attendances:', error);
    }
  }, []);

  useEffect(() => {
    fetchBUs();
    fetchAcknowledgments();
    fetchEventAttendances();

    const fetchData = async () => {
      const data = await getAnnouncements();
      setLocalAnnouncements(data);
    };
    fetchData();
    const handleUpdate = async () => {
      const data = await getAnnouncements();
      setLocalAnnouncements(data);
      fetchAcknowledgments();
      fetchEventAttendances();
    };
    window.addEventListener("announcements-updated", handleUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("announcements");
      bc.onmessage = () => handleUpdate();
    } catch {}
    return () => {
      window.removeEventListener("announcements-updated", handleUpdate);
      try {
        if (bc) bc.close();
      } catch {}
    };
  }, [fetchAcknowledgments, fetchEventAttendances]);

  // Listen for acknowledgment updates to refresh tracking data
  useEffect(() => {
    const handleAckUpdate = () => {
      setTrackingRefreshTrigger((prev) => prev + 1);
      fetchAcknowledgments();
    };
    window.addEventListener('acknowledgments-updated', handleAckUpdate);
    return () => window.removeEventListener('acknowledgments-updated', handleAckUpdate);
  }, [fetchAcknowledgments]);

  // Refresh tracking data when the tab becomes active
  useEffect(() => {
    if (activeTab === 'tracking') {
      setTrackingRefreshTrigger((prev) => prev + 1);
      fetchAcknowledgments();
    }
  }, [activeTab, fetchAcknowledgments]);

  // Stats Filtering - 2-tab filterization
  const [filterMode, setFilterMode] = useState<'current' | 'last2'>('current');
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [trackingFilterBU, setTrackingFilterBU] = useState<string>("all");
  const [attendanceSearchUser, setAttendanceSearchUser] = useState("");
  const [searchedUserStats, setSearchedUserStats] = useState<{
    name: string;
    email: string;
    attended: number;
    total: number;
    status: 'Active' | 'Inactive';
    engagement: number;
  } | null>(null);

  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "admin" | "company-email">("all");
  const [userBUFilter, setUserBUFilter] = useState<string>("all");
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [2026, 2027, 2028, 2029, 2030];

  const normalizeBU = (s?: string) => {
    const v = (s || "").trim();
    if (!v) return "";
    const clean = v.toUpperCase().replace(/[^A-Z0-9]+/g, ""); // Remove all spaces and symbols
    if (clean.startsWith("FRONT")) return "FRONTIER";
    if (clean.startsWith("LYFELAN")) return "LYFE LAND";
    if (
      clean.includes("PROMO") &&
      (clean.includes("ADS") || clean.includes("AD"))
    )
      return "CNT PROMO & ADS SPECIALISTS";
    return v.toUpperCase(); // Always return uppercase for consistent comparison
  };

  const currentUserAllowedCategories = Array.isArray(
    session?.user?.allowedCategories,
  )
    ? (session?.user?.allowedCategories as string[])
    : undefined;

  const currentUserBusinessUnits = Array.isArray(session?.user?.businessUnits)
    ? (session?.user?.businessUnits as string[])
    : undefined;

  const canManageUsers = session?.user?.canManageUsers === true;
  const isItAdmin = session?.user?.username === "itadmin" || session?.user?.username === "it.support@cntpromoads.com";

  // CNT Group admins get elevated visibility (see all BUs) but not full super admin access
  const isCNTGroupAdmin = !isItAdmin && !!currentUserBusinessUnits &&
    currentUserBusinessUnits.some(u => normalizeBU(u) === "CNT GROUP");

  // Only true super admins (itadmin accounts) get full access
  const isSuperAdmin = isItAdmin;

  const filteredBusinessUnits = useMemo(() => {
    if (isItAdmin || (!!currentUserBusinessUnits && currentUserBusinessUnits.some(u => normalizeBU(u) === "CNT GROUP"))) {
      return businessUnits;
    }
    if (!currentUserBusinessUnits) return [];
    return businessUnits.filter(bu => 
      currentUserBusinessUnits.some(u => normalizeBU(u) === normalizeBU(bu.name))
    );
  }, [businessUnits, isItAdmin, currentUserBusinessUnits]);

  const canSeeAllMemos =
    !session?.user?.isScannerOnly && (
      (!!currentUserBusinessUnits &&
        currentUserBusinessUnits.some((bu) => normalizeBU(bu) === "CNT GROUP")) ||
      isSuperAdmin
    );

  // Function to get business logo based on business unit name from database
  const getBusinessLogo = (businessUnitName: string) => {
    const normalizedBU = normalizeBU(businessUnitName);
    
    // Find the business unit from database that matches the name
    const businessUnit = businessUnits.find(bu => normalizeBU(bu.name) === normalizedBU);
    
    console.log("Business Units from DB:", businessUnits);
    console.log(`Looking for business unit: ${businessUnitName} (normalized: ${normalizedBU})`);
    console.log("Found Business Unit:", businessUnit);
    console.log("Business Unit Image:", businessUnit?.image);
    
    // Return the image URL from the database if available
    return businessUnit?.image || null;
  };

  const canAccessCategory = useCallback(
    (category: CategoryType) => {
      if (canSeeAllMemos) return true;
      return currentUserAllowedCategories?.includes(category) ?? false;
    },
    [canSeeAllMemos, currentUserAllowedCategories],
  );

  const sidebarItems: {
    id: AdminView;
    label: string;
    icon: string;
    requiresManageUsers?: boolean;
    requiresPolicyAccess?: boolean;
    requiresItAdmin?: boolean;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: "bar-chart-3" },
    {
      id: "tracking",
      label: "Memo Tracking",
      icon: "clipboard-check",
      requiresPolicyAccess: true,
    },
    { id: "announcement", label: "Announcement", icon: "plus-circle" },
    {
      id: "account",
      label: "Create Account",
      icon: "user-plus",
      requiresItAdmin: true,
    },
    { id: "users", label: "Users Directory", icon: "users", requiresItAdmin: true },
    { id: "logs", label: "Audit Logs", icon: "history", requiresItAdmin: true },
    {
      id: "business-units",
      label: "Business Units",
      icon: "building",
      requiresItAdmin: true,
    },
    { id: "qr-scanner", label: "QR Scanner", icon: "qr-code" },
  ];

  // Modified navItems logic to handle scanner only users
  const filteredNavItems = useMemo(() => {
    return sidebarItems.filter((item) => {
      // Rule: Scanner Only users only see Dashboard and QR Scanner
      if (session?.user?.isScannerOnly) {
        return item.id === "dashboard" || item.id === "qr-scanner";
      }

      if (item.requiresManageUsers && !canManageUsers) return false;
      if (item.requiresItAdmin && !isItAdmin) return false;
      if (item.requiresPolicyAccess && !canAccessCategory("policy")) return false;
      return true;
    });
  }, [sidebarItems, canManageUsers, isItAdmin, session?.user?.isScannerOnly, canAccessCategory]);

  const isMemoVisible = (ann: Announcement) => {
    // 1. Authorship: Everyone sees what they personally created
    const currentUserIdentifier = session?.user?.email || session?.user?.name;
    if (currentUserIdentifier && ann.createdBy === currentUserIdentifier)
      return true;

    // 2. Scanner Only Logic: Strict Business Unit Isolation with CNT GROUP Exception
    if (session?.user?.isScannerOnly) {
      const memoBU = normalizeBU(ann.businessUnit || "");
      const userBUs = (currentUserBusinessUnits || []).map((u) => normalizeBU(u));
      
      // Rule: Scanners see events for their assigned BUs.
      // Exception: If the announcement is created for "CNT GROUP", all scanners can see it.
      if (memoBU === "CNT GROUP") return true;
      
      return userBUs.includes(memoBU);
    }

    // 3. Special visibility for Super Admins and CNT GROUP members
    if (canSeeAllMemos) {
      // itadmin (root) sees everything
      if (isItAdmin) return true;

      // CNT GROUP admins see ALL announcements across all business units
      const userBUs = (currentUserBusinessUnits || []).map((u) => normalizeBU(u));
      if (userBUs.some((bu) => bu === "CNT GROUP")) return true;

      // Other elevated admins: see policies from any BU + their own BU's content
      if (ann.category === "policy") return true;

      const memoBU = normalizeBU(ann.businessUnit || "");
      if (userBUs.includes(memoBU)) return true;
      if (memoBU === "ALL") return true;
    }

    // 3. Otherwise, hide it (Restricted admins ONLY see what they personally created)
    return false;
  };

  const visibleAnnouncements = useMemo(() => {
    return localAnnouncements.filter((ann) => {
      // CNT Group admins and scanner users use the full isMemoVisible logic
      if (isCNTGroupAdmin || session?.user?.isScannerOnly) {
        return isMemoVisible(ann);
      }
      // Regular admins (not super admin) only see their own posts
      if (!isItAdmin) {
        const currentUserIdentifier = session?.user?.email || session?.user?.name;
        return currentUserIdentifier && ann.createdBy === currentUserIdentifier;
      }
      return isMemoVisible(ann);
    });
  }, [localAnnouncements, isMemoVisible, isItAdmin, isCNTGroupAdmin, session?.user?.isScannerOnly, session?.user?.email, session?.user?.name]);

  // Combined list of all people (company emails + admin users) for acknowledgment tracking
  const allPeople = useMemo(() => {
    // Admin users: username is their email, businessUnits is an array
    const admins = adminUsers
      .filter((u) => u.type === 'admin' && u.username && u.username.includes('@'))
      .map((u) => ({
        email: u.username.toLowerCase(),
        name: u.name || u.username,
        businessUnit: (u.businessUnits || [])[0] || '',
      }));

    // Company emails
    const employees = companyEmails.map((e) => ({
      email: e.email.toLowerCase(),
      name: e.name,
      businessUnit: e.businessUnit || '',
    }));

    // Merge, deduplicate by email (company email record takes priority)
    const emailSet = new Set(employees.map((e) => e.email));
    const uniqueAdmins = admins.filter((a) => !emailSet.has(a.email));
    return [...employees, ...uniqueAdmins];
  }, [companyEmails, adminUsers]);

  useEffect(() => {
    if (
      !currentUserAllowedCategories ||
      currentUserAllowedCategories.length === 0
    )
      return;
    setSelectedCategory((prev) =>
      canAccessCategory(prev)
        ? prev
        : (currentUserAllowedCategories[0] as CategoryType),
    );
  }, [currentUserAllowedCategories, canAccessCategory]);

  useEffect(() => {
    // Redirect regular admins away from super-admin-only tabs
    const superAdminOnlyTabs = ["account", "users", "business-units", "logs"];
    if (superAdminOnlyTabs.includes(activeTab) && !isItAdmin) {
      setActiveTab("dashboard");
      return;
    }
    if (activeTab === "logs") {
      if (!isItAdmin) {
        setActiveTab("dashboard");
        return;
      }
      const loadLogs = async () => {
        try {
          setIsLoadingLogs(true);
          const res = await fetch("/api/logs");
          const data = await res.json();
          if (res.ok) {
            setLogs(data);
          } else {
            sileo.error({
              title: "Failed to load logs",
              description: (data as { error: string }).error,
            });
          }
        } catch {
          sileo.error({ title: "Failed to load logs" });
        } finally {
          setIsLoadingLogs(false);
        }
      };
      loadLogs();
    }
  }, [activeTab, isItAdmin]);

  // Ensure edit states don't leak across tabs or categories
  useEffect(() => {
    setEditingAnnouncement(null);
  }, [selectedCategory]);
  useEffect(() => {
    if (activeTab !== "announcement") {
      setEditingAnnouncement(null);
    }
    if (activeTab !== "users") {
      setEditingUserId(null);
      setEditingUserUsername("");
      setEditingUserCategories([]);
      setEditingUserPassword("");
    }
  }, [activeTab]);
  const fetchAllUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const [usersRes, emailsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/company-emails")
      ]);

      if (!usersRes.ok || !emailsRes.ok) {
        sileo.error({ title: "Failed to load users or emails" });
        return;
      }

      const usersData = (await usersRes.json()) as {
        _id: string;
        username: string;
        name?: string;
        allowedCategories?: string[];
        businessUnits?: string[];
        isScannerOnly?: boolean;
        scannerRegTypes?: string[];
      }[];

      const emailsData = (await emailsRes.json()) as CompanyEmail[];
      setCompanyEmails(emailsData);

      const mappedUsers: AdminUserRow[] = usersData.map((u) => {
        const fromApi = Array.isArray(u.allowedCategories)
          ? u.allowedCategories
          : [];
        const valid = fromApi.filter((c) =>
          Object.prototype.hasOwnProperty.call(CATEGORIES, c),
        ) as CategoryType[];
        return {
          id: u._id,
          username: u.username,
          name: u.name,
          allowedCategories: valid,
          businessUnits: Array.isArray(u.businessUnits)
            ? u.businessUnits
            : [],
          isScannerOnly: !!u.isScannerOnly,
          scannerRegTypes: Array.isArray(u.scannerRegTypes) ? u.scannerRegTypes : [],
          type: 'admin'
        };
      });

      const mappedEmails: AdminUserRow[] = emailsData.map((ce) => ({
        id: ce._id,
        username: ce.name, 
        email: ce.email, 
        birthdate: ce.birthdate,
        allowedCategories: [],
        businessUnits: ce.businessUnit ? [ce.businessUnit] : [],
        type: 'company-email'
      })); 

      setAdminUsers([...mappedUsers, ...mappedEmails]);
    } catch (error) {
      console.error("Error fetching users/emails:", error);
      sileo.error({ title: "Failed to load directory" });
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "users" && activeTab !== "tracking") return;
    fetchAllUsers();
  }, [activeTab, fetchAllUsers]);

  const handleAttendanceSearch = useCallback(() => {
    if (!attendanceSearchUser) {
      setSearchedUserStats(null);
      return;
    }
    
    // Simulate finding user and calculating stats from allAcknowledgments
    const userAcks = allAcknowledgments.filter(ack => 
      ack.employee_name?.toLowerCase().includes(attendanceSearchUser.toLowerCase()) || 
      ack.employee_email.toLowerCase().includes(attendanceSearchUser.toLowerCase())
    );

    const uniqueUser = userAcks[0];
    if (uniqueUser) {
      const totalEvents = visibleAnnouncements.filter(a => a.category === 'events').length;
      const attendedCount = userAcks.length;
      setSearchedUserStats({
        name: uniqueUser.employee_name || 'User',
        email: uniqueUser.employee_email,
        attended: attendedCount,
        total: totalEvents,
        status: 'Active',
        engagement: totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0
      });
    } else {
      setSearchedUserStats(null);
    }
  }, [attendanceSearchUser, allAcknowledgments, visibleAnnouncements]);

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      if (userTypeFilter === "admin") {
        if (u.type !== "admin") return false;
        // itadmin is special
        if (isAccountSuperAdmin(u)) return true;
        // otherwise filter by BU
        return userBUFilter === "all" || (u.businessUnits || []).some(bu => normalizeBU(bu) === normalizeBU(userBUFilter));
      }
      if (userTypeFilter === "company-email") {
        if (u.type !== "company-email") return false;
        return userBUFilter === "all" || (u.businessUnits || []).some(bu => normalizeBU(bu) === normalizeBU(userBUFilter));
      }
      // all
      const matchesBU = userBUFilter === "all" || (u.businessUnits || []).some(bu => normalizeBU(bu) === normalizeBU(userBUFilter));
      return matchesBU;
    });
  }, [adminUsers, userTypeFilter, userBUFilter]);

  const getAnnouncementsByCategory = (category: CategoryType) => {
    if (!canAccessCategory(category)) return [];
    return visibleAnnouncements
      .filter((ann) => ann.category === category && ann.isActive);
  };

  const getFilteredStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
        
    const filtered = visibleAnnouncements
      .filter((ann) => {
        const date = new Date(ann.createdAt);
        const annMonth = date.getMonth();
        const annYear = date.getFullYear();
        
        if (filterMode === 'current') {
          return annMonth === currentMonth && annYear === currentYear;
        } else {
          // Last 2 months (previous 2 months, excluding current month)
          const monthsDiff = (currentYear - annYear) * 12 + (currentMonth - annMonth);
          const dateMatches = monthsDiff >= 1 && monthsDiff <= 2;
          return dateMatches;
        }
      });

    return Object.entries(CATEGORIES)
      .filter(([key]) => canAccessCategory(key as CategoryType))
      .map(([key, category]) => {
        const count = filtered.filter((ann) => ann.category === key).length;
        return {
          id: key as CategoryType,
          label: (category as { displayName: string }).displayName,
          value: count,
          color: getStatColor(key as CategoryType),
        };
      });
  };

  const attendanceBarChartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter events based on filter mode
    const monthlyEvents = visibleAnnouncements.filter((ann) => {
      const date = new Date(ann.createdAt);
      const annMonth = date.getMonth();
      const annYear = date.getFullYear();
      
      let dateMatches = false;
      if (filterMode === 'current') {
        dateMatches = annMonth === currentMonth && annYear === currentYear;
      } else {
        // Last 2 months (previous 2 months, excluding current month)
        const monthsDiff = (currentYear - annYear) * 12 + (currentMonth - annMonth);
        dateMatches = monthsDiff >= 1 && monthsDiff <= 2;
      }
      
      return (
        ann.category === "events" &&
        ann.isActive &&
        dateMatches
      );
    });

    // Map events to their attendance counts
    return monthlyEvents.map(event => {
      const attendeesCount = allAcknowledgments.filter(ack => ack.memo_id === event.id).length;
      return {
        id: event.id,
        title: event.title,
        count: attendeesCount
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5); // Show top 5 events
  }, [visibleAnnouncements, allAcknowledgments, filterMode]);

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let startDate: Date;
    
    let monthsToShow = 1;
    if (filterMode === 'current') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      monthsToShow = 1;
    } else {
      // Last 2 months - start from 2 months ago
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      monthsToShow = 2;
    }
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      // Filter acknowledgments based on filter mode
      const count = allAcknowledgments.filter(ack => {
        const ackDate = new Date(ack.acknowledged_at);
        const ackMonth = ackDate.getMonth();
        const ackYear = ackDate.getFullYear();
        
        if (filterMode === 'current') {
          // Only show acknowledgments from current month
          return ackMonth === currentMonth && ackYear === currentYear && 
                 ackMonth === m && ackYear === y;
        } else {
          // Only show acknowledgments from Feb-Mar (exclude current month)
          const monthsDiff = (currentYear - ackYear) * 12 + (currentMonth - ackMonth);
          return monthsDiff >= 1 && monthsDiff <= 2 && 
                 ackMonth === m && ackYear === y;
        }
      }).length;

      // Filter events based on filter mode
      const hasEvent = visibleAnnouncements.some(ann => {
        const annDate = new Date(ann.createdAt);
        const annMonth = annDate.getMonth();
        const annYear = annDate.getFullYear();
        
        if (filterMode === 'current') {
          // Only show events from current month
          return ann.category === 'events' && 
                 annMonth === currentMonth && annYear === currentYear &&
                 annMonth === m && annYear === y;
        } else {
          // Only show events from Feb-Mar (exclude current month)
          const monthsDiff = (currentYear - annYear) * 12 + (currentMonth - annMonth);
          return monthsDiff >= 1 && monthsDiff <= 2 && 
                 ann.category === 'events' &&
                 annMonth === m && annYear === y;
        }
      });
      
      data.push({
        month: d.toLocaleString('default', { month: 'short' }),
        fullName: d.toLocaleString('default', { month: 'long' }),
        count,
        hasEvent
      });
    }

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const peak = data.reduce((prev, current) => (prev.count >= current.count) ? prev : current, data[0]);

    // Calculate SVG path for smooth curve (Bezier)
    const points = data.map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50; // Center if only one point
      const y = 100 - (d.count / (maxVal * 1.2)) * 100;
      return { x, y, ...d };
    });

    let pathData = '';
    if (points.length > 0) {
      pathData = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        const cp1y = curr.y;
        const cp2x = curr.x + (next.x - curr.x) / 2;
        const cp2y = next.y;
        pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      }
    }

    return { points, peak, pathData, maxVal };
  }, [allAcknowledgments, visibleAnnouncements, filterMode]);

  const getStatColor = (category: CategoryType) => {
    switch (category) {
      case "events":
        return "#ed1c24"; // red
      case "company-news":
        return "#065f46"; // emerald-800
      case "urgent-notices":
        return "#991b1b"; // red-800
      case "policy":
        return "#5b21b6"; // violet-800
      case "birthday-celebrants":
        return "#92400e"; // amber-800
      case "food-menu":
        return "#3f3f46"; // zinc-700
      default:
        return "#71717a"; // zinc-500
    }
  };

  const pieSlices = (() => {
    const data = getFilteredStats();
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let cumulativeAngle = 0;
    return data.map((item) => {
      const angle = (item.value / total) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;

      const x1 = Math.cos(((startAngle - 90) * Math.PI) / 180) * 80 + 100;
      const y1 = Math.sin(((startAngle - 90) * Math.PI) / 180) * 80 + 100;
      const x2 = Math.cos(((cumulativeAngle - 90) * Math.PI) / 180) * 80 + 100;
      const y2 = Math.sin(((cumulativeAngle - 90) * Math.PI) / 180) * 80 + 100;

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...item,
        pathData,
        percentage: Math.round((item.value / total) * 100),
      };
    });
  })();

  const handleCreateAnnouncement = async (data: Partial<Announcement>) => {
    const newAnnouncement: Omit<Announcement, "id"> = {
      ...data,
      createdAt: new Date(),
      createdBy: session?.user?.email || session?.user?.name || "Unknown",
      isActive: true,
    } as Omit<Announcement, "id">;
    const created = await addAnnouncement(newAnnouncement);

    const updatedData = await getAnnouncements();
    setLocalAnnouncements(updatedData);
    onAnnouncementCreate(created);
    sileo.success({
      title: "Announcement Created",
      description: "Your announcement has been posted.",
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("announcements-updated"));
      try {
        const bc = new BroadcastChannel("announcements");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
    }
  };

  const handleSendInvites = async (announcement: Announcement) => {
    if (!announcement.invitedUsers || announcement.invitedUsers.length === 0) {
      sileo.warning({ title: "No invited users", description: "Please add invited users first." });
      return;
    }

    setIsSendingInvites(announcement.id);
    try {
      const res = await fetch("/api/send-event-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: announcement.id,
          eventTitle: announcement.title,
          eventDate: announcement.eventDate,
          invitedEmails: announcement.invitedUsers,
        }),
      });

      if (res.ok) {
        sileo.success({ title: "Invites Sent", description: `Successfully sent invites to ${announcement.invitedUsers.length} users.` });
      } else {
        const data = await res.json();
        sileo.error({ title: "Failed to send invites", description: data.error || "Unknown error" });
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      sileo.error({ title: "Network Error" });
    } finally {
      setIsSendingInvites(null);
    }
  };

  const handleUpdateAnnouncement = async (
    id: string,
    data: Partial<Announcement>,
  ) => {
    const originalAnn = localAnnouncements.find((ann) => ann.id === id);
    if (originalAnn) {
      const keys = Object.keys(data) as Array<keyof typeof data>;
      const isEqual = keys.every((k) => {
        const key = k as keyof Announcement;
        const ov = originalAnn[key] as unknown;
        const nv = data[key] as unknown;
        if (ov instanceof Date || nv instanceof Date) {
          const toIso = (val: unknown) => {
            if (!val) return "";
            const d = val instanceof Date ? val : new Date(val as string);
            return isNaN(d.getTime()) ? "" : d.toISOString();
          };
          const oIso = toIso(ov);
          const nIso = toIso(nv);
          return oIso === nIso;
        }
        if (Array.isArray(ov) || Array.isArray(nv)) {
          const oa = Array.isArray(ov) ? ov : [];
          const na = Array.isArray(nv) ? nv : [];
          if (oa.length !== na.length) return false;
          for (let i = 0; i < oa.length; i++) {
            if (oa[i] !== na[i]) return false;
          }
          return true;
        }
        return (ov ?? "") === (nv ?? "");
      });
      if (isEqual) {
        sileo.warning({ title: "No Change" });
        return;
      }
    }
    const updatedAnn: Partial<Announcement> = {
      ...data,
      expiresAt: data.expiresAt
        ? new Date(data.expiresAt)
        : originalAnn?.expiresAt,
      eventDate: data.eventDate
        ? new Date(data.eventDate)
        : originalAnn?.eventDate,
    };
    await updateAnnouncement(id, updatedAnn);
    const updatedData = await getAnnouncements();
    setLocalAnnouncements(updatedData);
    setEditingAnnouncement(null);
    onAnnouncementUpdate(id, updatedAnn);
    sileo.success({
      title: "Announcement updated",
      description: "Changes saved successfully",
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("announcements-updated"));
      try {
        const bc = new BroadcastChannel("announcements");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    const updatedData = await getAnnouncements();
    setLocalAnnouncements(updatedData);
    onAnnouncementDelete(id);
    sileo.success({
      title: "Announcement Deleted",
      description: "The announcement has been removed.",
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("announcements-updated"));
      try {
        const bc = new BroadcastChannel("announcements");
        bc.postMessage({ type: "updated" });
        bc.close();
      } catch {}
    }
  };

  const handleExportToExcel = (memo: Announcement) => {
    const recs = allAcknowledgments.filter(
      (r) => r.memo_id === memo.id,
    );

    // Use the same filtering logic as the dashboard
    const mbu = normalizeBU(memo.businessUnit || "");
    const employees = allPeople.filter((e) => {
      const ebu = normalizeBU(e.businessUnit || "");

      // Rule 1: Filter by viewer's allowed BUs if restricted
      if (
        !canSeeAllMemos &&
        currentUserBusinessUnits &&
        currentUserBusinessUnits.length > 0
      ) {
        const userBUs = currentUserBusinessUnits.map((u) => normalizeBU(u));
        if (!userBUs.includes(ebu)) return false;
      }

      // Rule 2: Filter by selected tracking BU dropdown
      if (trackingFilterBU !== "all") {
        if (ebu !== normalizeBU(trackingFilterBU)) return false;
      }

      // Rule 3: CNT GROUP and ALL mean the memo applies to every employee
      if (mbu && mbu !== "ALL" && mbu !== "CNT GROUP") {
        return ebu === mbu;
      }

      return true;
    });

    const allowedEmails = new Set(employees.map((e) => e.email.toLowerCase()));

    // Only include acknowledgments from allowed employees
    const filteredRecs = recs.filter((r) =>
      allowedEmails.has(r.employee_email.toLowerCase()),
    );
    const acknowledgedEmails = new Set(
      filteredRecs.map((r) => r.employee_email.toLowerCase()),
    );

    // Prepare Acknowledged Data
    const acknowledgedData = filteredRecs.map((r) => ({
      "Employee Name": r.employee_name || "N/A",
      Email: r.employee_email,
      "Memo UID": r.memo_id,
      Status: "ACKNOWLEDGED",
      "Date Read": new Date(r.acknowledged_at).toLocaleDateString(),
      "Time Read": new Date(r.acknowledged_at).toLocaleTimeString(),
    }));

    // Prepare Pending Data
    const pendingData = employees
      .filter((e) => !acknowledgedEmails.has(e.email.toLowerCase()))
      .map((e) => ({
        "Employee Name": e.name,
        Email: e.email,
        Status: "PENDING",
        "Date Read": "-",
        "Time Read": "-",
      }));

    // Combine Data
    const combinedData = [...acknowledgedData, ...pendingData];

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(combinedData);

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking Report");

    // Export File
    const label = memo.memoUid ?? stripLeadingEmoji(memo.title);
    const fileName = `Memo_Tracking_${label.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportLogsToExcel = () => {
    try {
      const rows = logs.map((log) => {
        const dt = new Date(log.timestamp);
        return {
          User: log.performedBy || "",
          Action: log.action || "",
          Target: log.targetTitle || "",
          Date: dt.toLocaleDateString(),
          Time: dt.toLocaleTimeString(),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "System Logs");

      const fileName = `System_Logs_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      sileo.success({
        title: "Exported",
        description: "System logs downloaded as Excel.",
      });
    } catch {
      sileo.error({ title: "Export Failed" });
    }
  };

  const stripLeadingEmoji = (text: string) =>
    text.replace(/^\p{Extended_Pictographic}\s*/u, "");

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      const loadFile = () =>
        new Promise<void>((resolve, reject) => {
          reader.onload = async (evt) => {
            try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: "yyyy-mm-dd" }) as any[];

              if (data.length === 0) {
                sileo.warning({
                  title: "Import Failed",
                  description: "Excel file is empty",
                });
                resolve();
                return;
              }

              setImportProgress({ current: 0, total: data.length });
              let successCount = 0;
              let failCount = 0;
              let existCount = 0;
              const newPendingAdmins: PendingAdmin[] = [];

              // Get existing emails for duplicate checking
              const existingEmails = new Set(adminUsers.map(u => (u.email || u.username).toLowerCase()));

              for (let i = 0; i < data.length; i++) {
                const row = data[i];
                // ... extraction logic ...
                const firstName = (
                  row["First Name"] ||
                  row["Firstname"] ||
                  row["firstname"] ||
                  ""
                )
                  .toString()
                  .trim();
                const middleName = (
                  row["Middle Name"] ||
                  row["middlename"] ||
                  ""
                )
                  .toString()
                  .trim();
                const lastName = (
                  row["Last Name"] ||
                  row["lastname"] ||
                  ""
                )
                  .toString()
                  .trim();
                const birthdateVal = (
                  row["Birthdate"] ||
                  row["birthdate"] ||
                  row["Birth Date"] ||
                  row["birth date"] ||
                  ""
                );

                let birthdateRaw = "";
                const numVal = Number(birthdateVal);
                if (typeof birthdateVal === "number" || (!isNaN(numVal) && birthdateVal.toString().length >= 5)) {
                  // Handle Excel serial date
                  const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
                  birthdateRaw = date.toISOString().split("T")[0];
                } else {
                  birthdateRaw = birthdateVal.toString().trim();
                }
                const email = (row["Email"] || row["email"] || "")
                  .toString()
                  .trim()
                  .toLowerCase();
                const password = (row["Password"] || row["password"] || "")
                  .toString()
                  .trim();
                const businessUnit = (
                  row["Business Unit"] ||
                  row["businessunit"] ||
                  row["BU"] ||
                  ""
                )
                  .toString()
                  .trim();

                if (!email || !businessUnit) {
                  failCount++;
                  continue;
                }

                // Check for duplicates
                if (existingEmails.has(email)) {
                  existCount++;
                  continue;
                }

                // Always stage for review
                newPendingAdmins.push({
                  id: Math.random().toString(36).substr(2, 9),
                  firstName,
                  middleName,
                  lastName,
                  email,
                  password,
                  businessUnit,
                  allowedCategories: [],
                  isScannerOnly: false,
                  isAdmin: accountSubTab === "admin",
                  birthdate: birthdateRaw,
                });
                successCount++;
                setImportProgress({ current: i + 1, total: data.length });
              }

              setPendingAdmins((prev) => [...prev, ...newPendingAdmins]);
              sileo.success({
                title: "Import Complete",
                description: `Successfully staged ${successCount} accounts for review. ${existCount} already exist. ${failCount} failed.`,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsBinaryString(file);
        });

      await loadFile();
    } catch (error) {
      console.error("Excel import error:", error);
      sileo.error({
        title: "Import Failed",
        description: "An error occurred during import",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      if (e.target) e.target.value = "";
    }
  };

  const getIconNameForCategory = (category: CategoryType) => {
    switch (category) {
      case "events":
        return "calendar";
      case "company-news":
        return "bar-chart";
      case "urgent-notices":
        return "alert-circle";
      case "policy":
        return "file-text";
      case "birthday-celebrants":
        return "cake";
      default:
        return "file-text";
    }
  };

  const getIconBgClass = (category: CategoryType) => {
    switch (category) {
      case "events":
        return "bg-gradient-to-br from-red-500 to-red-600";
      case "company-news":
        return "bg-gradient-to-br from-emerald-500 to-teal-600";
      case "urgent-notices":
        return "bg-gradient-to-br from-rose-500 to-orange-600";
      case "policy":
        return "bg-gradient-to-br from-violet-500 to-purple-600";
      case "birthday-celebrants":
        return "bg-gradient-to-br from-amber-400 to-pink-500";
      default:
        return "bg-zinc-700";
    }
  };

  const getStatGradient = (category: CategoryType) => {
    switch (category) {
      case "events":
        return "bg-zinc-950 border-red-900/30 hover:border-[#ed1c24]/50";
      case "company-news":
        return "bg-zinc-950 border-emerald-900/30 hover:border-emerald-500/50";
      case "urgent-notices":
        return "bg-zinc-950 border-rose-900/30 hover:border-rose-500/50";
      case "policy":
        return "bg-zinc-950 border-violet-900/30 hover:border-violet-500/50";
      case "birthday-celebrants":
        return "bg-zinc-950 border-amber-900/30 hover:border-amber-500/50";
      case "food-menu":
        return "bg-zinc-950 border-zinc-800/30 hover:border-zinc-400/50";
      default:
        return "bg-zinc-950 border-zinc-800/30";
    }
  };

  const getCardBg = (category: CategoryType) => {
    switch (category) {
      case "events":              return "bg-red-950/70 border-red-900/50 hover:border-red-500/60";
      case "company-news":        return "bg-emerald-950/70 border-emerald-900/50 hover:border-emerald-500/60";
      case "urgent-notices":      return "bg-rose-950/70 border-rose-900/50 hover:border-rose-500/60";
      case "policy":              return "bg-violet-950/70 border-violet-900/50 hover:border-violet-500/60";
      case "birthday-celebrants": return "bg-amber-950/70 border-amber-900/50 hover:border-amber-500/60";
      case "food-menu":           return "bg-zinc-900/70 border-zinc-800/50 hover:border-zinc-500/60";
      default:                    return "bg-zinc-900/70 border-zinc-800/50";
    }
  };

  const getStatTopGradient = (category: CategoryType) => {
    switch (category) {
      case "events":         return "from-red-600/40 via-red-900/20 to-transparent";
      case "company-news":   return "from-emerald-600/40 via-emerald-900/20 to-transparent";
      case "urgent-notices": return "from-rose-600/40 via-rose-900/20 to-transparent";
      case "policy":         return "from-violet-600/40 via-violet-900/20 to-transparent";
      case "birthday-celebrants": return "from-amber-600/40 via-amber-900/20 to-transparent";
      case "food-menu":      return "from-zinc-600/30 via-zinc-900/20 to-transparent";
      default:               return "from-zinc-600/30 via-zinc-900/20 to-transparent";
    }
  };

  const getStatIconColor = (category: CategoryType) => {
    switch (category) {
      case "events":
        return "text-[#ed1c24]";
      case "company-news":
        return "text-emerald-400";
      case "urgent-notices":
        return "text-rose-400";
      case "policy":
        return "text-violet-400";
      case "birthday-celebrants":
        return "text-amber-400";
      case "food-menu":
        return "text-zinc-400";
      default:
        return "text-zinc-400";
    }
  };

  const filteredSidebarItems = sidebarItems.filter(
    (item) =>
      (!item.requiresManageUsers || canManageUsers) &&
      (!item.requiresPolicyAccess || canAccessCategory("policy")) &&
      (!item.requiresItAdmin || isItAdmin),
  );

  if (session?.user?.isScannerOnly) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="h-[72px] border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950">
          <div className="flex items-center gap-3">
            <Image
              src="/CloudSpace_Logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              CNT <span className="text-[#ed1c24]">CloudSpace</span>
            </h2>
            <div className="h-4 w-px bg-white/10 mx-2" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
              Scanner Mode
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
              <div className="w-8 h-8 rounded-full bg-zinc-900/40 border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-[#ed1c24]">
                  {session?.user?.name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">
                  {session?.user?.name}
                </span>
                <span className="text-[8px] text-zinc-500 font-medium uppercase tracking-tighter">
                  {session?.user?.role}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="h-9 px-4 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-white text-[9px] font-bold uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2"
            >
              <LucideIcon name="log-out" className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QRScanner 
              events={visibleAnnouncements}
              selectedEventId={selectedScannerEventId}
              onEventChange={(id) => {
                setSelectedScannerEventId(id);
                fetchScannerAttendance(id);
              }}
              onScan={handleQRScan}
              attendance={scannerAttendance}
              isLoading={isScannerLoading}
              result={scannerResult}
            />

            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
              <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl p-0 overflow-hidden max-w-sm">
                <div className="relative">
                  {/* Success Header */}
                  <div className="bg-emerald-500/10 p-8 flex flex-col items-center justify-center border-b border-emerald-500/20">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4 animate-in zoom-in-50 duration-500">
                      <LucideIcon name="check" className="w-12 h-12 text-white stroke-[3px]" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Verified!</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mt-1">Access Granted</p>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/40 border border-white/10 flex items-center justify-center text-white shrink-0">
                          <LucideIcon name="user" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Employee Name</p>
                          <p className="text-base font-bold text-white truncate">{successScanData?.userName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/40 border border-white/10 flex items-center justify-center text-white shrink-0">
                          <LucideIcon name="mail" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</p>
                          <p className="text-sm font-bold text-zinc-400 truncate">{successScanData?.userEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900/40 border border-white/10 flex items-center justify-center text-white shrink-0">
                          <LucideIcon name="calendar" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Time Verified</p>
                          <p className="text-sm font-bold text-zinc-400">
                            {successScanData?.attendedAt ? new Date(successScanData.attendedAt).toLocaleTimeString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSuccessModalOpen(false)}
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                    >
                      Back to Scan
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar collapsible="icon" className="border-none">
        <SidebarHeader className="border-b border-white/5 p-5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-[72px] group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
            <div className="w-9 h-9 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300">
              <Image
                src="/CloudSpace_Logo.png"
                alt="Logo"
                width={20}
                height={20}
                className="w-10 h-9 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7"
              />
            </div>
            <div className="flex min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                CNT <span className="text-[#ed1c24]">CloudSpace</span>
              </h2>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="custom-scrollbar px-3 pt-6 group-data-[collapsible=icon]:px-0">
          <SidebarGroup className="group-data-[collapsible=icon]:px-0">
            <SidebarGroupLabel className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-4 group-data-[collapsible=icon]:hidden mb-5 opacity-80">
              Management
            </SidebarGroupLabel>
            <SidebarMenu className="gap-2 group-data-[collapsible=icon]:gap-4 group-data-[collapsible=icon]:items-center">
              {filteredSidebarItems.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                >
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200 h-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center rounded-xl px-4",
                      activeTab === item.id
                        ? "bg-zinc-800 text-white backdrop-blur-md border border-white/10 shadow-none"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-lg",
                        activeTab === item.id
                          ? ""
                          : "bg-zinc-900/20 border border-white/5",
                      )}
                    >
                      <LucideIcon
                        name={item.icon}
                        className={cn(
                          "w-4 h-4 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5",
                          activeTab === item.id
                            ? "text-white"
                            : "text-zinc-500",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "font-bold uppercase tracking-widest text-[10px] truncate group-data-[collapsible=icon]:hidden ml-4 transition-colors",
                        activeTab === item.id ? "text-white" : "text-zinc-400",
                      )}
                    >
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* User Section */}
          <SidebarGroup className="mt-auto border-t border-white/10 pt-8 pb-8 px-3 group-data-[collapsible=icon]:px-0">
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              <SidebarMenuItem className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <button 
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="flex items-center gap-4 px-4 py-3 overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 w-full hover:bg-zinc-900/40 rounded-xl transition-all outline-none border border-transparent hover:border-white/10 min-h-[60px] group-data-[collapsible=icon]:min-h-[64px]"
                >
                  <div className="w-10 h-10 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:h-11 rounded-full bg-zinc-900/40 border border-white/10 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                    <LucideIcon name="log-out" className="w-4 h-4 text-[#ed1c24]" />
                  </div>
                  <div className="flex flex-col min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-bold text-white tracking-tight truncate uppercase leading-none">
                      Logout
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate mt-2 opacity-80 leading-relaxed">
                      Exit Session
                    </span>
                  </div>
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>


        <SidebarRail />
      </AppSidebar>

      <SidebarInset className="bg-zinc-950 min-h-screen flex flex-col pb-24">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/5 px-6 md:px-8 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-[50] shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SidebarTrigger className="text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all p-2 rounded-lg" />
            <Separator orientation="vertical" className="mr-3 h-5 bg-zinc-800 hidden sm:block" />
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">
                    {sidebarItems.find((i) => i.id === activeTab)?.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            {/* Mobile Title */}
            <div className="sm:hidden flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                {sidebarItems.find((i) => i.id === activeTab)?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {/* User Profile */}
             <button className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl hover:bg-zinc-900/40 transition-all group">
               <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ed1c24] to-red-700 flex items-center justify-center text-white font-black text-xs">
                 {session?.user?.name?.[0]?.toUpperCase() || "A"}
               </div>
               <div className="hidden lg:flex flex-col text-left">
                 <span className="text-xs font-bold text-white group-hover:text-[#ed1c24] transition-colors">
                   {session?.user?.name || "User"}
                 </span>
                 <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-tighter">
                   {currentUserBusinessUnits?.[0] || "Administrator"}
                 </span>
               </div>
               <LucideIcon name="chevron-down" className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-all ml-1" />
             </button>
           </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto corporate-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
            {/* Active Tab Content Rendering */}
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Dashboard Overview</h1>
                  <div className="flex items-center gap-1 p-1 bg-zinc-900/40 rounded-xl border border-white/10 w-full sm:w-auto">
                    <button
                      onClick={() => setFilterMode('current')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                        filterMode === 'current'
                          ? 'bg-[#ed1c24] text-white shadow-lg'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                      }`}
                    >
                      Current Month
                    </button>
                    <button
                      onClick={() => setFilterMode('last2')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                        filterMode === 'last2'
                          ? 'bg-[#ed1c24] text-white shadow-lg'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-900/40'
                      }`}
                    >
                      Last 2 Months
                    </button>
                  </div>
                </div>

                
                <div className="space-y-8">
                {/* 6 Category Cards Grid - full width */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(CATEGORIES)
                    .filter(([key]) => canAccessCategory(key as CategoryType))
                    .map(([key, category]) => {
                      const cat = key as CategoryType;
                      const countByFilter = visibleAnnouncements.filter((ann) => {
                            const date = new Date(ann.createdAt);
                            const annMonth = date.getMonth();
                            const annYear = date.getFullYear();
                            const now = new Date();
                            const currentMonth = now.getMonth();
                            const currentYear = now.getFullYear();
                            
                            let dateMatches = false;
                            if (filterMode === 'current') {
                              dateMatches = annMonth === currentMonth && annYear === currentYear;
                            } else {
                              // Last 2 months (previous 2 months, excluding current month)
                              const monthsDiff = (currentYear - annYear) * 12 + (currentMonth - annMonth);
                              dateMatches = monthsDiff >= 1 && monthsDiff <= 2;
                            }
                            
                            return (
                              ann.category === key &&
                              ann.isActive &&
                              dateMatches
                            );
                          }).length;
                          
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setActiveTab("announcement");
                              }}
                              className={cn(
                                "group relative overflow-hidden rounded-2xl p-5 text-left border transition-all duration-300 hover:scale-[1.02] shadow-xl",
                                getStatGradient(cat)
                              )}
                            >
                              {/* Top gradient overlay */}
                              <div className={cn(
                                "absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none",
                                getStatTopGradient(cat)
                              )} />
                              <div className="relative flex items-center gap-3 mb-6 sm:mb-8">
                                <span className={cn(
                                  "inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 shadow-inner transition-transform group-hover:scale-110",
                                  getStatIconColor(cat)
                                )}>
                                  <LucideIcon name={getIconNameForCategory(cat)} className="w-4 h-4 sm:w-5 sm:h-5" />
                                </span>
                                <div className="min-w-0">
                                  <div className="text-sm sm:text-base font-black tracking-wide leading-tight uppercase text-white truncate">
                                    {category.displayName}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/30 mt-1">
                                    {filterMode === 'current' 
                                      ? `${months[new Date().getMonth()]} ${new Date().getFullYear()}`
                                      : `${months[(new Date().getMonth() - 2 + 12) % 12]} - ${months[(new Date().getMonth() - 1 + 12) % 12]} ${new Date().getFullYear()}`
                                    }
                                  </div>
                                </div>
                              </div>

                              <div className="relative flex items-end justify-between">
                                <div className="flex flex-col">
                                  <div className="text-4xl font-black leading-none tracking-tighter tabular-nums text-white mb-2">
                                    {countByFilter}
                                  </div>
                                  <div className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">
                                    Announcements
                                  </div>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-zinc-900/40 border border-white/5 flex items-center justify-center group-hover:bg-zinc-900/60 transition-all">
                                  <LucideIcon name="chevron-right" className="w-3 h-3 text-zinc-500" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                </div>

                  {/* Distribution Doughnut — full width below cards */}
                  <div className="bg-zinc-950 rounded-2xl p-5 border border-white/10 shadow-2xl">
                      {/* Title top-left */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                          <LucideIcon name="pie-chart" className="w-4 h-4 text-violet-500" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Distribution</h4>
                      </div>

                      {/* Chart + Legend flex row */}
                      {(() => {
                        const total = getFilteredStats().reduce((sum, item) => sum + item.value, 0);
                        const hasData = (pieSlices?.filter(s => s.value > 0).length ?? 0) > 0;
                        const chartCircle = (
                          <div className="relative w-44 h-44 shrink-0">
                            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                              {pieSlices?.map((slice, i) => (
                                <path
                                  key={i}
                                  d={slice.pathData}
                                  fill={slice.color}
                                  className="transition-all duration-500 hover:opacity-80 cursor-pointer stroke-[6] stroke-zinc-950"
                                />
                              ))}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-20 h-20 bg-zinc-950 rounded-full border border-white/10 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{total}</span>
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total</span>
                              </div>
                            </div>
                          </div>
                        );
                        if (!hasData) {
                          return <div className="flex justify-center py-2">{chartCircle}</div>;
                        }
                        return (
                          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                            {chartCircle}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 sm:gap-x-10 gap-y-3 flex-1 w-full">
                              {pieSlices?.filter(s => s.value > 0).map((slice, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide truncate">{slice.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            )}

            {activeTab === "qr-scanner" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <QRScanner 
                  events={visibleAnnouncements}
                  selectedEventId={selectedScannerEventId}
                  onEventChange={(id) => {
                    setSelectedScannerEventId(id);
                    fetchScannerAttendance(id);
                  }}
                  onScan={handleQRScan}
                  attendance={scannerAttendance}
                  isLoading={isScannerLoading}
                  result={scannerResult}
                />

                <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                  <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl p-0 overflow-hidden max-w-sm">
                    <div className="relative">
                      {/* Success Header */}
                      <div className="bg-emerald-500/10 p-8 flex flex-col items-center justify-center border-b border-emerald-500/20">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4 animate-in zoom-in-50 duration-500">
                          <LucideIcon name="check" className="w-12 h-12 text-white stroke-[3px]" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-500">Verified!</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mt-1">Access Granted</p>
                      </div>

                      {/* Content */}
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                              <LucideIcon name="user" className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Employee Name</p>
                              <p className="text-base font-bold text-white truncate">{successScanData?.userName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                              <LucideIcon name="mail" className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Email Address</p>
                              <p className="text-sm font-bold text-white/60 truncate">{successScanData?.userEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                              <LucideIcon name="calendar" className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Time Verified</p>
                              <p className="text-sm font-bold text-white/60">
                                {successScanData?.attendedAt ? new Date(successScanData.attendedAt).toLocaleTimeString() : 'Just now'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsSuccessModalOpen(false)}
                          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                        >
                          Back to Scan
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {activeTab === "logs" && isItAdmin && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Header Card */}
                <div className="bg-zinc-900/40 rounded-xl border border-white/10 shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        System Logs
                      </h3>
                      <p className="text-sm text-zinc-400 font-medium mt-1">
                        Audit trail of administrative actions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExportLogsToExcel}
                        disabled={isLoadingLogs || logs.length === 0}
                        className={cn(
                          "h-10 px-5 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5",
                          isLoadingLogs || logs.length === 0
                            ? "bg-zinc-900/40 border-white/10 text-zinc-600 cursor-not-allowed"
                            : "bg-[#ed1c24] hover:bg-red-800 border-[#ed1c24] text-white shadow-md",
                        )}
                      >
                        <LucideIcon
                          name="file-spreadsheet"
                          className="w-3.5 h-3.5"
                        />
                        Export
                      </button>
                      <div className="px-3 py-1 rounded-md bg-zinc-900/40 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {logs.length} Entries
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retention reminder */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <LucideIcon name="clock" className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Logs are automatically deleted after 60 days
                  </p>
                </div>

                {/* Content Section */}
                <div className="bg-zinc-900/40 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                  {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <LucideIcon
                        name="loader"
                        className="w-6 h-6 text-[#ed1c24] animate-spin"
                      />
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        Fetching logs…
                      </span>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                      <LucideIcon
                        name="history"
                        className="w-12 h-12 text-zinc-600 mb-4 stroke-[1px]"
                      />
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        No logs found
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">
                        Activities will appear here as they happen
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto corporate-scrollbar">
                      <div className="min-w-[800px] flex flex-col">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr] gap-4 px-8 py-4 bg-zinc-900/20 border-b border-white/5">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            User
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Action
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">
                            Date
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">
                            Time
                          </span>
                        </div>
                        {/* Table Body */}
                        <div className="divide-y divide-white/5">
                          {logs.map((log) => (
                            <div
                              key={log._id}
                              className="grid grid-cols-[1.2fr_2fr_1fr_1fr] gap-4 px-8 py-5 hover:bg-zinc-900/20 transition-all group"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900/40 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-[#ed1c24] transition-colors shrink-0">
                                  <LucideIcon
                                    name="user"
                                    className="w-3.5 h-3.5"
                                  />
                                </div>
                                <span className="text-sm font-bold text-white truncate">
                                  {log.performedBy || "Unknown"}
                                </span>
                              </div>
                              <div className="flex flex-col justify-center min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span
                                    className={cn(
                                      "text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded border leading-none",
                                      log.action.toLowerCase().includes("delete")
                                        ? "text-rose-500 bg-rose-500/5 border-rose-500/10"
                                        : log.action
                                              .toLowerCase()
                                              .includes("create")
                                          ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
                                          : "text-[#ed1c24] bg-[#ed1c24]/5 border-[#ed1c24]/10",
                                    )}
                                  >
                                    {log.action.replace("_", " ")}
                                  </span>
                                </div>
                                <span
                                  className="text-[13px] text-zinc-400 font-medium truncate leading-none"
                                  title={log.targetTitle || ""}
                                >
                                  {log.targetTitle || "No target specified"}
                                </span>
                              </div>
                              <div className="flex items-center justify-end text-[13px] text-zinc-400 font-semibold">
                                {new Date(log.timestamp).toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                              <div className="flex items-center justify-end text-[13px] text-zinc-500 font-bold tracking-tight">
                                {new Date(log.timestamp).toLocaleTimeString(
                                  undefined,
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {canAccessCategory("policy") && activeTab === "tracking" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Tracking Control Card - Matches Content Management Header */}
                <div className="bg-zinc-950 rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-5">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">Memorandum Tracking</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Monitor policy compliance and acknowledgment status</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {canSeeAllMemos && (
                        <>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] hidden md:block">
                            Filter BU:
                          </span>
                          <Select
                            value={trackingFilterBU}
                            onValueChange={(v) => {
                              setTrackingFilterBU(v);
                              setSelectedMemoId(null);
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-[240px] h-12 border border-white/10 bg-zinc-900/40 rounded-xl shadow-lg hover:border-[#ed1c24] hover:bg-zinc-900/60 focus:ring-2 focus:ring-[#ed1c24]/40 transition-all text-white font-bold uppercase tracking-widest text-[11px]">
                              <SelectValue placeholder="Select Business Unit" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-white/10 shadow-2xl bg-zinc-950 p-2 text-white">
                              <SelectItem
                                value="all"
                                className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white cursor-pointer m-1 text-[10px] font-bold uppercase tracking-widest"
                              >
                                All Business Units
                              </SelectItem>
                              {businessUnits.map((bu) => (
                                <SelectItem
                                  key={bu.name}
                                  value={bu.name}
                                  className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white cursor-pointer m-1 text-[10px] font-bold uppercase tracking-widest"
                                >
                                  <div className="flex items-center gap-3">
                                    <Image
                                      src={bu.image}
                                      alt={bu.name}
                                      width={24}
                                      height={24}
                                      className="rounded-lg object-contain"
                                    />
                                    {bu.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified List View - Matches Active Feed Structure */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900/40 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                        <LucideIcon name="bar-chart-3" className="w-5 h-5 text-[#ed1c24]" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase">Active Tracking</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                          Monitoring {
                            visibleAnnouncements
                              .filter((a) => a.category === "policy" && a.requiresAcknowledgment)
                              .filter((a) => {
                                if (canSeeAllMemos) {
                                  if (trackingFilterBU === "all") return true;
                                  return normalizeBU(a.businessUnit || "") === normalizeBU(trackingFilterBU);
                                }
                                return true;
                              }).length
                          } Policies
                        </p>
                      </div>
                    </div>

                    {/* Overall Compliance Badge in Header - Matches Post Count Badge Style */}
                    {(() => {
                      const trackedMemos = visibleAnnouncements
                        .filter((a) => a.category === "policy" && a.requiresAcknowledgment)
                        .filter((a) => {
                          if (selectedMemoId && a.id !== selectedMemoId) return false;
                          if (trackingFilterBU !== "all") {
                            const abu = normalizeBU(a.businessUnit || "");
                            const fbu = normalizeBU(trackingFilterBU);
                            return abu === fbu || abu === "ALL" || !abu;
                          }
                          return true;
                        });

                      const emailsByMemo: Record<string, Set<string>> = {};
                      trackedMemos.forEach((m) => {
                        const mbu = normalizeBU(m.businessUnit || "");
                        const allowed = allPeople.filter((e) => {
                          const ebu = normalizeBU(e.businessUnit || "");
                          if (!canSeeAllMemos && currentUserBusinessUnits?.length) {
                            if (!currentUserBusinessUnits.map(u => normalizeBU(u)).includes(ebu)) return false;
                          }
                          if (trackingFilterBU !== "all" && ebu !== normalizeBU(trackingFilterBU)) return false;
                          if (mbu && mbu !== "ALL" && mbu !== "CNT GROUP") return ebu === mbu;
                          return true;
                        }).map((e) => e.email.toLowerCase());
                        emailsByMemo[m.id] = new Set(allowed);
                      });
                      
                      const totalRequired = trackedMemos.reduce((sum, m) => sum + (emailsByMemo[m.id]?.size || 0), 0);
                      const totalAcknowledged = allAcknowledgments.filter((r) => emailsByMemo[r.memo_id]?.has(r.employee_email.toLowerCase())).length;
                      const globalPercentage = totalRequired > 0 ? Math.round((totalAcknowledged / totalRequired) * 100) : 0;

                      return (
                        <div className="px-4 py-1.5 rounded-lg bg-[#ed1c24]/10 border border-[#ed1c24]/20 text-[10px] font-black text-[#ed1c24] uppercase tracking-widest shadow-sm flex items-center gap-3">
                          <LucideIcon name="check-circle" className="w-3 h-3" />
                          <span>{globalPercentage}% Compliance</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(() => {
                      const filteredMemos = visibleAnnouncements
                        .filter((a) => a.category === "policy" && a.requiresAcknowledgment)
                        .filter((a) => {
                          if (selectedMemoId && a.id !== selectedMemoId) return false;
                          if (trackingFilterBU !== "all") {
                            const abu = normalizeBU(a.businessUnit || "");
                            const fbu = normalizeBU(trackingFilterBU);
                            return abu === fbu || abu === "ALL" || !abu;
                          }
                          return true;
                        });

                      if (filteredMemos.length === 0) {
                        return (
                          <div className="col-span-full text-center py-20 bg-zinc-950 rounded-xl border border-dashed border-white/10">
                            <div className="text-white/60 text-lg font-black uppercase tracking-tighter">
                              No Memo Created
                            </div>
                            <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
                              Create a policy memo to start tracking
                            </div>
                          </div>
                        );
                      }

                      return filteredMemos.map((a) => {
                        const mbu = normalizeBU(a.businessUnit || "");
                        const employees = allPeople.filter((e) => {
                          const ebu = normalizeBU(e.businessUnit || "");
                          if (!canSeeAllMemos && currentUserBusinessUnits?.length) {
                            if (!currentUserBusinessUnits.map(u => normalizeBU(u)).includes(ebu)) return false;
                          }
                          if (trackingFilterBU !== "all" && ebu !== normalizeBU(trackingFilterBU)) return false;
                          if (mbu && mbu !== "ALL" && mbu !== "CNT GROUP") return ebu === mbu;
                          return true;
                        });
                        
                        const allowedEmails = new Set(employees.map((e) => e.email.toLowerCase()));
                        const ackCount = allAcknowledgments.filter(r => r.memo_id === a.id && allowedEmails.has(r.employee_email.toLowerCase())).length;
                        const pendingCount = employees.length - ackCount;
                        const compliance = employees.length > 0 ? Math.round((ackCount / employees.length) * 100) : 0;

                        return (
                          <Dialog key={a.id}>
                            <DialogTrigger asChild>
                              <div
                                className="rounded-2xl border bg-violet-950/70 border-violet-900/50 hover:border-violet-500/60 transition-all duration-500 group relative flex flex-col min-h-[280px] shadow-2xl overflow-hidden cursor-pointer"
                              >
                                {/* Business Unit Watermark Background - Full Card */}
                                {a.businessUnit && getBusinessLogo(a.businessUnit) && (
                                  <div className="absolute inset-0 flex items-center justify-end overflow-hidden pr-8">
                                    <div className="relative w-[280px] h-[280px]">
                                      <Image 
                                        src={getBusinessLogo(a.businessUnit)!}
                                        alt={a.businessUnit}
                                        fill
                                        className="object-contain opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.12]"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Floating Badges - Top */}
                                <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                                  <div className="flex flex-col gap-2">
                                    <span className="px-3 py-1 rounded-full bg-zinc-950/90 backdrop-blur-md text-[10px] font-black text-zinc-400 uppercase tracking-wider border border-white/10 shadow-xl">
                                      {a.memoUid || "NO-UID"}
                                    </span>
                                    {a.registrationType && (
                                      <span className="px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur-md text-[10px] font-black text-rose-400 uppercase tracking-wider border border-rose-500/30 shadow-xl">
                                        {a.registrationType.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-lg backdrop-blur-md",
                                    compliance >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                                    compliance >= 50 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : 
                                    "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                  )}>
                                    {compliance}%
                                  </span>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 px-6 pt-24 pb-6 flex flex-col justify-between relative z-10">
                                  {/* Icon and Title */}
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105">
                                        <LucideIcon name="file-text" className="w-8 h-8 text-white" />
                                      </div>
                                      <h4 className="flex-1 font-black text-white text-xl leading-tight line-clamp-2 transition-colors group-hover:text-white/90">
                                        {stripLeadingEmoji(a.title)}
                                      </h4>
                                    </div>

                                    {/* Date and Stats */}
                                    <div className="space-y-2 pl-1">
                                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        <div className="w-7 h-7 rounded-lg bg-zinc-900/50 flex items-center justify-center border border-white/5">
                                          <LucideIcon name="calendar" className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        <div className="w-7 h-7 rounded-lg bg-zinc-900/50 flex items-center justify-center border border-white/5">
                                          <LucideIcon name="users" className="w-4 h-4 text-zinc-500" />
                                        </div>
                                        <span className="text-zinc-400">{ackCount} confirmed</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <span className="text-rose-500/60">{pendingCount} pending</span>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="space-y-1 pt-2">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                          <span>Compliance</span>
                                          <span className={cn(
                                            compliance >= 80 ? "text-emerald-500" : 
                                            compliance >= 50 ? "text-amber-500" : 
                                            "text-rose-500"
                                          )}>{compliance}%</span>
                                        </div>
                                        <div className="relative h-1.5 w-full bg-zinc-900/60 rounded-full overflow-hidden border border-white/5">
                                          <div 
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ed1c24] to-red-500 transition-all duration-1000"
                                            style={{ width: `${compliance}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions Section */}
                                  <div className="flex justify-end pt-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleExportToExcel(a)}
                                      className="h-9 px-4 rounded-xl bg-zinc-900/60 hover:bg-[#ed1c24] text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-[#ed1c24]/50 active:scale-95 group/btn"
                                    >
                                      <LucideIcon name="file-spreadsheet" className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Export Report</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 text-white w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[1600px] max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl rounded-2xl p-0">
                               <div className="p-8 md:p-10">
                                 <div className="mb-10 border-b border-white/5 pb-8">
                                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                     <div className="flex items-center gap-6">
                                       <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20 shadow-inner">
                                         <LucideIcon name="file-text" className="w-6 h-6 text-violet-500" />
                                       </div>
                                       <div>
                                         <div className="mb-2">
                                           <Image 
                                             src="/GOC.png" 
                                             alt="Logo" 
                                             width={60} 
                                             height={24} 
                                             className="h-6 w-auto object-contain"
                                           />
                                         </div>
                                         <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                                           {stripLeadingEmoji(a.title)}
                                         </h2>
                                         <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                                           {a.memoUid} • Issued {new Date(a.createdAt).toLocaleDateString()}
                                         </p>
                                       </div>
                                     </div>
                                     <button
                                       onClick={() => handleExportToExcel(a)}
                                       className="flex items-center justify-center gap-2.5 px-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                                     >
                                       <LucideIcon name="file-spreadsheet" className="w-4 h-4" />
                                       Export Report
                                     </button>
                                   </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                   <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 shadow-xl">
                                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Compliance Rate</span>
                                     <div className="text-4xl font-black text-[#ed1c24] mt-2">{compliance}%</div>
                                     <div className="mt-4 h-1.5 w-full bg-zinc-900/20 rounded-full overflow-hidden">
                                       <div className="h-full bg-[#ed1c24]" style={{ width: `${compliance}%` }} />
                                     </div>
                                   </div>
                                   <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 shadow-xl">
                                     <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Confirmed</span>
                                     <div className="text-4xl font-black text-emerald-500 mt-2">{ackCount}</div>
                                     <p className="text-[10px] text-white/40 font-bold uppercase mt-2">Total acknowledgments</p>
                                   </div>
                                   <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/10 shadow-xl">
                                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Pending</span>
                                     <div className="text-4xl font-black text-rose-500 mt-2">{pendingCount}</div>
                                     <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">Awaiting confirmation</p>
                                   </div>
                                 </div>

                                 <div className="space-y-6">
                                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                       <LucideIcon name="users" className="w-4 h-4 text-zinc-500" />
                                       Staff Records
                                     </h3>
                                     <div className="relative w-full max-w-xs">
                                       <LucideIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                         <input
                                          type="text"
                                          placeholder="Search by name or email..."
                                          value={employeeSearchQuery}
                                          onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                          className="w-full h-10 pl-9 pr-4 bg-zinc-900/40 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ed1c24] transition-all"
                                        />
                                     </div>
                                   </div>

                                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                     <div className="flex flex-col h-[500px]">
                                       <div className="flex items-center gap-2 mb-4">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                         <span className="text-[11px] font-black text-white uppercase tracking-widest">Acknowledged List</span>
                                       </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/20 rounded-xl border border-white/5 p-4">
                                           {(() => {
                                             const recs = allAcknowledgments
                                               .filter(r => r.memo_id === a.id && allowedEmails.has(r.employee_email.toLowerCase()))
                                               .filter(r => !employeeSearchQuery.trim() || 
                                                 r.employee_name?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                                 r.employee_email.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                                               );
                                             
                                             return recs.length > 0 ? (
                                               <div className="space-y-2">
                                                 {recs.map(r => (
                                                   <div key={r.employee_email} className="p-3 rounded-lg bg-zinc-900/40 flex items-center justify-between hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-white/5">
                                                    <div>
                                                      <div className="text-xs font-bold text-white">{r.employee_name || r.employee_email}</div>
                                                      <div className="text-[8px] text-zinc-500 uppercase mt-1">
                                                        {new Date(r.acknowledged_at).toLocaleString()}
                                                      </div>
                                                    </div>
                                                    <div className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">CONFIRMED</div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : <div className="h-full flex flex-col items-center justify-center text-white/20 text-[10px] uppercase font-bold gap-3">
                                              <LucideIcon name="search-x" className="w-8 h-8 opacity-20" />
                                              No records found
                                            </div>;
                                          })()}
                                       </div>
                                     </div>

                                     <div className="flex flex-col h-[500px]">
                                       <div className="flex items-center gap-2 mb-4">
                                         <div className="w-2 h-2 rounded-full bg-rose-500" />
                                         <span className="text-[11px] font-black text-white uppercase tracking-widest">Pending List</span>
                                       </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/20 rounded-xl border border-white/5 p-4">
                                           {(() => {
                                             const acknowledgedEmails = new Set(allAcknowledgments.filter(r => r.memo_id === a.id).map(r => r.employee_email.toLowerCase()));
                                             const pending = employees
                                               .filter(e => !acknowledgedEmails.has(e.email.toLowerCase()))
                                               .filter(e => !employeeSearchQuery.trim() || 
                                                 e.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                                                 e.email.toLowerCase().includes(employeeSearchQuery.toLowerCase())
                                               );
                                             
                                             return pending.length > 0 ? (
                                               <div className="space-y-2">
                                                 {pending.map(e => (
                                                   <div key={e.email} className="p-3 rounded-lg bg-zinc-900/40 flex items-center justify-between hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-white/5">
                                                    <div>
                                                      <div className="text-xs font-bold text-white">{e.name}</div>
                                                      <div className="text-[8px] text-zinc-500 uppercase mt-1">{e.email}</div>
                                                    </div>
                                                    <div className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">PENDING</div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : <div className="h-full flex flex-col items-center justify-center text-white/20 text-[10px] uppercase font-bold gap-3">
                                              <LucideIcon name="check-circle" className="w-8 h-8 opacity-20 text-emerald-500" />
                                              All staff confirmed
                                            </div>;
                                          })()}
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                            </DialogContent>
                          </Dialog>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "announcement" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Category Selection Card */}
                <div className="bg-zinc-950 rounded-2xl border border-white/10 shadow-2xl p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                                            <div>
                        <h3 className="text-xl font-bold text-white tracking-tight uppercase">Content Management</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Select category to manage posts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] hidden md:block">
                        Switch Category:
                      </span>
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) =>
                          setSelectedCategory(value as CategoryType)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[320px] h-12 border border-white/10 bg-zinc-900/40 rounded-xl shadow-lg hover:border-[#ed1c24] hover:bg-zinc-900/60 focus:ring-2 focus:ring-[#ed1c24]/40 transition-all text-white font-bold uppercase tracking-widest text-[11px]">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIES)
                            .filter(([key]) =>
                              canAccessCategory(key as CategoryType),
                            )
                            .map(([key, category]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="rounded-lg py-3 focus:bg-[#ed1c24] focus:text-white cursor-pointer m-1"
                              >
                                <div className="flex items-center gap-4">
                                  <span
                                    className={cn(
                                      "inline-flex items-center justify-center w-8 h-8 rounded-lg text-white shadow-md",
                                      getIconBgClass(key as CategoryType),
                                    )}
                                  >
                                    <LucideIcon
                                      name={getIconNameForCategory(
                                        key as CategoryType,
                                      )}
                                      className="w-4 h-4 text-white"
                                    />
                                  </span>
                                  <span className="font-bold uppercase tracking-widest text-[10px] text-white">
                                    {category.displayName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Unified List View with Create Box at Top */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight uppercase">Active Feed</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Managing {CATEGORIES[selectedCategory].displayName}</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-lg bg-zinc-900/40 border border-white/10 text-[10px] font-black text-zinc-500 uppercase tracking-widest shadow-sm">
                      {getAnnouncementsByCategory(selectedCategory).length} Posts
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Create New Post Card (Placeholder) */}
                    <div 
                      onClick={() => {
                        setEditingAnnouncement(null);
                        setIsAnnouncementDialogOpen(true);
                      }}
                      className="rounded-2xl border-2 border-dashed border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-[#ed1c24]/50 transition-all duration-500 group cursor-pointer flex flex-col items-center justify-center min-h-[280px] shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ed1c24]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900/40 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-[#ed1c24] group-hover:border-[#ed1c24] transition-all duration-500 shadow-2xl">
                          <LucideIcon name="plus" className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-sm font-black text-white tracking-tighter uppercase group-hover:text-[#ed1c24] transition-colors leading-none mb-1">
                            Create New Post
                          </h3>
                          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                            Publish an announcement
                          </p>
                        </div>
                      </div>
                    </div>

                    {getAnnouncementsByCategory(selectedCategory).map(
                      (announcement) => (
                        <div
                          key={announcement.id}
                          className={cn(
                            "rounded-2xl border transition-all duration-500 group relative flex flex-col min-h-[280px] shadow-2xl overflow-hidden",
                            getCardBg(selectedCategory)
                          )}
                        >
                          {/* Business Unit Watermark Background - Full Card */}
                          {announcement.businessUnit && getBusinessLogo(announcement.businessUnit) && (
                            <div className="absolute inset-0 flex items-center justify-end overflow-hidden pr-8">
                              <div className="relative w-[280px] h-[280px]">
                                <Image 
                                  src={getBusinessLogo(announcement.businessUnit)!}
                                  alt={announcement.businessUnit}
                                  fill
                                  className="object-contain opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.12]"
                                />
                              </div>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                            <div className="flex flex-col gap-2">
                              <span className="px-3 py-1 rounded-full bg-zinc-950/90 backdrop-blur-md text-[10px] font-black text-zinc-400 uppercase tracking-wider border border-white/10 shadow-xl">
                                {announcement.memoUid || "NO-UID"}
                              </span>
                              {announcement.registrationType && announcement.category === 'events' && (
                                <span className="px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur-md text-[10px] font-black text-rose-400 uppercase tracking-wider border border-rose-500/30 shadow-xl">
                                  {announcement.registrationType.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            {isEndingSoon(announcement) && (
                              <span className="px-3 py-1 rounded-full bg-rose-500 text-[10px] font-black text-white uppercase tracking-wider border border-rose-400/50 shadow-lg animate-pulse">
                                Ending Soon
                              </span>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 px-6 pt-24 pb-6 flex flex-col justify-between relative z-10">
                            {/* Icon and Title */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 bg-white/10 backdrop-blur-md border border-white/20"
                                )}>
                                  <LucideIcon
                                    name={getIconNameForCategory(selectedCategory)}
                                    className="w-8 h-8 text-white"
                                  />
                                </div>
                                <h4 className="flex-1 font-black text-white text-3xl leading-tight line-clamp-2 transition-colors group-hover:text-white/90">
                                  {stripLeadingEmoji(announcement.title)}
                                </h4>
                              </div>

                              {/* Date and Location */}
                              <div className="space-y-2 pl-1">
                                <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                  <div className="w-7 h-7 rounded-lg bg-zinc-900/50 flex items-center justify-center border border-white/5">
                                    <LucideIcon name="calendar" className="w-4 h-4 text-zinc-500" />
                                  </div>
                                  <span>{new Date(announcement.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                                {announcement.category === "events" && announcement.location && (
                                  <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    <div className="w-7 h-7 rounded-lg bg-zinc-900/50 flex items-center justify-center border border-white/5">
                                      <LucideIcon name="map-pin" className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <span className="truncate">{announcement.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions Section */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                              {announcement.category === "events" && announcement.registrationType === "INVITE_ONLY" && (
                                <button
                                  onClick={() => handleSendInvites(announcement)}
                                  disabled={isSendingInvites === announcement.id}
                                  className="h-12 px-6 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 group/btn"
                                >
                                  {isSendingInvites === announcement.id ? (
                                    <LucideIcon name="loader" className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <LucideIcon name="send" className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                  )}
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Invites</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setEditingAnnouncement(announcement.id);
                                  setIsAnnouncementDialogOpen(true);
                                }}
                                className="h-9 px-4 rounded-xl bg-zinc-900/60 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95 group/edit"
                              >
                                <LucideIcon name="pencil" className="w-3.5 h-3.5 group-hover/edit:rotate-12 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Edit</span>
                              </button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/20 active:scale-95 group/del"
                                    title="Delete"
                                  >
                                    <LucideIcon name="trash-2" className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl shadow-2xl p-6">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg font-black uppercase tracking-tight text-white mb-1">Delete Post?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400 font-medium text-sm">
                                      This will permanently remove &quot;<span className="text-white font-bold">{stripLeadingEmoji(announcement.title)}</span>&quot;. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-3 mt-6">
                                    <AlertDialogCancel className="bg-zinc-900/40 hover:bg-zinc-900/60 border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] h-10 px-6 transition-all">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                                      className="bg-[#ed1c24] hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] h-10 px-6 border-none transition-all shadow-lg shadow-red-500/20"
                                    >Delete Permanently</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Announcement Creation/Editing Dialog */}
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={(open) => {
                  setIsAnnouncementDialogOpen(open);
                  if (!open) setEditingAnnouncement(null);
                }}>
                  <DialogContent className="bg-zinc-950 border-white/10 text-white w-full max-w-[95vw] lg:max-w-[80vw] xl:max-w-[70vw] 2xl:max-w-[1400px] max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl rounded-2xl p-0">
                    <div className="p-8 md:p-10">
                      <div className="mb-10 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-zinc-900/40 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <LucideIcon
                              name={editingAnnouncement ? "edit-3" : "plus-circle"}
                              className="w-6 h-6 text-[#ed1c24]"
                            />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                              {editingAnnouncement ? "Edit Post" : "Create Post"}
                            </h2>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">
                              {CATEGORIES[selectedCategory].displayName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <AdminForm
                        category={selectedCategory}
                        businessUnits={filteredBusinessUnits}
                        onSubmit={async (data) => {
                          if (editingAnnouncement) {
                            await handleUpdateAnnouncement(editingAnnouncement, data);
                          } else {
                            await handleCreateAnnouncement(data);
                          }
                          setIsAnnouncementDialogOpen(false);
                        }}
                        onCancel={() => {
                          setIsAnnouncementDialogOpen(false);
                          setEditingAnnouncement(null);
                        }}
                        editingAnnouncement={
                          editingAnnouncement
                            ? localAnnouncements.find(
                                (ann) => ann.id === editingAnnouncement,
                              )
                            : undefined
                        }
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {canManageUsers && activeTab === "account" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-zinc-900/40 rounded-xl border border-white/10 shadow-lg p-8">
                  <div className="flex flex-col gap-8">
                    {/* Header with Toggle */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-8">
                      <div className="flex items-center gap-5">
                                                <div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">
                            Create Admin Account
                          </h3>
                          <p className="text-sm text-zinc-500 font-medium mt-1">
                            Add new administrators with specific permissions
                          </p>
                        </div>
                        
                                              </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                        {/* Import Controls */}
                        <div className="flex items-center gap-4 pr-6 sm:border-r border-white/5">
                          <div className="flex flex-col items-end text-right hidden md:flex">
                            <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest leading-none">
                              Bulk Creation
                            </span>
                            <span className="text-[8px] text-zinc-500 font-medium uppercase tracking-tighter mt-1.5 max-w-[180px] leading-tight">
                              {accountSubTab === "admin" ? "Names, Email, BU, Password" : "Names, Birthdate, Email, BU"}
                            </span>
                          </div>
                          <label className="cursor-pointer group shrink-0">
                            <div
                              className={cn(
                                "flex items-center gap-2.5 px-5 h-10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-500 rounded-xl border border-emerald-500/10 transition-all shadow-sm",
                                isImporting && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              <LucideIcon
                                name={isImporting ? "loader" : "file-spreadsheet"}
                                className={cn(
                                  "w-4 h-4",
                                  isImporting && "animate-spin",
                                )}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                {isImporting ? "Importing..." : "Import Excel"}
                              </span>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".xlsx, .xls"
                              onChange={handleExcelImport}
                              disabled={isImporting}
                            />
                          </label>
                        </div>

                        {/* Sub Tab Switcher */}
                                              </div>
                    </div>

                    {/* Form Fields — hidden when there are pending accounts */}
                    {pendingAdmins.length === 0 && (<>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Name Fields (Common for both Admin and User) */}
                      <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* First Name */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                            First Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. John"
                            value={newFirstName}
                            onChange={(e) => setNewFirstName(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                            disabled={isCreatingUser || creatingCompanyEmail}
                          />
                        </div>
                        {/* Middle Name */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Quency"
                            value={newMiddleName}
                            onChange={(e) => setNewMiddleName(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                            disabled={isCreatingUser || creatingCompanyEmail}
                          />
                        </div>
                        {/* Last Name */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Doe"
                            value={newLastName}
                            onChange={(e) => setNewLastName(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                            disabled={isCreatingUser || creatingCompanyEmail}
                          />
                        </div>
                      </div>

                      {/* Secondary Fields (Email, Birthdate/Password, BU) */}
                      <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Email Field */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                            {isCreatingAdmin ? "Admin Email" : "Email Address"}
                          </label>
                          <input
                            type="text"
                            placeholder="Enter email address"
                            value={isCreatingAdmin ? newUsername : newCompanyEmail}
                            onChange={(e) => isCreatingAdmin ? setNewUsername(e.target.value) : setNewCompanyEmail(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                            disabled={isCreatingUser || creatingCompanyEmail}
                          />
                        </div>

                        {/* Birthdate/Password Field */}
                        {!isCreatingAdmin ? (
                          /* Birthdate Field (User Only) */
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                              Birthdate
                            </label>
                            <input
                              type="date"
                              value={newCompanyBirthdate}
                              onChange={(e) => setNewCompanyBirthdate(e.target.value)}
                              className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600 [color-scheme:dark]"
                              disabled={creatingCompanyEmail}
                            />
                          </div>
                        ) : (
                          <>
                          {/* Password Field (Admin Only) */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-11 pl-4 pr-24 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                                disabled={isCreatingUser}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 h-7 text-[9px] font-black uppercase tracking-widest rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                              >
                                {showNewPassword ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>

                          {/* Birthdate Field (Admin Only) */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                              Birthdate
                            </label>
                            <input
                              type="date"
                              value={newUserBirthdate}
                              onChange={(e) => setNewUserBirthdate(e.target.value)}
                              className="w-full h-11 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600 [color-scheme:dark]"
                              disabled={isCreatingUser}
                            />
                          </div>
                          </>
                        )}

                        {/* Business Unit (Common) */}
                        {!isAccountSuperAdmin({ username: isCreatingAdmin ? newUsername : newCompanyEmail }) && (
                          <div className="space-y-2.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                              Business Unit
                            </label>
                            <Select
                              value={isCreatingAdmin ? newUserBusinessUnit : newCompanyBusinessUnit}
                              onValueChange={(v) => isCreatingAdmin ? setNewUserBusinessUnit(v) : setNewCompanyBusinessUnit(v)}
                            >
                              <SelectTrigger className="w-full h-11 border border-white/10 bg-zinc-900/40 text-white rounded-lg text-xs font-bold shadow-sm focus:ring-1 focus:ring-[#ed1c24]/40 transition-all">
                                <SelectValue placeholder="Select Business Unit" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-lg shadow-xl">
                                {businessUnits.map((bu) => (
                                  <SelectItem
                                    key={bu._id}
                                    value={bu.name}
                                    className="text-xs font-medium focus:bg-[#ed1c24] focus:text-white"
                                  >
                                    {bu.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Admin Specific Toggle for Scanner (only if creating admin) */}
                    </div>

                    {/* Posting Permissions or Registration Type (Admin Only) */}
                    {isCreatingAdmin && !isAccountSuperAdmin({ username: newUsername }) && (
                      <div className="space-y-4 mt-6">
                        <>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                Posting Permissions
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium ml-1">
                                Toggle which categories this account can manage. If
                                none are selected, all categories are allowed.
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {Object.entries(CATEGORIES).map(([key, category]) => {
                                const cat = key as CategoryType;
                                const isOn = newUserAllowedCategories.includes(cat);
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    disabled={isCreatingUser}
                                    onClick={() => {
                                      const next = newUserAllowedCategories.includes(cat)
                                        ? newUserAllowedCategories.filter((c) => c !== cat)
                                        : [...newUserAllowedCategories, cat];
                                      setNewUserAllowedCategories(next);
                                      if (cat === "events") {
                                        // Scanner only if events is the sole category
                                        setNewUserIsScannerOnly(!isOn && next.length === 1);
                                      } else {
                                        // If other categories exist alongside events, not scanner only
                                        setNewUserIsScannerOnly(next.length === 1 && next.includes("events"));
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                                      isOn
                                        ? "bg-[#ed1c24] border-[#ed1c24] text-white shadow-md"
                                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900/60 hover:border-white/10",
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={cn(
                                          "inline-flex items-center justify-center w-6 h-6 rounded-md text-white shadow-sm",
                                          getIconBgClass(cat),
                                        )}
                                      >
                                        <LucideIcon
                                          name={getIconNameForCategory(cat)}
                                          className="w-3 h-3"
                                        />
                                      </span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                                        {category.displayName}
                                      </span>
                                    </div>
                                    <LucideIcon
                                      name={isOn ? "check-circle-2" : "circle"}
                                      className={cn(
                                        "w-3.5 h-3.5 shrink-0",
                                        isOn ? "text-white" : "text-white/10",
                                      )}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/5 mt-8">
                      <button
                        onClick={async () => {
                          const fullName = [
                            newFirstName.trim(),
                            newMiddleName.trim(),
                            newLastName.trim(),
                          ]
                            .filter(Boolean)
                            .join(" ");

                          if (isCreatingAdmin) {
                            // Admin Creation Logic
                            const isSuper = isAccountSuperAdmin({ username: newUsername.trim() });
                            if (
                              !newUsername.trim() ||
                              !newPassword.trim() ||
                              (!isSuper && !newUserBusinessUnit) ||
                              !fullName
                            ) {
                              sileo.warning({
                                title: "Please fill in all required fields",
                                description: "Names, Email, Password, and BU are required."
                              });
                              return;
                            }
                            // Basic email validation
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(newUsername.trim())) {
                              sileo.warning({
                                title: "Invalid Email",
                                description:
                                  "Please enter a valid email address for the admin account",
                              });
                              return;
                            }
                            if (newPassword.length < 6) {
                              sileo.warning({ title: "Password too short" });
                              return;
                            }
                            setIsCreatingUser(true);
                            try {
                              const res = await fetch("/api/admin/users", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  username: newUsername.trim(),
                                  name: fullName,
                                  password: newPassword,
                                  allowedCategories: newUserAllowedCategories,
                                  businessUnits: Array.from(new Set([newUserBusinessUnit, ...newUserBusinessUnits])).filter(Boolean),
                                  isScannerOnly: newUserIsScannerOnly,
                                  scannerRegTypes: newUserScannerRegTypes,
                                }),
                              });
                              if (res.ok) {
                                sileo.success({ title: "Admin Account Created" });
                                setNewFirstName("");
                                setNewMiddleName("");
                                setNewLastName("");
                                setNewUsername("");
                                setNewPassword("");
                                setNewUserAllowedCategories([]);
                                setNewUserBusinessUnit("");
                                setNewUserBusinessUnits([]);
                                setNewUserIsScannerOnly(false);
                                setNewUserScannerRegTypes([]);
                                fetchAllUsers();
                              } else {
                                const data = await res.json();
                                sileo.error({ title: data.error || "Failed to create" });
                              }
                            } catch {
                              sileo.error({ title: "Network error" });
                            } finally {
                              setIsCreatingUser(false);
                            }
                          } else {
                            // User Creation Logic
                            if (
                              !fullName ||
                              !newCompanyEmail.trim() ||
                              !newCompanyBusinessUnit ||
                              !newCompanyBirthdate
                            ) {
                              sileo.warning({
                                title: "Please fill in all required fields",
                                description:
                                  "First Name, Last Name, Email, Birthdate, and Business Unit are required.",
                              });
                              return;
                            }

                            try {
                              setCreatingCompanyEmail(true);
                              await createCompanyEmail({
                                name: fullName,
                                email: newCompanyEmail.trim().toLowerCase(),
                                businessUnit: newCompanyBusinessUnit.trim(),
                                birthdate: newCompanyBirthdate,
                              });
                              sileo.success({ title: "User Account Created" });
                              setNewFirstName("");
                              setNewMiddleName("");
                              setNewLastName("");
                              setNewCompanyEmail("");
                              setNewCompanyBirthdate("");
                              setNewCompanyBusinessUnit("");
                              fetchAllUsers();
                            } catch {
                              sileo.error({ title: "Failed to create" });
                            } finally {
                              setCreatingCompanyEmail(false);
                            }
                          }
                        }}
                        disabled={isCreatingUser || creatingCompanyEmail}
                        className="w-full sm:w-auto h-12 px-8 bg-[#ed1c24] hover:bg-red-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-3"
                      >
                        {(isCreatingUser || creatingCompanyEmail) ? (
                          <>
                            <LucideIcon name="loader" className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <LucideIcon name={isCreatingAdmin ? "shield-check" : "user-plus"} className="w-4 h-4" />
                            <span>{isCreatingAdmin ? "Create Admin Account" : "Create User Account"}</span>
                          </>
                        )}
                      </button>
                    </div>
                    </>)}
                  </div>
                </div>

                {pendingAdmins.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                          <LucideIcon name="users" className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight uppercase">
                            Pending Accounts ({pendingAdmins.length})
                          </h3>
                          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">
                            Configure each account — toggle Admin if needed — then save
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setPendingAdmins([])}
                          disabled={isCreatingAll}
                          className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          Clear All
                        </button>
                        <button 
                          onClick={async () => {
                            if (isCreatingAll) return;
                            setIsCreatingAll(true);
                            let successCount = 0;
                            let failCount = 0;

                            try {
                              for (const pending of pendingAdmins) {
                                try {
                                  const fullName = [pending.firstName, pending.middleName, pending.lastName].filter(Boolean).join(" ");
                                  if (!fullName) { failCount++; continue; }

                                  if (pending.isAdmin) {
                                    const res = await fetch("/api/admin/users", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        username: pending.email,
                                        name: fullName,
                                        password: pending.password || "",
                                        allowedCategories: pending.allowedCategories,
                                        businessUnits: [pending.businessUnit],
                                        isScannerOnly: pending.isScannerOnly,
                                      }),
                                    });
                                    if (res.ok) {
                                      successCount++;
                                      // Remove from company emails if exists to avoid duplication
                                      const findRes = await fetch(`/api/company-emails/find?email=${encodeURIComponent(pending.email)}`);
                                      if (findRes.ok) {
                                        const found = await findRes.json();
                                        if (found?._id) {
                                          await fetch(`/api/company-emails/${found._id}`, { method: "DELETE" });
                                        }
                                      }
                                    } else failCount++;
                                  } else {
                                    await createCompanyEmail({
                                      name: fullName,
                                      email: pending.email,
                                      businessUnit: pending.businessUnit,
                                      birthdate: pending.birthdate || "",
                                    });
                                    successCount++;
                                  }
                                } catch (err) {
                                  console.error("Failed to create account:", err);
                                  failCount++;
                                }
                              }
                              
                              if (successCount > 0) {
                                sileo.success({ 
                                  title: "Accounts Created", 
                                  description: `Successfully created ${successCount} accounts. ${failCount} failed.` 
                                });
                                setPendingAdmins([]);
                                fetchAllUsers();
                                setActiveTab("users");
                              } else {
                                sileo.error({ title: "Creation Failed", description: "Failed to create any accounts." });
                              }
                            } catch (err) {
                              sileo.error({ title: "Process error" });
                            } finally {
                              setIsCreatingAll(false);
                            }
                          }}
                          disabled={isCreatingAll}
                          className="h-9 px-6 rounded-lg bg-[#ed1c24] hover:bg-red-800 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isCreatingAll ? (
                            <LucideIcon name="loader" className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LucideIcon name="user-plus" className="w-3.5 h-3.5" />
                          )}
                          Save All &amp; Go to Directory
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {pendingAdmins.map((pending, idx) => (
                        <div key={pending.id} className="bg-zinc-900/40 rounded-xl border border-white/5 p-5 space-y-5 hover:bg-zinc-900/60 transition-all duration-300">
                          {/* Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-bold text-[10px] shadow-sm tracking-tight">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                                  {[pending.firstName, pending.middleName, pending.lastName].filter(Boolean).join(" ")}
                                </h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] text-zinc-500 font-medium tracking-tight">{pending.email}</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                  <span className="text-[9px] text-emerald-500/90 font-bold uppercase tracking-widest">{pending.businessUnit}</span>
                                  {pending.birthdate && (<>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="text-[9px] text-zinc-400 font-medium tracking-tight">
                                      {new Date(pending.birthdate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </>)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-5">
                              {/* Admin switch */}
                              <button
                                onClick={() => setPendingAdmins(prev => prev.map(p =>
                                  p.id === pending.id ? { ...p, isAdmin: !p.isAdmin } : p
                                ))}
                                className="flex items-center gap-3 group"
                                aria-label="Toggle admin"
                              >
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest transition-colors",
                                  pending.isAdmin ? "text-[#ed1c24]" : "text-zinc-500 group-hover:text-zinc-400"
                                )}>
                                  Admin
                                </span>
                                <div className={cn(
                                  "relative w-10 h-5 rounded-full border transition-all duration-300",
                                  pending.isAdmin
                                    ? "bg-[#ed1c24] border-[#ed1c24] shadow-[0_0_10px_rgba(237,28,36,0.2)]"
                                    : "bg-zinc-800 border-white/10"
                                )}>
                                  <div className={cn(
                                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300",
                                    pending.isAdmin ? "left-[22px]" : "left-0.5"
                                  )} />
                                </div>
                              </button>

                              <button
                                onClick={() => setPendingAdmins(prev => prev.filter(p => p.id !== pending.id))}
                                className="h-8 w-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-white border border-white/5 transition-all flex items-center justify-center"
                              >
                                <LucideIcon name="x" className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Admin-only config — expands when toggled on */}
                          {pending.isAdmin && (
                            <div className="space-y-6 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                              {/* Password + Birthdate + Business Unit row */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                                  <input
                                    type="text"
                                    placeholder="Leave blank for default"
                                    value={pending.password || ""}
                                    onChange={(e) => setPendingAdmins(prev => prev.map(p =>
                                      p.id === pending.id ? { ...p, password: e.target.value } : p
                                    ))}
                                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-xs focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Birthdate</label>
                                  <input
                                    type="date"
                                    value={pending.birthdate || ""}
                                    onChange={(e) => setPendingAdmins(prev => prev.map(p =>
                                      p.id === pending.id ? { ...p, birthdate: e.target.value } : p
                                    ))}
                                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-xs focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all [color-scheme:dark]"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Business Unit</label>
                                  <Select
                                    value={pending.businessUnit}
                                    onValueChange={(v) => setPendingAdmins(prev => prev.map(p =>
                                      p.id === pending.id ? { ...p, businessUnit: v } : p
                                    ))}
                                  >
                                    <SelectTrigger className="w-full h-10 border border-white/10 bg-zinc-900/40 text-white rounded-lg text-xs font-bold">
                                      <SelectValue placeholder="Select BU" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#000] border-white/10 text-white rounded-lg">
                                      {businessUnits.map((bu) => (
                                        <SelectItem key={bu._id} value={bu.name} className="text-xs">
                                          {bu.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Posting Permissions</span>
                                  <span className="text-[8px] text-zinc-600 font-medium ml-1">Select categories this admin can manage</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {Object.entries(CATEGORIES).map(([key, category]) => {
                                    const cat = key as CategoryType;
                                    const isOn = pending.allowedCategories.includes(cat);
                                    return (
                                      <button
                                        key={key}
                                        onClick={() => setPendingAdmins(prev => prev.map(p => {
                                          if (p.id !== pending.id) return p;
                                          const next = isOn
                                            ? p.allowedCategories.filter(c => c !== cat)
                                            : [...p.allowedCategories, cat];
                                          return {
                                            ...p,
                                            allowedCategories: next,
                                            // Scanner only if events is the sole category
                                            isScannerOnly: next.length === 1 && next.includes("events"),
                                          };
                                        }))}
                                        className={cn(
                                          "flex items-center gap-2 px-3 h-8 rounded-lg border text-[8px] font-bold uppercase tracking-tight transition-all",
                                          isOn
                                            ? "bg-[#ed1c24] border-[#ed1c24] text-white shadow-sm"
                                            : "bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                                        )}
                                      >
                                        <LucideIcon name={getIconNameForCategory(cat)} className="w-3 h-3" />
                                        <span className="truncate">{category.displayName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {canManageUsers && activeTab === "users" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-zinc-900/40 rounded-xl border border-white/10 shadow-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                      Users & Directory
                    </h3>
                    <p className="text-sm text-zinc-500 font-medium mt-1">
                      Manage admin accounts and company email directory.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                        Filter by Type
                      </label>
                      <Select
                        value={userTypeFilter}
                        onValueChange={(v: any) => setUserTypeFilter(v)}
                      >
                        <SelectTrigger className="w-[140px] h-9 border-white/10 bg-zinc-900/40 text-white rounded-lg text-[10px] font-bold">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                          <SelectItem value="all" className="text-xs">All Types</SelectItem>
                          <SelectItem value="admin" className="text-xs">Admin Accounts</SelectItem>
                          <SelectItem value="company-email" className="text-xs">Company Emails</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                        Filter by Business Unit
                      </label>
                      <Select
                        value={userBUFilter}
                        onValueChange={(v) => setUserBUFilter(v)}
                      >
                        <SelectTrigger className="w-[180px] h-9 border-white/10 bg-zinc-900/40 text-white rounded-lg text-[10px] font-bold">
                          <SelectValue placeholder="All Business Units" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                          <SelectItem value="all" className="text-xs">All Business Units</SelectItem>
                          {businessUnits.map((bu) => (
                            <SelectItem key={bu._id} value={bu.name} className="text-xs">
                              {bu.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="px-3 py-1 rounded-md bg-zinc-900/40 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest self-end h-9 flex items-center">
                      {filteredUsers.length} Entries
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/40 rounded-xl border border-white/10 shadow-lg p-6">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
                      <LucideIcon
                        name="loader"
                        className="w-5 h-5 animate-spin"
                      />
                      <span className="text-sm font-medium">
                        Loading directory…
                      </span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                      <LucideIcon
                        name="users"
                        className="w-12 h-12 text-zinc-600 mb-4 stroke-[1px]"
                      />
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        No entries found
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">
                        Adjust your filters or create a new entry in the Create Account tab
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => {
                        const isSelf = session?.user?.id === user.id;
                        const isAdmin = user.type === 'admin';
                        const isEditing = isAdmin && editingUserId === user.id;
                        const isEditingEmail = !isAdmin && editingCompanyId === user.id;
                        
                        const categoriesForUser = user.allowedCategories;
                        const displayCategories =
                          !categoriesForUser || categoriesForUser.length === 0
                            ? (Object.keys(CATEGORIES) as CategoryType[])
                            : categoriesForUser;
                        
                        return (
                          <div
                            key={`${user.type}-${user.id}`}
                            className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 group hover:bg-zinc-900/60 hover:border-white/20 transition-all duration-300"
                          >
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className={cn(
                                "w-11 h-11 rounded-lg flex items-center justify-center border shadow-sm shrink-0",
                                isAdmin ? "bg-[#ed1c24]/5 border-[#ed1c24]/10" : "bg-[#ed1c24]/5 border-[#ed1c24]/10"
                              )}>
                                <LucideIcon
                                  name={isAdmin ? "shield-check" : "mail"}
                                  className={cn("w-4 h-4", isAdmin ? "text-[#ed1c24]" : "text-zinc-400")}
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                {isEditing ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                          Full Name
                                        </label>
                                        <input
                                          type="text"
                                          value={editingUserFullName}
                                          onChange={(e) =>
                                            setEditingUserFullName(e.target.value)
                                          }
                                          className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-800 outline-none transition-all placeholder:text-zinc-600"
                                          placeholder="Full Name"
                                          disabled={savingUserId === user.id}
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                          Admin Email
                                        </label>
                                        <input
                                          type="text"
                                          value={editingUserUsername}
                                          onChange={(e) =>
                                            setEditingUserUsername(e.target.value)
                                          }
                                          className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-800 outline-none transition-all placeholder:text-zinc-600"
                                          placeholder="Admin Email"
                                          disabled={savingUserId === user.id}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : isEditingEmail ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                                      <input
                                        type="text"
                                        value={editingCompanyName}
                                        onChange={(e) => setEditingCompanyName(e.target.value)}
                                        className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-800 outline-none transition-all"
                                        placeholder="Full Name"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                                      <input
                                        type="email"
                                        value={editingCompanyEmail}
                                        onChange={(e) => setEditingCompanyEmail(e.target.value)}
                                        className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-800 outline-none transition-all"
                                        placeholder="Email Address"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Birthdate</label>
                                      <input
                                        type="date"
                                        value={editingCompanyBirthdate || ""}
                                        onChange={(e) => setEditingCompanyBirthdate(e.target.value)}
                                        className="w-full h-10 px-4 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-800 outline-none transition-all [color-scheme:dark]"
                                      />
                                    </div>
                                    {/* Promote to Admin toggle */}
                                    <div className="flex items-center gap-3 h-10 col-span-full">
                                      <button
                                        onClick={() => {
                                          setEditingCompanyPromoteToAdmin(v => !v);
                                          setEditingCompanyAdminPassword("");
                                          setEditingCompanyAllowedCategories([]);
                                          setEditingCompanyIsScannerOnly(false);
                                        }}
                                        className="flex items-center gap-2.5 group"
                                        aria-label="Promote to admin"
                                      >
                                        <div className={cn(
                                          "relative w-10 h-5 rounded-full border transition-all duration-300",
                                          editingCompanyPromoteToAdmin
                                            ? "bg-[#ed1c24] border-[#ed1c24] shadow-[0_0_10px_rgba(237,28,36,0.2)]"
                                            : "bg-zinc-800 border-white/10"
                                        )}>
                                          <div className={cn(
                                            "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300",
                                            editingCompanyPromoteToAdmin ? "left-[22px]" : "left-0.5"
                                          )} />
                                        </div>
                                        <span className={cn(
                                          "text-[9px] font-bold uppercase tracking-widest transition-colors",
                                          editingCompanyPromoteToAdmin ? "text-[#ed1c24]" : "text-zinc-500 group-hover:text-zinc-400"
                                        )}>
                                          Set as Admin
                                        </span>
                                      </button>
                                    </div>
                                    {editingCompanyPromoteToAdmin && (<>
                                      <div className="col-span-full space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Admin Password</label>
                                        <input
                                          type="text"
                                          value={editingCompanyAdminPassword}
                                          onChange={(e) => setEditingCompanyAdminPassword(e.target.value)}
                                          className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                                          placeholder="Admin password (leave blank for default)"
                                        />
                                      </div>
                                      {/* Posting Permissions */}
                                      <div className="col-span-full space-y-3">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Posting Permissions</span>
                                          <span className="text-[8px] text-zinc-600 font-medium ml-1">Select categories this admin can manage</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {Object.entries(CATEGORIES).map(([key, category]) => {
                                            const cat = key as CategoryType;
                                            const isOn = editingCompanyAllowedCategories.includes(cat);
                                            return (
                                              <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                  const next = isOn
                                                    ? editingCompanyAllowedCategories.filter(c => c !== cat)
                                                    : [...editingCompanyAllowedCategories, cat];
                                                  setEditingCompanyAllowedCategories(next);
                                                  // Scanner only if events is the sole category
                                                  setEditingCompanyIsScannerOnly(next.length === 1 && next.includes("events"));
                                                }}
                                                className={cn(
                                                  "flex items-center gap-2 px-3 h-8 rounded-lg border text-[8px] font-bold uppercase tracking-tight transition-all",
                                                  isOn
                                                    ? "bg-[#ed1c24] border-[#ed1c24] text-white shadow-sm"
                                                    : "bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                                                )}
                                              >
                                                <LucideIcon name={getIconNameForCategory(cat)} className="w-3 h-3" />
                                                <span className="truncate">{category.displayName}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </>)}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight truncate group-hover:text-[#ed1c24] transition-colors">
                                      {isAdmin ? (
                                        (user.username === 'itadmin' || user.username === 'it.support@cntpromoads.com') 
                                          ? 'IT Admin' 
                                          : (user.name || (user.username.split('@')[0].replace(/[\._]/g, ' ')))
                                      ) : user.username}
                                    </h4>
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                      isAdmin 
                                        ? "bg-[#ed1c24]/10 text-[#ed1c24] border-[#ed1c24]/20" 
                                        : "bg-zinc-800 text-zinc-400 border-white/5"
                                    )}>
                                      {isAdmin ? "Admin" : "Employee"}
                                    </span>
                                    {isSelf && (
                                      <span className="px-2 py-0.5 rounded bg-zinc-700 text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                                        You
                                      </span>
                                    )}
                                    {isAdmin && isAccountSuperAdmin(user) && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[8px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                        Super Admin
                                      </span>
                                    )}
                                    {isAdmin && user.isScannerOnly && (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[8px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                        Scanner Only
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                  {(!isEditing && !isEditingEmail) && (
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        // Don't show logo for super admin users
                                        if (isAccountSuperAdmin(user)) {
                                          return (
                                            <LucideIcon
                                              name="shield-check"
                                              className="w-3 h-3 text-zinc-500"
                                            />
                                          );
                                        }
                                        
                                        const businessUnitName = user.businessUnits?.[0];
                                        const businessLogo = businessUnitName ? getBusinessLogo(businessUnitName) : null;
                                        
                                        if (businessLogo) {
                                          return (
                                            <img 
                                              src={businessLogo} 
                                              alt={businessUnitName}
                                              className="w-4 h-4 rounded-sm object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallbackIcon = document.createElement('div');
                                                fallbackIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v6"/><path d="M13 9v6"/></svg>';
                                                fallbackIcon.className = 'w-3 h-3 text-zinc-500';
                                                e.currentTarget.parentElement?.insertBefore(fallbackIcon, e.currentTarget.nextSibling);
                                              }}
                                            />
                                          );
                                        } else {
                                          return (
                                            <LucideIcon
                                              name="building"
                                              className="w-3 h-3 text-zinc-500"
                                            />
                                          );
                                        }
                                      })()}
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        {isAccountSuperAdmin(user) ? "All Categories" : (user.businessUnits?.[0] || "No BU assigned")}
                                      </span>
                                    </div>
                                  )}

                                  {!isEditing && !isEditingEmail && (
                                    <div className="flex items-center gap-2">
                                      <LucideIcon
                                        name="mail"
                                        className="w-3 h-3 text-zinc-500"
                                      />
                                      <span className="text-[10px] font-bold text-zinc-500 lowercase tracking-tight">
                                        {isAdmin ? (isAccountSuperAdmin(user) ? user.username : user.username) : user.email}
                                      </span>
                                    </div>
                                  )}

                                  {(!isAdmin && user.birthdate && !isEditingEmail) && (
                                    <div className="flex items-center gap-2">
                                      <LucideIcon
                                        name="cake"
                                        className="w-3 h-3 text-zinc-500"
                                      />
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        {new Date(user.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                  )}

                                  {isAdmin && !isEditing && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <LucideIcon
                                        name="shield"
                                        className="w-3 h-3 text-zinc-500"
                                      />
                                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-1">
                                        Permissions:
                                      </span>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {displayCategories.length ===
                                        Object.keys(CATEGORIES).length ? (
                                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                                            All Categories
                                          </span>
                                        ) : (
                                          displayCategories.map((cat) => (
                                            <span
                                              key={cat}
                                              className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[8px] font-bold text-zinc-500 uppercase tracking-tighter flex items-center gap-1.5"
                                            >
                                              <LucideIcon
                                                name={getIconNameForCategory(cat)}
                                                className="w-2.5 h-2.5"
                                              />
                                              {CATEGORIES[cat].displayName}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {isEditing && (
                                  <div className="mt-6 space-y-6 pt-6 border-t border-white/5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                          New Password (Optional)
                                        </label>
                                        <div className="relative">
                                          <input
                                            type={
                                              showEditingPassword
                                                ? "text"
                                                : "password"
                                            }
                                            value={editingUserPassword}
                                            onChange={(e) =>
                                              setEditingUserPassword(
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Leave blank to keep current"
                                            className="w-full h-10 pl-4 pr-24 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:border-[#ed1c24] focus:bg-zinc-900/60 outline-none transition-all placeholder:text-zinc-600"
                                            disabled={savingUserId === user.id}
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setShowEditingPassword((v) => !v)
                                            }
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 h-7 text-[9px] font-black uppercase tracking-widest rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                                          >
                                            {showEditingPassword
                                              ? "Hide"
                                              : "Show"}
                                          </button>
                                        </div>
                                      </div>

                                      {!isAccountSuperAdmin(user) && (
                                        <div className="space-y-2">
                                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                            Business Unit
                                          </label>
                                          <Select
                                            value={editingUserBusinessUnit}
                                            onValueChange={(v) =>
                                              setEditingUserBusinessUnit(v)
                                            }
                                          >
                                            <SelectTrigger className="w-full h-10 border border-white/10 bg-zinc-900/40 text-white rounded-lg text-xs font-bold shadow-sm focus:ring-1 focus:ring-[#ed1c24]/40 transition-all">
                                              <SelectValue placeholder="Select Business Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-lg shadow-xl">
                                              {businessUnits.map((bu) => (
                                                <SelectItem
                                                  key={bu._id}
                                                  value={bu.name}
                                                  className="text-xs font-medium focus:bg-[#ed1c24] focus:text-white"
                                                >
                                                  {bu.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>

                                    {!isAccountSuperAdmin(user) && (
                                      <div className="space-y-3">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Posting Permissions</span>
                                          <span className="text-[8px] text-zinc-600 font-medium ml-1">Select categories this admin can manage</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                          {(Object.keys(CATEGORIES) as CategoryType[]).map((cat) => {
                                            const isOn = editingUserCategories.includes(cat);
                                            return (
                                              <button
                                                key={cat}
                                                type="button"
                                                disabled={savingUserId === user.id}
                                                onClick={() => {
                                                  const next = isOn
                                                    ? editingUserCategories.filter(c => c !== cat)
                                                    : [...editingUserCategories, cat];
                                                  setEditingUserCategories(next);
                                                  setEditingUserIsScannerOnly(next.length === 1 && next.includes("events"));
                                                }}
                                                className={cn(
                                                  "flex items-center gap-2 px-3 h-8 rounded-lg border text-[8px] font-bold uppercase tracking-tight transition-all",
                                                  isOn
                                                    ? "bg-[#ed1c24] border-[#ed1c24] text-white"
                                                    : "bg-zinc-900/40 border-white/10 text-zinc-500 hover:text-white"
                                                )}
                                              >
                                                <LucideIcon name={getIconNameForCategory(cat)} className="w-3 h-3" />
                                                <span className="truncate">{CATEGORIES[cat].displayName}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isEditingEmail && (
                                  <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="max-w-md space-y-2">
                                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                                        Business Unit
                                      </label>
                                      <Select
                                        value={editingCompanyBusinessUnit}
                                        onValueChange={(v) => setEditingCompanyBusinessUnit(v)}
                                      >
                                        <SelectTrigger className="w-full h-10 border border-white/10 bg-zinc-900/40 text-white rounded-lg text-xs font-bold">
                                          <SelectValue placeholder="Select Business Unit" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-lg">
                                          {businessUnits.map((bu) => (
                                            <SelectItem key={bu._id} value={bu.name} className="text-xs">
                                              {bu.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                              {isEditing || isEditingEmail ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (isAdmin) {
                                        setEditingUserId(null);
                                        setEditingUserUsername("");
                                        setEditingUserCategories([]);
                                        setEditingUserPassword("");
                                      } else {
                                        setEditingCompanyId(null);
                                        setEditingCompanyName("");
                                        setEditingCompanyEmail("");
                                        setEditingCompanyBusinessUnit("");
                                        setEditingCompanyPromoteToAdmin(false);
                                        setEditingCompanyAdminPassword("");
                                        setEditingCompanyAllowedCategories([]);
                                        setEditingCompanyIsScannerOnly(false);
                                      }
                                    }}
                                    className="h-9 px-4 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/60 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (isAdmin) {
                                        const trimmed =
                                          editingUserUsername.trim();
                                        if (!trimmed) {
                                          sileo.warning({
                                            title: "Email required",
                                          });
                                          return;
                                        }
                                        // Basic email validation
                                        const emailRegex =
                                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        if (!emailRegex.test(trimmed)) {
                                          sileo.warning({
                                            title: "Invalid Email",
                                            description:
                                              "Please enter a valid email address for the admin account",
                                          });
                                          return;
                                        }
                                        setSavingUserId(user.id);
                                        try {
                                          const payload: any = {
                                            username: trimmed,
                                            name: editingUserFullName.trim(),
                                            ...(editingUserPassword ? { password: editingUserPassword } : {}),
                                          };
                                          if (!isAccountSuperAdmin(user)) {
                                            payload.allowedCategories = editingUserCategories;
                                            payload.businessUnits = Array.from(new Set([editingUserBusinessUnit, ...editingUserBusinessUnits])).filter(Boolean);
                                            payload.isScannerOnly = editingUserIsScannerOnly;
                                            payload.scannerRegTypes = editingUserScannerRegTypes;
                                          }
                                          const res = await fetch(`/api/admin/users/${user.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(payload),
                                          });
                                          if (res.ok) {
                                            sileo.success({ title: "User updated" });
                                            setAdminUsers((prev) =>
                                              prev.map((u) =>
                                                u.id === user.id
                                                  ? {
                                                      ...u,
                                                      username: trimmed,
                                                      name: editingUserFullName.trim(),
                                                      allowedCategories: editingUserCategories,
                                                      businessUnits: editingUserBusinessUnit ? [editingUserBusinessUnit] : [],
                                                      isScannerOnly: editingUserIsScannerOnly,
                                                      scannerRegTypes: editingUserScannerRegTypes,
                                                    }
                                                  : u,
                                              ),
                                            );
                                            setEditingUserId(null);
                                          }
                                        } catch {
                                          sileo.error({ title: "Update failed" });
                                        } finally {
                                          setSavingUserId(null);
                                        }
                                      } else {
                                        // Update Company Email or Promote to Admin
                                        try {
                                          if (editingCompanyPromoteToAdmin) {
                                            // Promote to admin account
                                            const res = await fetch("/api/admin/users", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                username: editingCompanyEmail.trim().toLowerCase(),
                                                name: editingCompanyName.trim(),
                                                password: editingCompanyAdminPassword.trim() || "",
                                                allowedCategories: editingCompanyAllowedCategories,
                                                businessUnits: [editingCompanyBusinessUnit.trim()].filter(Boolean),
                                                isScannerOnly: editingCompanyIsScannerOnly,
                                              }),
                                            });
                                            if (res.ok) {
                                              // Delete the company email entry to avoid duplication
                                              await fetch(`/api/company-emails/${user.id}`, { method: "DELETE" });
                                              sileo.success({ title: "Promoted to Admin", description: `${editingCompanyName} is now an admin account.` });
                                              setEditingCompanyId(null);
                                              setEditingCompanyPromoteToAdmin(false);
                                              setEditingCompanyAdminPassword("");
                                              setEditingCompanyAllowedCategories([]);
                                              setEditingCompanyIsScannerOnly(false);
                                              fetchAllUsers();
                                            } else {
                                              const data = await res.json();
                                              sileo.error({ title: data.error || "Promotion failed" });
                                            }
                                          } else {
                                            const payload = {
                                              name: editingCompanyName.trim(),
                                              email: editingCompanyEmail.trim().toLowerCase(),
                                              businessUnit: editingCompanyBusinessUnit.trim(),
                                              birthdate: editingCompanyBirthdate,
                                            };
                                            const res = await fetch(`/api/company-emails/${user.id}`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify(payload),
                                            });
                                            if (res.ok) {
                                              sileo.success({ title: "Directory updated" });
                                              setAdminUsers((prev) =>
                                                prev.map((u) =>
                                                  u.id === user.id
                                                    ? {
                                                        ...u,
                                                        username: payload.name,
                                                        email: payload.email,
                                                        birthdate: payload.birthdate,
                                                        businessUnits: [payload.businessUnit],
                                                      }
                                                    : u,
                                                ),
                                              );
                                              setEditingCompanyId(null);
                                            }
                                          }
                                        } catch {
                                          sileo.error({ title: "Update failed" });
                                        }
                                      }
                                    }}
                                    disabled={savingUserId === user.id}
                                    className="h-9 px-4 rounded-lg bg-[#ed1c24] hover:bg-red-800 text-white text-[10px] font-bold uppercase tracking-widest shadow-md transition-all flex items-center gap-2"
                                  >
                                    {savingUserId === user.id ? (
                                      <LucideIcon name="loader" className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <LucideIcon name="check" className="w-3 h-3" />
                                    )}
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {(isSuperAdmin || !isAdmin) && (
                                    <button
                                      onClick={() => {
                                        if (isAdmin) {
                                          setEditingUserId(user.id);
                                          setEditingUserUsername(user.username);
                                          setEditingUserFullName(user.name || "");
                                          setEditingUserCategories(user.allowedCategories || []);
                                          setEditingUserBusinessUnit(user.businessUnits?.[0] || "");
                                          setEditingUserBusinessUnits(user.businessUnits?.slice(1) || []);
                                          setEditingUserIsScannerOnly(!!user.isScannerOnly);
                                          setEditingUserScannerRegTypes(user.scannerRegTypes || []);
                                          setEditingUserPassword("");
                                        } else {
                                          setEditingCompanyId(user.id);
                                          setEditingCompanyName(user.username);
                                          setEditingCompanyEmail(user.email || "");
                                          setEditingCompanyBusinessUnit(user.businessUnits?.[0] || "");
                                          setEditingCompanyBirthdate(user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : "");
                                          setEditingCompanyPromoteToAdmin(false);
                                          setEditingCompanyAdminPassword("");
                                          setEditingCompanyAllowedCategories([]);
                                          setEditingCompanyIsScannerOnly(false);
                                        }
                                      }}
                                      className="w-9 h-9 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-500 hover:text-white transition-all flex items-center justify-center border border-white/10"
                                      title="Edit"
                                    >
                                      <LucideIcon
                                        name="pencil"
                                        className="w-3.5 h-3.5"
                                      />
                                    </button>
                                  )}
                                  {!isSelf && !isAccountSuperAdmin(user) && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          className="w-9 h-9 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 transition-all flex items-center justify-center border border-rose-500/10"
                                          title="Delete"
                                        >
                                          <LucideIcon
                                            name="trash-2"
                                            className="w-3.5 h-3.5"
                                          />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-lg font-bold">
                                            Delete {isAdmin ? "Account" : "Directory Entry"}?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className="text-zinc-400">
                                            Are you sure you want to delete{" "}
                                            <span className="text-white font-bold">
                                              &quot;{user.username}&quot;
                                            </span>
                                            ? This action is permanent.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-zinc-900/40 hover:bg-zinc-900/60 border-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest h-10 px-6">
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={async () => {
                                              try {
                                                const url = isAdmin ? `/api/admin/users/${user.id}` : `/api/company-emails/${user.id}`;
                                                const res = await fetch(url, { method: "DELETE" });
                                                if (res.ok) {
                                                  sileo.success({ title: "Deleted successfully" });
                                                  setAdminUsers((prev) => prev.filter((u) => u.id !== user.id || u.type !== user.type));
                                                }
                                              } catch {
                                                sileo.error({ title: "Delete failed" });
                                              }
                                            }}
                                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest h-10 px-6"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {canManageUsers && activeTab === "business-units" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Header Card */}
                <div className="bg-zinc-950 rounded-xl border border-white/10 shadow-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                        Business Units
                      </h3>
                      <p className="text-sm text-zinc-400 font-medium mt-1">
                        Create and manage business units, including branding and logos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsCreatingBU(true)}
                      className="w-full sm:w-auto px-5 h-10 bg-[#ed1c24] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-red-800 flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98]"
                    >
                      <LucideIcon name="plus" className="w-3.5 h-3.5" />
                      Add New
                    </button>
                  </div>
                </div>

                {isCreatingBU && (
                  <div className="bg-zinc-950 rounded-xl border border-white/10 shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-2">
                      <LucideIcon
                        name="plus-circle"
                        className="w-4 h-4 text-[#ed1c24]"
                      />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                        New Business Unit
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                          Name of Business Unit
                        </label>
                        <input
                          type="text"
                          value={newBUName}
                          onChange={(e) => setNewBUName(e.target.value)}
                          placeholder="e.g. Frontier"
                          className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-[#ed1c24] focus:bg-zinc-900/60 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                          Prefix
                        </label>
                        <input
                          type="text"
                          value={newBULabel}
                          onChange={(e) => setNewBULabel(e.target.value)}
                          placeholder="e.g. FRT"
                          className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-[#ed1c24] focus:bg-zinc-900/60 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                          Logo Image
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 cursor-pointer group">
                            <div className="flex items-center gap-3 h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white group-hover:bg-zinc-900/60 transition-all">
                              <LucideIcon
                                name={isUploadingBU ? "loader" : "image-plus"}
                                className={cn(
                                  "w-3.5 h-3.5 text-zinc-500 group-hover:text-[#ed1c24]",
                                  isUploadingBU && "animate-spin",
                                )}
                              />
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white truncate">
                                {isUploadingBU
                                  ? "Uploading..."
                                  : newBUImage
                                    ? "Change Logo"
                                    : "Upload Logo"}
                              </span>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                setIsUploadingBU(true);
                                const formData = new FormData();
                                formData.append("file", file);

                                try {
                                  const res = await uploadImage(formData);
                                  if (res.success) {
                                    setNewBUImage(res.url || res.path || "");
                                    sileo.success({ title: "Logo uploaded" });
                                  } else {
                                    sileo.error({
                                      title: "Upload failed",
                                      description: res.error,
                                    });
                                  }
                                } catch (err) {
                                  sileo.error({ title: "Upload error" });
                                } finally {
                                  setIsUploadingBU(false);
                                }
                              }}
                            />
                          </label>
                          {newBUImage && (
                            <div className="w-10 h-10 rounded-lg border border-white/10 bg-zinc-900/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              <img
                                src={newBUImage}
                                alt="Preview"
                                className="w-full h-full object-contain p-1.5"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setNewBUName("");
                          setNewBULabel("");
                          setNewBUImage("/CNT_PROMO_ADS_SPECIALISTS.png");
                          setIsCreatingBU(false);
                        }}
                        className="px-5 h-10 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!newBUName.trim() || !newBULabel.trim()) {
                            sileo.warning({
                              title: "Missing Information",
                              description: "Name and Prefix are required",
                            });
                            return;
                          }
                          setIsSavingBU(true);
                          try {
                            const res = await fetch(
                              "/api/admin/business-units",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  name: newBUName.trim(),
                                  label: newBULabel.trim(),
                                  image: newBUImage,
                                }),
                              },
                            );
                            if (res.ok) {
                              sileo.success({ title: "Business Unit Added" });
                              setNewBUName("");
                              setNewBULabel("");
                              setNewBUImage("/CNT_PROMO_ADS_SPECIALISTS.png");
                              setIsCreatingBU(false);
                              fetchBUs();
                            } else {
                              const data = await res.json();
                              sileo.error({
                                title: "Failed to add BU",
                                description: data.error,
                              });
                            }
                          } catch {
                            sileo.error({ title: "Network Error" });
                          } finally {
                            setIsSavingBU(false);
                          }
                        }}
                        disabled={isSavingBU || isUploadingBU}
                        className="px-6 h-10 bg-[#ed1c24] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-red-800 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
                      >
                        {isSavingBU ? "Saving…" : "Save Business Unit"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-zinc-950 rounded-xl border border-white/10 shadow-lg overflow-hidden">
                  <div className="p-5 border-b border-white/5 bg-zinc-900/20">
                    <div className="flex items-center gap-2">
                      <LucideIcon
                        name="list"
                        className="w-4 h-4 text-[#ed1c24]"
                      />
                      <div className="text-xs font-bold text-white uppercase tracking-widest">
                        Business Unit List
                      </div>
                    </div>
                  </div>
                  {isLoadingBUs ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <LucideIcon
                        name="loader"
                        className="w-6 h-6 text-[#ed1c24] animate-spin"
                      />
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        Loading business units…
                      </span>
                    </div>
                  ) : businessUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                      <LucideIcon
                        name="building"
                        className="w-12 h-12 text-zinc-600 mb-4 stroke-[1px]"
                      />
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                        No business units found
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">
                        Create your first business unit using the button above
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/50">
                      {businessUnits.map((bu) => (
                        <div
                          key={bu._id}
                          className="p-4 flex flex-col gap-4 group hover:bg-zinc-900/20 transition-colors"
                        >
                          {editingBUId === bu._id ? (
                            <div className="space-y-6 p-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                    Name of Business Unit
                                  </label>
                                  <input
                                    type="text"
                                    value={editingBUName}
                                    onChange={(e) =>
                                      setEditingBUName(e.target.value)
                                    }
                                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#ed1c24] focus:bg-zinc-900/60 transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                    Prefix
                                  </label>
                                  <input
                                    type="text"
                                    value={editingBULabel}
                                    onChange={(e) =>
                                      setEditingBULabel(e.target.value)
                                    }
                                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white text-sm focus:outline-none focus:border-[#ed1c24] focus:bg-zinc-900/60 transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] ml-1">
                                    Logo Image
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer group">
                                      <div className="flex items-center gap-3 h-10 px-4 rounded-lg bg-zinc-900/40 border border-white/10 text-white group-hover:bg-zinc-900/60 transition-all">
                                        <LucideIcon
                                          name={
                                            isUploadingBU
                                              ? "loader"
                                              : "image-plus"
                                          }
                                          className={cn(
                                            "w-3.5 h-3.5 text-zinc-500 group-hover:text-[#ed1c24]",
                                            isUploadingBU && "animate-spin",
                                          )}
                                        />
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white truncate">
                                          {isUploadingBU
                                            ? "Uploading..."
                                            : editingBUImage
                                              ? "Change Logo"
                                              : "Upload Logo"}
                                        </span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;

                                          setIsUploadingBU(true);
                                          const formData = new FormData();
                                          formData.append("file", file);

                                          try {
                                            const res =
                                              await uploadImage(formData);
                                            if (res.success) {
                                              setEditingBUImage(
                                                res.url || res.path || "",
                                              );
                                              sileo.success({
                                                title: "Logo uploaded",
                                              });
                                            } else {
                                              sileo.error({
                                                title: "Upload failed",
                                                description: res.error,
                                              });
                                            }
                                          } catch (err) {
                                            sileo.error({
                                              title: "Upload error",
                                            });
                                          } finally {
                                            setIsUploadingBU(false);
                                          }
                                        }}
                                      />
                                    </label>
                                    {editingBUImage && (
                                      <div className="w-10 h-10 rounded-lg border border-white/10 bg-zinc-900/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        <img
                                          src={editingBUImage}
                                          alt="Preview"
                                          className="w-full h-full object-contain p-1.5"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <button
                                  onClick={() => setEditingBUId(null)}
                                  className="px-5 h-10 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    setIsSavingBU(true);
                                    try {
                                      const res = await fetch(
                                        `/api/admin/business-units/${bu._id}`,
                                        {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            name: editingBUName.trim(),
                                            label: editingBULabel.trim(),
                                            image: editingBUImage,
                                          }),
                                        },
                                      );
                                      if (res.ok) {
                                        sileo.success({
                                          title: "Business Unit Updated",
                                        });
                                        setEditingBUId(null);
                                        fetchBUs();
                                      }
                                    } catch {
                                      sileo.error({
                                        title: "Failed to update BU",
                                      });
                                    } finally {
                                      setIsSavingBU(false);
                                    }
                                  }}
                                  disabled={isSavingBU || isUploadingBU}
                                  className="px-6 h-10 bg-[#ed1c24] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-red-800 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
                                >
                                  {isSavingBU ? "Saving…" : "Update BU"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center bg-zinc-900/40 shadow-sm overflow-hidden group-hover:border-[#ed1c24]/30 transition-all">
                                  {bu.image ? (
                                    <img
                                      src={bu.image}
                                      alt={bu.label}
                                      className="w-full h-full object-contain p-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                  ) : (
                                    <span className="text-white font-black text-xs uppercase tracking-tighter">
                                      {bu.label}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white group-hover:text-[#ed1c24] transition-colors">
                                    {bu.name}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <div className="flex items-center gap-1.5 bg-zinc-900/40 px-2 py-0.5 rounded border border-white/5">
                                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                        Prefix:
                                      </span>
                                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {bu.label}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="w-8 h-8 rounded-md bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-white transition-all border border-white/10 flex items-center justify-center"
                                  title="Edit Business Unit"
                                  onClick={() => {
                                    setEditingBUId(bu._id);
                                    setEditingBUName(bu.name);
                                    setEditingBULabel(bu.label);
                                    setEditingBUImage(bu.image || "");
                                  }}
                                >
                                  <LucideIcon
                                    name="pencil"
                                    className="w-3.5 h-3.5"
                                  />
                                </button>
                                {bu.name.toUpperCase() !== "CNT GROUP" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="w-8 h-8 rounded-md bg-rose-500/5 hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 transition-all border border-rose-500/10 flex items-center justify-center"
                                        title="Delete Business Unit"
                                      >
                                        <LucideIcon
                                          name="trash-2"
                                          className="w-3.5 h-3.5"
                                        />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-lg font-bold">
                                          Confirm Deletion
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-zinc-400">
                                          Are you sure you want to remove{" "}
                                          <span className="text-white font-bold">
                                            &quot;{bu.name}&quot;
                                          </span>
                                          ? This action is permanent and may
                                          affect linked content.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-zinc-900/40 hover:bg-zinc-900/60 border-white/10 text-white rounded-lg text-xs uppercase tracking-widest font-bold h-10 px-6">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs uppercase tracking-widest font-bold h-10 px-6"
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                `/api/admin/business-units/${bu._id}`,
                                                { method: "DELETE" },
                                              );
                                              if (res.ok) {
                                                sileo.success({
                                                  title:
                                                    "Business Unit Removed",
                                                });
                                                fetchBUs();
                                              }
                                            } catch {
                                              sileo.error({
                                                title: "Failed to delete BU",
                                              });
                                            }
                                          }}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

