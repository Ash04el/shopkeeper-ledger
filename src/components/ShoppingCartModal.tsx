"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle2, ShoppingCart, Plus, Minus, Trash2, Package, ArrowRight } from "lucide-react";
import type { Category, Product, CartItem, CustomerWithBalance } from "@/lib/types";
import ProductManagementModal from "./ProductManagementModal";

interface ShoppingCartModalProps {
  customers: CustomerWithBalance[];
  prefillCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShoppingCartModal({
  customers,
  prefillCustomerId,
  onClose,
  onSuccess,
}: ShoppingCartModalProps) {
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [txCustomerId, setTxCustomerId] = useState(prefillCustomerId ?? "");
  const [notes, setNotes] = useState("");

  // Modal state
  const [showProductMgmt, setShowProductMgmt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories ?? []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  // Group products by category for "all" view
  const productsByCategory = categories.map((cat) => ({
    category: cat,
    products: products.filter((p) => p.category_id === cat.id),
  })).filter((g) => g.products.length > 0);

  const addToCart = (product: Product) => {
    const catName = categories.find((c) => c.id === product.category_id)?.name ?? "غير مصنف";
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, category_name: catName }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const activeCustomers = customers.filter((c) => !c.is_archived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!txCustomerId) {
      setError("اختار الزبون");
      return;
    }

    if (cart.length === 0) {
      setError("زيد شي منتج للسلة");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: txCustomerId,
          notes: notes.trim() || undefined,
          items: cart.map((item) => ({
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            category_name: item.category_name,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "فشل فتسجيل المعاملة");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setSubmitting(false);
    }
  };

  if (showProductMgmt) {
    return <ProductManagementModal onClose={() => { fetchData(); setShowProductMgmt(false); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">السلة</h3>
              {cart.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {cart.length}
                </span>
              )}
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200" aria-label="سد">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer select */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">اختار الزبون</label>
              <select
                value={txCustomerId}
                onChange={(e) => setTxCustomerId(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">...</option>
                {activeCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Category tabs */}
            {!loading && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">الفئات</label>
                  <button
                    type="button"
                    onClick={() => setShowProductMgmt(true)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    + زيد منتج
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      selectedCategory === "" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    الكل
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        selectedCategory === cat.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.emoji} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                {selectedCategory ? (
                  <div className="grid grid-cols-3 gap-2">
                    {filteredProducts.length === 0 ? (
                      <p className="col-span-3 py-8 text-center text-sm text-gray-400">ماكين حتى منتج فهاد الفئة</p>
                    ) : (
                      filteredProducts.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="flex flex-col items-center gap-1 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.98]"
                        >
                          <span className="text-2xl">{prod.emoji}</span>
                          <span className="text-xs font-semibold text-gray-800 line-clamp-1">{prod.name}</span>
                          <span className="text-xs font-bold text-emerald-600 amount-number">{prod.price.toFixed(2)}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productsByCategory.map(({ category, products: prods }) => (
                      <div key={category.id}>
                        <p className="mb-2 text-xs font-semibold text-gray-500">{category.emoji} {category.name}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {prods.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => addToCart(prod)}
                              className="flex flex-col items-center gap-1 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.98]"
                            >
                              <span className="text-2xl">{prod.emoji}</span>
                              <span className="text-xs font-semibold text-gray-800 line-clamp-1">{prod.name}</span>
                              <span className="text-xs font-bold text-emerald-600 amount-number">{prod.price.toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            )}

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-gray-700">السلة ({cart.reduce((s, i) => s + i.quantity, 0)} منتج)</p>
                </div>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{item.product.emoji}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-800">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400">{item.category_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateQuantity(item.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold amount-number">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-16 text-left text-xs font-bold text-emerald-600 amount-number">{(item.product.price * item.quantity).toFixed(2)}</span>
                        <button type="button" onClick={() => removeFromCart(item.product.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                  <p className="text-sm font-bold text-gray-900">المجموع</p>
                  <p className="text-lg font-extrabold text-emerald-600 amount-number">{cartTotal.toFixed(2)} درهم</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ملاحظة (اختياري)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: شرا بالجملة"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {success && (
              <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> تزادت المعاملة بنجاح!
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DA3437] px-4 py-4 text-lg font-bold text-white transition-all duration-150 hover:bg-[#C42E31] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  تأكيد وتسجيل <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}