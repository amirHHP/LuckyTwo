"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { formatUsd } from "@/lib/wallet";

const ACTIVITY_ICONS: Record<string, string> = {
  ACCOUNT_CREATED: "🆕",
  LOGIN: "🔑",
  PROFILE_UPDATED: "📝",
  SELFIE_UPLOADED: "📸",
  SELFIE_APPROVED: "✅",
  SELFIE_REJECTED: "❌",
  QUIZ_COMPLETED: "🧠",
  SEARCH_STARTED: "🔍",
  MATCH_CREATED: "💕",
  SCHEDULE_PROPOSED: "📅",
  SCHEDULE_CONFIRMED: "🔒",
  MATCH_CANCELLED: "🚫",
  MATCH_COMPLETED: "✅",
  MATCH_NO_SHOW: "🚫",
  NO_SHOW_PENALTY: "💸",
  WALLET_DEPOSIT: "💰",
  CRYPTO_DEPOSIT_CREATED: "🪙",
  CRYPTO_DEPOSIT_COMPLETED: "✅",
  CRYPTO_DEPOSIT_FAILED: "⚠️",
  MESSAGE_SENT: "💬",
  CLOTHING_UPDATED: "👕",
};

const SELFIE_STATUS: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "در انتظار تأیید", badge: "badge-warning" },
  APPROVED: { label: "تأیید شده", badge: "badge-success" },
  REJECTED: { label: "رد شده", badge: "badge-danger" },
};

export default function AdminUserProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.status === 404) {
        router.push("/admin/users");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setActivities(data.activities || []);
      }
    } catch {
      showToast("error", "خطا در بارگذاری پروفایل");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleSelfieAction = async (action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/selfies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message);
        fetchProfile();
      } else {
        showToast("error", data.error || "عملیات با خطا مواجه شد");
      }
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  if (!user) return null;

  const selfieStatus = SELFIE_STATUS[user.selfieStatus] ?? SELFIE_STATUS.PENDING;
  const interests: string[] = JSON.parse(user.interests || "[]");
  const zones: string[] = JSON.parse(user.zones || "[]");
  const allMatches = [
    ...user.matchesAsMale.map((m: any) => ({ ...m, partner: m.female, role: "male" })),
    ...user.matchesAsFemale.map((m: any) => ({ ...m, partner: m.male, role: "female" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/users" className="btn btn-ghost btn-sm">← بازگشت به لیست کاربران</Link>
      </div>

      <div className="page-header">
        <h1>{user.firstName || "کاربر"} — پروفایل</h1>
        <p>{user.email}</p>
      </div>

      <div className="admin-profile-grid">
        {/* Selfie + profile card */}
        <div className="glass-card admin-profile-selfie">
          <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>سلفی و احراز هویت</h3>
          <div className="admin-selfie-frame">
            {user.selfieUrl ? (
              <img src={user.selfieUrl} alt={`سلفی ${user.firstName}`} />
            ) : (
              <div className="admin-selfie-empty">سلفی بارگذاری نشده</div>
            )}
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span className={`badge ${selfieStatus.badge}`}>{selfieStatus.label}</span>
            {user.isVerified && <span className="badge badge-success">احراز هویت شده</span>}
          </div>
          {user.selfieStatus === "PENDING" && user.selfieUrl && (
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button className="btn btn-success" style={{ flex: 1 }} disabled={actionLoading} onClick={() => handleSelfieAction("approve")}>
                تأیید سلفی
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} disabled={actionLoading} onClick={() => handleSelfieAction("reject")}>
                رد سلفی
              </button>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="glass-card admin-profile-info">
          <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>اطلاعات پروفایل</h3>
          <dl className="profile-dl">
            <div><dt>نام</dt><dd>{user.firstName || "—"}</dd></div>
            <div><dt>سن</dt><dd>{user.age ? `${user.age} سال` : "—"}</dd></div>
            <div><dt>جنسیت</dt><dd>{user.gender === "MALE" ? "پسر" : user.gender === "FEMALE" ? "دختر" : "—"}</dd></div>
            <div><dt>قد</dt><dd>{user.height ? `${user.height} cm` : "—"}</dd></div>
            <div><dt>شغل</dt><dd>{user.occupation || "—"}</dd></div>
            <div><dt>MBTI</dt><dd>{user.mbtiType || "—"}</dd></div>
            <div><dt>موجودی کیف پول</dt><dd>{formatUsd(user.walletBalance ?? 0)}</dd></div>
            <div><dt>وضعیت جستجو</dt><dd>{user.isSearching ? "در صف مچ‌میکینگ" : "غیرفعال"}</dd></div>
            <div><dt>تاریخ عضویت</dt><dd>{new Date(user.createdAt).toLocaleString("fa-IR")}</dd></div>
            <div><dt>علاقه‌مندی‌ها</dt><dd>{interests.length ? interests.join("، ") : "—"}</dd></div>
            <div><dt>مناطق</dt><dd>{zones.length ? zones.join("، ") : "—"}</dd></div>
            {user.clothing && <div><dt>پوشش</dt><dd>{user.clothing}</dd></div>}
          </dl>
        </div>
      </div>

      {/* Matches summary */}
      {allMatches.length > 0 && (
        <div className="glass-card" style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>قرارهای ملاقات ({allMatches.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {allMatches.map((m) => (
              <div key={m.id} style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 600 }}>
                  با {m.partner?.firstName ?? "—"}
                  {m.partner?.id && (
                    <Link href={`/admin/users/${m.partner.id}`} style={{ marginRight: "8px", fontSize: "0.75rem" }}>
                      (مشاهده پروفایل)
                    </Link>
                  )}
                </div>
                <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                  {m.cafe?.name ?? "کافه نامشخص"} — {m.status} — سازگاری {m.compatibilityScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div className="glass-card" style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>تاریخچه فعالیت‌ها</h3>
        {activities.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "16px 0" }}>
            هنوز فعالیتی ثبت نشده است.
          </p>
        ) : (
          <div className="activity-timeline">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{ACTIVITY_ICONS[activity.type] ?? "•"}</div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  {activity.detail && (
                    <div className="activity-detail">{activity.detail}</div>
                  )}
                  <div className="activity-time">
                    {new Date(activity.createdAt).toLocaleString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
