"use client";

import { FormEvent, useEffect, useState } from "react";

const WHATSAPP = "918074474524";

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 },
    );
    nodes.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parent = String(data.get("parent") ?? "").trim();
    const student = String(data.get("student") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const cls = String(data.get("cls") ?? "").trim();
    const subjects = String(data.get("subjects") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!parent || !student || !phone || !cls) {
      window.alert("Please fill in all required fields before sending.");
      return;
    }

    const text =
      "🎓 *New Enquiry – Bhargav Academy*\n\n" +
      "👤 *Parent Name:* " + parent + "\n" +
      "👦 *Student Name:* " + student + "\n" +
      "📞 *Phone:* " + phone + "\n" +
      "🏫 *Class:* " + cls + "\n" +
      "📚 *Subjects:* " + subjects + "\n" +
      (message ? "💬 *Message:* " + message + "\n" : "") +
      "\n_Sent from bhargavacademy.com_";

    setSending(true);
    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    window.setTimeout(() => {
      setSending(false);
      event.currentTarget.reset();
    }, 4000);
  }

  return (
    <>


{/* NAV */}
<nav>
  <div className="nav-inner">
    <a href="#" className="nav-logo">Bhargav <span>Academy</span></a>
    <button className="nav-toggle" type="button" aria-label="Menu" onClick={() => setMenuOpen((open) => !open)}>
      <span></span><span></span><span></span>
    </button>
    <ul className={`nav-links${menuOpen ? " open" : ""}`}>
      <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
      <li><a href="#programs" onClick={() => setMenuOpen(false)}>Programs</a></li>
      <li><a href="#results" onClick={() => setMenuOpen(false)}>Results</a></li>
      <li><a href="#gate" onClick={() => setMenuOpen(false)}>Our Alumni</a></li>
      <li><a href="#contact" className="nav-cta" onClick={() => setMenuOpen(false)}>Enroll Now</a></li>
    </ul>
  </div>
</nav>

{/* HERO */}
<section className="hero" id="home">
  <div className="hero-grid">
    <div className="hero-text">
      <div className="hero-eyebrow">IIT JEE Foundation Coaching · Hyderabad</div>
      <h1>Where <em>IIT Minds</em><br />Shape Future<br />Engineers</h1>
      <p className="hero-sub">Taught by an IIT Kanpur alumnus &amp; GATE AIR 721 holder — with a proven record of students scoring 100/100 in Mathematics and gaining admission to IITs &amp; IISc.</p>
      <div className="hero-stats">
        <div className="hstat"><div className="hstat-val">721</div><div className="hstat-lbl">GATE All India Rank</div></div>
        <div className="hstat"><div className="hstat-val">8.86</div><div className="hstat-lbl">IIT Kanpur CPI /10</div></div>
        <div className="hstat"><div className="hstat-val">100/100</div><div className="hstat-lbl">Students in Maths · 2025</div></div>
        <div className="hstat"><div className="hstat-val">5</div><div className="hstat-lbl">GATE Qualifiers · IITs & IISc</div></div>
        <div className="hstat"><div className="hstat-val">4.9/5</div><div className="hstat-lbl">JustDial Rating · 32 Reviews</div></div>
      </div>
      <div className="hero-btns">
        <a href="#contact" className="btn-primary">Enroll Your Child</a>
        <a href="https://wa.me/918074474524" target="_blank" rel="noopener noreferrer" className="btn-secondary">💬 WhatsApp Us</a>
      </div>
    </div>
    <div className="hero-photo-wrap">
      <div className="hero-photo-frame">
        <img src="/images/parankusam-bhargavan-founder-bhargav-aca.jpg" alt="Parankusam Bhargavan — Founder, Bhargav Academy" />
        <div className="hero-gold-rule"></div>
      </div>
      <div className="hero-photo-badge" style={{ position: "static", marginTop: 0, borderRadius: "0 0 6px 6px" }}>
        <div className="hpb-name">Parankusam Bhargavan</div>
        <div className="hpb-title">M.Tech IIT Kanpur · GATE AIR 721 · Founder, Bhargav Academy</div>
      </div>
    </div>
  </div>
</section>

{/* WHY US */}
<section id="why">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="section-label">Why Choose Us</div>
      <div className="section-title">Teaching that goes beyond the textbook</div>
      <div className="section-sub">Taught by an IIT Kanpur alumnus & GATE AIR 721 holder, using methods our students themselves describe as life-changing.</div>
    </div>
    <div className="why-grid">
      <div className="why-card reveal reveal-delay-1">
        <div className="why-icon" style={{ background: "#EBF2FA" }}>🔬</div>
        <h3>3D Visualisation & Live Demos</h3>
        <p>"Live demonstrations and 3D visualisation techniques led us to understand concepts effortlessly, unlike the mug-up culture in schools." — Jathin</p>
      </div>
      <div className="why-card reveal reveal-delay-2">
        <div className="why-icon" style={{ background: "#E8F5EE" }}>📋</div>
        <h3>Real Exam Atmosphere</h3>
        <p>"Strict invigilation and printed question papers feel like real IIT examinations — Board-level questions for serious preparation." — Madhav & Jathin</p>
      </div>
      <div className="why-card reveal reveal-delay-3">
        <div className="why-icon" style={{ background: "#FFF4EC" }}>👥</div>
        <h3>Small Batches, Equal Attention</h3>
        <p>"Limited strength is taken so everyone is treated equally. I went from 45% to 75% in Maths." — V. Sushanth Sai</p>
      </div>
      <div className="why-card reveal reveal-delay-4">
        <div className="why-icon" style={{ background: "#F5F0FF" }}>📚</div>
        <h3>Best-in-Class Study Material</h3>
        <p>We use RD Sharma, H.C. Verma, and S.P. Jauhar — the same books that top JEE and Board scorers rely on.</p>
      </div>
    </div>
  </div>
</section>



{/* ABOUT FOUNDER */}
<section className="about-bg" id="about">
  <div className="container">
    <div className="about-grid">
      <div className="about-story reveal">
        <div className="section-label">The Founder</div>
        <div className="section-title">Parankusam Bhargavan</div>
        <p><strong>Bhargavan's story is unlike any other coaching faculty's.</strong> He began with a First Class with Distinction in B.Tech (ECE) from JNTU Kakinada, then cleared GATE 2009 with an <strong>All India Rank of 721</strong> out of 43,797 candidates — earning admission to <strong>IIT Kanpur</strong>, where he completed his M.Tech in Photonics Science &amp; Engineering with a CPI of <strong>8.86/10</strong>.</p>
        <p>His research at IIT Kanpur explored <strong>non-invasive medical imaging using diffused photon waves</strong> — detecting hidden inhomogeneities in tissue-like media using third-order statistical moments and Green's function approaches. Real IIT-level mathematical thinking.</p>
        
        <p>He then served as Assistant Professor at Aditya Engineering College, and was <strong>nationally selected as Assistant Professor under TEQIP III</strong> (Ministry of HRD, Govt. of India). He founded <strong>Bhargav Academy in July 2023</strong>, dedicated to building JEE-ready foundations from Class 8 onwards.</p>
        <div className="about-quote">
          <p>The goal isn't just to teach Maths — it's to develop the kind of mathematical mind that cracks JEE. That comes from understanding deeply, not from drilling formulae.</p>
        </div>
      </div>
      <div className="about-creds reveal reveal-delay-1">
        <div className="section-label" style={{ marginBottom: "20px" }}>Credentials</div>
        <div className="cred-list">
          <div className="cred-card purple">
            <div className="cred-title">GATE 2009 — AIR 721 <span className="cred-badge" style={{ background: "#F0E8FF", color: "#5A1090" }}>Top 1.6%</span></div>
            <div className="cred-detail">Electronics & Communication Engineering · out of 43,797 candidates nationwide</div>
          </div>
          <div className="cred-card navy">
            <div className="cred-title">M.Tech — IIT Kanpur · CPI 8.86/10</div>
            <div className="cred-detail">Photonics Science & Engineering · Research: Non-invasive medical imaging using diffused photon waves</div>
          </div>
          <div className="cred-card gold">
            <div className="cred-title">IIEECP Merit Certificate — 10/10 <span className="cred-badge" style={{ background: "#FDF3D8", color: "#8A5E00" }}>Perfect Score</span></div>
            <div className="cred-detail">APSSDC · IUCEE · Indo-US International Engineering Educator Certification Program</div>
          </div>
          <div className="cred-card green">
            <div className="cred-title">TEQIP III — Govt. of India</div>
            <div className="cred-detail">Nationally selected as Assistant Professor · Ministry of HRD, New Delhi · Sep 2018 – Mar 2021</div>
          </div>
          <div className="cred-card navy">
            <div className="cred-title">NPTEL Certificate of Appreciation</div>
            <div className="cred-detail">Translated IIT Madras course (Design for IoT) into Telugu for SWAYAM · Oct 2020</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* PROGRAMS */}
<section className="programs-bg" id="programs">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="section-label" style={{ color: "var(--gold)" }}>Our Programs</div>
      <div className="section-title">Built for the journey to IIT</div>
      <div className="section-sub" style={{ color: "rgba(255,255,255,.65)" }}>Every programme is designed to build a strong conceptual foundation — not just for board exams, but for JEE Mains and Advanced.</div>
    </div>
    <div className="programs-grid">
      <div className="prog-card reveal reveal-delay-1">
        <span className="prog-badge blue">CLASS 6 – 8</span>
        <h3>Foundation Builder</h3>
        <div className="prog-for">For students starting their JEE journey early</div>
        <div className="prog-subjects">
          <span className="prog-sub-tag">Mathematics</span>
          <span className="prog-sub-tag">Science</span>
        </div>
        <ul>
          <li>Number theory, algebra and geometry fundamentals</li>
          <li>Logical reasoning and problem-solving skills</li>
          <li>NCERT + JEE Foundation curriculum</li>
          <li>Weekly tests and progress reports</li>
        </ul>
      </div>
      <div className="prog-card featured reveal reveal-delay-2">
        <span className="prog-badge gold">⭐ CLASS 9 – 10</span>
        <h3>Board + JEE Intensive</h3>
        <div className="prog-for">For serious aspirants targeting top scores</div>
        <div className="prog-subjects">
          <span className="prog-sub-tag">Mathematics</span>
          <span className="prog-sub-tag">Physics</span>
          <span className="prog-sub-tag">Chemistry</span>
        </div>
        <ul>
          <li>SSC / CBSE board exam preparation</li>
          <li>JEE Foundation concepts introduced</li>
          <li>Concept-first, formula-later methodology</li>
          <li>Personalised doubt sessions</li>
          <li>Students consistently scoring 95–100/100</li>
        </ul>
      </div>
      <div className="prog-card reveal reveal-delay-3">
        <span className="prog-badge blue">CLASS 6 – 10</span>
        <h3>Science & Maths Foundation</h3>
        <div className="prog-for">Building the roots that make JEE possible</div>
        <div className="prog-subjects">
          <span className="prog-sub-tag">Mathematics</span>
          <span className="prog-sub-tag">Physics</span>
          <span className="prog-sub-tag">Chemistry</span>
        </div>
        <ul>
          <li>Master number sense, ratio, proportion & algebra before they become hard</li>
          <li>Build intuition for motion, force & energy through real-world examples</li>
          <li>Make sense of matter, reactions & the periodic table from the ground up</li>
          <li>Develop logical thinking & problem-solving habits early — the real JEE skill</li>
          <li>Strong NCERT base that naturally connects to JEE thinking later</li>
        </ul>
      </div>
    </div>
  </div>
</section>

{/* RESULTS */}
<section className="results-bg" id="results">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="section-label">Bhargav Academy Results</div>
      <div className="section-title">Our students speak for themselves</div>
      <div className="section-sub">Class 10 board results — 2025 & 2026. Every student listed here was personally coached by Bhargavan in Mathematics.</div>
    </div>
    <div className="results-grid">
      <div className="result-card reveal reveal-delay-1">
        <div className="result-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <img src="/images/m-jaya-hamsini.jpg" alt="M. Jaya Hamsini" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "2px solid #E8F5EE" }} />
            <div><span className="maths-badge mb-perfect">Maths 100/100</span><div className="result-name">M. Jaya Hamsini</div><div className="result-board">SSC Board · 2025</div></div>
          </div>
        </div>
        <div className="result-score-row">
          <div><div className="rs-label">Mathematics</div><div className="rs-score perfect">100/100</div></div>
          <div><div className="rs-label">Science</div><div className="rs-score perfect">100/100</div></div>
        </div>
        <div className="result-total">⭐ Overall: 589 / 600</div>
      </div>
      <div className="result-card reveal reveal-delay-2">
        <div className="result-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <img src="/images/b-lokesh-murari.jpg" alt="B. Lokesh Murari" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "2px solid #E8F5EE" }} />
            <div><span className="maths-badge mb-perfect">Maths 100/100</span><div className="result-name">B. Lokesh Murari</div><div className="result-board">SSC Board · 2025</div></div>
          </div>
        </div>
        <div className="result-score-row">
          <div><div className="rs-label">Mathematics</div><div className="rs-score perfect">100/100</div></div>
          <div><div className="rs-label">Science</div><div className="rs-score">88/100</div></div>
        </div>
        <div className="result-total">Overall: 563 / 600</div>
      </div>
      <div className="result-card reveal reveal-delay-3">
        <div className="result-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <img src="/images/sabhapathy-varun-kumar.jpg" alt="Sabhapathy Varun Kumar" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "2px solid #FFF3D8" }} />
            <div><span className="maths-badge mb-near">Maths 99/100</span><div className="result-name">Sabhapathy Varun Kumar</div><div className="result-board">TG SSC Board · 2026</div></div>
          </div>
        </div>
        <div className="result-score-row">
          <div><div className="rs-label">Mathematics</div><div className="rs-score near">99/100</div></div>
          <div><div className="rs-label">Science</div><div className="rs-score">89/100</div></div>
        </div>
        <div className="result-total">Overall: 558 / 600</div>
      </div>
      <div className="result-card reveal reveal-delay-4">
        <div className="result-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <img src="/images/nsa-jathin.jpg" alt="NSA Jathin" style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "2px solid #FFF3D8" }} />
            <div><span className="maths-badge mb-near">Maths 95/100</span><div className="result-name">NSA Jathin</div><div className="result-board">CBSE Board · 2025</div></div>
          </div>
        </div>
        <div className="result-score-row">
          <div><div className="rs-label">Mathematics</div><div className="rs-score near">95/100</div></div>
          <div><div className="rs-label">Science</div><div className="rs-score">90/100</div></div>
        </div>
        <div className="result-total">Overall: 448 / 500</div>
      </div>
    </div>
  </div>
</section>

{/* GATE ALUMNI */}
{/* REVIEWS */}
<section style={{ background: "var(--navy)", padding: "90px 0" }}>
  <div className="container">
    <div className="section-header centered reveal">
      <div className="section-label" style={{ color: "var(--gold)" }}>Student Voices</div>
      <div className="section-title" style={{ color: "var(--white)" }}>What Our Students Say</div>
      <div className="section-sub" style={{ color: "rgba(255,255,255,.65)" }}>Real experiences from real students at Bhargav Academy, Meerpet — in their own words.</div>
    </div>

    {/* 3 FEATURED HIGHLIGHT CARDS */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", marginBottom: "48px" }}>

      <div className="review-card reveal reveal-delay-1" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <img src="/images/harsh.jpg" alt="harsh" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>B. Harsh</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,.5)" }}>Class 10</div>
          </div>
        </div>
        <div className="review-stars">★★★★★</div>
        <p style={{ flex: 1 }}>"Before joining, I was weak in Maths and afraid of Science. The teaching style connected concepts to real life. I improved from basics to a standard level — the experience exceeded my expectations by a drastic change."</p>
      </div>

      <div className="review-card reveal reveal-delay-2" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <img src="/images/madhav.jpg" alt="Madhav" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>Madhav</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,.5)" }}>Class 10</div>
          </div>
        </div>
        <div className="review-stars">★★★★★</div>
        <p style={{ flex: 1 }}>"The examination process is very good — questions are at Board exam level. The printed question papers felt like real IIT examinations. I improved my basics in Maths by 85%."</p>
      </div>

      <div className="review-card reveal reveal-delay-3" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <img src="/images/sushanth.jpg" alt="sushanth" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>V. Sushanth Sai</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,.5)" }}>Class 10</div>
          </div>
        </div>
        <div className="review-stars">★★★★★</div>
        <p style={{ flex: 1 }}>"I went from 45% to 75% in Maths. I thought there would be too many students, but limited strength is taken and everyone is treated equally. This is the best place to study."</p>
      </div>

    </div>

    {/* ALL 8 DETAILED REVIEWS GRID */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "18px", marginBottom: "36px" }}>

      <div className="review-card reveal" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/nsa-jathin.jpg" alt="jathin" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>NSA Jathin</div><div style={{ fontSize: "10.5px", color: "var(--gold)" }}>Maths 95/100 · CBSE 2025</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"Learning Physics here was pleasurable and experimental. Live demonstrations and 3D visualisation led us to understand concepts effortlessly, unlike the mug-up culture in schools. The exam atmosphere felt like a real examination hall."</p>
      </div>

      <div className="review-card reveal reveal-delay-1" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/m-jaya-hamsini.jpg" alt="jaya" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>M. Jaya Hamsini</div><div style={{ fontSize: "10.5px", color: "var(--gold)" }}>Maths 100/100 · Science 100/100 · SSC 2025</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"Bhargav Academy didn't just help me improve in Maths and Physics — I learned values of life. The detailed Chemistry explanations made me feel like I was living in the world of atoms. I'm grateful to Sir for helping me build my self-esteem."</p>
      </div>

      <div className="review-card reveal reveal-delay-2" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/b-lokesh-murari.jpg" alt="lokesh" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>B. Lokesh Murari</div><div style={{ fontSize: "10.5px", color: "var(--gold)" }}>Maths 100/100 · SSC 2025</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"My experience with Bhargav Sir was extraordinary. He taught me many things beyond academics. The focus on every student and solving multiple examples helped me improve my problem-solving skills significantly."</p>
      </div>

      <div className="review-card reveal reveal-delay-3" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/pranathi.jpg" alt="pranathi" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Pranathi</div><div style={{ fontSize: "10.5px", color: "rgba(255,255,255,.5)" }}>Bhargav Academy</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"I thought tuition would be serious and boring, but I really enjoyed the classes. Sir makes learning fun with general knowledge and humour. I became serious about Maths and Science and actually started enjoying problem-solving."</p>
      </div>

      <div className="review-card reveal reveal-delay-1" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/tanish.jpg" alt="tanish" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Tanish</div><div style={{ fontSize: "10.5px", color: "rgba(255,255,255,.5)" }}>Bhargav Academy</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"I feel I improved the most in Chemistry — after Sir's teaching, I find it interesting and enjoyable. The exam questions are at Board level, which is very useful for accuracy and building real confidence."</p>
      </div>

      <div className="review-card reveal reveal-delay-2" style={{ background: "rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <img src="/images/krishna.jpg" alt="krishna" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,.15)", flexShrink: 0 }} />
          <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Krishna</div><div style={{ fontSize: "10.5px", color: "rgba(255,255,255,.5)" }}>Bhargav Academy</div></div>
        </div>
        <p style={{ fontSize: "13px" }}>"I initially hesitated to join, but it was a great decision. Even joining for only the last two chapters, I understood Physics in a more effective way. The handwritten notes in Mathematics helped me grasp concepts efficiently."</p>
      </div>

    </div>

    <div style={{ textAlign: "center" }}>
      <a href="https://www.justdial.com/Hyderabad/Bhargav-Academy-Meerpet/040PXX40-XX40-230808205722-R2G8_BZDET" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "rgba(255,255,255,.1)", color: "var(--white)", padding: "12px 32px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "14px", border: "1px solid rgba(255,255,255,.2)" }}>View All Reviews on JustDial →</a>
    </div>
  </div>
</section>

<section id="gate">
  <div className="container">
    <div className="section-header reveal">
      <div className="section-label">GATE Qualifiers</div>
      <div className="section-title">Our alumni at India's<br />premier institutions</div>
      <div className="section-sub">Bhargavan's mentorship goes beyond school. These students cleared GATE under his guidance and are now pursuing advanced education and careers at India's most prestigious institutions.</div>
    </div>
    <div className="gate-intro reveal">
      <div className="gate-num">5</div>
      <div className="gate-intro-text">
        <h3>GATE Qualifiers Mentored</h3>
        <p>Five students who cleared GATE under Bhargavan's mentorship are now at IIT Kanpur, IIT Dharwad, IIT Guwahati (×2) and IISc Bangalore — with one now working at Qualcomm, Bengaluru. This is the ultimate proof of teaching that produces real results.</p>
      </div>
    </div>
    <div className="gate-list">
      <div className="gate-item iitk reveal">
        <div>
          <div className="gi-name"><a href="https://www.linkedin.com/in/vivekkk21/" target="_blank" rel="noopener noreferrer" title="View Vivek Kumar on LinkedIn">Vivek Kumar <span className="li-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</span></a></div>
          <div className="gi-prog">M.Tech · Power Electronics</div>
          <div className="gi-now">🏢 Now: Characterization & Validation Engineer · Qualcomm, Bengaluru</div>
          <span className="alma-tag">★ IIT Kanpur — Bhargavan's Alma Mater</span>
        </div>
        <div className="gi-inst-badge">
          <div className="gi-inst">IIT Kanpur</div>
          <div className="gi-type">Master of Technology</div>
        </div>
      </div>
      <div className="gate-item reveal reveal-delay-1">
        <div>
          <div className="gi-name"><a href="https://www.linkedin.com/in/girishkumargupta/" target="_blank" rel="noopener noreferrer" title="View Girish Kumar Gupta on LinkedIn">Girish Kumar Gupta <span className="li-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</span></a></div>
          <div className="gi-prog">MS Research · EE · AI/ML & Satellite Data Science</div>
          <div className="gi-now">🔬 Active Researcher · Published · CWPRS Collaboration</div>
        </div>
        <div className="gi-inst-badge">
          <div className="gi-inst">IIT Dharwad</div>
          <div className="gi-type">MS by Research</div>
        </div>
      </div>
      <div className="gate-item reveal reveal-delay-2">
        <div>
          <div className="gi-name"><a href="https://www.linkedin.com/in/nibha-ranjan-b0370524a/" target="_blank" rel="noopener noreferrer" title="View Nibha Ranjan on LinkedIn">Nibha Ranjan <span className="li-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</span></a></div>
          <div className="gi-prog">M.Tech · Electrical Engineering</div>
          <div className="gi-now">🏢 Now: Senior Engineer · Mahindra & Mahindra Automotive</div>
        </div>
        <div className="gi-inst-badge">
          <div className="gi-inst">IIT Guwahati</div>
          <div className="gi-type">Master of Technology</div>
        </div>
      </div>
      <div className="gate-item reveal reveal-delay-3">
        <div>
          <div className="gi-name"><a href="https://www.linkedin.com/in/vishaltande/" target="_blank" rel="noopener noreferrer" title="View Vishal Tande on LinkedIn">Vishal Tande <span className="li-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</span></a></div>
          <div className="gi-prog">M.Tech · Engineering</div>
        </div>
        <div className="gi-inst-badge">
          <div className="gi-inst">IIT Guwahati</div>
          <div className="gi-type">Master of Technology</div>
        </div>
      </div>
      <div className="gate-item reveal reveal-delay-4">
        <div>
          <div className="gi-name"><a href="https://www.linkedin.com/in/yogeshsahu21july/" target="_blank" rel="noopener noreferrer" title="View Yogesh Kumar Sahu on LinkedIn">Yogesh Kumar Sahu <span className="li-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</span></a></div>
          <div className="gi-prog">PhD · Centre for Nano Science and Engineering (CeNSE)</div>
          <div className="gi-now">🔬 Active PhD Researcher · Published · IISc Bangalore</div>
        </div>
        <div className="gi-inst-badge">
          <div className="gi-inst">IISc Bangalore</div>
          <div className="gi-type">Doctor of Philosophy</div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* CONTACT */}
<section className="contact-bg" id="contact">
  <div className="container">
    <div className="section-header centered reveal">
      <div className="section-label">Enroll Now</div>
      <div className="section-title">Start your child's IIT journey today</div>
      <div className="section-sub">Limited seats. Personal attention. Reach out on WhatsApp or fill the form below and we'll get back to you within 24 hours.</div>
    </div>
    <div className="contact-grid">
      <div className="contact-info reveal">
        <h3>Get in Touch</h3>
        <div className="contact-detail">
          <div className="cd-icon">📞</div>
          <div className="cd-text">
            <strong>Phone / WhatsApp</strong>
            <span><a href="tel:+918074474524">+91 80744 74524</a></span>
          </div>
        </div>
        <div className="contact-detail">
          <div className="cd-icon">✉️</div>
          <div className="cd-text">
            <strong>Email</strong>
            <span><a href="mailto:bhargavanmobile@gmail.com">bhargavanmobile@gmail.com</a></span>
          </div>
        </div>
        <div className="contact-detail">
          <div className="cd-icon">📍</div>
          <div className="cd-text">
            <strong>Location</strong>
            <span>House No 14, Sarala Devi Enclave,<br />X Road, Pragathi Colony, Meerpet,<br />Hyderabad – 500097, Telangana</span>
          </div>
        </div>

        <div className="contact-detail">
          <div className="cd-icon">⭐</div>
          <div className="cd-text">
            <strong>JustDial Rating</strong>
            <span><strong style={{ color: "var(--gold)" }}>4.9 / 5</strong> — 32 ratings & reviews</span>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.5!2d78.5258796!3d17.3238414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcba34af153f283%3A0x681c23b53eeac9d3!2sBhargav%20Academy!5e0!3m2!1sen!2sin!4v1" width="100%" height="180" style={{ border: 0, borderRadius: "8px" }} allowFullScreen loading="lazy"></iframe>
        </div>
        <a href="https://wa.me/918074474524?text=Hello%2C%20I%20am%20interested%20in%20enrolling%20my%20child%20at%20Bhargav%20Academy" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          Chat on WhatsApp
        </a>
      </div>
      <div className="enroll-form reveal reveal-delay-1">
        <h3>Enquiry Form</h3>
        <form id="baForm" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Parent's Name *</label>
              <input id="f_parent" name="parent" type="text" placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label>Student's Name *</label>
              <input id="f_student" name="student" type="text" placeholder="Child's name" required />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Phone Number *</label>
              <input id="f_phone" name="phone" type="tel" placeholder="+91 XXXXX XXXXX" required />
            </div>
            <div className="form-group">
              <label>Class *</label>
              <select id="f_class" name="cls" required>
                <option value="">Select Class</option>
                <option>Class 8</option>
                <option>Class 9</option><option>Class 10</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Subject(s) of Interest</label>
            <select id="f_subjects" name="subjects">
              <option>Mathematics + Physics + Chemistry</option>
              <option>Mathematics only</option>
              <option>Mathematics + Physics</option>
              <option>Mathematics + Chemistry</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message (optional)</label>
            <textarea id="f_message" name="message" rows={3} placeholder="Any questions or specific requirements..."></textarea>
          </div>
          <button type="submit" id="f_btn" className="submit-btn" disabled={sending}>{sending ? "✓ Opening WhatsApp..." : "💬 Send via WhatsApp"}</button>
          <p style={{ fontSize: "12px", color: "#999", textAlign: "center", marginTop: "10px" }}>Opens WhatsApp with your details pre-filled</p>
        </form>
      </div>
    </div>
  </div>
</section>

{/* FOOTER */}
<footer>
  <div className="footer-inner">
    <div className="footer-top">
      <div className="footer-brand">
        <div className="logo">Bhargav <span>Academy</span></div>
        <p>IIT JEE Foundation Coaching for Class 8–10 in Hyderabad. Founded by an IIT Kanpur alumnus &amp; GATE AIR 721 holder.</p>
      </div>
      <div className="footer-links">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About the Founder</a></li>
          <li><a href="#programs" onClick={() => setMenuOpen(false)}>Programs</a></li>
          <li><a href="#results" onClick={() => setMenuOpen(false)}>Student Results</a></li>
          <li><a href="#gate" onClick={() => setMenuOpen(false)}>GATE Alumni</a></li>
          <li><a href="#contact">Enroll Now</a></li>
        </ul>
      </div>
      <div className="footer-links">
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:+918074474524">+91 80744 74524</a></li>
          <li><a href="mailto:bhargavanmobile@gmail.com">bhargavanmobile@gmail.com</a></li>
          <li><a href="https://wa.me/918074474524">WhatsApp Us</a></li>
          <li>Meerpet, Hyderabad – 500097</li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} Bhargav Academy. All rights reserved. | bhargavacademy.com</p>
      <p>Founded by Parankusam Bhargavan · M.Tech IIT Kanpur · GATE AIR 721</p>
    </div>
  </div>
</footer>

{/* WHATSAPP FLOAT */}
<a href="https://wa.me/918074474524?text=Hello%2C%20I%20am%20interested%20in%20Bhargav%20Academy" target="_blank" rel="noopener noreferrer" className="wa-float" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
</a>

    </>
  );
}
