"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { uploadImages } from "@/lib/upload";
import { toast } from "react-hot-toast";

interface SlideInput {
  id: string; // uniquely tracks slide instance in admin editor UI
  heading: string;
  subheading: string;
  ctaText: string;
  action: string;
  image: string; // stored URL
  file?: File; // staged local file
  previewUrl?: string; // local preview object URL
}

interface SaleBannerInput {
  enabled: boolean;
  heading: string;
  subheading: string;
  ctaText: string;
  action: string;
  image: string; // stored URL
  file?: File; // staged local file
  previewUrl?: string; // local preview object URL
}

const DEFAULT_SLIDES = [
  {
    heading: "Premium Boys Fashion",
    subheading: "Curated streetwear collection for modern trendsetters.",
    ctaText: "Shop Now",
    action: "#products",
    image: "/hero-boys-fashion.png",
  },
  {
    heading: "New Arrivals",
    subheading: "Freshly dropped designs to elevate his daily style.",
    ctaText: "Shop Now",
    action: "#new-arrivals",
    image: "/hero-new-arrivals.png",
  },
  {
    heading: "Summer Collection",
    subheading: "Breezy cotton tees & shorts for fun in the sun.",
    ctaText: "Shop Now",
    action: "/products/t-shirt",
    image: "/hero-summer-collection.png",
  },
  {
    heading: "Best Sellers",
    subheading: "Our most-loved denim wear, trousers, and coordinates.",
    ctaText: "Shop Now",
    action: "#best-sellers",
    image: "/hero-best-sellers.png",
  },
];

export default function AdminHomepageSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Section Toggles
  const [featuredSectionEnabled, setFeaturedSectionEnabled] = useState(true);
  const [trendingSectionEnabled, setTrendingSectionEnabled] = useState(true);
  const [seasonalSectionEnabled, setSeasonalSectionEnabled] = useState(true);

  // Hero Banners
  const [slides, setSlides] = useState<SlideInput[]>([]);

  // Sale Banner
  const [saleBanner, setSaleBanner] = useState<SaleBannerInput>({
    enabled: false,
    heading: "",
    subheading: "",
    ctaText: "Shop Now",
    action: "/products/all",
    image: "/banner-winter.png",
  });

  // Track slides state in a ref to clean up object URLs on unmount
  const slidesRef = useRef<SlideInput[]>([]);
  slidesRef.current = slides;
  const saleBannerRef = useRef<SaleBannerInput>(saleBanner);
  saleBannerRef.current = saleBanner;

  useEffect(() => {
    return () => {
      // Clean up object URLs
      slidesRef.current.forEach((slide) => {
        if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
      });
      if (saleBannerRef.current.previewUrl) {
        URL.revokeObjectURL(saleBannerRef.current.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "homepageSettings", "settings");
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setFeaturedSectionEnabled(data.featuredSectionEnabled !== false);
          setTrendingSectionEnabled(data.trendingSectionEnabled !== false);
          setSeasonalSectionEnabled(data.seasonalSectionEnabled !== false);

          if (Array.isArray(data.heroBanners) && data.heroBanners.length > 0) {
            setSlides(
              data.heroBanners.map((slide: any, idx: number) => ({
                id: `slide-${idx}-${Date.now()}`,
                heading: slide.heading || "",
                subheading: slide.subheading || "",
                ctaText: slide.ctaText || "Shop Now",
                action: slide.action || "/products/all",
                image: slide.image || "",
              }))
            );
          } else {
            // Load defaults if no slides are in DB
            loadDefaultSlides();
          }

          if (data.saleBanner) {
            setSaleBanner({
              enabled: !!data.saleBanner.enabled,
              heading: data.saleBanner.heading || data.saleBanner.title || "",
              subheading: data.saleBanner.subheading || data.saleBanner.subtitle || "",
              ctaText: data.saleBanner.ctaText || data.saleBanner.buttonText || "Shop Now",
              action: data.saleBanner.action || data.saleBanner.buttonLink || "/products/all",
              image: data.saleBanner.image || data.saleBanner.imageUrl || "/banner-winter.png",
            });
          }
        } else {
          // Document does not exist, set default configuration
          loadDefaultSlides();
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        toast.error("Error loading homepage configurations.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const loadDefaultSlides = () => {
    setSlides(
      DEFAULT_SLIDES.map((slide, idx) => ({
        id: `slide-default-${idx}-${Date.now()}`,
        heading: slide.heading,
        subheading: slide.subheading,
        ctaText: slide.ctaText,
        action: slide.action,
        image: slide.image,
      }))
    );
  };

  const handleSlideChange = (id: string, field: keyof SlideInput, value: any) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSlideImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old object URL if exists
    const currentSlide = slides.find((s) => s.id === id);
    if (currentSlide?.previewUrl) {
      URL.revokeObjectURL(currentSlide.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSlides((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, file, previewUrl, image: "" } : s
      )
    );
  };

  const handleSaleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (saleBanner.previewUrl) {
      URL.revokeObjectURL(saleBanner.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSaleBanner((prev) => ({
      ...prev,
      file,
      previewUrl,
      image: "",
    }));
  };

  const addSlide = () => {
    const newSlide: SlideInput = {
      id: `slide-new-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      heading: "New Slide Heading",
      subheading: "Describe the promotion or category here.",
      ctaText: "Shop Now",
      action: "/products/all",
      image: "/hero-boys-fashion.png",
    };
    setSlides((prev) => [...prev, newSlide]);
    toast.success("New slide added at the bottom!");
  };

  const removeSlide = (id: string) => {
    const slide = slides.find((s) => s.id === id);
    if (slide?.previewUrl) {
      URL.revokeObjectURL(slide.previewUrl);
    }
    setSlides((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slide removed");
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const uploadToast = toast.loading("Saving settings... Please wait.");

      // 1. Upload Staged Slide Images
      const updatedSlides = [...slides];
      for (let i = 0; i < updatedSlides.length; i++) {
        const slide = updatedSlides[i];
        if (slide.file) {
          try {
            const urls = await uploadImages([slide.file]);
            if (urls && urls.length > 0) {
              slide.image = urls[0];
              // clean up local file and previewUrl reference
              delete slide.file;
              if (slide.previewUrl) {
                URL.revokeObjectURL(slide.previewUrl);
                delete slide.previewUrl;
              }
            }
          } catch (uploadErr) {
            console.error(`Failed to upload image for slide ${i + 1}:`, uploadErr);
            toast.error(`Failed to upload slide #${i + 1} image.`, { id: uploadToast });
            setSaving(false);
            return;
          }
        }
      }

      // 2. Upload Sale Banner image
      const updatedSaleBanner = { ...saleBanner };
      if (updatedSaleBanner.file) {
        try {
          const urls = await uploadImages([updatedSaleBanner.file]);
          if (urls && urls.length > 0) {
            updatedSaleBanner.image = urls[0];
            delete updatedSaleBanner.file;
            if (updatedSaleBanner.previewUrl) {
              URL.revokeObjectURL(updatedSaleBanner.previewUrl);
              delete updatedSaleBanner.previewUrl;
            }
          }
        } catch (uploadErr) {
          console.error("Failed to upload Sale Banner image:", uploadErr);
          toast.error("Failed to upload Sale Banner image.", { id: uploadToast });
          setSaving(false);
          return;
        }
      }

      // 3. Write Config Payload to Firestore
      const settingsRef = doc(db, "homepageSettings", "settings");
      const configPayload = {
        featuredSectionEnabled,
        trendingSectionEnabled,
        seasonalSectionEnabled,
        heroBanners: updatedSlides.map((slide, index) => ({
          id: index + 1,
          heading: slide.heading,
          subheading: slide.subheading,
          ctaText: slide.ctaText,
          action: slide.action,
          image: slide.image,
        })),
        saleBanner: {
          enabled: updatedSaleBanner.enabled,
          heading: updatedSaleBanner.heading,
          subheading: updatedSaleBanner.subheading,
          ctaText: updatedSaleBanner.ctaText,
          action: updatedSaleBanner.action,
          image: updatedSaleBanner.image,
        },
      };

      await setDoc(settingsRef, configPayload);
      
      // Update local states to flush file pointers
      setSlides(updatedSlides);
      setSaleBanner(updatedSaleBanner);

      toast.success("Homepage settings saved successfully!", { id: uploadToast });
      router.refresh();
    } catch (err) {
      console.error("Save failure:", err);
      toast.error("Failed to save homepage settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto pb-24">
        {/* Header Breadcrumbs */}
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
                Homepage Settings
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase mt-2">
              Manage Homepage
            </h1>
            <p className="text-[#666666] text-xs font-semibold mt-1">
              Configure slider carousels, banner sections, and dynamic display options.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-[#38BDF8] text-black hover:bg-[#0ea5e9] disabled:bg-neutral-200 disabled:text-neutral-400 hover:text-white px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-neutral-500 text-sm font-semibold">Loading current settings...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Section Toggles Panel */}
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-[32px] p-8 shadow-sm">
              <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-6 flex items-center gap-2">
                ⚙️ Section View Controls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Featured Products */}
                <div
                  onClick={() => setFeaturedSectionEnabled(!featuredSectionEnabled)}
                  className={`border cursor-pointer p-6 rounded-2xl transition duration-200 select-none ${
                    featuredSectionEnabled
                      ? "bg-white border-[#38BDF8] shadow-sm"
                      : "bg-[#f1f1f1] border-neutral-300 text-neutral-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black uppercase tracking-wider">⭐ Featured Products</span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                        featuredSectionEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {featuredSectionEnabled ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-neutral-500">
                    Showcases curated best picks at the center of the homepage.
                  </p>
                </div>

                {/* Trending Products */}
                <div
                  onClick={() => setTrendingSectionEnabled(!trendingSectionEnabled)}
                  className={`border cursor-pointer p-6 rounded-2xl transition duration-200 select-none ${
                    trendingSectionEnabled
                      ? "bg-white border-[#38BDF8] shadow-sm"
                      : "bg-[#f1f1f1] border-neutral-300 text-neutral-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black uppercase tracking-wider">🔥 Trending Products</span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                        trendingSectionEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {trendingSectionEnabled ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-neutral-500">
                    Highlights fast-selling trending boys wear recommendations.
                  </p>
                </div>

                {/* Seasonal Collection */}
                <div
                  onClick={() => setSeasonalSectionEnabled(!seasonalSectionEnabled)}
                  className={`border cursor-pointer p-6 rounded-2xl transition duration-200 select-none ${
                    seasonalSectionEnabled
                      ? "bg-white border-[#38BDF8] shadow-sm"
                      : "bg-[#f1f1f1] border-neutral-300 text-neutral-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black uppercase tracking-wider">🗓️ Seasonal Collection</span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                        seasonalSectionEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {seasonalSectionEnabled ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-neutral-500">
                    Displays seasonal products and banners dynamically.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Carousel Slides Manager */}
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-black flex items-center gap-2">
                    🖼️ Hero Carousel Banners
                  </h2>
                  <p className="text-neutral-500 text-xs font-semibold mt-0.5">
                    Customize high-impact slide banners displaying at the top of the store page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSlide}
                  className="bg-[#111111] hover:bg-neutral-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  + Add Slide
                </button>
              </div>

              {slides.length === 0 ? (
                <div className="text-center py-10 bg-white border border-neutral-200 rounded-2xl">
                  <p className="text-neutral-400 font-semibold text-sm">No banners created. Click Add Slide to start.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {slides.map((slide, index) => {
                    const slideImgSrc = slide.previewUrl || slide.image || "/hero-boys-fashion.png";
                    return (
                      <div
                        key={slide.id}
                        className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 relative"
                      >
                        {/* Slide Rank / Controls */}
                        <div className="flex md:flex-col justify-between items-center gap-2 md:border-r border-neutral-100 md:pr-6">
                          <span className="bg-black text-white text-xs font-black h-8 w-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex md:flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveSlide(index, "up")}
                              disabled={index === 0}
                              className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-bold"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSlide(index, "down")}
                              disabled={index === slides.length - 1}
                              className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-bold"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                        {/* Image Preview & Upload Selection */}
                        <div className="w-full md:w-1/3 flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                            Slide Media
                          </span>
                          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-inner group">
                            <img
                              src={slideImgSrc}
                              alt="Slide preview"
                              className="w-full h-full object-cover"
                            />
                            {slide.file && (
                              <div className="absolute top-2 right-2 bg-[#38BDF8] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                                Staged
                              </div>
                            )}
                          </div>
                          <label className="border border-dashed border-neutral-300 hover:border-[#38BDF8] text-neutral-500 hover:text-[#38BDF8] font-bold text-center py-2.5 rounded-xl text-xs transition cursor-pointer block select-none">
                            Change Background Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleSlideImageUpload(slide.id, e)}
                            />
                          </label>
                        </div>

                        {/* Form Inputs Fields */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                              Heading / Title
                            </label>
                            <input
                              type="text"
                              value={slide.heading}
                              onChange={(e) => handleSlideChange(slide.id, "heading", e.target.value)}
                              className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                              placeholder="e.g. Summer Collection"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                              Subheading / Description
                            </label>
                            <input
                              type="text"
                              value={slide.subheading}
                              onChange={(e) => handleSlideChange(slide.id, "subheading", e.target.value)}
                              className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                              placeholder="e.g. Cotton coordinates and shorts"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={slide.ctaText}
                              onChange={(e) => handleSlideChange(slide.id, "ctaText", e.target.value)}
                              className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                              placeholder="e.g. Shop Now"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                              CTA Redirect Link / Hash
                            </label>
                            <input
                              type="text"
                              value={slide.action}
                              onChange={(e) => handleSlideChange(slide.id, "action", e.target.value)}
                              className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                              placeholder="e.g. /products/all or #products"
                            />
                          </div>
                        </div>

                        {/* Slide Delete Absolute Button */}
                        <button
                          type="button"
                          onClick={() => removeSlide(slide.id)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-750 transition text-sm p-1.5 border border-red-100 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Remove Slide"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sale Banner Panel */}
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-neutral-250 pb-4">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-black flex items-center gap-2">
                    🏷️ Storefront Sale Banner
                  </h2>
                  <p className="text-neutral-500 text-xs font-semibold mt-0.5">
                    Configure a premium high-contrast promo banner at the footer/midsection.
                  </p>
                </div>
                {/* Active switch */}
                <button
                  type="button"
                  onClick={() => setSaleBanner((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 cursor-pointer ${
                    saleBanner.enabled
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-neutral-200 text-neutral-600 border border-neutral-300"
                  }`}
                >
                  {saleBanner.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              {saleBanner.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                        Banner Heading / Title
                      </label>
                      <input
                        type="text"
                        value={saleBanner.heading}
                        onChange={(e) => setSaleBanner((prev) => ({ ...prev, heading: e.target.value }))}
                        className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                        placeholder="e.g. Flat 50% Off Everything"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                        Banner Subtitle / Description
                      </label>
                      <input
                        type="text"
                        value={saleBanner.subheading}
                        onChange={(e) => setSaleBanner((prev) => ({ ...prev, subheading: e.target.value }))}
                        className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                        placeholder="e.g. End of season clearance sale, limited stocks."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={saleBanner.ctaText}
                          onChange={(e) => setSaleBanner((prev) => ({ ...prev, ctaText: e.target.value }))}
                          className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                          placeholder="e.g. Shop Sale"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                          Button Redirect Link
                        </label>
                        <input
                          type="text"
                          value={saleBanner.action}
                          onChange={(e) => setSaleBanner((prev) => ({ ...prev, action: e.target.value }))}
                          className="w-full border border-neutral-200 hover:border-neutral-300 focus:border-[#38BDF8] outline-none rounded-xl p-3 text-sm font-semibold transition"
                          placeholder="e.g. /products/all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-1">
                        Banner Background Image
                      </label>
                      <label className="border border-dashed border-neutral-300 hover:border-[#38BDF8] text-neutral-500 hover:text-[#38BDF8] font-bold text-center py-3 rounded-xl text-xs transition cursor-pointer block select-none">
                        Upload Custom Background File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSaleBannerImageUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Right live mockup preview */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">
                      Live Mockup Preview
                    </span>
                    <div className="relative h-[220px] rounded-3xl overflow-hidden shadow border border-neutral-200 flex items-center bg-black">
                      <div className="absolute inset-0 z-0">
                        <img
                          src={saleBanner.previewUrl || saleBanner.image || "/banner-winter.png"}
                          alt="Sale banner preview"
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                      </div>
                      <div className="relative z-10 p-6 text-white max-w-[280px] space-y-2">
                        <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#38BDF8]">
                          Limited Time Offer
                        </span>
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-tight">
                          {saleBanner.heading || "Promo Headline"}
                        </h3>
                        <p className="text-[10px] text-neutral-300 leading-normal font-medium">
                          {saleBanner.subheading || "Promo description/subheading goes here."}
                        </p>
                        <div className="pt-1">
                          <span className="inline-block bg-[#38BDF8] text-black text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-wider select-none">
                            {saleBanner.ctaText || "Shop Now"}
                          </span>
                        </div>
                      </div>
                      {saleBanner.file && (
                        <div className="absolute top-3 right-3 bg-[#38BDF8] text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow z-20">
                          Staged
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
