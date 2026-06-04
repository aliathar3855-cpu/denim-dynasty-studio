"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-hot-toast";

interface Announcement {
  id: string;
  text: string;
  link: string;
  enabled: boolean;
  createdAt?: any;
}

const EMOJI_PRESETS = ["🚚", "🎉", "🔥", "⚡", "✨", "🎁", "💖", "🌟", "📣", "🛍️"];

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

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

      // Sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setAnnouncements(list);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => emoji + " " + prev);
  };

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, "announcements", id);
      await updateDoc(docRef, { enabled: !currentStatus });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: !currentStatus } : a))
      );
      toast.success(!currentStatus ? "Announcement enabled!" : "Announcement disabled!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleEditClick = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setText(announcement.text);
    setLink(announcement.link);
    setEnabled(announcement.enabled);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText("");
    setLink("");
    setEnabled(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await deleteDoc(doc(db, "announcements", id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted successfully");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete announcement");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Announcement text cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      const loadingToast = toast.loading(
        editingId ? "Updating announcement..." : "Creating announcement..."
      );

      if (editingId) {
        // Update document
        const docRef = doc(db, "announcements", editingId);
        await updateDoc(docRef, {
          text: text.trim(),
          link: link.trim(),
          enabled,
        });

        toast.success("Announcement updated successfully!", { id: loadingToast });
        setEditingId(null);
      } else {
        // Create document
        const docRef = collection(db, "announcements");
        await addDoc(docRef, {
          text: text.trim(),
          link: link.trim(),
          enabled,
          createdAt: serverTimestamp(),
        });

        toast.success("Announcement created successfully!", { id: loadingToast });
      }

      // Reset Form fields
      setText("");
      setLink("");
      setEnabled(true);

      // Refresh list
      fetchAnnouncements();
      router.refresh();
    } catch (err) {
      console.error("Save failure:", err);
      toast.error("Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto pb-24">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-neutral-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-neutral-500 hover:text-black font-bold text-xs uppercase tracking-wider transition"
              >
                Control Panel
              </Link>
              <span className="text-neutral-300 text-sm">/</span>
              <span className="font-bold text-xs uppercase tracking-wider text-[#38BDF8]">
                Announcements
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase mt-2">
              Announcement Bar
            </h1>
            <p className="text-[#666666] text-xs font-semibold mt-1">
              Configure promo banners displaying at the top of the storefront. If multiple are enabled, they will rotate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Form Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-[24px] p-6 shadow-sm sticky top-28">
              <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-4">
                {editingId ? "✏️ Edit Announcement" : "✨ Create Announcement"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Text Field */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                    Announcement Text
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                    placeholder="e.g. 🚚 Free Delivery Above ₹999"
                    required
                  />
                  {/* Emoji Quick Picker */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="h-7 w-7 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition text-xs flex items-center justify-center cursor-pointer select-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Redirect Link Field */}
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                    Redirect Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                    placeholder="e.g. /products/all"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3 py-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    id="enabled-toggle"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#38BDF8] focus:ring-[#38BDF8]"
                  />
                  <label
                    htmlFor="enabled-toggle"
                    className="text-xs font-bold text-neutral-600 cursor-pointer uppercase tracking-wide"
                  >
                    Enable immediately
                  </label>
                </div>

                {/* Buttons container */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#38BDF8] text-black hover:bg-[#0ea5e9] disabled:bg-neutral-200 disabled:text-neutral-450 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : editingId ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-white border border-neutral-300 text-black hover:bg-neutral-50 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Inventory List Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-[24px] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black uppercase tracking-tight mb-4 flex items-center justify-between">
                <span>📋 Active Announcements list</span>
                <span className="bg-neutral-200 text-neutral-800 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
                  Total: {announcements.length}
                </span>
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <p className="text-neutral-500 text-xs font-semibold mt-2">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-12 bg-white border border-neutral-250 rounded-xl">
                  <p className="text-neutral-400 font-bold text-sm">No announcements configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`bg-white border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition duration-200 ${
                        ann.enabled ? "border-neutral-200" : "border-neutral-200 opacity-60"
                      }`}
                    >
                      {/* Announcement Details */}
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              ann.enabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
                            }`}
                          />
                          <p className="font-bold text-sm text-black leading-relaxed">
                            {ann.text}
                          </p>
                        </div>
                        {ann.link && (
                          <div className="flex items-center gap-1.5 text-xs text-[#38BDF8] font-bold">
                            <span>Link:</span>
                            <span className="underline hover:text-[#0ea5e9] truncate max-w-[200px] sm:max-w-xs block">
                              {ann.link}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Announcement Actions */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleEnable(ann.id, ann.enabled)}
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition duration-200 cursor-pointer ${
                            ann.enabled
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {ann.enabled ? "Active" : "Disabled"}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEditClick(ann)}
                          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(ann.id)}
                          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
