'use client';

import { useState, useEffect, useMemo } from 'react';
import { Announcement, CATEGORIES, CategoryType } from '@/types';
import Image from 'next/image';
import LucideIcon from './LucideIcon';
import { uploadImage } from '@/app/_actions/uploadImage';
import { getAnnouncements } from '@/data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';
import { type CompanyEmail } from '@/data/companyEmails';

interface AdminFormProps {
  category: CategoryType;
  onSubmit: (data: Partial<Announcement>) => void;
  onCancel?: () => void;
  editingAnnouncement?: Announcement;
  businessUnits?: { _id: string; name: string; label: string; image?: string }[];
}

export default function AdminForm({ category, onSubmit, onCancel, editingAnnouncement, businessUnits = [] }: AdminFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    memoUid: '',
    businessUnit: '',
    expiresInDays: '',
    link: '',
    fileUrl: '',
    imageUrl: '',
    imageUrls: [] as string[],
    eventDate: '',
    eventTime: '',
    eventSubCategory: 'Christmas Party',
    registrationDeadline: '',
    registrationDeadlineTime: '',
    registrationType: 'GENERAL' as 'GENERAL' | 'BU_ONLY' | 'INVITE_ONLY' | 'RULE_BASED',
    allowedBusinessUnits: [] as string[],
    invitedUsers: '',
    birthMonth: '',
    location: '',
    requiresAcknowledgment: false,
    menuFrom: '',
    menuTo: '',
  });

  const [availableEventSubCategories, setAvailableEventSubCategories] = useState(['Christmas Party']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const fetchExistingCategories = async () => {
      try {
        const anns = await getAnnouncements();
        const eventSubCats = anns
          .filter(a => a.category === 'events' && a.eventSubCategory)
          .map(a => a.eventSubCategory!);
        
        setAvailableEventSubCategories(prev => {
          const combined = Array.from(new Set([...prev, ...eventSubCats]));
          return combined;
        });
      } catch (error) {
        console.error('Failed to fetch existing categories:', error);
      }
    };
    fetchExistingCategories();
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const [users, setUsers] = useState<{ _id: string; name: string; email: string; businessUnit?: string }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userBUFilter, setUserBUFilter] = useState('all');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryRules = CATEGORIES[category].rules;
  const isContentRequired = categoryRules.hasText && category !== 'company-news';

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const [companyRes, adminRes] = await Promise.all([
          fetch('/api/company-emails'),
          fetch('/api/admin/users'),
        ]);

        const companyData = companyRes.ok ? await companyRes.json() : [];
        const adminData = adminRes.ok ? await adminRes.json() : [];

        // Map company emails
        const companyUsers = companyData.map((u: any) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          businessUnit: u.businessUnit,
        }));

        // Map admin users — exclude super admins
        const superAdminUsernames = ['itadmin', 'it.support@cntpromoads.com'];
        const adminUsers = adminData
          .filter((u: any) => !superAdminUsernames.includes((u.username || '').toLowerCase()))
          .map((u: any) => ({
            _id: u._id,
            name: u.name || u.username,
            email: u.username,
            businessUnit: Array.isArray(u.businessUnits) ? u.businessUnits[0] : '',
          }));

        // Merge, deduplicate by email
        const emailSet = new Set(companyUsers.map((u: any) => u.email.toLowerCase()));
        const uniqueAdmins = adminUsers.filter((u: any) => !emailSet.has(u.email.toLowerCase()));

        setUsers([...companyUsers, ...uniqueAdmins]);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const availableBUs = useMemo(() => {
    const bus = users
      .map(u => u.businessUnit)
      .filter((bu): bu is string => !!bu && bu.trim() !== '');
    return Array.from(new Set(bus)).sort();
  }, [users]);

  const combinedBUs = useMemo(() => {
    const fromProps = (businessUnits || []).map(bu => bu.name);
    const bus = Array.from(new Set([...fromProps, ...availableBUs])).filter(Boolean);
    return bus.sort();
  }, [businessUnits, availableBUs]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        user.email.toLowerCase().includes(userSearch.toLowerCase());
      
      const filter = userBUFilter.toLowerCase().trim();
      const matchesBU = filter === 'all' || 
                        (user.businessUnit && user.businessUnit.toLowerCase().trim() === filter);
      
      return matchesSearch && matchesBU;
    });
  }, [users, userSearch, userBUFilter]);

  const selectedInvitedUsers = useMemo(() => {
    return formData.invitedUsers.split(',').map(e => e.trim()).filter(Boolean);
  }, [formData.invitedUsers]);

  const toggleUserInvitation = (email: string) => {
    const current = selectedInvitedUsers;
    const updated = current.includes(email)
      ? current.filter(e => e !== email)
      : [...current, email];
    handleInputChange('invitedUsers', updated.join(', '));
  };

  useEffect(() => {
    if (editingAnnouncement) {
      const inferredDays = (() => {
        if (!editingAnnouncement.expiresAt) return '';
        const createdAt = new Date(editingAnnouncement.createdAt);
        const expiresAt = new Date(editingAnnouncement.expiresAt);
        const diffMs = expiresAt.getTime() - createdAt.getTime();
        if (!Number.isFinite(diffMs) || diffMs <= 0) return '';
        const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        if (!Number.isFinite(days) || days <= 0) return '';
        return String(Math.min(30, Math.max(1, days)));
      })();
      
      if (editingAnnouncement.category === 'events' && editingAnnouncement.eventSubCategory) {
        setAvailableEventSubCategories(prev => {
          if (!prev.includes(editingAnnouncement.eventSubCategory!)) {
            return [...prev, editingAnnouncement.eventSubCategory!];
          }
          return prev;
        });
      }

      setFormData({
        title: editingAnnouncement.title || '',
        content: editingAnnouncement.content || '',
        memoUid: editingAnnouncement.memoUid || '',
        businessUnit: editingAnnouncement.businessUnit || '',
        expiresInDays: editingAnnouncement.category === 'food-menu' ? '' : inferredDays,
        link: editingAnnouncement.link || '',
        fileUrl: editingAnnouncement.fileUrl || '',
        imageUrl: editingAnnouncement.imageUrl || '',
        imageUrls: editingAnnouncement.imageUrls || [],
        eventDate: editingAnnouncement.eventDate ? editingAnnouncement.eventDate.toString().split('T')[0] : '',
        eventTime: editingAnnouncement.eventTime || '',
        eventSubCategory: editingAnnouncement.eventSubCategory || 'Christmas Party',
        registrationDeadline: editingAnnouncement.registrationDeadline ? editingAnnouncement.registrationDeadline.toString().split('T')[0] : '',
        registrationDeadlineTime: editingAnnouncement.registrationDeadlineTime || '',
        registrationType: editingAnnouncement.registrationType || 'GENERAL',
        allowedBusinessUnits: editingAnnouncement.allowedBusinessUnits || [],
        invitedUsers: editingAnnouncement.invitedUsers?.join(', ') || '',
        birthMonth: editingAnnouncement.ruleConfig?.month !== undefined ? String(editingAnnouncement.ruleConfig.month) : '',
        location: editingAnnouncement.location || '',
        requiresAcknowledgment: editingAnnouncement.requiresAcknowledgment || false,
        menuFrom: (() => {
          if (editingAnnouncement.category === 'food-menu' && editingAnnouncement.content) {
            const m = editingAnnouncement.content.match(/Valid from\s+(.+?)\s*-\s*(.+)$/i);
            if (m && m[1]) {
              const d = new Date(m[1]);
              if (!isNaN(d.getTime())) {
                const y = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${y}-${mm}-${dd}`;
              }
            }
          }
          return '';
        })(),
        menuTo: (() => {
          if (editingAnnouncement.category === 'food-menu') {
            const to = editingAnnouncement.expiresAt;
            if (to) {
              const d = new Date(to);
              const y = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              return `${y}-${mm}-${dd}`;
            }
          }
          return '';
        })(),
      });
    } else {
      const defaultDays = (() => {
        if (category === 'events') return '';
        const d = CATEGORIES[category]?.rules?.autoHideDays;
        if (typeof d === 'number' && d > 0) return String(Math.min(30, d));
        return '30';
      })();
      // Reset form if not editing
      setFormData({
        title: '',
        content: '',
        memoUid: '',
        businessUnit: businessUnits.length === 1 ? businessUnits[0].name : '',
        expiresInDays: category === 'food-menu' ? '' : defaultDays,
        link: '',
        fileUrl: '',
        imageUrl: '',
        imageUrls: [],
        eventDate: '',
        eventTime: '',
        eventSubCategory: 'Christmas Party',
        registrationDeadline: '',
        registrationDeadlineTime: '',
        registrationType: 'GENERAL',
        allowedBusinessUnits: [],
        invitedUsers: '',
        birthMonth: '',
        location: '',
        requiresAcknowledgment: (category === 'policy'),
        menuFrom: '',
        menuTo: '',
      });
      // Also reset any file/image related errors when switching categories
      setErrors(prev => ({
        ...prev,
        fileUrl: '',
        imageUrl: '',
      }));
    }
  }, [editingAnnouncement, category, businessUnits]);

  // Auto-generate Memo UID when Business Unit changes (client-side preview)
  useEffect(() => {
    const gen = async () => {
      if (editingAnnouncement || category !== 'policy') return;
      const buName = String(formData.businessUnit || '').trim();
      if (!buName) return;

      const normalizeBU = (s?: string) => {
        const v = (s || '').trim();
        if (!v) return '';
        const clean = v.toUpperCase().replace(/[^A-Z0-9]+/g, ''); // Remove all spaces and symbols
        if (clean.startsWith('FRONT')) return 'FRONTIER';
        if (clean.startsWith('LYFELAN')) return 'LYFE LAND';
        if (clean.includes('PROMO') && (clean.includes('ADS') || clean.includes('AD'))) return 'CNT PROMO & ADS SPECIALISTS';
        return v.toUpperCase();
      };

      const normBU = normalizeBU(buName);
      const buData = businessUnits.find(b => normalizeBU(b.name) === normBU);
      const prefix = buData?.label || '';
      if (!prefix) return;

      try {
        const anns = await getAnnouncements();
        const year = new Date().getFullYear();
        let maxNum = 0;
        
        // Match both formats: PREFIX-NUMBER and PREFIX-YEAR-NUMBER
        const reSimple = new RegExp(`^${prefix}-(\\d+)$`, 'i');
        const reWithYear = new RegExp(`^${prefix}-${year}-(\\d+)$`, 'i');
        
        anns.forEach(a => {
          if (!a.memoUid) return;
          const uid = String(a.memoUid);
          
          // Try matching with year first
          let m = uid.match(reWithYear);
          if (m && m[1]) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n)) {
              maxNum = Math.max(maxNum, n);
            }
          } else {
            // Try simple match
            m = uid.match(reSimple);
            if (m && m[1]) {
              const n = parseInt(m[1], 10);
              if (!Number.isNaN(n)) {
                maxNum = Math.max(maxNum, n);
              }
            }
          }
        });

        const next = maxNum + 1;
        const memoUid = `${prefix}-${year}-${String(next).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, memoUid }));
      } catch (error) {
        console.error('Failed to auto-generate memo UID:', error);
      }
    };
    gen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.businessUnit, category, businessUnits]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (isContentRequired && !formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (categoryRules.hasLink && !formData.link.trim()) {
      newErrors.link = 'Link URL is required';
    }
    
    if (categoryRules.hasFile && !formData.fileUrl) {
      newErrors.fileUrl = 'File upload is required';
    }
    
    if (categoryRules.hasDate && !formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    if (!formData.businessUnit) {
      newErrors.businessUnit = 'Business Unit is required';
    }

    if (categoryRules.hasImage) {
      if (category === 'birthday-celebrants') {
        if (formData.imageUrls.length === 0) {
          newErrors.imageUrl = 'At least one image is required';
        }
      } else if (category !== 'urgent-notices' && category !== 'company-news') {
        if (!formData.imageUrl) {
          newErrors.imageUrl = 'Image is required';
        }
      }
    }

    if (category === 'events' && formData.eventDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selected = new Date(formData.eventDate);
      const selectedDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      if (selectedDay < today) {
        newErrors.eventDate = 'Event date cannot be in the past';
      }

      if (formData.registrationDeadline) {
        const deadline = new Date(formData.registrationDeadline);
        if (deadline > selected) {
          newErrors.registrationDeadline = 'Deadline cannot be after the event date';
        }
      }
    }

    if (category === 'events' && !formData.eventSubCategory) {
      newErrors.eventSubCategory = 'Event Category is required';
    }

    if (category === 'food-menu') {
      if (!formData.menuFrom) newErrors.menuFrom = 'Start date is required';
      if (!formData.menuTo) newErrors.menuTo = 'End date is required';
      if (formData.menuFrom && formData.menuTo) {
        const from = new Date(formData.menuFrom);
        const to = new Date(formData.menuTo);
        if (from > to) {
          newErrors.menuTo = 'End date must be after start date';
        }
      }
    }

    if (category !== 'food-menu' && formData.expiresInDays.trim()) {
      const days = parseInt(formData.expiresInDays.trim(), 10);
      if (!Number.isFinite(days) || Number.isNaN(days) || days < 1 || days > 30) {
        newErrors.expiresInDays = 'Days must be between 1 and 30';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const hadExistingImages =
      !!editingAnnouncement &&
      (!!editingAnnouncement.imageUrl || (editingAnnouncement.imageUrls && editingAnnouncement.imageUrls.length > 0));

    const hasImagesInForm =
      !!formData.imageUrl || (formData.imageUrls && formData.imageUrls.length > 0);

    const submissionData = {
      title: formData.title,
      content: (() => {
        if (category === 'food-menu' && formData.menuFrom && formData.menuTo) {
          const fmt = (ds: string) =>
            new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              .format(new Date(ds));
          return `Valid from ${fmt(formData.menuFrom)} - ${fmt(formData.menuTo)}`;
        }
        if (category === 'birthday-celebrants') {
          return formData.content?.trim() || 'Birthday celebration';
        }
        return formData.content;
      })(),
      category,
      ...(formData.businessUnit && { businessUnit: formData.businessUnit }),
      ...(category === 'policy' && formData.memoUid && { memoUid: formData.memoUid }),
      ...(categoryRules.hasLink && formData.link && { link: formData.link }),
      ...(categoryRules.hasFile && formData.fileUrl && { fileUrl: formData.fileUrl }),
      ...(categoryRules.hasImage && hasImagesInForm
        ? {
            imageUrl: formData.imageUrl || formData.imageUrls[0],
            imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : (formData.imageUrl ? [formData.imageUrl] : []),
          }
        : {}),
      ...(categoryRules.hasImage && !hasImagesInForm && hadExistingImages
        ? {
            imageUrl: '',
            imageUrls: [],
          }
        : {}),
      ...(categoryRules.hasDate && formData.eventDate && { 
        eventDate: new Date(formData.eventDate),
        ...(formData.eventTime && { eventTime: formData.eventTime }),
        ...(category === 'events' && formData.eventSubCategory && { eventSubCategory: formData.eventSubCategory }),
        ...(category === 'events' && formData.registrationDeadline && { registrationDeadline: new Date(formData.registrationDeadline) }),
        ...(category === 'events' && formData.registrationDeadlineTime && { registrationDeadlineTime: formData.registrationDeadlineTime }),
        ...(category === 'events' && {
          registrationType: formData.registrationType,
          allowedBusinessUnits: formData.allowedBusinessUnits,
          invitedUsers: formData.invitedUsers.split(',').map(u => u.trim()).filter(Boolean),
          ruleConfig: formData.registrationType === 'RULE_BASED' ? {
            type: 'BIRTHDAY' as const,
            month: formData.birthMonth ? parseInt(formData.birthMonth) : undefined
          } : undefined,
        }),
        ...(formData.location && { location: formData.location }),
      }),
      ...(category === 'food-menu' && formData.menuTo && { 
        expiresAt: new Date(new Date(formData.menuTo).setHours(23, 59, 59, 999)) 
      }),
      ...(category !== 'food-menu' && formData.expiresInDays.trim() && (() => {
        const days = parseInt(formData.expiresInDays.trim(), 10);
        if (!Number.isFinite(days) || Number.isNaN(days) || days < 1 || days > 30) return {};
        const base = editingAnnouncement ? new Date(editingAnnouncement.createdAt) : new Date();
        const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
        return { expiresAt };
      })()),
      requiresAcknowledgment: formData.requiresAcknowledgment,
    };

    onSubmit(submissionData);
    
    // Reset form if not editing
    if (!editingAnnouncement) {
      const defaultDays = (() => {
        if (category === 'events') return '';
        const d = CATEGORIES[category]?.rules?.autoHideDays;
        if (typeof d === 'number' && d > 0) return String(Math.min(30, d));
        return '30';
      })();
      setFormData({
        title: '',
        content: '',
        memoUid: '',
        businessUnit: businessUnits.length === 1 ? businessUnits[0].name : '',
        expiresInDays: category === 'food-menu' ? '' : defaultDays,
        link: '',
        fileUrl: '',
        imageUrl: '',
        imageUrls: [],
        eventDate: '',
        eventTime: '',
        eventSubCategory: 'Christmas Party',
        registrationDeadline: '',
        registrationDeadlineTime: '',
        registrationType: 'GENERAL',
        allowedBusinessUnits: [],
        invitedUsers: '',
        birthMonth: '',
        location: '',
        requiresAcknowledgment: false,
        menuFrom: '',
        menuTo: '',
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = async (field: 'fileUrl' | 'imageUrl', file: File) => {
    setIsUploading(true);
    setErrors(prev => ({ ...prev, [field]: '' }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadImage(formData);
      if (result.success) {
        const url = result.url 
          ? result.url 
          : `${process.env.NEXT_PUBLIC_NAS_BASE_URL}${result.path}`;
        if (field === 'imageUrl' && category === 'birthday-celebrants') {
          setFormData(prev => ({
            ...prev,
            imageUrls: [...prev.imageUrls, url]
          }));
        } else {
          handleInputChange(field, url);
        }
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setErrors(prev => ({ 
        ...prev, 
        [field]: message
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

 

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-1">
          {category === 'events' ? 'Event Title' : 'Title'} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          autoFocus
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white placeholder-white/30 caret-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
          placeholder={category === 'events' ? "Enter event title" : "Enter announcement title"}
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Content */}
      {categoryRules.hasText && (
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-white/70 mb-1">
            {category === 'events' ? 'Description' : 'Content'} {isContentRequired && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white placeholder-white/30 caret-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
            placeholder={
              category === 'events' ? "Enter event description" :
              category === 'company-news' ? "Optional description for the update" : 
              "Enter announcement content"
            }
          />
          {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
        </div>
      )}

      {/* Link */}
      {categoryRules.hasLink && (
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-white/70 mb-1">
            Link URL <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            id="link"
            value={formData.link}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
            placeholder="https://example.com"
          />
          {errors.link && <p className="text-red-400 text-xs mt-1">{errors.link}</p>}
        </div>
      )}

      {/* File Upload */}
      {categoryRules.hasFile && (
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-white/70 mb-1">
            File Upload <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => e.target.files?.[0] && handleFileUpload('fileUrl', e.target.files[0])}
            className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white file:bg-[#ed1c24] file:text-white file:border-none file:rounded-md file:px-3 file:py-1 file:mr-3 file:cursor-pointer hover:file:bg-[#c51a15]"
            accept=".pdf,.doc,.docx"
          />
          {errors.fileUrl && <p className="text-red-400 text-xs mt-1">{errors.fileUrl}</p>}
          {formData.fileUrl && (
            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
              <LucideIcon name="check-circle" className="w-3 h-3" />
              File ready for upload
            </p>
          )}
        </div>
      )}

      {/* Image Upload */}
      {categoryRules.hasImage && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/70">
            {category === 'birthday-celebrants' ? 'Celebrant Images' : 'Image Upload'}
          </label>
          
          {/* Image Upload Warning */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <LucideIcon name="alert-circle" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-[10px] font-medium text-amber-200/80">
              Only accepted formats: <span className="font-bold text-amber-400">JFIF, JPG, JPEG, WEBP</span>
            </p>
          </div>
          
          {/* Preview of uploaded images */}
          {category === 'birthday-celebrants' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-white/10 shadow-xl bg-zinc-900/20">
                  <Image 
                    src={url} 
                    alt={`Preview ${index}`} 
                    fill 
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <LucideIcon name="trash-2" className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Add More Button */}
              <label className="cursor-pointer aspect-video rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-[#ed1c24] hover:bg-[#ed1c24]/10 transition-all text-white/40 hover:text-[#ed1c24]">
                <LucideIcon name="image-plus" className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Add Image</span>
                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('imageUrl', e.target.files[0])}
                    accept=".jfif,.jpg,.jpeg,.webp"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  id="image"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('imageUrl', e.target.files[0])}
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white file:bg-[#ed1c24] file:text-white file:border-none file:rounded-md file:px-3 file:py-1 file:mr-3 file:cursor-pointer hover:file:bg-[#c51a15]"
                  accept=".jfif,.jpg,.jpeg,.webp"
                />
              {formData.imageUrl && (
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden border border-white/10 shadow-xl group">
                  <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: '', imageUrls: [] }));
                    }}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <LucideIcon name="trash-2" className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>}
        </div>
      )}

      {/* Food Menu Date Range */}
      {category === 'food-menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="menuFrom" className="block text-sm font-medium text-white/70 mb-1">
              Valid From <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              id="menuFrom"
              value={formData.menuFrom}
              onChange={(e) => handleInputChange('menuFrom', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
            />
            {errors.menuFrom && <p className="text-red-400 text-xs mt-1">{errors.menuFrom}</p>}
          </div>
          <div>
            <label htmlFor="menuTo" className="block text-sm font-medium text-white/70 mb-1">
              Valid To <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              id="menuTo"
              value={formData.menuTo}
              onChange={(e) => handleInputChange('menuTo', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
              min={formData.menuFrom || undefined}
            />
            {errors.menuTo && <p className="text-red-400 text-xs mt-1">{errors.menuTo}</p>}
          </div>
        </div>
      )}

      {/* Event Date */}
      {categoryRules.hasDate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-white/70 mb-1">
              Event Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              id="eventDate"
              value={formData.eventDate}
              onChange={(e) => handleInputChange('eventDate', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
              min={(() => {
                const d = new Date();
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              })()}
              // No strict max; allow any future date
            />
            {errors.eventDate && <p className="text-red-400 text-xs mt-1">{errors.eventDate}</p>}
          </div>
          <div>
            <label htmlFor="eventTime" className="block text-sm font-medium text-white/70 mb-1">
              Event Time
            </label>
            <input
              type="time"
              id="eventTime"
              value={formData.eventTime}
              onChange={(e) => handleInputChange('eventTime', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
            />
            {errors.eventTime && <p className="text-red-400 text-xs mt-1">{errors.eventTime}</p>}
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-white/70 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white placeholder-white/30 caret-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
              placeholder="e.g., Auditorium A"
            />
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
          </div>
        </div>
      )}

      {/* Registration Deadline */}
      {category === 'events' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="col-span-full mb-1 flex items-center gap-2">
              <LucideIcon name="timer" className="w-3.5 h-3.5 text-[#ed1c24]" />
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Registration Deadline</h4>
            </div>
            <div>
              <label htmlFor="registrationDeadline" className="block text-[10px] font-bold text-white/70 mb-1 uppercase tracking-widest">
                Deadline Date
              </label>
              <input
                type="date"
                id="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
                max={formData.eventDate || undefined}
              />
            </div>
            <div>
              <label htmlFor="registrationDeadlineTime" className="block text-[10px] font-bold text-white/70 mb-1 uppercase tracking-widest">
                Deadline Time
              </label>
              <input
                type="time"
                id="registrationDeadlineTime"
                value={formData.registrationDeadlineTime}
                onChange={(e) => handleInputChange('registrationDeadlineTime', e.target.value)}
                className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
              />
            </div>
          </div>

          {/* Registration Type (Core Control) */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ed1c24]/10 flex items-center justify-center border border-[#ed1c24]/20">
                <LucideIcon name="shield-check" className="w-4 h-4 text-[#ed1c24]" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Registration Type</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Core control for event access</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'GENERAL', label: 'Public Access', desc: 'Open to all employees', icon: 'globe' },
                { id: 'BU_ONLY', label: 'Business Unit Restricted', desc: 'Specific business units', icon: 'building-2' },
                { id: 'INVITE_ONLY', label: 'Exclusive Invite', desc: 'Designated guests only', icon: 'ticket' },
                { id: 'RULE_BASED', label: 'Attribute-Based', desc: 'Filtered by profile data', icon: 'filter' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleInputChange('registrationType', type.id)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-200 group relative",
                    formData.registrationType === type.id 
                      ? "bg-[#ed1c24]/10 border-[#ed1c24]" 
                      : "bg-white/[0.02] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center border shrink-0",
                    formData.registrationType === type.id 
                      ? "bg-[#ed1c24] border-[#ed1c24] text-white" 
                      : "bg-white/5 border-white/10 text-slate-500 group-hover:text-slate-300"
                  )}>
                    <LucideIcon name={type.icon as any} className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-tight",
                      formData.registrationType === type.id ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}>
                      {type.label}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter truncate">
                      {type.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Conditional Config based on Registration Type */}
            {formData.registrationType === 'BU_ONLY' && (
              <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Allowed Business Units</label>
                <div className="grid grid-cols-2 gap-2">
                  {businessUnits.map((bu) => {
                    const logoPath = bu.image;
                    return (
                      <button
                        key={bu._id}
                        type="button"
                        onClick={() => {
                          const current = formData.allowedBusinessUnits;
                          const updated = current.includes(bu.name) 
                            ? current.filter(n => n !== bu.name) 
                            : [...current, bu.name];
                          handleInputChange('allowedBusinessUnits', updated);
                        }}
                        className={cn(
                          "flex items-center justify-start gap-2.5 px-3 py-2 h-auto min-h-[40px] rounded-lg border text-[9px] font-bold uppercase transition-all text-left",
                          formData.allowedBusinessUnits.includes(bu.name)
                            ? "bg-[#ed1c24] border-[#ed1c24] text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {logoPath ? (
                          <Image 
                            src={logoPath} 
                            alt={bu.name} 
                            width={16} 
                            height={16}
                            className="w-4 h-4 shrink-0 object-contain"
                          />
                        ) : (
                          <LucideIcon name="building" className="w-3 h-3 shrink-0" />
                        )}
                        <span className="leading-tight">{bu.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.registrationType === 'INVITE_ONLY' && (
              <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Select Guests from Directory</label>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <LucideIcon name="users" className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{selectedInvitedUsers.length} Selected</span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <LucideIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:border-[#ed1c24] outline-none transition-all placeholder:text-white/20"
                  />
                </div>

                {/* User List */}
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2 border border-white/5 rounded-xl p-2 bg-white/[0.01]">
                  {isLoadingUsers ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 opacity-40">
                      <LucideIcon name="loader-2" className="w-6 h-6 animate-spin text-white" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Loading Directory...</span>
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const isInvited = selectedInvitedUsers.includes(user.email);
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleUserInvitation(user.email)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                            isInvited
                              ? "bg-[#ed1c24]/10 border-[#ed1c24]/30"
                              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                              isInvited ? "bg-[#ed1c24] text-white" : "bg-white/5 text-slate-500 group-hover:bg-white/10"
                            )}>
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={cn(
                                "text-[11px] font-bold uppercase tracking-tight truncate",
                                isInvited ? "text-white" : "text-slate-300"
                              )}>{user.name}</span>
                              <span className="text-[9px] font-medium text-slate-500 truncate">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:border-white/10">
                              {user.businessUnit}
                            </span>
                            <div className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              isInvited ? "bg-[#ed1c24] border-[#ed1c24]" : "bg-white/10 border-white/20"
                            )}>
                              {isInvited && <LucideIcon name="check" className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 opacity-20">
                      <LucideIcon name="search-x" className="w-8 h-8 text-white" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center">No users found matching filters</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.registrationType === 'RULE_BASED' && (
              <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2.5">Rule Type</label>
                  <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-[#ed1c24] uppercase tracking-widest flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#ed1c24]/10 border border-[#ed1c24]/20 flex items-center justify-center">
                      <LucideIcon name="fingerprint" className="w-3.5 h-3.5" />
                    </div>
                    Profile-Based Logic: Birthday Filter
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Target Month</label>
                  <Select
                    value={formData.birthMonth}
                    onValueChange={(v) => handleInputChange('birthMonth', v)}
                  >
                    <SelectTrigger className="w-full h-11 border border-white/10 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest px-4">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map((month, idx) => (
                        <SelectItem key={idx} value={String(idx)} className="text-[10px] font-bold uppercase tracking-widest focus:bg-[#ed1c24]">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Unit */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Name of Business Unit <span className="text-rose-500">*</span>
        </label>
        <Select
          value={formData.businessUnit}
          onValueChange={(v) => handleInputChange('businessUnit', v)}
        >
          <SelectTrigger className={cn(
            "w-full h-11 px-4 border rounded-xl bg-white/5 text-white text-sm",
            errors.businessUnit ? "border-rose-500" : "border-white/10"
          )}>
            <SelectValue placeholder="Select business unit" />
          </SelectTrigger>
          <SelectContent>
            {businessUnits.map((bu) => (
              <SelectItem key={bu._id} value={bu.name}>{bu.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.businessUnit && <p className="text-red-400 text-xs mt-1">{errors.businessUnit}</p>}
      </div>

      {/* Verification & Acknowledgment */}
      {category === 'policy' && (
        <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <label htmlFor="memoUid" className="block text-sm font-medium text-white/70 mb-1">
              Memo Unique ID
            </label>
            <input
              type="text"
              id="memoUid"
              value={formData.memoUid}
              onChange={(e) => handleInputChange('memoUid', e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white placeholder-white/30 caret-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/20 focus:border-[#ed1c24] transition-all"
              placeholder={formData.businessUnit ? `${businessUnits.find(b => b.name === formData.businessUnit)?.label || 'PREFIX'}-${new Date().getFullYear()}-001` : "e.g., POLICY-2026-001"}
            />
            {errors.memoUid && <p className="text-red-400 text-xs mt-1">{errors.memoUid}</p>}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Access Verification</h4>
              <p className="text-[10px] text-white/40 mt-0.5">Require employees to verify email before accessing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.requiresAcknowledgment}
                onChange={(e) => handleInputChange('requiresAcknowledgment', e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ed1c24] peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 sm:flex-none px-6 py-3 bg-[#ed1c24] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:bg-red-800 transition-all shadow-lg shadow-[#ed1c24]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <LucideIcon name="loader-2" className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            editingAnnouncement ? 'Update Announcement' : 'Create Announcement'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-6 py-3 bg-rose-500/10 text-rose-400 rounded-xl font-bold uppercase tracking-widest text-[10px] sm:text-xs border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            Cancel
          </button>
        )}
      </div>

      
    </form>
  );
}
