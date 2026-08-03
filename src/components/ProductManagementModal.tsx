"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle2, Plus, PlusCircle } from "lucide-react";
import type { Category } from "@/lib/types";

interface ProductManagementModalProps {
  onClose: () => void;
}

export default function ProductManagementModal({ onClose }: ProductManagementModalProps) {
  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // Add category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📦");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState(false);

  // Add product form
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("");
  const [newProdEmoji, setNewProdEmoji] = useState("🛒");
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [prodError, setProdError] = useState<string | null>(null);
  const [prodSuccess, setProdSuccess] = useState(false);

  const fetchCategories = useCallback(async () => {
    setCatsLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
      }
    } catch {
      // ignore
    } finally {
      setCatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!newCatName.trim()) { setCatError("السم ضروري"); return; }
    setCatSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), emoji: newCatEmoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل");
      setCatSuccess(true);
      setNewCatName("");
      setNewCatEmoji("📦");
      await fetchCategories();
      setTimeout(() => setCatSuccess(false), 1500);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : "خطأ");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError(null);
    if (!newProdName.trim()) { setProdError("السم ديال المنتج ضروري"); return; }
    const price = parseFloat(newProdPrice);
    if (!newProdPrice || isNaN(price) || price < 0) { setProdError("الثمن خاصو يكون رقم موجب"); return; }
    setProdSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProdName.trim(),
          price,
          category_id: newProdCategory || null,
          emoji: newProdEmoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل");
      setProdSuccess(true);
      setNewProdName("");
      setNewProdPrice("");
      setNewProdEmoji("🛒");
      setTimeout(() => setProdSuccess(false), 1500);
    } catch (err) {
      setProdError(err instanceof Error ? err.message : "خطأ");
    } finally {
      setProdSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">إدارة المنتجات</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200" aria-label="سد">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add Category Section */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-gray-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <PlusCircle className="h-4 w-4 text-emerald-600" /> زيد فئة جديدة
          </h4>
          <form onSubmit={handleAddCategory} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                className="w-14 rounded-2xl border border-gray-300 px-3 py-3 text-center text-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                maxLength={2}
              />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="سم الفئة..."
                className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button type="submit" disabled={catSubmitting} className="flex shrink-0 items-center gap-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50">
                {catSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
            {catError && <p className="text-xs text-red-600">{catError}</p>}
            {catSuccess && <p className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> تزادت الفئة</p>}
          </form>
        </div>

        {/* Add Product Section */}
        <div className="rounded-2xl border border-slate-100 bg-gray-50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <PlusCircle className="h-4 w-4 text-emerald-600" /> زيد منتج جديد
          </h4>
          <form onSubmit={handleAddProduct} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newProdEmoji}
                onChange={(e) => setNewProdEmoji(e.target.value)}
                className="w-14 rounded-2xl border border-gray-300 px-3 py-3 text-center text-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                maxLength={2}
              />
              <input
                type="text"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="سم المنتج..."
                className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <select
              value={newProdCategory}
              onChange={(e) => setNewProdCategory(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              disabled={catsLoading}
            >
              <option value="">بلا فئة</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                placeholder="الثمن (درهم)"
                dir="ltr"
                step="0.01"
                min="0"
                className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button type="submit" disabled={prodSubmitting} className="flex shrink-0 items-center gap-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50">
                {prodSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
            {prodError && <p className="text-xs text-red-600">{prodError}</p>}
            {prodSuccess && <p className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> تزاد المنتج</p>}
          </form>
        </div>
      </div>
    </div>
  );
}