'use client';

import { useState, useEffect } from 'react';
import { Announcement, CategoryType } from '@/types';
import { getAllActiveAnnouncements } from '@/data/mockData';
import { getAllSampleAnnouncements } from '@/data/sampleData';
import AnnouncementCard from './AnnouncementCard';
import LucideIcon from './LucideIcon';
import Image from 'next/image';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from '@/lib/utils';

interface AnnouncementListProps {
  selectedCategory: CategoryType | 'all';
  selectedBU?: string | 'all';
  hideBirthdays?: boolean;
}

export default function AnnouncementList({ selectedCategory, selectedBU = 'all', hideBirthdays = false }: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    const loadAnnouncements = async () => {
      const mockAnnouncements = await getAllActiveAnnouncements();
      const sampleAnnouncements = getAllSampleAnnouncements();
      let filtered = [...mockAnnouncements, ...sampleAnnouncements];
      
      // Filter by category if not 'all'
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(ann => ann.category === selectedCategory);
        
        // Only show 1 card for food-menu category
        if (selectedCategory === 'food-menu' && filtered.length > 1) {
          filtered = [filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]];
        }
      } else {
        // In 'all' view, only show the latest food menu card if there are multiple
        const foodMenuAnnouncements = filtered.filter(ann => ann.category === 'food-menu');
        if (foodMenuAnnouncements.length > 1) {
          const latestFoodMenu = foodMenuAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          filtered = filtered.filter(ann => ann.category !== 'food-menu' || ann.id === latestFoodMenu.id);
        }
      }

      // Filter by Business Unit if not 'all'
      if (selectedBU !== 'all') {
        filtered = filtered.filter(ann => ann.businessUnit === selectedBU);
      }

      // Remove birthday celebrants when requested (e.g., user preview)
      if (hideBirthdays) {
        filtered = filtered.filter(ann => ann.category !== 'birthday-celebrants');
      }

      // Group birthday-celebrants if there are multiple
      const birthdayAnnouncements = filtered.filter(ann => ann.category === 'birthday-celebrants');
      const otherAnnouncements = filtered.filter(ann => ann.category !== 'birthday-celebrants');

      const finalAnnouncements = [...otherAnnouncements];

      if (birthdayAnnouncements.length > 0) {
        // Always consolidate birthdays into a fixed template
        const names = birthdayAnnouncements.map(ann => {
          // Strip emoji and "Happy Birthday" if possible to get names
          return ann.title
            .replace(/^\p{Extended_Pictographic}\s*/u, '')
            .replace(/Happy Birthday\s*/gi, '')
            .replace(/!/g, '')
            .trim();
        });

        // Combine images
        const allImages: string[] = [];
        birthdayAnnouncements.forEach(ann => {
          if (ann.imageUrl) allImages.push(ann.imageUrl);
          if (ann.imageUrls) allImages.push(...ann.imageUrls);
        });

        // Unique images
        const uniqueImages = Array.from(new Set(allImages));

        // Get the most recent createdAt date
        const latestCreatedAt = new Date(Math.max(...birthdayAnnouncements.map(ann => new Date(ann.createdAt).getTime())));

        const consolidatedBirthday: Announcement = {
          id: 'consolidated-birthdays',
          title: `Birthday Celebrants`,
          content: names.join(', '),
          category: 'birthday-celebrants',
          createdAt: latestCreatedAt,
          isActive: true,
          imageUrls: uniqueImages,
          businessUnit: 'CNT GROUP',
        };
        finalAnnouncements.push(consolidatedBirthday);
      }

      const sorted = finalAnnouncements.sort((a, b) => {
        const aPinned = a.pinned ? 1 : 0;
        const bPinned = b.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAnnouncements(sorted);
    };

    loadAnnouncements();
    
    // Listen for custom update events
    const handleUpdate = () => loadAnnouncements();
    window.addEventListener('announcements-updated', handleUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('announcements');
      bc.onmessage = () => handleUpdate();
    } catch {}
    
    // Auto-refresh every 30 seconds to simulate real-time updates
    const interval = setInterval(loadAnnouncements, 30000);
    
    return () => {
      window.removeEventListener('announcements-updated', handleUpdate);
      try {
        if (bc) bc.close();
      } catch {}
      clearInterval(interval);
    };
  }, [selectedCategory, selectedBU, hideBirthdays]);

  const totalPages = Math.ceil(announcements.length / ITEMS_PER_PAGE);
  const effectivePage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const paginatedAnnouncements = announcements.slice(
    (effectivePage - 1) * ITEMS_PER_PAGE,
    effectivePage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Featured Food Menu - Show prominently if selected category is food-menu */}
      {selectedCategory === 'food-menu' && paginatedAnnouncements.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#000] rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row min-h-[400px] md:h-[320px]">
            <div className="p-6 sm:p-8 md:w-[30%] bg-[#000] text-white flex flex-col justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#ed1c24] border border-white/10 flex items-center justify-center shadow-lg shadow-[#ed1c24]/20">
                  <LucideIcon name="utensils" className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase">Food Menu</h2>
              </div>
              <p className="text-white/60 text-xs leading-relaxed mb-4 line-clamp-3 md:line-clamp-2 font-black tracking-tight">
                {paginatedAnnouncements[0].content}
              </p>
              <div className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] pt-4 border-t border-white/5">
                Refreshed for 2026
              </div>
            </div>
            <div className="md:w-[70%] relative bg-black/20 group min-h-[250px] md:min-h-0">
              {paginatedAnnouncements[0].imageUrl && (
                <div 
                  className="relative w-full h-full cursor-pointer overflow-hidden"
                  onClick={() => {
                    // Trigger the dialog of the hidden card
                    const triggerElement = document.getElementById(`trigger-${paginatedAnnouncements[0].id}`);
                    if (triggerElement) triggerElement.click();
                  }}
                >
                  <Image 
                    src={paginatedAnnouncements[0].imageUrl} 
                    alt="Current Food Menu" 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1200px) 100vw, 800px"
                    priority
                  />
                  {/* Overlay to ensure readability and indicate clickability */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="bg-[#000] px-6 py-3 rounded-xl border border-white/10 shadow-2xl text-white font-black uppercase tracking-tighter text-[10px] flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 scale-100 sm:scale-95 group-hover:scale-100">
                      <LucideIcon name="maximize-2" className="w-4 h-4" />
                      View Full Menu
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Hidden card to handle dialog logic if clicked from featured view */}
          <div className="invisible absolute h-0 w-0 overflow-hidden pointer-events-none">
            <AnnouncementCard 
              announcement={paginatedAnnouncements[0]} 
              triggerId={`trigger-${paginatedAnnouncements[0].id}`}
              variant="compact"
            />
          </div>
        </div>
      )}

      {/* Announcements Grid */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        selectedCategory === 'food-menu' && "hidden" 
      )}>
        {paginatedAnnouncements.length > 0 ? (
          paginatedAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              variant="compact"
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-20 bg-[#000] rounded-xl border border-dashed border-white/10">
            <div className="text-white/60 text-lg font-black uppercase tracking-tighter">
              No announcements found for this category.
            </div>
            <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
              Check back later for updates!
            </div>
          </div>
        )}
      </div>

      {/* Modern Pagination Controls */}
      <div className="flex justify-center mt-16 mb-12">
        <Pagination className="inline-flex w-auto bg-[#000] border border-white/10 rounded-xl shadow-2xl p-1.5 transition-all">
          <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={cn(
                    "rounded-lg w-10 h-10 p-0 sm:w-auto sm:px-4 transition-all duration-300 border-none",
                    currentPage === 1 
                      ? "pointer-events-none opacity-10 grayscale" 
                      : "cursor-pointer hover:bg-white/5 text-white/60 hover:text-white active:scale-95"
                  )}
                />
              </PaginationItem>
              
              <div className="flex items-center gap-1 sm:gap-1.5 mx-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Simple logic to show current, first, last, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNumber);
                          }}
                          isActive={currentPage === pageNumber}
                          className={cn(
                            "w-10 h-10 rounded-lg transition-all duration-300 cursor-pointer border-none font-black text-[10px] uppercase tracking-tighter",
                            currentPage === pageNumber 
                              ? "bg-[#ed1c24] text-white shadow-xl shadow-[#ed1c24]/20" 
                              : "text-white/40 hover:bg-white/5 hover:text-white active:scale-95"
                          )}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis className="w-8 text-white/20" />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
              </div>

              <PaginationItem>
                <PaginationNext 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={cn(
                    "rounded-lg w-10 h-10 p-0 sm:w-auto sm:px-4 transition-all duration-300 border-none",
                    currentPage === totalPages 
                      ? "pointer-events-none opacity-10 grayscale" 
                      : "cursor-pointer hover:bg-white/5 text-white/60 hover:text-white active:scale-95"
                  )}
                />
              </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
