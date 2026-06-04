"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import AdminGuard from "@/components/AdminGuard";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Coupon {
  id?: string;
  code: string;
  type: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number;
  active: boolean;
  usageLimit: number;
  usedCount: number;
  validFrom: any; // Timestamp
  validUntil: any; // Timestamp
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    usage: 0,
  });

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const list: Coupon[] = [];
      let totalUsage = 0;
      let activeCount = 0;
      let expiredCount = 0;
      const nowSec = Timestamp.now().seconds;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Coupon;
        const coupon = { ...data, id: docSnap.id };
        list.push(coupon);

        totalUsage += Number(data.usedCount || 0);

        // Status checks
        const expired = data.validUntil && nowSec > data.validUntil.seconds;
        if (data.active && !expired) {
          activeCount++;
        } else if (expired) {
          expiredCount++;
        }
      });

      // Sort alphabetically by code
      list.sort((a, b) => a.code.localeCompare(b.code));

      setCoupons(list);
      setStats({
        total: list.length,
        active: activeCount,
        expired: expiredCount,
        usage: totalUsage,
      });
    } catch (err) {
      console.error("Failed to load coupons:", err);
      toast.error("Failed to load coupons from database.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill form when editing
  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setDiscountValue(String(coupon.discountValue));
    setMinOrderValue(String(coupon.minOrderValue));
    setMaxDiscountAmount(String(coupon.maxDiscountAmount));
    setUsageLimit(String(coupon.usageLimit));

    // Convert Timestamps to input date strings (YYYY-MM-DD)
    if (coupon.validFrom) {
      const fromDate = new Date(coupon.validFrom.seconds * 1000);
      setStartDate(fromDate.toISOString().split("T")[0]);
    } else {
      setStartDate("");
    }

    if (coupon.validUntil) {
      const untilDate = new Date(coupon.validUntil.seconds * 1000);
      setEndDate(untilDate.toISOString().split("T")[0]);
    } else {
      setEndDate("");
    }

    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setType("percentage");
    setDiscountValue("");
    setMinOrderValue("");
    setMaxDiscountAmount("");
    setUsageLimit("");
    setStartDate(new Date().toISOString().split("T")[0]); // Today as default
    // Default end date is 1 month from now
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    setEndDate(oneMonthLater.toISOString().split("T")[0]);
    setShowModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setSubmitting(true);
    try {
      // Parse inputs
      const parsedVal = Number(discountValue || 0);
      const parsedMin = Number(minOrderValue || 0);
      const parsedMax = Number(maxDiscountAmount || 0);
      const parsedLimit = Number(usageLimit || 0);

      // Convert Date string to Timestamp
      const fromTimestamp = startDate
        ? Timestamp.fromDate(new Date(startDate + "T00:00:00"))
        : Timestamp.now();
      const untilTimestamp = endDate
        ? Timestamp.fromDate(new Date(endDate + "T23:59:59"))
        : null;

      const couponPayload = {
        code: code.trim().toUpperCase(),
        type,
        discountValue: parsedVal,
        minOrderValue: parsedMin,
        maxDiscountAmount: parsedMax,
        usageLimit: parsedLimit,
        validFrom: fromTimestamp,
        validUntil: untilTimestamp,
        active: editingCoupon ? editingCoupon.active : true,
        usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      };

      if (editingCoupon && editingCoupon.id) {
        // Edit flow
        await updateDoc(doc(db, "coupons", editingCoupon.id), couponPayload);
        toast.success(`Coupon ${couponPayload.code} updated successfully!`);
      } else {
        // Create flow
        // Check if code already exists in local state
        const exists = coupons.some((c) => c.code === couponPayload.code);
        if (exists) {
          toast.error(`Coupon with code ${couponPayload.code} already exists!`);
          setSubmitting(false);
          return;
        }

        await addDoc(collection(db, "coupons"), {
          ...couponPayload,
          createdAt: Timestamp.now(),
        });
        toast.success(`Coupon ${couponPayload.code} created successfully!`);
      }

      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      console.error("Error saving coupon:", err);
      toast.error("Failed to save coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon ${name}?`)) return;

    try {
      await deleteDoc(doc(db, "coupons", id));
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await updateDoc(doc(db, "coupons", id), {
        active: !currentStatus,
      });
      toast.success(`Coupon ${name} ${!currentStatus ? "activated" : "deactivated"}`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Seed default demo coupons instantly
  const handleSeedCoupons = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const couponsRef = collection(db, "coupons");

      // Timestamps
      const now = Timestamp.now();
      const oneYearLater = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
      const pastDate = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
      const wayPastDate = Timestamp.fromDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)); // 60 days ago

      const defaultCoupons = [
        { code: "WELCOME10", type: "percentage", discountValue: 10, minOrderValue: 0, maxDiscountAmount: 300, active: true, usageLimit: 1000, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "SAVE200", type: "fixed", discountValue: 200, minOrderValue: 999, maxDiscountAmount: 0, active: true, usageLimit: 500, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "SUMMER15", type: "percentage", discountValue: 15, minOrderValue: 1000, maxDiscountAmount: 500, active: true, usageLimit: 500, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "INSTA20", type: "percentage", discountValue: 20, minOrderValue: 1500, maxDiscountAmount: 600, active: true, usageLimit: 300, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "EID25", type: "percentage", discountValue: 25, minOrderValue: 2000, maxDiscountAmount: 800, active: true, usageLimit: 200, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "FESTIVE30", type: "percentage", discountValue: 30, minOrderValue: 3000, maxDiscountAmount: 1000, active: true, usageLimit: 150, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "INFLUENCER10", type: "percentage", discountValue: 10, minOrderValue: 0, maxDiscountAmount: 150, active: true, usageLimit: 500, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        
        // Error testing coupons
        { code: "EXPIRED10", type: "percentage", discountValue: 10, minOrderValue: 0, maxDiscountAmount: 300, active: true, usageLimit: 100, usedCount: 0, validFrom: wayPastDate, validUntil: pastDate },
        { code: "INACTIVE10", type: "percentage", discountValue: 10, minOrderValue: 0, maxDiscountAmount: 300, active: false, usageLimit: 100, usedCount: 0, validFrom: now, validUntil: oneYearLater },
        { code: "LIMIT0", type: "percentage", discountValue: 10, minOrderValue: 0, maxDiscountAmount: 300, active: true, usageLimit: 100, usedCount: 100, validFrom: now, validUntil: oneYearLater },
        { code: "MIN500", type: "percentage", discountValue: 10, minOrderValue: 500, maxDiscountAmount: 150, active: true, usageLimit: 100, usedCount: 0, validFrom: now, validUntil: oneYearLater },
      ];

      for (const coupon of defaultCoupons) {
        const newDocRef = doc(couponsRef);
        batch.set(newDocRef, { ...coupon, createdAt: now });
      }

      await batch.commit();
      toast.success("Successfully seeded 11 promotional & test coupons!");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed coupons.");
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Forever";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const checkStatus = (coupon: Coupon) => {
    const nowSec = Timestamp.now().seconds;
    if (coupon.validUntil && nowSec > coupon.validUntil.seconds) return "EXPIRED";
    if (!coupon.active) return "INACTIVE";
    return "ACTIVE";
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 border-b border-neutral-250 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#38BDF8] tracking-widest mb-1">
              <Link href="/admin" className="hover:underline">Panel</Link> / <span>Coupons</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase">
              Coupons Management
            </h1>
          </div>
          <div className="flex gap-3">
            {coupons.length === 0 && !loading && (
              <button
                onClick={handleSeedCoupons}
                className="bg-amber-100 border border-amber-300 text-amber-900 px-5 py-3 rounded-xl font-bold hover:bg-amber-200 transition text-sm cursor-pointer select-none"
              >
                ⚡ Seed Default Coupons
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="bg-[#38BDF8] text-black px-5 py-3 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition text-sm cursor-pointer select-none shadow-sm"
            >
              ＋ Create Coupon
            </button>
          </div>
        </div>

        {/* Dashboard Statistics Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#f8f8f8] border border-neutral-200 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Coupons</span>
            <p className="text-3xl font-black text-[#111111] mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Campaigns</span>
            <p className="text-3xl font-black text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Expired Coupons</span>
            <p className="text-3xl font-black text-red-500 mt-1">{stats.expired}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Usage Count</span>
            <p className="text-3xl font-black text-[#38BDF8] mt-1">{stats.usage}</p>
          </div>
        </div>

        {/* Coupons List */}
        {loading ? (
          <div className="py-20 text-center text-neutral-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#38BDF8] mb-3"></div>
            <p className="text-sm font-semibold">Loading Coupons Database...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
            <h2 className="text-2xl font-bold text-neutral-400 mb-2">No Coupon Codes Available</h2>
            <p className="text-sm text-neutral-500 mb-6">Create customized coupon campaigns or click "Seed Default Coupons" to start testing.</p>
            <button
              onClick={handleSeedCoupons}
              className="bg-[#111111] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#38BDF8] hover:text-black transition text-sm select-none"
            >
              Seed Standard Test Coupons
            </button>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-neutral-700">
                <thead className="bg-[#f8f8f8] text-[#111111] border-b border-neutral-200 font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Min Spend</th>
                    <th className="px-6 py-4">Max Discount</th>
                    <th className="px-6 py-4">Usage (Limit)</th>
                    <th className="px-6 py-4">Validity Range</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600 bg-white">
                  {coupons.map((coupon) => {
                    const status = checkStatus(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-neutral-50/50">
                        <td className="px-6 py-4.5 font-bold text-black text-sm tracking-wide">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4.5 font-bold text-neutral-800">
                          {coupon.type === "percentage" ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </td>
                        <td className="px-6 py-4.5">
                          ₹{coupon.minOrderValue}
                        </td>
                        <td className="px-6 py-4.5">
                          {coupon.type === "percentage" ? `₹${coupon.maxDiscountAmount}` : "N/A"}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="font-bold text-black">{coupon.usedCount}</span>
                          <span className="text-neutral-400"> / {coupon.usageLimit || "∞"}</span>
                        </td>
                        <td className="px-6 py-4.5 text-[11px]">
                          {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          {status === "ACTIVE" && (
                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                          {status === "INACTIVE" && (
                            <span className="bg-neutral-100 text-neutral-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                          {status === "EXPIRED" && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Expired
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(coupon.id!, coupon.active, coupon.code)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none ${
                              coupon.active
                                ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {coupon.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="bg-sky-50 text-sky-700 hover:bg-sky-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id!, coupon.code)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer select-none"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal Dialog */}
        {showModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
            <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-200 p-6 shadow-2xl relative animate-scaleIn">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-black font-extrabold text-xl p-1 cursor-pointer transition select-none"
                aria-label="Close modal"
              >
                ✕
              </button>

              <h3 className="text-xl font-black tracking-tight uppercase text-black mb-1">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
              </h3>
              <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-6">
                Fill in the promotional parameters below
              </p>

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-left">
                {/* Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. WELCOME10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition uppercase font-bold"
                    required
                    disabled={!!editingCoupon} // Disallow editing the code directly once created
                  />
                </div>

                {/* Discount Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Discount Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Flat (₹)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      placeholder={type === "percentage" ? "10 (% off)" : "200 (₹ off)"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                      required
                      min="1"
                    />
                  </div>
                </div>

                {/* Min Order Value & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Min Spend (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0 for none"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0 for unlimited"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition-all"
                      disabled={type === "fixed"}
                      min="0"
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Usage Limit (Max Redeems)
                  </label>
                  <input
                    type="number"
                    placeholder="E.g. 500 (0 for unlimited)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                    min="0"
                  />
                </div>

                {/* Validity Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 bg-[#111111] text-white py-3.5 rounded-xl font-bold hover:bg-[#38BDF8] hover:text-black transition text-center text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving Coupon..." : (editingCoupon ? "Update Coupon" : "Create Coupon")}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
