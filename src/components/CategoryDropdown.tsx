'use client';

import { CATEGORIES, CategoryType } from '@/types';
import LucideIcon from './LucideIcon';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';

interface CategoryDropdownProps {
  selectedCategory: CategoryType | 'all';
  onCategoryChange: (category: CategoryType | 'all') => void;
  selectedBU: string | 'all';
  onBUChange: (bu: string | 'all') => void;
}

export default function CategoryDropdown({ selectedCategory, onCategoryChange, selectedBU, onBUChange }: CategoryDropdownProps) {
  const [businessUnits, setBusinessUnits] = useState<{ _id: string; name: string; label: string; image: string }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchBUs = async () => {
      try {
        const res = await fetch('/api/admin/business-units');
        if (res.ok) {
          const data = await res.json();
          setBusinessUnits(data);
        }
      } catch (error) {
        console.error('Failed to fetch business units:', error);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchBUs();
    fetchCategories();
  }, []);

  const getIconNameForCategory = (category: CategoryType) => {
    switch (category) {
      case 'events': return 'calendar';
      case 'company-news': return 'bar-chart';
      case 'urgent-notices': return 'alert-circle';
      case 'policy': return 'file-text';
      case 'birthday-celebrants': return 'cake';
      default: return 'file-text';
    }
  };

  const getIconBgClass = (_category?: CategoryType) => {
    return 'bg-[#000] border border-white/10';
  };

  const getStatGradient = (category: CategoryType) => {
    return 'bg-[#000] border border-white/10';
  };

  return (
    <div className="bg-[#000] rounded-xl shadow-2xl p-4 w-full mb-8 border border-white/10">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Unified Filter Header */}
        <div className="flex items-center gap-3 shrink-0 mr-2">
          <div className="w-10 h-10 rounded-xl bg-[#ed1c24] flex items-center justify-center shadow-lg border border-white/10">
            <LucideIcon name="filter" className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Refine View</span>
            <span className="text-sm font-black text-white leading-none tracking-tighter">Smart Filters</span>
          </div>
        </div>

        <div className="h-10 w-px bg-white/10 hidden md:block mx-2" />

        {/* Category Filter */}
        <div className="flex-1 w-full">
          <Select
            value={selectedCategory}
            onValueChange={(value) => onCategoryChange(value as CategoryType | 'all')}
          >
            <SelectTrigger 
              className={cn(
                "w-full h-12 border rounded-xl transition-all font-black uppercase tracking-widest text-[10px] px-4",
                "border-white/10 bg-[#000] text-white/60 hover:text-white hover:border-white/30 shadow-xl"
              )}
            >
              <div className="flex items-center gap-3">
                <LucideIcon 
                  name={selectedCategory === 'all' ? 'layers' : getIconNameForCategory(selectedCategory as CategoryType)} 
                  className="w-4 h-4" 
                />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/10 shadow-2xl bg-[#000] p-1">
              <SelectItem value="all" className="rounded-lg py-2.5 focus:bg-white/5 focus:text-white cursor-pointer font-black text-[10px] uppercase tracking-widest text-white">
                <div className="flex items-center gap-3">
                  <LucideIcon name="layers" className="w-4 h-4 text-white/40" />
                  <span>All Categories</span>
                </div>
              </SelectItem>
              {(() => {
                const catsToUse = categories.length > 0 
                  ? categories.map(c => ({ id: c.name, displayName: c.name, color: c.color }))
                  : Object.entries(CATEGORIES).map(([key, cat]) => ({ id: key, displayName: cat.displayName, color: cat.color }));
                
                return catsToUse.map((cat) => (
                  <SelectItem 
                    key={cat.id} 
                    value={cat.id} 
                    className="rounded-lg py-2.5 focus:bg-white/5 focus:text-white cursor-pointer font-black text-[10px] uppercase tracking-widest text-white mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-xl text-white shadow-lg", getIconBgClass(cat.id as CategoryType))}>
                        <LucideIcon name={getIconNameForCategory(cat.id as CategoryType)} className="w-4 h-4 text-white" />
                      </span>
                      <span>{cat.displayName}</span>
                    </div>
                  </SelectItem>
                ));
              })()}
            </SelectContent>
          </Select>
        </div>

        {/* Business Unit Filter */}
        <div className="flex-1 w-full">
          <Select
            value={selectedBU}
            onValueChange={(value) => onBUChange(value)}
          >
            <SelectTrigger 
              className={cn(
                "w-full h-12 border rounded-xl transition-all font-black uppercase tracking-widest text-[10px] px-4",
                "border-white/10 bg-[#000] text-white/60 hover:text-white hover:border-white/30 shadow-xl"
              )}
            >
              <div className="flex items-center gap-3">
                <SelectValue placeholder="All Business Units" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-white/10 shadow-2xl bg-[#000] p-1">
              <SelectItem value="all" className="rounded-lg py-2.5 focus:bg-white/5 focus:text-white cursor-pointer font-black text-[10px] uppercase tracking-widest text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <LucideIcon name="building" className="w-4 h-4 text-white/40" />
                  </div>
                  <span>All Business Units</span>
                </div>
              </SelectItem>
              {businessUnits.map((bu) => (
                <SelectItem 
                  key={bu._id} 
                  value={bu.name} 
                  className="rounded-lg py-2.5 focus:bg-white/5 focus:text-white cursor-pointer font-black text-[10px] uppercase tracking-widest text-white mb-1"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-white shadow-lg overflow-hidden border border-white/10 p-1 bg-white/5"
                    >
                      {bu.image ? (
                        <img src={bu.image} alt={bu.label} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-black">{bu.label}</span>
                      )}
                    </span>
                    <span>{bu.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear All Button */}
        {(selectedCategory !== 'all' || selectedBU !== 'all') && (
          <button
            onClick={() => {
              onCategoryChange('all');
              onBUChange('all');
            }}
            className="shrink-0 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            title="Clear All Filters"
          >
            <LucideIcon name="rotate-ccw" className="w-4 h-4" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Reset</span>
          </button>
        )}
      </div>

      {selectedCategory !== 'all' && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl border mt-3 transition-all duration-300 text-white shadow-lg",
            getStatGradient(selectedCategory as CategoryType)
          )}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Category Description</div>
          <div className="text-xs font-bold tracking-tight text-white/90">
            {categories.find(c => c.name === selectedCategory)?.description || CATEGORIES[selectedCategory as CategoryType]?.description || `Viewing all ${selectedCategory} content.`}
          </div>
        </div>
      )}
    </div>
  );
}
