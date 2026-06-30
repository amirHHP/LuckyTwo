"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در ارسال کد");
        return;
      }

      setDevOtp(data.devOtp || null);
      setStep("otp");
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در تأیید کد");
        return;
      }

      const user = data.user;

      // Route based on role and onboarding status
      if (user.role === "admin") {
        router.push("/admin");
      } else if (
        !user.firstName ||
        !user.gender ||
        !user.mbtiType ||
        !user.selfieUrl ||
        user.selfieStatus === "REJECTED"
      ) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card-strong">
        <div className="auth-header">
          <div className="auth-logo">💕</div>
          <h1>ورود به LuckyTwo</h1>
          <p>با ایمیل وارد شوید یا ثبت‌نام کنید</p>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px",
            background: "var(--danger-soft)",
            border: "1px solid rgba(214, 48, 49, 0.3)",
            borderRadius: "var(--radius-md)",
            color: "var(--danger)",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {step === "email" ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="input-group">
              <label htmlFor="email-input">آدرس ایمیل</label>
              <input
                id="email-input"
                className="input"
                type="email"
                placeholder="you@example.com"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !email}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "ارسال کد تأیید"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            {devOtp && (
              <div className="otp-display">
                <div>🔑 کد تأیید (حالت توسعه)</div>
                <div className="otp-code">{devOtp}</div>
              </div>
            )}
            <div className="input-group">
              <label htmlFor="otp-input">کد تأیید ۶ رقمی</label>
              <input
                id="otp-input"
                className="input"
                type="text"
                placeholder="۱۲۳۴۵۶"
                dir="ltr"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoFocus
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace" }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || otpCode.length < 6}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "تأیید و ورود"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => { setStep("email"); setOtpCode(""); setDevOtp(null); setError(null); }}
            >
              تغییر ایمیل
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
