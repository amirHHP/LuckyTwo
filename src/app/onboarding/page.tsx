"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SelfieCapture } from "@/components/SelfieCapture";

const MBTI_QUESTIONS = [
  { id: 1, text: "در میهمانی‌ها بیشتر با افراد جدید معاشرت می‌کنید یا با افراد قدیمی هم‌صحبت می‌شوید؟", dim: "EI", optA: "معاشرت با افراد جدید", optB: "صحبت با دوستان قدیمی" },
  { id: 2, text: "معاشرت با دیگران انرژی شما را افزایش می‌دهد یا بعد از آن نیاز به استراحت دارید؟", dim: "EI", optA: "کسب انرژی از جمع", optB: "نیاز به خلوت و استراحت" },
  { id: 3, text: "بیشتر تمایل دارید افکار خود را بلند مطرح کنید یا در ذهن نگه دارید؟", dim: "EI", optA: "بیان بلند افکار", optB: "تفکر درونی و سکوت" },
  { id: 4, text: "در جمع دوست دارید مرکز توجه باشید یا در حاشیه؟", dim: "EI", optA: "مرکز توجه بودن", optB: "حاشیه و تماشاگری" },
  { id: 5, text: "به حقایق واقعی اهمیت می‌دهید یا به ایده‌ها و احتمالات آینده؟", dim: "SN", optA: "حقایق ملموس و حال", optB: "ایده‌ها و احتمالات آینده" },
  { id: 6, text: "خود را فردی واقع‌بین می‌دانید یا خیال‌پرداز؟", dim: "SN", optA: "واقع‌بین و عمل‌گرا", optB: "خیال‌پرداز و خلاق" },
  { id: 7, text: "به جزئیات بیشتر دقت می‌کنید یا به تصویر کلی؟", dim: "SN", optA: "دقت به جزئیات ریز", optB: "توجه به تصویر بزرگ کلی" },
  { id: 8, text: "ترجیح می‌دهید از روش‌های آزموده استفاده کنید یا روش‌های جدید؟", dim: "SN", optA: "روش‌های سنتی و مطمئن", optB: "نوآوری و روش‌های تازه" },
  { id: 9, text: "در تصمیم‌گیری بیشتر منطق را ملاک قرار می‌دهید یا احساسات؟", dim: "TF", optA: "منطق و تحلیل سرد", optB: "احساسات و همدلی قلبی" },
  { id: 10, text: "عدالت و انصاف مهم‌تر است یا مهربانی و صمیمیت؟", dim: "TF", optA: "عدالت و حقیقت", optB: "مهربانی و صمیمیت" },
  { id: 11, text: "سرزنش کردن در زمان خطا درست است یا سعی می‌کنید شرایط احساسی را درک کنید؟", dim: "TF", optA: "برخورد منطقی و نقد کار", optB: "درک احساسات و همراهی" },
  { id: 12, text: "در زمان نقد شدن به درستی نقد توجه می‌کنید یا به لحن گوینده؟", dim: "TF", optA: "ارزیابی محتوای نقد", optB: "توجه به احساس و لحن گوینده" },
  { id: 13, text: "ترجیح می‌دهید برنامه دقیق داشته باشید یا کارها را خودجوش پیش ببرید؟", dim: "JP", optA: "برنامه‌ریزی دقیق و منظم", optB: "انعطاف و کارهای خودجوش" },
  { id: 14, text: "قبل از کارهای مهم زمان‌بندی دارید یا آخرین لحظه تمام می‌کنید؟", dim: "JP", optA: "انجام کارها زودتر از موعد", optB: "انجام کار در لحظه آخر" },
  { id: 15, text: "نظم و چارچوب آرامش می‌دهد یا احساس محدودیت می‌کنید؟", dim: "JP", optA: "نظم و ساختار مشخص", optB: "آزادی و فرار از چارچوب" },
  { id: 16, text: "تمایل دارید کارها را سریع نهایی کنید یا گزینه‌ها را باز نگه دارید؟", dim: "JP", optA: "تصمیم‌گیری و نهایی‌سازی", optB: "باز گذاشتن گزینه‌ها" },
];

const PREDEFINED_INTERESTS = [
  "Camping", "Minimalist", "Tech/Startup", "Gaming",
  "Anime", "Vinyl Music", "Cafe Hopping", "Books",
  "Photography", "Boardgames", "Fitness", "Hiking"
];

const TEHRAN_ZONES = [
  { id: "NORTH", name: "شمال تهران (تجریش، نیاوران)" },
  { id: "CENTER", name: "مرکز تهران (ولیعصر، کریمخان)" },
  { id: "WEST", name: "غرب تهران (شهرک غرب، سعادت‌آباد)" },
  { id: "EAST", name: "شرق تهران (تهرانپارس، نارمک)" },
  { id: "SOUTH", name: "جنوب تهران (شهرری، بازار)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Info, 2: Selfie, 3: Quiz, 4: Interests, 5: Zones
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");

  // Step 2 selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 3 quiz
  const [quizAnswers, setQuizAnswers] = useState<string[]>(Array(16).fill(""));
  const [quizIdx, setQuizIdx] = useState(0);

  // Step 4 interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 5 zones
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  const isFullyOnboarded = (user: {
    firstName?: string | null;
    gender?: string | null;
    mbtiType?: string | null;
    interests?: string | null;
    zones?: string | null;
  }) =>
    Boolean(
      user.firstName &&
        user.gender &&
        user.mbtiType &&
        user.interests !== "[]" &&
        user.zones !== "[]"
    );

  const getPostSelfieStep = (user: {
    mbtiType?: string | null;
    interests?: string | null;
    zones?: string | null;
  }) => {
    if (!user.mbtiType) return 3;
    const interests = JSON.parse(user.interests || "[]");
    if (interests.length !== 5) return 4;
    return 5;
  };

  // Check if user is logged in and has completed onboarding
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth");
          return;
        }
        const data = await res.json();
        const user = data.user;

        // If already fully onboarded (and selfie not rejected), redirect to dashboard
        if (isFullyOnboarded(user) && user.selfieStatus !== "REJECTED" && user.selfieUrl) {
          router.push("/dashboard");
          return;
        }

        // Pre-fill existing fields
        if (user.firstName) setFirstName(user.firstName);
        if (user.age) setAge(String(user.age));
        if (user.occupation) setOccupation(user.occupation);
        if (user.gender) setGender(user.gender);
        if (user.height) setHeight(String(user.height));

        // Determine which step to start from
        if (!user.firstName || !user.gender) {
          setStep(1);
        } else if (!user.selfieUrl || user.selfieStatus === "REJECTED") {
          setStep(2);
        } else if (!user.mbtiType) {
          setStep(3);
        } else {
          const interests = JSON.parse(user.interests || "[]");
          if (interests.length !== 5) {
            setStep(4);
          } else {
            setStep(5);
          }
        }
      } catch {
        router.push("/auth");
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  const totalSteps = 5;

  const handleProfileSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, age, occupation, gender, height }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(2);
    } catch { setError("خطای شبکه"); }
    finally { setLoading(false); }
  };

  const handleSelfieUpload = async () => {
    if (!selfieFile) return;
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("selfie", selfieFile);
      const res = await fetch("/api/profile/selfie", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const user = data.user;
      if (isFullyOnboarded(user)) {
        router.push("/dashboard");
      } else {
        setStep(getPostSelfieStep(user));
      }
    } catch { setError("خطای شبکه"); }
    finally { setLoading(false); }
  };

  const handleQuizSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: quizAnswers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(4);
    } catch { setError("خطای شبکه"); }
    finally { setLoading(false); }
  };

  const handleInterestsSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selectedInterests }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(5);
    } catch { setError("خطای شبکه"); }
    finally { setLoading(false); }
  };

  const handleZonesSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones: selectedZones }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/dashboard");
    } catch { setError("خطای شبکه"); }
    finally { setLoading(false); }
  };

  const handleSelfieCapture = (file: File, previewUrl: string) => {
    setSelfieFile(file);
    setSelfiePreview(previewUrl);
  };

  const handleSelfieClear = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) :
      prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const toggleZone = (zone: string) => {
    setSelectedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) :
      prev.length < 3 ? [...prev, zone] : prev
    );
  };

  if (checking) {
    return <div className="loading-center" style={{ minHeight: "100vh" }}><div className="spinner" /></div>;
  }

  return (
    <div className="onboarding-page container-sm">
      {/* Progress Bar */}
      <div className="onboarding-progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`progress-dot ${i + 1 === step ? "active" : ""} ${i + 1 < step ? "completed" : ""}`}
          />
        ))}
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

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <div className="onboarding-step">
          <h2 className="step-title">اطلاعات شخصی</h2>
          <p className="step-subtitle">این اطلاعات به کسی نمایش داده نمیشه — فقط برای مچ‌میکینگ استفاده میشه</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="input-group">
              <label>نام</label>
              <input className="input" placeholder="مثلاً سارا" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="input-group">
                <label>سن</label>
                <input className="input" type="number" placeholder="۲۵" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="input-group">
                <label>قد (cm)</label>
                <input className="input" type="number" placeholder="۱۷۰" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label>شغل / رشته تحصیلی</label>
              <input className="input" placeholder="مثلاً طراح محصول" value={occupation} onChange={e => setOccupation(e.target.value)} />
            </div>

            <div className="input-group">
              <label>جنسیت</label>
              <div className="gender-select">
                <button
                  type="button"
                  className={`gender-option ${gender === "MALE" ? "selected" : ""}`}
                  onClick={() => setGender("MALE")}
                >
                  <span className="gender-icon">👨</span>
                  <span className="gender-label">پسر</span>
                </button>
                <button
                  type="button"
                  className={`gender-option ${gender === "FEMALE" ? "selected" : ""}`}
                  onClick={() => setGender("FEMALE")}
                >
                  <span className="gender-icon">👩</span>
                  <span className="gender-label">دختر</span>
                </button>
              </div>
            </div>
          </div>

          <div className="step-actions">
            <button
              className="btn btn-primary btn-block btn-lg"
              disabled={!firstName || !age || !gender || loading}
              onClick={handleProfileSave}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "مرحله بعد"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Selfie Upload */}
      {step === 2 && (
        <div className="onboarding-step">
          <h2 className="step-title">تأیید هویت</h2>
          <p className="step-subtitle">یه سلفی واضح آپلود کنید — این عکس فقط برای تأیید هویت توسط تیم ماست و به کسی نشون داده نمیشه</p>

          <SelfieCapture
            preview={selfiePreview}
            onCapture={handleSelfieCapture}
            onClear={handleSelfieClear}
          />

          <div className="step-actions">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>بازگشت</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={!selfieFile || loading}
              onClick={handleSelfieUpload}
              style={{ flex: 2 }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "بارگذاری و ادامه"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: MBTI Quiz */}
      {step === 3 && (
        <div className="onboarding-step">
          <h2 className="step-title">تست شخصیت‌شناسی</h2>
          <p className="step-subtitle">به ۱۶ سوال پاسخ بدید تا تایپ شخصیتی MBTI شما مشخص بشه</p>

          <div className="glass-card quiz-card">
            <div className="quiz-number">سوال {quizIdx + 1} از {MBTI_QUESTIONS.length}</div>
            <div className="quiz-question">{MBTI_QUESTIONS[quizIdx].text}</div>
            <div className="quiz-options">
              <button
                className={`quiz-option ${quizAnswers[quizIdx] === "A" ? "selected" : ""}`}
                onClick={() => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[quizIdx] = "A";
                  setQuizAnswers(newAnswers);
                }}
              >
                <span className="option-letter">A</span>
                <span>{MBTI_QUESTIONS[quizIdx].optA}</span>
              </button>
              <button
                className={`quiz-option ${quizAnswers[quizIdx] === "B" ? "selected" : ""}`}
                onClick={() => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[quizIdx] = "B";
                  setQuizAnswers(newAnswers);
                }}
              >
                <span className="option-letter">B</span>
                <span>{MBTI_QUESTIONS[quizIdx].optB}</span>
              </button>
            </div>
          </div>

          <div className="step-actions">
            <button
              className="btn btn-ghost"
              disabled={quizIdx === 0}
              onClick={() => setQuizIdx(Math.max(0, quizIdx - 1))}
            >
              قبلی
            </button>
            {quizIdx < 15 ? (
              <button
                className="btn btn-primary btn-lg"
                disabled={!quizAnswers[quizIdx]}
                onClick={() => setQuizIdx(quizIdx + 1)}
                style={{ flex: 2 }}
              >
                بعدی
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                disabled={quizAnswers.some(a => !a) || loading}
                onClick={handleQuizSubmit}
                style={{ flex: 2 }}
              >
                {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "ثبت نتیجه"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Interests */}
      {step === 4 && (
        <div className="onboarding-step">
          <h2 className="step-title">علاقه‌مندی‌ها</h2>
          <p className="step-subtitle">دقیقاً ۵ مورد انتخاب کنید — {selectedInterests.length} از ۵</p>

          <div className="tags-grid">
            {PREDEFINED_INTERESTS.map(tag => (
              <button
                key={tag}
                className={`tag-chip ${selectedInterests.includes(tag) ? "selected" : ""}`}
                onClick={() => toggleInterest(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="step-actions">
            <button className="btn btn-ghost" onClick={() => setStep(3)}>بازگشت</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={selectedInterests.length !== 5 || loading}
              onClick={handleInterestsSave}
              style={{ flex: 2 }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "مرحله بعد"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Zones */}
      {step === 5 && (
        <div className="onboarding-step">
          <h2 className="step-title">مناطق ترجیحی</h2>
          <p className="step-subtitle">دقیقاً ۳ منطقه تهران انتخاب کنید — {selectedZones.length} از ۳</p>

          <div className="zone-list">
            {TEHRAN_ZONES.map(z => (
              <button
                key={z.id}
                className={`zone-item ${selectedZones.includes(z.id) ? "selected" : ""}`}
                onClick={() => toggleZone(z.id)}
              >
                <span className="zone-check">{selectedZones.includes(z.id) ? "✓" : ""}</span>
                <span>{z.name}</span>
              </button>
            ))}
          </div>

          <div className="step-actions">
            <button className="btn btn-ghost" onClick={() => setStep(4)}>بازگشت</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={selectedZones.length !== 3 || loading}
              onClick={handleZonesSave}
              style={{ flex: 2 }}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : "تکمیل و شروع 🎉"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
