"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

interface Announcement {
  id: string;
  text: string;
  link?: string;
  enabled: boolean;
  createdAt?: any;
}

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user dismissed it in this session
    const isDismissed = sessionStorage.getItem("announcement-dismissed");
    if (isDismissed === "true") {
      setIsVisible(false);
      setLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "announcements"));
        const list: Announcement[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            text: data.text || "",
            link: data.link || "",
            enabled: !!data.enabled,
            createdAt: data.createdAt,
          });
        });

        // Filter enabled announcements & sort by createdAt descending client-side
        const activeAnnouncements = list
          .filter((a) => a.enabled)
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

        setAnnouncements(activeAnnouncements);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Auto-rotate logic
  useEffect(() => {
    if (announcements.length <= 1 || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [announcements.length, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  };

  if (loading || !isVisible || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-[#111111] text-white text-xs font-semibold py-2 px-8 flex items-center justify-center relative w-full select-none z-[60] border-b border-neutral-800">
      <div className="max-w-4xl mx-auto text-center flex items-center justify-center gap-1.5 min-h-[16px] transition-all duration-500 ease-in-out">
        {currentAnnouncement.link ? (
          <Link
            href={currentAnnouncement.link}
            className="hover:underline flex items-center justify-center gap-1.5 transition text-neutral-100 hover:text-white"
          >
            <span>{currentAnnouncement.text}</span>
            <span className="text-[10px] text-neutral-400">➔</span>
          </Link>
        ) : (
          <span>{currentAnnouncement.text}</span>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition p-1 text-sm font-light cursor-pointer"
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  );
}
