"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Wallet
  const [depositAmount, setDepositAmount] = useState("200000");
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositCurrency, setDepositCurrency] = useState("usdttrc20");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [activeDeposit, setActiveDeposit] = useState<any>(null);
  const [isMockPayment, setIsMockPayment] = useState(false);

  // Clothing
  const [clothing, setClothing] = useState("");
  const [showClothingEdit, setShowClothingEdit] = useState(false);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [meRes, matchRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/match/status"),
      ]);

      if (!meRes.ok) { router.push("/auth"); return; }

      const meData = await meRes.json();
      setUser(meData.user);

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        setMatch(matchData.match);
      }
    } catch {
      router.push("/auth");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (showDeposit && currencies.length === 0) {
      fetch("/api/wallet/crypto/currencies")
        .then((r) => r.json())
        .then((data) => {
          setCurrencies(data.currencies || []);
          setIsMockPayment(data.isMock);
        })
        .catch(() => {});
    }
  }, [showDeposit, currencies.length]);

  // Poll active crypto deposit status
  useEffect(() => {
    if (!activeDeposit || activeDeposit.status === "COMPLETED" || activeDeposit.status === "FAILED" || activeDeposit.status === "EXPIRED") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/wallet/crypto/${activeDeposit.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setActiveDeposit(data.deposit);
        if (data.deposit.status === "COMPLETED") {
          setUser((u: any) => ({ ...u, walletBalance: data.balance }));
          showToast("success", `${data.deposit.amountTomans.toLocaleString()} تومان به کیف پول اضافه شد`);
        }
      } catch {}
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [activeDeposit]);

  // Auto-refresh match status every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/match/status");
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeposit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/wallet/crypto/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseInt(depositAmount), currency: depositCurrency }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveDeposit(data.deposit);
        setIsMockPayment(data.deposit.isMock);
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const handleSimulatePayment = async () => {
    if (!activeDeposit) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/wallet/crypto/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: activeDeposit.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((u: any) => ({ ...u, walletBalance: data.balance }));
        setActiveDeposit((d: any) => ({ ...d, status: "COMPLETED" }));
        showToast("success", data.message);
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "کپی شد");
  };

  const closeDeposit = () => {
    setShowDeposit(false);
    setActiveDeposit(null);
  };

  const currencyLabel = (code: string) => {
    const c = currencies.find((x) => x.code === code);
    return c ? c.label : code.toUpperCase();
  };

  const handleInitiateMatch = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/match/initiate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        showToast("success", data.message);
        await fetchData();
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const handleSelectSlot = async (slot: string) => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/match/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, action: "select_slot_male", selectedSlot: slot }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message);
        fetchData();
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const handleConfirmSlot = async () => {
    if (!match) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/match/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, action: "confirm_slot_female" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", data.message);
        fetchData();
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const handleSaveClothing = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/match/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clothing }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        showToast("success", data.message);
        setShowClothingEdit(false);
      } else {
        showToast("error", data.error);
      }
    } catch { showToast("error", "خطای شبکه"); }
    finally { setActionLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  };

  if (loading) {
    return <div className="loading-center" style={{ minHeight: "100vh" }}><div className="spinner" /></div>;
  }

  if (!user) return null;

  const fee = user.gender === "MALE" ? 200000 : 50000;
  const canInitiate = user.isVerified && user.selfieStatus === "APPROVED" && user.walletBalance >= fee && !user.isSearching;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Top Nav */}
      <header className="top-nav">
        <div className="logo">
          <span className="logo-icon">💕</span>
          <span>LuckyTwo</span>
        </div>
        <div className="nav-actions">
          <span className="badge badge-accent">{user.firstName}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>خروج</button>
        </div>
      </header>

      <main className="container-md main-content" style={{ padding: "16px 20px" }}>
        {/* Wallet & Profile Stats */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="glass-card stat-card">
            <div className="stat-icon" style={{ background: "var(--accent-soft)" }}>💰</div>
            <div className="stat-info">
              <h3>کیف پول</h3>
              <div className="stat-value">{user.walletBalance.toLocaleString()} <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>تومان</span></div>
            </div>
          </div>
          <div className="glass-card stat-card">
            <div className="stat-icon" style={{ background: "var(--info-soft)" }}>🧠</div>
            <div className="stat-info">
              <h3>تایپ شخصیتی</h3>
              <div className="stat-value">{user.mbtiType || "—"}</div>
            </div>
          </div>
        </div>

        {/* Wallet Actions */}
        <div style={{ marginBottom: "16px" }}>
          {!showDeposit ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowDeposit(true)}>
              ₿ شارژ کیف پول با کریپتو
            </button>
          ) : !activeDeposit ? (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>شارژ با ارز دیجیتال</h3>
                <button className="btn btn-ghost btn-sm" onClick={closeDeposit}>بستن</button>
              </div>

              <div className="input-group">
                <label>مبلغ (تومان)</label>
                <input className="input" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} min={50000} step={50000} />
                <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                  {["200000", "500000", "1000000"].map((amt) => (
                    <button key={amt} className="btn btn-ghost btn-sm" onClick={() => setDepositAmount(amt)} style={{ fontSize: "0.75rem" }}>
                      {parseInt(amt).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>ارز دیجیتال</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {(currencies.length ? currencies : [{ code: "usdttrc20", label: "USDT (TRC20)", icon: "₮" }]).map((c: any) => (
                    <button
                      key={c.code}
                      className={`btn btn-sm ${depositCurrency === c.code ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setDepositCurrency(c.code)}
                      style={{ justifyContent: "center" }}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {isMockPayment && (
                <p style={{ fontSize: "0.75rem", color: "var(--warning)", background: "var(--warning-soft)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                  حالت آزمایشی — برای تست بدون پرداخت واقعی
                </p>
              )}

              <button className="btn btn-primary btn-block" disabled={actionLoading} onClick={handleDeposit}>
                {actionLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "ایجاد فاکتور پرداخت"}
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  {activeDeposit.status === "COMPLETED" ? "✅ پرداخت موفق" : "⏳ در انتظار پرداخت"}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={closeDeposit}>بستن</button>
              </div>

              {activeDeposit.status !== "COMPLETED" && (
                <>
                  <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>مبلغ قابل پرداخت</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-light)" }}>
                      {activeDeposit.payAmount} {currencyLabel(activeDeposit.payCurrency)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      معادل {activeDeposit.amountTomans.toLocaleString()} تومان
                    </div>
                  </div>

                  <div className="glass-card" style={{ background: "var(--bg-glass-strong)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>آدرس واریز</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <code style={{ flex: 1, fontSize: "0.75rem", wordBreak: "break-all", color: "var(--text-primary)" }}>
                        {activeDeposit.payAddress}
                      </code>
                      <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(activeDeposit.payAddress)}>کپی</button>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                    مهلت پرداخت: {new Date(activeDeposit.expiresAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {new Date(activeDeposit.expiresAt).toLocaleDateString("fa-IR")}
                  </div>

                  {activeDeposit.status === "CONFIRMING" && (
                    <div style={{ textAlign: "center" }}>
                      <div className="pulse-ring" style={{ margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "0.8rem", color: "var(--info)" }}>تراکنش دریافت شد — در حال تأیید شبکه</p>
                    </div>
                  )}

                  {isMockPayment && (
                    <button className="btn btn-success btn-block" disabled={actionLoading} onClick={handleSimulatePayment}>
                      تأیید پرداخت آزمایشی
                    </button>
                  )}
                </>
              )}

              {activeDeposit.status === "COMPLETED" && (
                <p style={{ textAlign: "center", color: "var(--success)", fontSize: "0.9rem" }}>
                  {activeDeposit.amountTomans.toLocaleString()} تومان به کیف پول شما اضافه شد
                </p>
              )}

              {(activeDeposit.status === "EXPIRED" || activeDeposit.status === "FAILED") && (
                <p style={{ textAlign: "center", color: "var(--danger)", fontSize: "0.85rem" }}>
                  پرداخت {activeDeposit.status === "EXPIRED" ? "منقضی" : "ناموفق"} شد — دوباره تلاش کنید
                </p>
              )}
            </div>
          )}
        </div>

        {/* Verification Status */}
        {user.selfieStatus === "PENDING" && (
          <div className="glass-card" style={{ marginBottom: "16px", textAlign: "center", padding: "24px" }}>
            <div className="pulse-ring" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>در انتظار تأیید سلفی</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>تیم ما سلفی شما رو بررسی می‌کنه. بعد از تأیید میتونید شروع به جستجوی قرار کنید.</p>
          </div>
        )}

        {user.selfieStatus === "REJECTED" && (
          <div className="glass-card" style={{ marginBottom: "16px", background: "var(--danger-soft)", borderColor: "rgba(214,48,49,0.3)" }}>
            <h3 style={{ color: "var(--danger)", fontSize: "1rem", marginBottom: "4px" }}>⚠️ سلفی رد شد</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>لطفاً یک سلفی واضح‌تر آپلود کنید.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: "8px" }} onClick={() => router.push("/onboarding")}>آپلود مجدد</button>
          </div>
        )}

        {/* Searching State */}
        {user.isSearching && !match && (
          <div className="glass-card" style={{ textAlign: "center", padding: "32px 24px", marginBottom: "16px" }}>
            <div className="pulse-ring" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>در حال جستجوی مچ...</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>صبر کنید تا یه نفر مناسب برای شما پیدا بشه. حداکثر ۴۸ ساعت.</p>
          </div>
        )}

        {/* Initiate Match Button */}
        {!user.isSearching && !match && user.selfieStatus === "APPROVED" && (
          <div className="glass-card" style={{ textAlign: "center", padding: "32px 24px", marginBottom: "16px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>☕</div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>آماده‌اید برای یه قرار بلایند؟</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              هزینه: {fee.toLocaleString()} تومان • موجودی: {user.walletBalance.toLocaleString()} تومان
            </p>
            <button
              className="btn btn-primary btn-lg"
              disabled={!canInitiate || actionLoading}
              onClick={handleInitiateMatch}
            >
              {actionLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "شروع جستجوی مچ 💕"}
            </button>
            {user.walletBalance < fee && (
              <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginTop: "8px" }}>موجودی کافی نیست — ابتدا کیف پول رو شارژ کنید</p>
            )}
          </div>
        )}

        {/* Match Found — Scheduling */}
        {match && match.status === "SCHEDULE_PENDING" && (
          <div className="glass-card match-card" style={{ marginBottom: "16px" }}>
            <div className="match-header">
              <h3>🎉 مچ پیدا شد!</h3>
              <span className="badge badge-accent">امتیاز: {match.compatibilityScore}%</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>منطقه: {match.zone}</p>

            {/* Male selects slot */}
            {match.isMale && !match.timeSlotSelected && (
              <>
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>یه زمان انتخاب کنید:</p>
                <div className="slots-list">
                  {match.timeSlotOptions.map((slot: string, i: number) => (
                    <button
                      key={i}
                      className="slot-item"
                      disabled={actionLoading}
                      onClick={() => handleSelectSlot(slot)}
                    >
                      <span>📅 {new Date(slot).toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(slot).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Male waiting for female */}
            {match.isMale && match.timeSlotSelected && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div className="pulse-ring" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>زمان پیشنهادی ثبت شد — در انتظار تأیید طرف مقابل</p>
              </div>
            )}

            {/* Female confirms slot */}
            {!match.isMale && match.timeSlotSelected && (
              <div>
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>زمان پیشنهادی:</p>
                <div className="glass-card" style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    📅 {new Date(match.timeSlotSelected).toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}
                    {" — "}
                    {new Date(match.timeSlotSelected).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <button className="btn btn-success btn-block" disabled={actionLoading} onClick={handleConfirmSlot}>
                  ✅ تأیید و قفل قرار
                </button>
              </div>
            )}

            {/* Female waiting for male */}
            {!match.isMale && !match.timeSlotSelected && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div className="pulse-ring" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>در انتظار انتخاب زمان توسط طرف مقابل</p>
              </div>
            )}
          </div>
        )}

        {/* Schedule Confirmed — Details */}
        {match && match.status === "SCHEDULE_CONFIRMED" && (
          <div className="glass-card match-card" style={{ marginBottom: "16px" }}>
            <div className="match-header">
              <h3>📋 قرار تأیید شده</h3>
              <span className="badge badge-success">قفل شد</span>
            </div>

            <div className="match-details" style={{ marginBottom: "16px" }}>
              <div className="match-detail-item">
                <span className="detail-label">📅 زمان</span>
                <span className="detail-value">
                  {match.timeSlotSelected
                    ? new Date(match.timeSlotSelected).toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })
                    + " — " + new Date(match.timeSlotSelected).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
              <div className="match-detail-item">
                <span className="detail-label">📍 منطقه</span>
                <span className="detail-value">{match.zone}</span>
              </div>
            </div>

            {/* T-24 Revealed Details */}
            {match.t24Revealed && match.cafeDetails && (
              <>
                <div className="glass-card" style={{ background: "var(--success-soft)", borderColor: "rgba(0,184,148,0.3)", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "8px", color: "var(--success)" }}>☕ محل قرار فاش شد</h4>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "4px" }}>{match.cafeDetails.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{match.cafeDetails.address}</div>
                </div>

                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "8px" }}>🔍 سرنخ‌های ظاهری طرف مقابل</h4>
                <div className="clues-grid">
                  <div className="glass-card clue-item">
                    <div className="clue-emoji">👤</div>
                    <div className="clue-label">نام</div>
                    <div className="clue-value">{match.partnerClues?.firstName || "—"}</div>
                  </div>
                  <div className="glass-card clue-item">
                    <div className="clue-emoji">🎂</div>
                    <div className="clue-label">سن</div>
                    <div className="clue-value">{match.partnerClues?.age || "—"}</div>
                  </div>
                  <div className="glass-card clue-item">
                    <div className="clue-emoji">📏</div>
                    <div className="clue-label">قد</div>
                    <div className="clue-value">{match.partnerClues?.height ? `${match.partnerClues.height} cm` : "—"}</div>
                  </div>
                  <div className="glass-card clue-item">
                    <div className="clue-emoji">👔</div>
                    <div className="clue-label">پوشش</div>
                    <div className="clue-value">{match.partnerClues?.clothing || "—"}</div>
                  </div>
                </div>
              </>
            )}

            {!match.t24Revealed && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔒</div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  جزئیات کافه و سرنخ‌های ظاهری ۲۴ ساعت قبل از قرار فاش میشن
                </p>
              </div>
            )}

            {/* Clothing Editor */}
            <div style={{ marginTop: "16px" }}>
              {!showClothingEdit ? (
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => { setClothing(user.clothing || ""); setShowClothingEdit(true); }}>
                  👔 ویرایش توضیح پوشش من
                </button>
              ) : (
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 500 }}>توضیح لباسی که روز قرار می‌پوشید</label>
                  <input className="input" value={clothing} onChange={e => setClothing(e.target.value)} placeholder="مثلاً یه تیشرت سفید و کلاه مشکی" />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-primary btn-sm" disabled={actionLoading} onClick={handleSaveClothing} style={{ flex: 1 }}>ذخیره</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowClothingEdit(false)}>بستن</button>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Link */}
            {match.chatActive && (
              <Link href={`/chat/${match.id}`} className="btn btn-primary btn-block btn-lg" style={{ marginTop: "16px" }}>
                💬 ورود به چت موقت
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
