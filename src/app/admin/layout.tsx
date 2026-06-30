"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth");
          return;
        }
        const data = await res.json();
        if (data.user.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setAdminUser(data.user);
      } catch {
        router.push("/auth");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!adminUser) return null;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-brand">پنل مدیریت LuckyTwo</div>
          <span className="badge badge-accent admin-badge">{adminUser.firstName}</span>
        </div>
        <nav>
          <Link href="/admin" className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}>
            <span className="link-icon">📊</span>
            <span>داشبورد اصلی</span>
          </Link>
          <Link href="/admin/users" className={`sidebar-link ${pathname.startsWith("/admin/users") ? "active" : ""}`}>
            <span className="link-icon">👤</span>
            <span>مدیریت کاربران</span>
          </Link>
          <Link href="/admin/selfies" className={`sidebar-link ${pathname === "/admin/selfies" ? "active" : ""}`}>
            <span className="link-icon">📸</span>
            <span>تأیید سلفی‌ها</span>
          </Link>
          <Link href="/admin/matches" className={`sidebar-link ${pathname === "/admin/matches" ? "active" : ""}`}>
            <span className="link-icon">🤝</span>
            <span>مدیریت قرارهای ملاقات</span>
          </Link>
          <Link href="/admin/cafes" className={`sidebar-link ${pathname === "/admin/cafes" ? "active" : ""}`}>
            <span className="link-icon">☕</span>
            <span>مدیریت کافه‌ها</span>
          </Link>
          <Link href="/admin/time" className={`sidebar-link ${pathname === "/admin/time" ? "active" : ""}`}>
            <span className="link-icon">⏳</span>
            <span>شبیه‌ساز زمان (تایم‌تراول)</span>
          </Link>
          
          <div style={{ marginTop: "auto", padding: "16px 8px 0" }}>
            <button className="btn btn-ghost btn-block" onClick={handleLogout}>
              🚪 خروج از پنل ادمین
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
