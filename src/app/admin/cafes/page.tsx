"use client";

import React, { useState, useEffect } from "react";
import { CAFE_ZONES, SUGGESTED_FEATURES, ZONE_LABELS, type CafeZone } from "@/lib/cafe";

interface Cafe {
  id: string;
  name: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  description: string | null;
  features: string[];
  isVerified: boolean;
}

const emptyForm = {
  name: "",
  zone: "CENTER" as CafeZone,
  address: "",
  lat: "",
  lng: "",
  description: "",
  features: [] as string[],
  isVerified: true,
};

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [featureInput, setFeatureInput] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCafes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cafes");
      if (res.ok) {
        const data = await res.json();
        setCafes(data.cafes || []);
      } else {
        showToast("error", "خطا در بارگذاری کافه‌ها");
      }
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setFeatureInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cafe: Cafe) => {
    setEditingId(cafe.id);
    setForm({
      name: cafe.name,
      zone: cafe.zone as CafeZone,
      address: cafe.address,
      lat: String(cafe.lat),
      lng: String(cafe.lng),
      description: cafe.description || "",
      features: [...cafe.features],
      isVerified: cafe.isVerified,
    });
    setFeatureInput("");
    setShowForm(true);
  };

  const addFeature = (feature: string) => {
    const trimmed = feature.trim();
    if (!trimmed || form.features.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    setFeatureInput("");
  };

  const removeFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      zone: form.zone,
      address: form.address,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      description: form.description || null,
      features: form.features,
      isVerified: form.isVerified,
    };

    try {
      const url = editingId ? `/api/admin/cafes/${editingId}` : "/api/admin/cafes";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("success", data.message);
        resetForm();
        fetchCafes();
      } else {
        showToast("error", data.error || "عملیات با خطا مواجه شد");
      }
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`آیا از حذف «${name}» مطمئن هستید؟`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/cafes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        showToast("success", data.message);
        if (editingId === id) resetForm();
        fetchCafes();
      } else {
        showToast("error", data.error || "حذف با خطا مواجه شد");
      }
    } catch {
      showToast("error", "خطای شبکه");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}
      >
        <div>
          <h1>☕ مدیریت کافه‌ها</h1>
          <p>افزودن، ویرایش و مدیریت کافه‌های همکار با توضیحات و ویژگی‌ها
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
            + افزودن کافه جدید
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
            {editingId ? "✏️ ویرایش کافه" : "➕ افزودن کافه جدید"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div className="input-group">
                <label>نام کافه *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثلاً کافه شمیران"
                  required
                />
              </div>

              <div className="input-group">
                <label>منطقه *</label>
                <select
                  className="input"
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value as CafeZone })}
                  required
                >
                  {CAFE_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {ZONE_LABELS[z]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>آدرس *</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="آدرس کامل کافه"
                  required
                />
              </div>

              <div className="input-group">
                <label>عرض جغرافیایی (Lat) *</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="35.7008"
                  required
                />
              </div>

              <div className="input-group">
                <label>طول جغرافیایی (Lng) *</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="51.4071"
                  required
                />
              </div>

              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label>توضیحات</label>
                <textarea
                  className="input"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="توضیحات درباره فضا، مناسب برای چه نوع قرارهایی، نکات مهم..."
                  style={{ resize: "vertical", minHeight: "100px" }}
                />
              </div>
            </div>

            {/* Features */}
            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                ویژگی‌ها و امکانات
              </label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                {form.features.map((feature) => (
                  <span
                    key={feature}
                    className="tag-chip selected"
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={() => removeFeature(feature)}
                    title="کلیک برای حذف"
                  >
                    {feature} ×
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                  className="input"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature(featureInput);
                    }
                  }}
                  placeholder="ویژگی جدید بنویسید و Enter بزنید"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addFeature(featureInput)}
                >
                  افزودن
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {SUGGESTED_FEATURES.filter((f) => !form.features.includes(f)).map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    className="tag-chip"
                    onClick={() => addFeature(feature)}
                  >
                    + {feature}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="isVerified"
                checked={form.isVerified}
                onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
              />
              <label htmlFor="isVerified" style={{ cursor: "pointer", fontSize: "0.9rem" }}>
                کافه فعال و تأیید‌شده (در مچ‌میکینگ استفاده شود)
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن کافه"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {cafes.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">☕</span>
          <span className="empty-text">هنوز کافه‌ای ثبت نشده. اولین کافه را اضافه کنید.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {cafes.map((cafe) => (
            <div key={cafe.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{cafe.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {ZONE_LABELS[cafe.zone as CafeZone] || cafe.zone}
                  </div>
                </div>
                <span className={`badge ${cafe.isVerified ? "badge-success" : "badge-warning"}`}>
                  {cafe.isVerified ? "فعال" : "غیرفعال"}
                </span>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                📍 {cafe.address}
              </div>

              {cafe.description && (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {cafe.description}
                </div>
              )}

              {cafe.features.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {cafe.features.map((f) => (
                    <span key={f} className="tag-chip selected" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                مختصات: {cafe.lat.toFixed(4)}, {cafe.lng.toFixed(4)}
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => startEdit(cafe)}>
                  ویرایش
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={deletingId === cafe.id}
                  onClick={() => handleDelete(cafe.id, cafe.name)}
                >
                  {deletingId === cafe.id ? "..." : "حذف"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
