"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminMatchesPage() {
  const [searchingUsers, setSearchingUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineLoading, setEngineLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMatchingData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/matching");
      if (res.ok) {
        const data = await res.json();
        setSearchingUsers(data.searchingUsers || []);
        setMatches(data.matches || []);
      }
    } catch {
      showToast("error", "خطا در بارگذاری اطلاعات قرارهای ملاقات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchingData();
  }, []);

  const triggerMatchmaking = async () => {
    setEngineLoading(true);
    try {
      const res = await fetch("/api/admin/matching", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        showToast("success", `موتور مچ‌میکینگ اجرا شد. ${data.matchesCreated} مچ جدید ایجاد شد.`);
        fetchMatchingData();
      } else {
        showToast("error", data.error || "خطا در اجرای مچ‌میکینگ");
      }
    } catch {
      showToast("error", "خطای شبکه در اتصال به موتور مچ‌میکینگ");
    } finally {
      setEngineLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>🤝 مدیریت مچ‌میکینگ و قرارهای ملاقات</h1>
          <p>لیست کاربران در صف انتظار و قرارهای ملاقات هماهنگ شده</p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          disabled={engineLoading || searchingUsers.length === 0}
          onClick={triggerMatchmaking}
        >
          {engineLoading ? "در حال مچ کردن..." : "⚡ اجرای موتور مچ‌میکینگ"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        
        {/* Waiting List Queue */}
        <div className="glass-card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
            <span>👥 صف انتظار مچ‌میکینگ</span>
            <span className="badge badge-accent">{searchingUsers.length} کاربر</span>
          </h2>

          {searchingUsers.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
              کاربری در صف انتظار وجود ندارد.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>جنسیت</th>
                    <th>ایمیل</th>
                    <th>تایپ MBTI</th>
                    <th>مناطق انتخابی</th>
                    <th>مدت زمان انتظار</th>
                  </tr>
                </thead>
                <tbody>
                  {searchingUsers.map((u) => {
                    const durationMs = Date.now() - new Date(u.searchingSince || u.createdAt).getTime();
                    const hours = Math.floor(durationMs / (1000 * 60 * 60));
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link href={`/admin/users/${u.id}`}>{u.firstName}</Link>
                        </td>
                        <td>{u.gender === "MALE" ? "پسر" : "دختر"}</td>
                        <td>{u.email}</td>
                        <td><span className="badge badge-info">{u.mbtiType}</span></td>
                        <td>{JSON.parse(u.zones || "[]").join(" ، ")}</td>
                        <td>
                          <span className={`badge ${hours >= 48 ? "badge-danger" : "badge-accent"}`}>
                            {hours} ساعت
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Existing Matches */}
        <div className="glass-card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
            <span>📜 قرارهای ملاقات ثبت شده</span>
            <span className="badge badge-success">{matches.length} قرار</span>
          </h2>

          {matches.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
              هنوز هیچ قراری ثبت نشده است.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>آقا (پسر)</th>
                    <th>خانم (دختر)</th>
                    <th>کافه ملاقات</th>
                    <th>سازگاری</th>
                    <th>وضعیت قرار</th>
                    <th>زمان پیشنهادی/نهایی</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          <Link href={`/admin/users/${m.male?.id}`}>{m.male?.firstName}</Link>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{m.male?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          <Link href={`/admin/users/${m.female?.id}`}>{m.female?.firstName}</Link>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{m.female?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.cafe?.name || "مشخص نشده"}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>منطقه {m.cafe?.zone}</div>
                      </td>
                      <td>
                        <span className="badge badge-accent">{m.compatibilityScore}%</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          m.status === "SCHEDULE_CONFIRMED" ? "badge-success" :
                          m.status === "SCHEDULE_PENDING" ? "badge-warning" :
                          m.status === "CANCELLED" ? "badge-danger" :
                          m.status === "NO_SHOW" ? "badge-danger" :
                          m.status === "COMPLETED" ? "badge-success" : "badge-info"
                        }`}>
                          {m.status === "SCHEDULE_CONFIRMED" ? "قفل شده" :
                           m.status === "SCHEDULE_PENDING" ? "در انتظار تایید" :
                           m.status === "CANCELLED" ? "لغو شده" :
                           m.status === "NO_SHOW" ? "عدم حضور" :
                           m.status === "COMPLETED" ? "تکمیل شده" : m.status}
                        </span>
                      </td>
                      <td>
                        {m.timeSlotSelected ? (
                          <div style={{ fontSize: "0.8rem" }}>
                            {new Date(m.timeSlotSelected).toLocaleDateString("fa-IR")}
                            {" — "}
                            {new Date(m.timeSlotSelected).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>تعیین نشده</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
