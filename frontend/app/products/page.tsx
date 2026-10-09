"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orgId, setOrgId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    quantity: "1",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [orderId, setOrderId] = useState<number | null>(null);

  const loadProducts = async (id: string) => {
    if (!id) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    try {
      const response = await fetch(
        `http://localhost:5000/public/products?orgid=${encodeURIComponent(id)}`
      );
      const data = await response.json();

      if (response.ok) {
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orgid") || "";
    setOrgId(id);
    void loadProducts(id);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const closeOrderForm = () => {
    if (!submitting) setSelectedProduct(null);
  };

  const placeOrder = async () => {
    if (!selectedProduct || submitting) return;

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.password.trim()
    ) {
      setMessageType("error");
      setMessage("Please complete all fields before placing your order.");
      setOrderId(null);
      return;
    }

    const quantity = Number(form.quantity);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > selectedProduct.stock
    ) {
      setMessageType("error");
      setMessage(`Enter a quantity between 1 and ${selectedProduct.stock}.`);
      setOrderId(null);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setOrderId(null);

    try {
      const response = await fetch("http://localhost:5000/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          productId: selectedProduct.id,
          quantity,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Order #${data.orderId} placed successfully.`);
        setMessageType("success");
        setOrderId(data.orderId);
        setSelectedProduct(null);
        setForm({
          name: "",
          email: "",
          phone: "",
          address: "",
          password: "",
          quantity: "1",
        });
        await loadProducts(orgId);
      } else {
        setMessage(data.message || "Order failed. Please try again.");
        setMessageType("error");
      }
    } catch {
      setMessage("Unable to reach the server. Please try again.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#090e10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#20d6b5] focus:ring-2 focus:ring-[#20d6b5]/10";

  return (
    <main className="min-h-screen bg-[#070a0b] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#070a0b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href={`/products?orgid=${encodeURIComponent(orgId)}`} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20d6b5] text-lg font-black text-[#06110f]">
              P
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">PropExcel</span>
              <span className="block text-[11px] text-slate-500">Business Store</span>
            </span>
          </a>

          <a
            href={`/track?orgid=${encodeURIComponent(orgId)}`}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-[#20d6b5]/50 hover:text-[#4fe0b5]"
          >
            Track Order <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#20d6b5]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-indigo-500/[0.08] blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#4fe0b5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20d6b5]" />
            YOUR BUSINESS, ONE STORE
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Find what you need.
            <br />
            <span className="text-[#4fe0b5]">Order with confidence.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Explore the products available from this organization and place your
            order in just a few steps.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
              <span className="mr-2 text-[#4fe0b5]">✓</span>Live stock availability
            </span>
            <span className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
              <span className="mr-2 text-[#4fe0b5]">✓</span>Order tracking
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {message && (
          <div
            role="status"
            className={`mb-8 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
              messageType === "success"
                ? "border-[#20d6b5]/25 bg-[#20d6b5]/[0.07]"
                : "border-rose-400/25 bg-rose-400/[0.07]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  messageType === "success"
                    ? "bg-[#20d6b5]/15 text-[#4fe0b5]"
                    : "bg-rose-400/15 text-rose-300"
                }`}
              >
                {messageType === "success" ? "✓" : "!"}
              </span>
              <div>
                <p
                  className={`font-semibold ${
                    messageType === "success" ? "text-[#4fe0b5]" : "text-rose-300"
                  }`}
                >
                  {message}
                </p>
                {orderId && (
                  <p className="mt-1 text-sm text-slate-400">
                    Keep your email and tracking password handy to view your order.
                  </p>
                )}
              </div>
            </div>
            {orderId && (
              <a
                href={`/track?orgid=${encodeURIComponent(orgId)}`}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#20d6b5] px-5 py-3 text-sm font-bold text-[#06110f] transition hover:bg-[#4fe0b5]"
              >
                Track Your Order <span className="ml-2">→</span>
              </a>
            )}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4fe0b5]">
              The collection
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Available products</h2>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Browse the current selection and check stock before ordering.
            </p>
          </div>
          {orgId && (
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-[#20d6b5]" />
              Organization <span className="font-semibold text-slate-200">{orgId}</span>
            </div>
          )}
        </div>

        {!orgId && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-xl text-amber-300">
              !
            </div>
            <h3 className="font-semibold text-white">Organization ID required</h3>
            <p className="mt-2 text-sm text-slate-400">
              Open the store using the organization link provided to you.
            </p>
          </div>
        )}

        {orgId && loadingProducts && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#0d1214] p-5">
                <div className="mb-5 h-36 rounded-xl bg-white/[0.05]" />
                <div className="mb-3 h-5 w-2/3 rounded bg-white/[0.06]" />
                <div className="mb-6 h-4 w-full rounded bg-white/[0.04]" />
                <div className="h-10 rounded-lg bg-white/[0.05]" />
              </div>
            ))}
          </div>
        )}

        {orgId && !loadingProducts && products.length === 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1214] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-2xl">
              ◇
            </div>
            <h3 className="text-lg font-semibold text-white">No products available yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              There are no published, in-stock products to display right now. Please check back later.
            </p>
          </div>
        )}

        {!loadingProducts && products.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1214] transition duration-200 hover:-translate-y-1 hover:border-[#20d6b5]/30 hover:shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-[radial-gradient(ellipse_at_center,rgba(32,214,181,0.10),transparent_65%),#0a0f11]">
                  <div className="absolute left-4 top-4 rounded-lg border border-[#20d6b5]/20 bg-[#20d6b5]/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4fe0b5]">
                    Available
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] text-3xl text-[#4fe0b5] transition group-hover:scale-105">
                    ◈
                  </div>
                  <span className="absolute bottom-4 right-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                    Product #{product.id}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-400">
                    {product.description || "Quality product available to order."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-[#090e10] p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Price</p>
                      <p className="mt-1 text-xl font-bold text-[#4fe0b5]">₹{Number(product.price).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[#090e10] p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">In stock</p>
                      <p className="mt-1 text-xl font-bold text-white">{product.stock} <span className="text-xs font-medium text-slate-500">units</span></p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setOrderId(null);
                      setSelectedProduct(product);
                      setForm((previous) => ({ ...previous, quantity: "1" }));
                    }}
                    disabled={product.stock < 1}
                    className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#20d6b5] px-4 py-3 text-sm font-bold text-[#06110f] transition hover:bg-[#4fe0b5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Buy Now <span className="ml-2">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#0d1214] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-semibold text-white">Already placed an order?</h3>
            <p className="mt-1 text-sm text-slate-400">Check the latest status and shipping details.</p>
          </div>
          <a
            href={`/track?orgid=${encodeURIComponent(orgId)}`}
            className="inline-flex w-fit items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#20d6b5]/40 hover:text-[#4fe0b5]"
          >
            Go to order tracking <span className="ml-2">→</span>
          </a>
        </div>

        <footer className="mt-10 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-600">
          Powered by <span className="font-semibold text-slate-400">PropExcel</span> · Business management, simplified.
        </footer>
      </section>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOrderForm();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d1214] shadow-2xl shadow-black/40"
          >
            <div className="border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_top_right,rgba(32,214,181,0.10),transparent_60%)] px-5 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4fe0b5]">Checkout</p>
                  <h2 id="order-dialog-title" className="mt-2 text-xl font-bold text-white sm:text-2xl">
                    Complete your order
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">{selectedProduct.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeOrderForm}
                  disabled={submitting}
                  aria-label="Close checkout"
                  className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  ×
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#090e10]/80 p-4">
                <div>
                  <p className="text-xs text-slate-500">Unit price</p>
                  <p className="mt-1 text-lg font-bold text-[#4fe0b5]">₹{Number(selectedProduct.price).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Available stock</p>
                  <p className="mt-1 font-semibold text-white">{selectedProduct.stock} units</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-6 sm:px-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Full name
                  <input name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={handleChange} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-xs font-semibold text-slate-300">
                  Email address
                  <input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-xs font-semibold text-slate-300">
                  Phone number
                  <input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" value={form.phone} onChange={handleChange} className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-xs font-semibold text-slate-300">
                  Quantity
                  <input name="quantity" type="number" min="1" max={selectedProduct.stock} value={form.quantity} onChange={handleChange} className={`${inputClass} mt-2`} />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-300">
                Shipping address
                <input name="address" autoComplete="street-address" placeholder="House no., street, city" value={form.address} onChange={handleChange} className={`${inputClass} mt-2`} />
              </label>

              <label className="block text-xs font-semibold text-slate-300">
                Tracking password
                <input name="password" type="password" autoComplete="new-password" placeholder="Create a password to track your order" value={form.password} onChange={handleChange} className={`${inputClass} mt-2`} />
                <span className="mt-1.5 block font-normal text-slate-500">
                  Use this password with your email to access order tracking.
                </span>
              </label>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#090e10] px-4 py-3">
                <span className="text-sm text-slate-400">Estimated total</span>
                <span className="text-lg font-bold text-white">
                  ₹{(Number(selectedProduct.price) * Math.max(0, Number(form.quantity) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={closeOrderForm}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.04] disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-[#20d6b5] px-4 py-3 text-sm font-bold text-[#06110f] transition hover:bg-[#4fe0b5] disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Placing order..." : "Place Order →"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
