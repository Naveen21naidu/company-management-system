"use client";

import { useEffect, useState } from "react";

const API = "https://company-management-system-si7m.onrender.com";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock: number;
  is_published: boolean;
};

type Order = {
  id: number;
  customer_name: string;
  email: string;
  total_amount: number | string;
  status: "ORDERED" | "SHIPPED" | "DELIVERED" | string;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AppUser = {
  id?: number;
  name: string;
  email?: string;
  role: string;
  orgId?: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Inventory Manager",
  });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const token = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders = (json = false) => {
    const currentToken = token();
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  const loadData = async () => {
    const storedUser = localStorage.getItem("user");
    const currentToken = localStorage.getItem("token");

    if (!storedUser || !currentToken) {
      window.location.href = "/login";
      return;
    }

    const currentUser = JSON.parse(storedUser) as AppUser;
    setUser(currentUser);

    try {
      const productResponse = await fetch(`${API}/api/products`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const productData = await productResponse.json();
      if (productResponse.ok) setProducts(productData);

      if (
        currentUser.role === "Account Manager" ||
        currentUser.role === "Admin"
      ) {
        const orderResponse = await fetch(`${API}/api/orders`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const orderData = await orderResponse.json();
        if (orderResponse.ok) setOrders(orderData);
      }

      if (currentUser.role === "Admin") {
        const employeeResponse = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const employeeData = await employeeResponse.json();
        if (employeeResponse.ok) setEmployees(employeeData);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Initial dashboard load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createEmployee = async () => {
    if (!employeeForm.name || !employeeForm.email || !employeeForm.password) {
      setMessage("Please fill all employee fields.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(employeeForm),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`${employeeForm.role} created successfully.`);
        setEmployeeForm({
          name: "",
          email: "",
          password: "",
          role: "Inventory Manager",
        });
        setShowEmployeeForm(false);
        await loadData();
      } else {
        setMessage(data.message || "Failed to create employee.");
      }
    } catch {
      setMessage("Unable to create employee.");
    } finally {
      setSaving(false);
    }
  };

  const createProduct = async () => {
    if (!productForm.name || productForm.price === "" || productForm.stock === "") {
      setMessage("Enter a product name, price and stock.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Product created successfully.");
        setProductForm({ name: "", description: "", price: "", stock: "" });
        await loadData();
      } else {
        setMessage(data.message || "Failed to create product.");
      }
    } catch {
      setMessage("Unable to create product.");
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({
          name: editingProduct.name,
          description: editingProduct.description,
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Product updated successfully.");
        setEditingProduct(null);
        await loadData();
      } else {
        setMessage(data.message || "Failed to update product.");
      }
    } catch {
      setMessage("Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Product deleted successfully.");
        await loadData();
      } else {
        setMessage(data.message || "Failed to delete product.");
      }
    } catch {
      setMessage("Unable to delete product.");
    }
  };

  const publishProduct = async (id: number) => {
    try {
      const response = await fetch(`${API}/api/products/${id}/publish`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Product published successfully.");
        await loadData();
      } else {
        setMessage(data.message || "Cannot publish product.");
      }
    } catch {
      setMessage("Unable to publish product.");
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Order updated to ${status}.`);
        await loadData();
      } else {
        setMessage(data.message || "Failed to update order.");
      }
    } catch {
      setMessage("Unable to update order.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070a0b] text-slate-300">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#20d6b5]" />
          <p className="text-sm">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  const role = String(user.role || "").trim().toLowerCase();
  const isAdmin = role === "admin";
  const canManageProducts = role === "inventory manager" || isAdmin;
  const canManageOrders = role === "account manager" || isAdmin;
  const publishedCount = products.filter((p) => p.is_published).length;
  const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length;

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-[#101719] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#20d6b5]";
  const labelClass = "mb-2 block text-sm font-medium text-slate-300";
  const panelClass = "rounded-2xl border border-white/[0.08] bg-[#0d1214]";
  const sectionTitle = "text-lg font-bold tracking-tight text-white";
  const muted = "text-sm text-slate-400";

  return (
    <main className="min-h-screen bg-[#070a0b] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#090d0e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20d6b5] text-lg font-black text-[#06100e]">
              P
            </div>
            <div>
              <p className="font-bold tracking-tight">PropExcel</p>
              <p className="text-xs text-slate-500">Business Management</p>
            </div>
          </a>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-[#4fe0b5]">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#20d6b5]/30 bg-[#20d6b5]/10 font-semibold text-[#4fe0b5]">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-400/40 hover:text-red-300 sm:px-4"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] px-3 py-1.5 text-xs font-semibold text-[#4fe0b5]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#20d6b5]" />
              {user.role} workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Dashboard<span className="text-[#20d6b5]">.</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Welcome back, {user.name}. Here&apos;s your business overview.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#20d6b5]" />
            Workspace active
          </div>
        </div>

        {message && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] px-4 py-3 text-sm text-[#9af2df]">
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="text-lg leading-none text-slate-400 hover:text-white"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Total products</p>
              <span className="rounded-lg bg-[#20d6b5]/10 p-2 text-[#20d6b5]">▦</span>
            </div>
            <p className="mt-4 text-3xl font-bold">{products.length}</p>
            <p className="mt-2 text-xs text-slate-500">{publishedCount} published</p>
          </div>
          {isAdmin && (
            <div className={`${panelClass} p-5`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Team members</p>
                <span className="rounded-lg bg-[#4fe0b5]/10 p-2 text-[#4fe0b5]">♙</span>
              </div>
              <p className="mt-4 text-3xl font-bold">{employees.length}</p>
              <p className="mt-2 text-xs text-slate-500">People in your organization</p>
            </div>
          )}
          {canManageOrders && (
            <div className={`${panelClass} p-5`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Total orders</p>
                <span className="rounded-lg bg-indigo-400/10 p-2 text-indigo-300">↗</span>
              </div>
              <p className="mt-4 text-3xl font-bold">{orders.length}</p>
              <p className="mt-2 text-xs text-slate-500">
                {orders.filter((o) => o.status !== "DELIVERED").length} in progress
              </p>
            </div>
          )}
          <div className={`${panelClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Stock attention</p>
              <span className="rounded-lg bg-amber-400/10 p-2 text-amber-300">!</span>
            </div>
            <p className="mt-4 text-3xl font-bold">{lowStockCount}</p>
            <p className="mt-2 text-xs text-slate-500">Products with stock of 5 or less</p>
          </div>
        </section>

        {isAdmin && (
          <section className="mb-10">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className={sectionTitle}>Employee management</h2>
                <p className={`mt-1 ${muted}`}>Create team members and assign their access level.</p>
              </div>
              <button
                onClick={() => setShowEmployeeForm(!showEmployeeForm)}
                className="rounded-xl bg-[#20d6b5] px-4 py-3 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5]"
              >
                {showEmployeeForm ? "Close form" : "+ Add employee"}
              </button>
            </div>

            {showEmployeeForm && (
              <div className={`${panelClass} mb-5 p-5 sm:p-6`}>
                <h3 className="mb-5 font-semibold">Create a team member</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Full name</label>
                    <input
                      placeholder="Employee name"
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email address</label>
                    <input
                      type="email"
                      placeholder="employee@company.com"
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Temporary password</label>
                    <input
                      type="password"
                      placeholder="Create temporary password"
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Assign role</label>
                    <select
                      value={employeeForm.role}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                      className={fieldClass}
                    >
                      <option className="bg-[#101719]" value="Inventory Manager">Inventory Manager</option>
                      <option className="bg-[#101719]" value="Account Manager">Account Manager</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={createEmployee}
                  disabled={saving}
                  className="mt-5 rounded-xl bg-[#20d6b5] px-5 py-3 text-sm font-bold text-[#06100e] disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create employee"}
                </button>
              </div>
            )}

            <div className={`${panelClass} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <h3 className="font-semibold">Organization team</h3>
                  <p className="mt-1 text-xs text-slate-500">Employees and assigned roles</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                  {employees.length} members
                </span>
              </div>
              {employees.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No employees found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">Employee</th>
                        <th className="px-5 py-4 font-medium">Email</th>
                        <th className="px-5 py-4 font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id} className="border-t border-white/[0.06] transition hover:bg-white/[0.02]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#20d6b5]/10 text-sm font-bold text-[#4fe0b5]">
                                {employee.name?.charAt(0)?.toUpperCase() || "E"}
                              </div>
                              <span className="text-sm font-medium">{employee.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-400">{employee.email}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full border border-[#20d6b5]/20 bg-[#20d6b5]/[0.07] px-3 py-1 text-xs font-medium text-[#7cebd4]">
                              {employee.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {canManageProducts && (
          <section className="mb-10">
            <div className="mb-5">
              <h2 className={sectionTitle}>Product management</h2>
              <p className={`mt-1 ${muted}`}>Add inventory, update product details and publish available items.</p>
            </div>
            <div className={`${panelClass} p-5 sm:p-6`}>
              <h3 className="mb-5 font-semibold">Add a product</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Product name</label>
                  <input
                    placeholder="e.g. Work tool"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    placeholder="Short product description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Available stock</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>
              <button
                onClick={createProduct}
                disabled={saving}
                className="mt-5 rounded-xl bg-[#20d6b5] px-5 py-3 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5] disabled:opacity-60"
              >
                {saving ? "Saving..." : "+ Create product"}
              </button>
            </div>
          </section>
        )}

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className={sectionTitle}>Products</h2>
              <p className={`mt-1 ${muted}`}>
                {canManageProducts ? "Manage your organization's inventory." : "Products available to your organization."}
              </p>
            </div>
            <span className="text-xs text-slate-500">{products.length} total</span>
          </div>

          {products.length === 0 ? (
            <div className={`${panelClass} p-10 text-center`}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl text-slate-400">▦</div>
              <p className="font-medium">No products yet</p>
              <p className="mt-1 text-sm text-slate-500">Products added to this organization will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className={`${panelClass} p-5 transition hover:border-[#20d6b5]/25`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#20d6b5]/10 text-xl text-[#20d6b5]">▦</div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      product.is_published
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-slate-400"
                    }`}>
                      {product.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{product.name}</h3>
                  <p className="mt-1 min-h-10 text-sm leading-5 text-slate-400">
                    {product.description || "No description provided."}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="mt-1 font-bold">₹{Number(product.price).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="text-xs text-slate-500">Stock</p>
                      <p className={`mt-1 font-bold ${Number(product.stock) <= 5 ? "text-amber-300" : "text-white"}`}>
                        {product.stock} units
                      </p>
                    </div>
                  </div>

                  {canManageProducts && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setEditingProduct({
                          id: product.id,
                          name: product.name,
                          description: product.description || "",
                          price: product.price,
                          stock: product.stock,
                        })}
                        className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#20d6b5]/40 hover:text-[#4fe0b5]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="flex-1 rounded-xl border border-red-400/20 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {canManageProducts && !product.is_published && Number(product.stock) > 0 && (
                    <button
                      onClick={() => publishProduct(product.id)}
                      className="mt-3 w-full rounded-xl bg-[#20d6b5] py-2.5 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5]"
                    >
                      Publish product
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {canManageOrders && (
          <section className="mb-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className={sectionTitle}>Order management</h2>
                <p className={`mt-1 ${muted}`}>Track customer orders and progress deliveries.</p>
              </div>
              <span className="text-xs text-slate-500">{orders.length} total</span>
            </div>

            {orders.length === 0 ? (
              <div className={`${panelClass} p-10 text-center`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl text-slate-400">↗</div>
                <p className="font-medium">No orders yet</p>
                <p className="mt-1 text-sm text-slate-500">Customer orders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <article key={order.id} className={`${panelClass} p-5 sm:p-6`}>
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-lg text-indigo-300">↗</div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Order #{order.id}</p>
                          <h3 className="mt-1 font-semibold">{order.customer_name || "Customer"}</h3>
                          <p className="mt-1 text-sm text-slate-400">{order.email}</p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xl font-bold">₹{Number(order.total_amount).toFixed(2)}</p>
                        <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          order.status === "DELIVERED"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : order.status === "SHIPPED"
                              ? "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"
                              : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-white/[0.07] pt-4">
                      {order.status === "ORDERED" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "SHIPPED")}
                          className="rounded-xl bg-[#20d6b5] px-4 py-2.5 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5]"
                        >
                          Mark as shipped →
                        </button>
                      )}
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                          className="rounded-xl bg-[#20d6b5] px-4 py-2.5 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5]"
                        >
                          Mark as delivered →
                        </button>
                      )}
                      {order.status === "DELIVERED" && (
                        <p className="text-sm font-medium text-emerald-300">✓ Order successfully delivered</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-[#20d6b5]/20 bg-[#0d1214] p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#4fe0b5]">INVENTORY</p>
                <h2 className="mt-2 text-2xl font-bold">Edit product</h2>
                <p className="mt-1 text-sm text-slate-400">Update the product details below.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-lg px-2 text-2xl text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Close edit product"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Product name</label>
                <input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className={fieldClass}
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className={fieldClass}
                  placeholder="Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className={fieldClass}
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className={fieldClass}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={updateProduct}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#20d6b5] py-3 text-sm font-bold text-[#06100e] transition hover:bg-[#4fe0b5] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}