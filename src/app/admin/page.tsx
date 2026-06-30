"use client";

import React, { useState, useEffect } from "react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    pendingSelfiesCount: 0,
    searchingUsersCount: 0,
    activeMatchesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [selfiesRes, matchesRes] = await Promise.all([
          fetch("/api/admin/selfies"),
          fetch("/api/admin/matching"),
        ]);

        if (selfiesRes.ok && matchesRes.ok) {
          const selfiesData = await selfiesRes.json();
          const matchesData = await matchesRes.json();

          setStats({
            pendingSelfiesCount: selfiesData.users?.length || 0,
            searchingUsersCount: matchesData.searchingUsers?.length || 0,
            activeMatchesCount: matchesData.matches?.length || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📊 داشبورد اصلی مدیریت</h1>
        <p>وضعیت کلی سیستم و صف کاربران را مشاهده و مدیریت کنید</p>
      </div>

      <div className="admin-stats-grid">
        <div className="glass-card admin-stat">
          <div className="stat-number">{stats.pendingSelfiesCount}</div>
          <div className="stat-label">سلفی‌های در انتظار تایید</div>
        </div>
        <div className="glass-card admin-stat">
          <div className="stat-number">{stats.searchingUsersCount}</div>
          <div className="stat-label">کاربران فعال در صف مچ‌میکینگ</div>
        </div>
        <div className="glass-card admin-stat">
          <div className="stat-number">{stats.activeMatchesCount}</div>
          <div className="stat-label">مچ‌ها و قرارهای ثبت شده</div>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>راهنمای کار ادمین:</h3>
        <ul style={{ paddingRight: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <li>در بخش <strong>تأیید سلفی‌ها</strong> می‌توانید سلفی‌های بارگذاری شده توسط کاربران را تایید یا رد کنید تا بتوانند در صف قرارهای بلایند دیت شرکت کنند.</li>
          <li>در بخش <strong>مدیریت قرارهای ملاقات</strong> می‌توانید موتور مچ‌میکینگ را به صورت دستی اجرا کنید تا کاربران سازگار را به هم مچ کند.</li>
          <li>در بخش <strong>شبیه‌ساز زمان (تایم‌تراول)</strong> می‌توانید ساعت سیستم را در محیط لوکال به عقب یا جلو ببرید تا باز شدن چت، افشا شدن اطلاعات و حذف خودکار چت پس از زمان ملاقات را تست کنید.</li>
        </ul>
      </div>
    </div>
  );
}
