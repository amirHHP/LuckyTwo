import Link from "next/link";

const FEATURES = [
  {
    icon: "🧠",
    title: "تطبیق شخصیتی MBTI",
    desc: "با تست ۱۶ سوالی، تایپ شخصیتی‌تون مشخص میشه و فقط با افرادی سازگار مچ میشید.",
    accentClass: "landing-feature-accent-pink",
  },
  {
    icon: "🗺️",
    title: "مچ جغرافیایی",
    desc: "فقط با افرادی مچ میشید که نزدیک شما هستن — بدون ساعت‌ها رانندگی.",
    accentClass: "landing-feature-accent-blue",
  },
  {
    icon: "🔐",
    title: "حریم خصوصی کامل",
    desc: "عکستون به کسی نشون داده نمیشه. ۲۴ ساعت قبل از قرار، سرنخ‌های ظاهری فاش میشن.",
    accentClass: "landing-feature-accent-green",
  },
  {
    icon: "☕",
    title: "قرار واقعی در کافه",
    desc: "هدف ما اینه که از چت بی‌پایان فرار کنید و یه ملاقات واقعی داشته باشید.",
    accentClass: "landing-feature-accent-gold",
  },
];

const STEPS = [
  { num: "۱", title: "ثبت‌نام و تست", desc: "پروفایل بسازید و تست MBTI رو تکمیل کنید" },
  { num: "۲", title: "مچ هوشمند", desc: "الگوریتم ما بهترین هم‌تایپ رو پیدا می‌کنه" },
  { num: "۳", title: "چت محدود", desc: "با هم آشنا بشید — بدون عکس، بدون فشار" },
  { num: "۴", title: "قرار در کافه", desc: "یه ملاقات واقعی، یه تجربه واقعی" },
];

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">💕</span>
            <span>LuckyTwo</span>
          </Link>
          <nav className="landing-nav-links hide-mobile">
            <a href="#features">ویژگی‌ها</a>
            <a href="#how-it-works">نحوه کار</a>
          </nav>
          <Link href="/auth" className="btn btn-primary btn-sm">
            شروع کنید
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-bg" aria-hidden="true">
            <div className="landing-orb landing-orb-1" />
            <div className="landing-orb landing-orb-2" />
            <div className="landing-orb landing-orb-3" />
          </div>

          <div className="landing-hero-grid container">
            <div className="landing-hero-text">
              <span className="landing-badge">🇮🇷 اولین بلایند دیت هوشمند ایرانی</span>
              <h1 className="landing-headline">
                عشق واقعی،
                <br />
                <span className="landing-headline-accent">بدون قضاوت ظاهری</span>
              </h1>
              <p className="landing-lead">
                LuckyTwo با تطبیق شخصیتی MBTI و موقعیت جغرافیایی، شما رو با
                آدم‌های سازگار وصل می‌کنه — بدون عکس، بدون چت بی‌پایان، فقط
                یه قرار واقعی در کافه.
              </p>
              <div className="landing-hero-actions">
                <Link href="/auth" className="btn btn-primary btn-lg">
                  شروع رایگان ✨
                </Link>
                <Link href="/auth" className="btn btn-secondary btn-lg">
                  ورود
                </Link>
              </div>
              <div className="landing-trust">
                <div className="landing-trust-item">
                  <span className="landing-trust-icon">🛡️</span>
                  <span>حریم خصوصی تضمین‌شده</span>
                </div>
                <div className="landing-trust-item">
                  <span className="landing-trust-icon">🎯</span>
                  <span>تطبیق بر اساس شخصیت</span>
                </div>
              </div>
            </div>

            <div className="landing-hero-visual" aria-hidden="true">
              <div className="landing-phone">
                <div className="landing-phone-notch" />
                <div className="landing-phone-screen">
                  <div className="landing-match-card">
                    <div className="landing-match-avatar">?</div>
                    <div className="landing-match-info">
                      <span className="landing-match-name">هم‌تایپ شما</span>
                      <span className="landing-match-type badge badge-accent">ENFP × INTJ</span>
                    </div>
                    <div className="landing-match-score">
                      <span>۹۲٪</span>
                      <small>سازگاری</small>
                    </div>
                  </div>
                  <div className="landing-phone-clues">
                    <div className="landing-clue-chip">📍 ۳ کیلومتر</div>
                    <div className="landing-clue-chip">☕ کافه پیشنهادی</div>
                  </div>
                  <div className="landing-phone-cta">قرار بذارید</div>
                </div>
              </div>
              <div className="landing-float-card landing-float-card-1">
                <span>🔒</span> بدون عکس
              </div>
              <div className="landing-float-card landing-float-card-2">
                <span>🧠</span> MBTI
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="landing-section landing-steps-section">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-tag">نحوه کار</span>
              <h2>از ثبت‌نام تا قرار، در ۴ قدم</h2>
              <p>فرآیند ساده و شفاف — بدون پیچیدگی‌های اپ‌های معمولی</p>
            </div>
            <div className="landing-steps">
              {STEPS.map((step, i) => (
                <div key={step.num} className="landing-step">
                  <div className="landing-step-num">{step.num}</div>
                  {i < STEPS.length - 1 && <div className="landing-step-line hide-mobile" />}
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-section landing-features-section">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-tag">چرا LuckyTwo؟</span>
              <h2>تفاوت ما با بقیه</h2>
              <p>طراحی‌شده برای ایرانی‌هایی که دنبال ارتباط واقعی هستن</p>
            </div>
            <div className="landing-features-grid">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className={`landing-feature-card ${f.accentClass}`}
                >
                  <div className="landing-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Philosophy */}
        <section className="landing-section landing-quote-section">
          <div className="container">
            <blockquote className="landing-quote glass-card-strong">
              <p>
                «ما باور داریم که جذابیت واقعی از درون میاد.
                LuckyTwo فرصتیه که قبل از قضاوت ظاهری،
                <em> شخصیت </em>
                رو بشناسید.»
              </p>
              <footer>— فلسفه LuckyTwo</footer>
            </blockquote>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-cta-section">
          <div className="container">
            <div className="landing-cta-box">
              <h2>آماده‌اید اولین قرار واقعی‌تون رو تجربه کنید؟</h2>
              <p>ثبت‌نام رایگانه. فقط ۵ دقیقه وقت می‌بره.</p>
              <Link href="/auth" className="btn btn-primary btn-lg">
                همین الان شروع کنید ✨
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo-icon">💕</span>
            <span>LuckyTwo</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} LuckyTwo — بلایند دیت هوشمند ایرانی
          </p>
        </div>
      </footer>
    </>
  );
}
