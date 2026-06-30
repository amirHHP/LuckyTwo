"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatUsd } from "@/lib/wallet";

const SELFIE_STATUS: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "در انتظار تأیید", badge: "badge-warning" },
  APPROVED: { label: "تأیید شده", badge: "badge-success" },
  REJECTED: { label: "رد شده", badge: "badge-danger" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const fetchUsers = async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <div>
      <div className="page-header">
        <h1>👤 مدیریت کاربران</h1>
        <p>لیست کاربران و مشاهده پروفایل، سلفی و تاریخچه فعالیت‌ها</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          className="input"
          placeholder="جستجو با نام یا ایمیل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <button type="submit" className="btn btn-primary">جستجو</button>
        {query && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(""); setQuery(""); }}>
            پاک کردن
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">👤</span>
          <span className="empty-text">کاربری یافت نشد.</span>
        </div>
      ) : (
        <div className="glass-card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>ایمیل</th>
                <th>جنسیت</th>
                <th>سلفی</th>
                <th>MBTI</th>
                <th>موجودی</th>
                <th>تاریخ عضویت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const selfie = SELFIE_STATUS[user.selfieStatus] ?? SELFIE_STATUS.PENDING;
                return (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.firstName || "—"}</td>
                    <td>{user.email}</td>
                    <td>{user.gender === "MALE" ? "پسر" : user.gender === "FEMALE" ? "دختر" : "—"}</td>
                    <td>
                      <span className={`badge ${selfie.badge}`}>{selfie.label}</span>
                    </td>
                    <td>{user.mbtiType ? <span className="badge badge-info">{user.mbtiType}</span> : "—"}</td>
                    <td>{formatUsd(user.walletBalance ?? 0)}</td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td>
                      <Link href={`/admin/users/${user.id}`} className="btn btn-ghost btn-sm">
                        مشاهده پروفایل
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
