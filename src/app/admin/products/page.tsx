"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { getProducts, deleteProduct, Product } from "@/lib/products";
import { toast } from "react-hot-toast";

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-neutral-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-neutral-450 hover:text-black font-bold text-xs uppercase tracking-wider transition">
                Control Panel
              </Link>
              <span className="text-neutral-300 text-sm">/</span>
              <span className="font-bold text-xs uppercase tracking-wider text-[#38BDF8]">Products</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase mt-2">
              Products Inventory
            </h1>
          </div>
          <Link
            href="/admin/products/new"
            className="bg-[#38BDF8] text-black hover:bg-[#0ea5e9] hover:text-white px-6 py-3.5 rounded-xl font-bold text-sm transition shadow-sm text-center uppercase tracking-wide cursor-pointer"
          >
            + Add New Product
          </Link>
        </div>

        {/* Product Table/Cards List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-neutral-500 text-sm">Loading products list...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold text-[#666666] mb-2">No products in inventory</h2>
            <p className="text-xs text-neutral-400 mb-6">Create a product to populate this list.</p>
            <Link
              href="/admin/products/new"
              className="bg-[#111111] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-neutral-850 transition uppercase tracking-wider"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f8f8] border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-[#666666]">
                    <th className="p-5">Product</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Sizes</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm font-semibold">
                  {products.map((product) => {
                    const firstImage = product.images && product.images.length > 0 ? product.images[0] : "";
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50 transition">
                        <td className="p-5 flex items-center gap-4">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-xl border border-neutral-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center text-xs text-neutral-400">
                              No Pic
                            </div>
                          )}
                          <span className="font-bold text-black">{product.name}</span>
                        </td>
                        <td className="p-5 uppercase tracking-wide text-xs text-[#666666] font-bold">{product.category}</td>
                        <td className="p-5 text-black">₹{product.price}</td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-1">
                            {(product.sizes || []).map((s) => (
                              <span
                                key={s}
                                className="bg-[#E0F2FE] text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#38BDF8]/20"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-3">
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="bg-neutral-150 text-black hover:bg-[#38BDF8] hover:text-black px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id!)}
                              className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden grid gap-6">
              {products.map((product) => {
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : "";
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-2xl border border-neutral-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-2xl flex items-center justify-center text-xs text-neutral-400">
                          No Pic
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-black text-lg">{product.name}</h4>
                        <p className="text-[#666666] text-sm font-bold mt-1">₹{product.price}</p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#38BDF8] mt-0.5">
                          {product.category}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#666666] tracking-wider mb-2">Sizes Available</p>
                      <div className="flex flex-wrap gap-1">
                        {(product.sizes || []).map((s) => (
                          <span
                            key={s}
                            className="bg-[#E0F2FE] text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#38BDF8]/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 border-t border-neutral-100 pt-4">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="flex-1 bg-neutral-100 text-black hover:bg-[#38BDF8] py-2.5 rounded-xl text-xs font-bold text-center transition shadow-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id!)}
                        className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
