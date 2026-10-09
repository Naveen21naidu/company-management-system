
"use client";

import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({
    orgId: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Signing in...");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      } else {
        setMessage(data.message || "Login failed. Check your credentials.");
      }
    } catch {
      setMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#101719] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#20d6b5] focus:ring-2 focus:ring-[#20d6b5]/10";

  const labelClass = "mb-2 block text-sm font-medium text-slate-300";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070a0b] px-6 py-10 text-white">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#14cdbb]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#4fe0b5]/10 blur-[130px]" />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-9 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#20d6b5] text-xl font-black text-[#06100e]">
              P
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">PropExcel</p>
              <p className="text-xs text-slate-400">Business Management Platform</p>
            </div>
          </a>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
            Sign in
          </span>
        </header>

        <div className="rounded-3xl border border-[#20d6b5]/20 bg-[#0d1214]/95 p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#20d6b5]/20 bg-[#20d6b5]/10 text-[#20d6b5]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
              </svg>
            </div>

            <p className="text-sm font-medium text-[#4fe0b5]">
              WELCOME BACK
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Access your organization's products, team and orders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Organization ID</label>
              <input
                name="orgId"
                value={form.orgId}
                onChange={handleChange}
                placeholder="e.g. ABC123"
                className={inputClass}
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={inputClass}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20d6b5] py-3.5 font-bold text-[#06100e] transition hover:bg-[#4fe0b5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>

            {message && (
              <p
                role="status"
                className={`rounded-lg border p-3 text-sm ${
                  message === "Signing in..."
                    ? "border-[#20d6b5]/20 bg-[#20d6b5]/10 text-[#4fe0b5]"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
                }`}
              >
                {message}
              </p>
            )}

            <p className="pt-2 text-center text-sm text-slate-400">
              New to PropExcel?{" "}
              <a
                href="/"
                className="font-semibold text-[#4fe0b5] transition hover:text-white"
              >
                Create an organization
              </a>
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Organization-based access · Role-specific workspaces
        </p>
      </div>
    </main>
  );
}
