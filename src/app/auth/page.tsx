"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMethod = "otp" | "password";
type PasswordMode = "login" | "register";

type AuthUser = {
  role: string;
  firstName?: string | null;
  gender?: string | null;
  mbtiType?: string | null;
  selfieUrl?: string | null;
  selfieStatus?: string | null;
};

function routeAfterAuth(router: ReturnType<typeof useRouter>, user: AuthUser) {
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
}

export default function AuthPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>("otp");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("login");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetErrors = () => setError(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();
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
    resetErrors();
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

      routeAfterAuth(router, data.user);
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (passwordMode === "register" && password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        passwordMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در احراز هویت");
        return;
      }

      routeAfterAuth(router, data.user);
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setStep("email");
    setOtpCode("");
    setDevOtp(null);
    setPassword("");
    setConfirmPassword("");
    resetErrors();
  };

  const switchPasswordMode = (mode: PasswordMode) => {
    setPasswordMode(mode);
    setPassword("");
    setConfirmPassword("");
    resetErrors();
  };

  const passwordSubmitDisabled =
    loading ||
    !email ||
    !password ||
    (passwordMode === "register" && password !== confirmPassword);

  return (
    <div className="auth-page">
      <div className="auth-card glass-card-strong">
        <div className="auth-header">
          <div className="auth-logo">💕</div>
          <h1>ورود به LuckyTwo</h1>
          <p>با ایمیل وارد شوید یا ثبت‌نام کنید</p>
        </div>

        <div className="auth-method-tabs">
          <button
            type="button"
            className={`auth-method-tab ${authMethod === "otp" ? "active" : ""}`}
            onClick={() => switchAuthMethod("otp")}
          >
            کد ایمیل
          </button>
          <button
            type="button"
            className={`auth-method-tab ${authMethod === "password" ? "active" : ""}`}
            onClick={() => switchAuthMethod("password")}
          >
            ایمیل و رمز
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--danger-soft)",
              border: "1px solid rgba(214, 48, 49, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {authMethod === "otp" ? (
          step === "email" ? (
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
                {loading ? (
                  <span
                    className="spinner"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />
                ) : (
                  "ارسال کد تأیید"
                )}
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
                  style={{
                    textAlign: "center",
                    letterSpacing: "8px",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? (
                  <span
                    className="spinner"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />
                ) : (
                  "تأیید و ورود"
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setStep("email");
                  setOtpCode("");
                  setDevOtp(null);
                  resetErrors();
                }}
              >
                تغییر ایمیل
              </button>
            </form>
          )
        ) : (
          <>
            <div className="auth-password-toggle">
              <button
                type="button"
                className={passwordMode === "login" ? "active" : ""}
                onClick={() => switchPasswordMode("login")}
              >
                ورود
              </button>
              <button
                type="button"
                className={passwordMode === "register" ? "active" : ""}
                onClick={() => switchPasswordMode("register")}
              >
                ثبت‌نام
              </button>
            </div>

            <form className="auth-form" onSubmit={handlePasswordAuth}>
              <div className="input-group">
                <label htmlFor="password-email-input">آدرس ایمیل</label>
                <input
                  id="password-email-input"
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
              <div className="input-group">
                <label htmlFor="password-input">رمز عبور</label>
                <input
                  id="password-input"
                  className="input"
                  type="password"
                  placeholder="حداقل ۸ کاراکتر"
                  dir="ltr"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {passwordMode === "register" && (
                <div className="input-group">
                  <label htmlFor="confirm-password-input">تکرار رمز عبور</label>
                  <input
                    id="confirm-password-input"
                    className="input"
                    type="password"
                    placeholder="رمز عبور را دوباره وارد کنید"
                    dir="ltr"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={passwordSubmitDisabled}
              >
                {loading ? (
                  <span
                    className="spinner"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />
                ) : passwordMode === "register" ? (
                  "ثبت‌نام"
                ) : (
                  "ورود"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
