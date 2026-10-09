"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  product_name: string;
  status: string;
  quantity: number;
  total_amount: number | string;
  shipping_address: string;
};

export default function TrackPage() {
  const [orgId, setOrgId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrgId(params.get("orgid") || "");
  }, []);

  const trackOrders = async () => {
    if (!orgId) {
      setMessage("Organization information is missing. Open tracking from your organization's store link.");
      setSearched(false);
      return;
    }

    if (!email.trim() || !password) {
      setMessage("Please enter your email and tracking password.");
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setMessage("");
    setOrders([]);

    try {
      const response = await fetch("http://localhost:5000/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const foundOrders = Array.isArray(data.orders) ? data.orders : [];
        setOrders(foundOrders);
        setMessage(
          foundOrders.length === 0
            ? "No orders were found for these details."
            : ""
        );
      } else {
        setMessage(data.message || "Unable to find orders. Check your details and try again.");
      }
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "border-[#20d6b5]/25 bg-[#20d6b5]/10 text-[#4fe0b5]";
      case "SHIPPED":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      default:
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
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
              <span className="block text-[11px] text-slate-500">Order tracking</span>
            </span>
          </a>
          <a
            href={`/products?orgid=${encodeURIComponent(orgId)}`}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-[#20d6b5]/50 hover:text-[#4fe0b5]"
          >
            ← Browse Products
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#20d6b5]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-indigo-500/[0.08] blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#4fe0b5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20d6b5]" />
            CUSTOMER PORTAL
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Your order.
            <br />
            <span className="text-[#4fe0b5]">Your peace of mind.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            View order status, quantities, totals, and shipping details securely
            using the email and tracking password you provided at checkout.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#0d1214] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4fe0b5]">
              Order lookup
            </p>
            <h2 className="mt-2 text-xl font-bold">Find your orders</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter the same email and tracking password used when placing your order.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Organization
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#090e10] px-4 py-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#20d6b5]" />
                  <span className={`text-sm font-semibold ${orgId ? "text-slate-200" : "text-amber-300"}`}>
                    {orgId || "Organization not found"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Detected automatically from the store link.
                </p>
              </div>

              <div>
                <label htmlFor="tracking-email" className="mb-2 block text-xs font-semibold text-slate-300">
                  Email address
                </label>
                <input
                  id="tracking-email"
                  type="email"
                  autoComplete="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void trackOrders();
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="tracking-password" className="mb-2 block text-xs font-semibold text-slate-300">
                  Tracking password
                </label>
                <input
                  id="tracking-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your tracking password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void trackOrders();
                  }}
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={() => void trackOrders()}
                disabled={!orgId || loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#20d6b5] px-4 py-3.5 text-sm font-bold text-[#06110f] transition hover:bg-[#4fe0b5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Looking up orders..." : "Find My Orders →"}
              </button>
            </div>

            {message && (
              <div
                role="status"
                className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${
                  message.toLowerCase().includes("unable") ||
                  message.toLowerCase().includes("please") ||
                  message.toLowerCase().includes("missing") ||
                  message.toLowerCase().includes("check your")
                    ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-300"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-300"
                }`}
              >
                {message}
              </div>
            )}
          </aside>

          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4fe0b5]">
                  Order history
                </p>
                <h2 className="mt-2 text-2xl font-bold">Your orders</h2>
              </div>
              {orders.length > 0 && (
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {orders.length} {orders.length === 1 ? "order" : "orders"}
                </span>
              )}
            </div>

            {!searched && orders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0d1214]/70 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#20d6b5]/15 bg-[#20d6b5]/[0.06] text-2xl text-[#4fe0b5]">
                  ◈
                </div>
                <h3 className="mt-4 font-semibold text-white">Your order details will appear here</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Enter your details to see order progress and shipping information.
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <div key={item} className="animate-pulse rounded-2xl border border-white/[0.07] bg-[#0d1214] p-5">
                    <div className="h-4 w-1/3 rounded bg-white/[0.06]" />
                    <div className="mt-4 h-6 w-2/3 rounded bg-white/[0.05]" />
                    <div className="mt-6 h-16 rounded-xl bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            )}

            {!loading && orders.map((order) => (
              <article
                key={order.id}
                className="mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1214]"
              >
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
                      Order #{order.id}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {order.product_name}
                    </h3>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle(order.status)}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                  <div className="rounded-xl border border-white/[0.06] bg-[#090e10] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Quantity</p>
                    <p className="mt-2 text-xl font-bold text-white">{order.quantity}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-[#090e10] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Order total</p>
                    <p className="mt-2 text-xl font-bold text-[#4fe0b5]">
                      ₹{Number(order.total_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mx-5 mb-5 rounded-xl border border-white/[0.06] bg-[#090e10] p-4 sm:mx-6 sm:mb-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg text-[#4fe0b5]">⌖</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Shipping address
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {order.shipping_address || "No shipping address provided."}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {!loading && searched && orders.length === 0 && message && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1214] px-6 py-10 text-center">
                <p className="text-slate-300">No order details to display.</p>
                <p className="mt-2 text-sm text-slate-500">Check your email and tracking password, or return to the store.</p>
                <a
                  href={`/products?orgid=${encodeURIComponent(orgId)}`}
                  className="mt-5 inline-flex rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#20d6b5]/40 hover:text-[#4fe0b5]"
                >
                  Browse Products
                </a>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-600">
          Powered by <span className="font-semibold text-slate-400">PropExcel</span> · Business management, simplified.
        </footer>
      </section>
    </main>
  );
}
