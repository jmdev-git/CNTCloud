"use client";

import { useState } from "react";
import { CategoryType } from "@/types";
import CloudspaceHeader from "../components/CloudspaceHeader";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import LatestNews from "../components/LatestNews";
import CategoryDropdown from "@/components/CategoryDropdown";
import AnnouncementList from "@/components/AnnouncementList";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "all">("all");
  const [selectedBU, setSelectedBU] = useState<string | "all">("all");

  return (
    <div className="min-h-screen bg-[#000]">
      <CloudspaceHeader buttonLabel="Login" buttonHref="/admin/login" />
      <HeroSection />
      {selectedCategory === "all" && selectedBU === "all" && <LatestNews />}
      <div className="container mx-auto px-4 py-8">
        <CategoryDropdown
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedBU={selectedBU}
          onBUChange={setSelectedBU}
        />
        <AnnouncementList
          selectedCategory={selectedCategory}
          selectedBU={selectedBU}
        />
      </div>
      <Footer showSupportInfo={false} />
    </div>
  );
}
