"use client";

import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    orgId: "",
    orgName: "",
    email: "",
    password: "",
    confirmPassword: "",
    orgCountry: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("Creating your organization...");

    try {
      const response = await fetch("https://company-management-system-si7m.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Organization ${data.orgId} created successfully.`);
        setForm({
          orgId: "",
          orgName: "",
          email: "",
          password: "",
          confirmPassword: "",
          orgCountry: "",
        });
      } else {
        setMessage(data.message || "Signup failed.");
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
    <main className="relative min-h-screen overflow-hidden bg-[#070a0b] text-white">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#14cdbb]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#4fe0b5]/10 blur-[130px]" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-5 sm:px-12 lg:px-20">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20d6b5] text-lg font-black text-[#06100e]">
            P
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">PropExcel</p>
            <p className="text-xs text-slate-400">Business Management Platform</p>
          </div>
        </a>

        <a
          href="/login"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-[#20d6b5]/60 hover:text-[#20d6b5]"
        >
          Sign in →
        </a>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-12 px-6 py-12 sm:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-20 lg:py-16">
        <div className="max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#20d6b5]/25 bg-[#20d6b5]/[0.07] px-4 py-2 text-sm font-medium text-[#4fe0b5]">
            <span className="h-2 w-2 rounded-full bg-[#20d6b5]" />
            Your business, connected
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            One platform to manage your entire business
            <span className="mt-1 block text-[#20d6b5]">
              Your team. Your operations.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
            Bring your products, employees and orders together in one organized
            workspace, with role-based access and dedicated organization data.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#20d6b5]/10 text-[#20d6b5]">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M8 9h8M8 13h5M8 17h3" />
                </svg>
              </div>
              <h3 className="font-semibold">One workspace</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Manage products, employees and customer orders together.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#4fe0b5]/10 text-[#4fe0b5]">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold">Role-based access</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Give every employee access according to their responsibilities.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-xs text-slate-500">
            <span>✓ Organization-specific databases</span>
            <span>✓ Centralized access control</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-3xl border border-[#20d6b5]/20 bg-[#0d1214]/95 p-6 shadow-2xl shadow-black/30 sm:p-9">
            <div className="mb-7">
              <p className="text-sm font-medium text-[#4fe0b5]">
                GET STARTED
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Create your organization
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Set up your workspace and create your administrator account.
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
                  pattern="[A-Za-z0-9]+"
                  title="Use letters and numbers only."
                  className={inputClass}
                  autoComplete="organization"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Use letters and numbers only.
                </p>
              </div>

              <div>
                <label className={labelClass}>Organization name</label>
                <input
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  placeholder="Your company name"
                  className={inputClass}
                  autoComplete="organization"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Administrator email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  className={inputClass}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    className={inputClass}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Confirm password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={inputClass}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <input
                  name="orgCountry"
                  value={form.orgCountry}
                  onChange={handleChange}
                  placeholder="India"
                  className={inputClass}
                  autoComplete="country-name"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#20d6b5] py-3.5 font-bold text-[#06100e] transition hover:bg-[#4fe0b5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating workspace..." : "Create Organization"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>

              {message && (
                <p
                  role="status"
                  className={`rounded-lg border p-3 text-sm ${
                    message.includes("successfully")
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : message.includes("Creating")
                        ? "border-[#20d6b5]/20 bg-[#20d6b5]/10 text-[#4fe0b5]"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                  }`}
                >
                  {message}
                </p>
              )}

              <p className="text-center text-sm text-slate-400">
                Already registered?{" "}
                <a
                  href="/login"
                  className="font-semibold text-[#4fe0b5] hover:text-white"
                >
                  Sign in
                </a>
              </p>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-slate-600">
            Secure organization setup · Role-based business management
          </p>
        </div>
      </section>
    </main>
  );
}