"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminSelfiesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPendingSelfies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/selfies");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      showToast("error", "خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSelfies();
  }, []);

  const handleSelfieAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/selfies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("success", data.message);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        showToast("error", data.error || "عملیات با خطا مواجه شد");
      }
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📸 تأیید سلفی‌ها و احراز هویت</h1>
        <p>در این صفحه می‌توانید سلفی‌های بارگذاری شده کاربران را تأیید یا رد کنید</p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">📷</span>
          <span className="empty-text">هیچ سلفی در انتظار تأییدی در صف وجود ندارد.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {users.map((user) => (
            <div key={user.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
              <div style={{ position: "relative", width: "100%", height: "240px", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-secondary)" }}>
                {user.selfieUrl ? (
                  <img
                    src={user.selfieUrl}
                    alt={`Selfie of ${user.firstName}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                    تصویر یافت نشد
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                  <Link href={`/admin/users/${user.id}`} style={{ color: "inherit" }}>
                    {user.firstName || "بدون نام"}
                  </Link>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>ایمیل: {user.email}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>سن: {user.age} سال • جنسیت: {user.gender === "MALE" ? "پسر" : "دختر"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>شغل: {user.occupation || "—"}</div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <Link href={`/admin/users/${user.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: "center" }}>
                  پروفایل
                </Link>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={actionLoading === user.id}
                  onClick={() => handleSelfieAction(user.id, "approve")}
                >
                  {actionLoading === user.id ? "..." : "تأیید سلفی"}
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={actionLoading === user.id}
                  onClick={() => handleSelfieAction(user.id, "reject")}
                >
                  {actionLoading === user.id ? "..." : "رد سلفی"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
