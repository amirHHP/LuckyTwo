"use client";

import React, { useState, useEffect } from "react";

type TimeData = {
  simulatedTime: string;
  actualTime?: string;
  offsetHours: number;
  success?: boolean;
};

export default function AdminTimeTravelPage() {
  const [timeData, setTimeData] = useState<TimeData | null>(null);
  const [customOffset, setCustomOffset] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTimeData = async () => {
    try {
      const res = await fetch("/api/admin/time");
      if (res.ok) {
        const data = await res.json();
        setTimeData(data);
        setCustomOffset(String(data.offsetHours || 0));
      }
    } catch {
      showToast("error", "خطا در بارگذاری اطلاعات زمان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeData();
  }, []);

  const handleSetOffset = async (hours: number) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offsetHours: hours }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("success", data.message);
        setTimeData(prev => ({
          ...(prev ?? { simulatedTime: "", offsetHours: 0 }),
          simulatedTime: data.simulatedTime,
          offsetHours: data.offsetHours,
        }));
        setCustomOffset(String(data.offsetHours));
      } else {
        showToast("error", data.error || "خطا در ثبت آفست");
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

  return (
    <div>
      <div className="page-header">
        <h1>⏳ شبیه‌ساز زمان (تایم‌تراول) ادمین</h1>
        <p>برای تست فرآیند ملاقات، ساعت سیستم را به صورت مجازی تغییر دهید</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        
        {/* Clock View */}
        <div className="glass-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", textAlign: "center" }}>
          <div className="glass-card" style={{ background: "var(--accent-soft)" }}>
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>⏰ ساعت مجازی سیستم (شبیه‌سازی شده)</h3>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "monospace" }}>
              {timeData?.simulatedTime ? new Date(timeData.simulatedTime).toLocaleDateString("fa-IR") : "—"}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "monospace", marginTop: "4px", color: "var(--accent-light)" }}>
              {timeData?.simulatedTime ? new Date(timeData.simulatedTime).toLocaleTimeString("fa-IR") : "—"}
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>⏱️ ساعت واقعی دستگاه</h3>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "monospace" }}>
              {new Date().toLocaleDateString("fa-IR")}
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "monospace", marginTop: "4px" }}>
              {new Date().toLocaleTimeString("fa-IR")}
            </div>
          </div>
        </div>

        {/* Adjust controls */}
        <div className="glass-card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>⚙️ تغییر ساعت و روز</h2>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
            <button className="btn btn-secondary" disabled={actionLoading} onClick={() => handleSetOffset(0)}>
              🔄 بازنشانی به زمان واقعی
            </button>
            <button className="btn btn-secondary" disabled={actionLoading} onClick={() => handleSetOffset((timeData?.offsetHours || 0) + 1)}>
              ➕ جلو بردن (۱ ساعت)
            </button>
            <button className="btn btn-secondary" disabled={actionLoading} onClick={() => handleSetOffset((timeData?.offsetHours || 0) + 24)}>
              ➕ جلو بردن (۱ روز)
            </button>
            <button className="btn btn-secondary" disabled={actionLoading} onClick={() => handleSetOffset((timeData?.offsetHours || 0) - 1)}>
              ➖ عقب بردن (۱ ساعت)
            </button>
            <button className="btn btn-secondary" disabled={actionLoading} onClick={() => handleSetOffset((timeData?.offsetHours || 0) - 24)}>
              ➖ عقب بردن (۱ روز)
            </button>
          </div>

          <div className="glass-card" style={{ display: "flex", gap: "10px", alignItems: "flex-end", maxWidth: "400px" }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>آفست ساعت دلخواه (می‌تواند منفی باشد)</label>
              <input
                className="input"
                type="number"
                value={customOffset}
                onChange={e => setCustomOffset(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={actionLoading || customOffset === ""}
              onClick={() => handleSetOffset(parseFloat(customOffset))}
            >
              اعمال آفست
            </button>
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
