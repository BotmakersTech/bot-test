import { useState, useEffect, } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import logo from "../../assets/logo.png";
// ─── Types ───────────────────────────────────────────────────────────────────
interface CategoryCard {
  color: string;
  emoji: string;
  title: string;
  age: string;
  tagline: string;
  events: { icon: string; name: string }[];
}

interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const WHY_CARDS: FeatureCard[] = [
  { icon: "📋", title: "Unified Rulebook", desc: "Same rules. Same fairness. Every city across India follows one standardized competition format." },
  { icon: "🏆", title: "League Structure", desc: "Clear progression from school to professional level with age-wise and skill-wise competition categories." },
  { icon: "📊", title: "Digital Rankings", desc: "Recognition that actually matters. Track your performance, climb the leaderboards, get discovered." },
  { icon: "🛡️", title: "Safety-First Arenas", desc: "Standardized setups, trained officials, and professional equipment ensuring safe competition." },
  { icon: "⚖️", title: "Fair Play & Judging", desc: "Transparent scoring systems and professional judges ensure every team gets a fair chance." },
  { icon: "🌍", title: "National → Global", desc: "Exposure beyond local events. Compete nationally, represent India globally." },
];

const CATEGORIES: CategoryCard[] = [
  {
    color: "#4CAF50",
    emoji: "🟢",
    title: "Mini Makers",
    age: "Age: 6–10 Years",
    tagline: "Creativity • Logic • Fun Learning",
    events: [
      { icon: "💡", name: "Project Innovation Challenge" },
      { icon: "🔌", name: "Plug & Play Robotics" },
      { icon: "🏎️", name: "Robo Race" },
      { icon: "📖", name: "Scratch Jr. – Story Making" },
    ],
  },
  {
    color: "#FF9800",
    emoji: "🟠",
    title: "Junior Innovators",
    age: "Age: 10–14 Years",
    tagline: "Engineering • Automation • Strategy",
    events: [
      { icon: "🏎️", name: "Robo Race" },
      { icon: "⚽", name: "Robo Soccer (1 Robot)" },
      { icon: "➡️", name: "Line Follower" },
      { icon: "🥊", name: "Robo Sumo" },
    ],
  },
  {
    color: "#2196F3",
    emoji: "🔵",
    title: "Young Engineers",
    age: "Age: 14–18 Years",
    tagline: "Advanced Robotics • Wireless Control • Competition",
    events: [
      { icon: "⚽", name: "Robo Soccer (2 Robots)" },
      { icon: "➡️", name: "Autonomous Line Follower" },
      { icon: "⚔️", name: "RoboWar (1.5 kg)" },
      { icon: "🏎️", name: "RC Racing Electric 1:12" },
    ],
  },
  {
    color: "#FF4C4C",
    emoji: "🔴",
    title: "Robo Minds",
    age: "Age: 18+ Years",
    tagline: "Professional Robotics • Advanced Sports • Elite Competition",
    events: [
      { icon: "🏒", name: "Robo Hockey (2 Robots)" },
      { icon: "➡️", name: "Manual + Line Follower" },
      { icon: "⚔️", name: "RoboWar (Multi-Class)" },
      { icon: "🚁", name: "FPV Drone Racing & Aeromodelling" },
    ],
  },
];

const FOR_CARDS: FeatureCard[] = [
  { icon: "🧑‍🎓", title: "Students & Teams", desc: "Compete at your level, grow your skills, and get national recognition for your robotics talent." },
  { icon: "🏫", title: "Schools & Colleges", desc: "Bring standardized robotics competitions to your institution and nurture the next generation of innovators." },
  { icon: "🤖", title: "Event Organizers", desc: "Host official BotLeague events with complete support, standardized rules, and professional systems." },
  { icon: "🤝", title: "Sponsors & Partners", desc: "Support India's robotics ecosystem and connect with talented young engineers nationwide." },
];

// ─── Styles ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800;900&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --primary-red: #FF4C4C;
    --dark-bg: #0a0a0a;
    --dark-secondary: #1a1a1a;
    --dark-tertiary: #0f0f0f;
    --text-primary: #ffffff;
    --text-secondary: #e6e6e6;
    --text-tertiary: #999999;
    --border-color: rgba(255,76,76,0.2);
    --glow-red: rgba(255,76,76,0.5);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Exo 2', sans-serif;
    background: var(--dark-bg);
    color: var(--text-primary);
    overflow-x: hidden;
    line-height: 1.6;
  }

  ::-webkit-scrollbar { width: 12px; }
  ::-webkit-scrollbar-track { background: var(--dark-bg); }
  ::-webkit-scrollbar-thumb { background: var(--primary-red); border-radius: 6px; }
  ::-webkit-scrollbar-thumb:hover { background: #ff3333; }

  /* ── Scroll Progress ── */
  .scroll-progress {
    position: fixed; top: 0; left: 0; height: 4px; width: 0%;
    background: linear-gradient(90deg, var(--primary-red), #ff7676);
    z-index: 10001; transition: width 0.1s ease;
  }

  /* ── Back to Top ── */
  .back-to-top {
    position: fixed; bottom: 30px; right: 30px;
    width: 50px; height: 50px;
    background: var(--primary-red); color: var(--text-primary);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; cursor: pointer;
    opacity: 0; visibility: hidden;
    transition: all 0.3s ease; z-index: 1000;
    box-shadow: 0 5px 20px rgba(255,76,76,0.4);
    border: none;
  }
  .back-to-top.visible { opacity: 1; visibility: visible; }
  .back-to-top:hover { transform: translateY(-5px); }

  /* ── Nav ── */
  nav {
    position: fixed; top: 0; width: 100%;
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(20px);
    z-index: 1000; padding: 0 6%;
    border-bottom: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }
  nav.scrolled {
    padding: 0.8rem 5%;
    box-shadow: 0 10px 40px rgba(255,76,76,0.1);
  }
  nav .container {
    margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center;
    padding:16px 0;
  }
  .logo { font-size: 1.8rem; font-weight: 900; color: var(--primary-red); text-transform: uppercase; letter-spacing: 2px; cursor: pointer; }
  .logo img { width: auto; height: 60px; }
  .nav-links { display: flex; gap: 2.5rem; list-style: none; align-items: center; }
  .nav-links a { color: var(--text-primary); text-decoration: none; font-weight: 600; transition: color 0.3s ease; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px; }
  .nav-links a:hover { color: var(--primary-red); }

  .mobile-menu-toggle { display: none; flex-direction: column; gap: 10px; cursor: pointer; padding: 5px; background: none; border: none; }
  .mobile-menu-toggle span { width: 25px; height: 3px; background: var(--primary-red); transition: all 0.3s ease; border-radius: 2px; display: block; }

  /* ── Hero ── */
  .hero {
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; padding-top: 130px;
  }
  @media (min-width: 1099px) { .hero { min-height: 100vh; } }

  .hero-video-bg {
    position: absolute; top: 12%; max-height: 85vh;
    width: 100%; height: 100%; z-index: 0;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  }
  .hero-video-bg video { width: 100%; height: 100%; object-fit: cover; }

  .hero-video-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(
      to right,
      var(--dark-bg) 0%, var(--dark-bg) 35%,
      rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.6) 55%,
      rgba(10,10,10,0.3) 65%, rgba(10,10,10,0.1) 75%, transparent 85%
    ),
    linear-gradient(
      to bottom,
      rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.3) 30%,
      rgba(10,10,10,0.1) 50%, transparent 70%
    );
    z-index: 1;
  }
  .grid-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image:
      linear-gradient(rgba(255,76,76,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,76,76,0.03) 1px, transparent 1px);
    background-size: 50px 50px; opacity: 0.3; z-index: 1;
  }
  .hero-content {
    position: relative; z-index: 2; padding: 0 5%;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 5rem; width: 100%;
  }
  .hero-text { text-align: left; }
  .hero h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 2px; line-height: 1.1; }
  .hero h1 .brand {
    color: var(--primary-red); display: block; font-size: 5.5rem; line-height: 1.1;
    text-shadow: 0 0 30px var(--glow-red); margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #FF4C4C 0%, #ff7676 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .hero-pillars { display: flex; flex-direction: column; gap: 1.2rem; margin-bottom: 3rem; }
  .pillar-item { display: flex; align-items: center; gap: 1.2rem; font-size: 1.15rem; font-weight: 600; color: var(--text-primary); padding: 0.8rem 1.5rem; }
  .pillar-icon { width: 2px; height: 30px; background: var(--primary-red); border-radius: 50%; box-shadow: 0 0 15px var(--glow-red); }
  .hero-spacer { position: relative; z-index: 2; }

  /* ── Buttons ── */
  .cta-buttons { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .btn {
    padding: 1.2rem 3rem; font-size: 1rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.5px;
    border: none; cursor: pointer; transition: all 0.3s ease;
    text-decoration: none; display: inline-block;
    font-family: 'Exo 2', sans-serif; border-radius: 4px;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary-red) 0%, #cc0000 100%);
    color: var(--text-primary); box-shadow: 0 10px 30px rgba(255,76,76,0.3);
  }
  .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(255,76,76,0.5); }
  .btn-secondary { background: transparent; color: var(--text-primary); border: 2px solid var(--primary-red); }
  .btn-secondary:hover { background: var(--primary-red); transform: translateY(-3px); }

  /* ── Section ── */
  .section { padding: 3.5rem 5%; position: relative; }
  .section-header { text-align: center; margin-bottom: 1rem; }
  .section-header h2 {
    font-size: 4rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 1.5rem; position: relative; display: inline-block;
  }
  .section-header h2::after {
    content: ''; position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%);
    width: 100px; height: 4px;
    background: linear-gradient(90deg, transparent, var(--primary-red), transparent);
  }
  .section-header .highlight {
    color: var(--primary-red);
    background: linear-gradient(135deg, #FF4C4C 0%, #ff7676 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .section-header p { font-size: 1.3rem; color: var(--text-tertiary); max-width: 700px; margin: 0 auto; line-height: 1.8; }

  .feature-icon { max-width: 100px; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; margin-bottom: 0.5rem; }
  .feature-icon img { max-width: 100%; }

  /* ── Features / Audience Grid ── */
  .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5rem; max-width: 1400px; margin: 0 auto; }
  .audience-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem; max-width: 1400px; margin: 0 auto; }
  .feature-card {
    background: #9797974a; padding: 3rem;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease; border-radius: 8px;
  }
  .feature-card:hover { border-color: var(--primary-red); transform: translateY(-5px); box-shadow: 0 15px 40px rgba(255,76,76,0.2); }
  .feature-card h3 { font-size: 1.6rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary-red); }
  .feature-card p { color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem; }

  /* ── Categories ── */
  .categories-section { background: linear-gradient(135deg, var(--dark-tertiary) 0%, var(--dark-secondary) 100%); position: relative; }
  .categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3rem; max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }
  .category-card {
    background: rgba(255,255,255,0.10); border: 2px solid transparent; padding: 2.5rem;
    transition: all 0.3s ease; border-radius: 12px; backdrop-filter: blur(10px);
    display: flex; flex-direction: column;
  }
  .category-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-5px); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
  .category-header { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.5rem; }
  .category-icon {
    width: 50px; height: 50px; min-width: 50px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; font-weight: 900;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  .category-card h3 { font-size: 1.6rem; font-weight: 900; text-transform: uppercase; line-height: 1.2; }
  .age-range {
    font-size: 0.9rem; color: var(--text-tertiary); margin-bottom: 0.8rem;
    font-weight: 600; display: inline-block; padding: 0.4rem 0.9rem;
    background: rgba(0,0,0,0.3); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
  }
  .category-tagline { font-size: 0.95rem; color: var(--text-tertiary); margin-bottom: 2rem; font-style: italic; padding-left: 1rem; line-height: 1.4; }
  .events-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 2rem; }
  .event-item {
    background: rgba(0,0,0,0.3); padding: 1.2rem; border-radius: 8px;
    transition: all 0.3s ease; display: flex; align-items: center; gap: 1rem;
  }
  .event-item:hover { background: rgba(0,0,0,0.5); transform: translateX(5px); }
  .event-icon {
    width: 50px; height: 50px; min-width: 50px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 1.5rem;
  }
  .event-icon img { width: 30px; height: 30px; object-fit: contain; }
  .event-name { color: var(--text-secondary); font-weight: 600; font-size: 0.95rem; line-height: 1.3; }

  /* ── CTA Section ── */
  .cta-section {
    background: linear-gradient(175deg, #ff8383 0%, #ff2222 100%);
    text-align: center; padding: 8rem 5%; position: relative; overflow: hidden;
  }
  .cta-section h2 { font-size: 4rem; font-weight: 900; text-transform: uppercase; margin-bottom: 2rem; text-shadow: 0 5px 20px rgba(0,0,0,0.3); }
  .cta-section p { font-size: 1.4rem; margin-bottom: 3rem; opacity: 0.95; max-width: 800px; margin-left: auto; margin-right: auto; line-height: 1.8; }
  .cta-section .cta-buttons { gap: 2rem; justify-content: center; }
  .cta-section .btn { background: var(--text-primary); color: var(--primary-red); font-weight: 800; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
  .cta-section .btn:hover { background: var(--dark-bg); color: var(--text-primary); transform: translateY(-3px); box-shadow: 0 15px 50px rgba(0,0,0,0.5); }

  /* ── Footer ── */
  .footer_rpz { background-color: #000; color: white; padding: 40px 20px 20px; font-family: 'Exo 2', sans-serif; }
  .footer-top_rpz { display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 30px; }
  .footer-logo_rpz { display: flex; align-items: center; flex-direction: column; gap: 12px; }
  .footer-logo-section_rpz { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .footer-logo-text_rpz { display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; gap: 4px; max-width: 350px; }
  .footer-logo-text_rpz img { width: 100%; }
  .footer-logo-tagline_rpz { text-align: center; font-size: 0.85rem; font-weight: 600; color: white; white-space: nowrap; }
  .footer-nav-container_rpz { display: flex; column-gap: 50px; }
  .footer-nav_rpz { display: flex; gap: 15px; flex-direction: column; font-size: 1rem; font-weight: 800; }
  .footer-nav_rpz a { color: white; text-decoration: none; transition: all 0.3s ease; }
  .footer-nav_rpz a:hover { text-decoration: underline; }
  .footer-social_rpz { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
  .social-icon_rpz {
    width: 50px; height: 50px; background-color: #fffff8; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #333; text-decoration: none; transition: all 0.3s ease;
  }
  .social-icon_rpz:hover { background-color: var(--dark-bg); transform: scale(1.1); }
  .social-icon_rpz svg { width: 23px; height: 23px; fill: #333; transition: fill 0.3s ease; }
  .social-icon_rpz:hover svg { fill: white; }
  .footer-line_rpz { margin: 15px auto; height: 3px; background-color: #FFF; width: 50%; max-width: 1200px; }
  .footer-text_rpz { text-align: center; font-size: 0.9rem; font-weight: 700; color: white; margin: 0; padding: 10px 0; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .hero-content { grid-template-columns: 1fr; gap: 3rem; }
    .features-grid { grid-template-columns: repeat(2,1fr); }
    .hero h1 { font-size: 3rem; }
    .hero h1 .brand { font-size: 4.5rem; }
    .section-header h2 { font-size: 3rem; }
    .audience-grid { grid-template-columns: repeat(2,1fr); }
    .categories-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .hero { padding-top: 100px; padding-bottom: 3rem; height: 85vh; }
    .logo { max-width: 250px; }
    .hero-video-bg { top: 0; max-height: 100%; opacity: 1; }
    .hero-video-overlay { background: linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.85) 100%); }
    .hero-content { grid-template-columns: 1fr; gap: 2rem; height: 100%; padding: 2rem 5%; }
    .hero-text { text-align: center; justify-content: space-between; display: flex; flex-direction: column; }
    .hero h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
    .hero h1 .brand { font-size: 3rem; }
    .hero-pillars { align-items: center; gap: 1rem; flex-direction: row; margin-bottom: 2rem; }
    .pillar-item { font-size: 1rem; padding: 0.6rem 1rem; }
    .cta-buttons { flex-direction: row; justify-content: center; gap: 1rem; flex-wrap: nowrap; }
    .btn { padding: 1rem 1.5rem; font-size: 0.85rem; white-space: nowrap; flex: 0 1 auto; }
    .section-header h2 { font-size: 2.2rem; }
    .section { padding: 1rem 5%; }
    .nav-links { position: fixed; top: 80px; left: -100%; width: 100%; height: calc(100vh - 80px); background: rgba(10,10,10,0.98); flex-direction: column; padding: 3rem; transition: left 0.3s ease; }
    .nav-links.active { left: 0; }
    .mobile-menu-toggle { display: flex; }
    .events-grid { grid-template-columns: 1fr; }
    .cta-buttons-bottom { display: flex; justify-content: center; flex-direction: column; }
  }
  @media (max-width: 550px) {
    .features-grid, .audience-grid { grid-template-columns: 1fr; gap: 2rem; }
    .hero h1 { font-size: 1.5rem; }
    .hero h1 .brand { font-size: 2.5rem; }
    .btn { padding: 0.9rem 1.2rem; font-size: 0.75rem; }
    .section-header h2 { font-size: 1.8rem; }
    .cta-section h2 { font-size: 2rem; }
    .category-card h3 { font-size: 1.4rem; }
    .feature-card { padding: 2rem; }
    nav .container { padding: 0; }
    .footer-top_rpz { flex-direction: column; gap: 30px; }
    .footer-nav-container_rpz { flex-direction: row; gap: 25px; text-align: center; }
    .footer-nav_rpz { align-items: center; font-size: 0.85rem; gap: 12px; }
    .social-icon_rpz { width: 45px; height: 45px; }
    .social-icon_rpz svg { width: 20px; height: 20px; }
    .footer-text_rpz { font-size: 0.8rem; }
    .footer-logo-text_rpz { font-size: 1.5rem; }
  }
  @media (max-width: 400px) {
    .cta-buttons { gap: 0.8rem; }
    .btn { padding: 0.8rem 1rem; font-size: 0.7rem; }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function BotLeague() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
const { isAuthenticated } = useSelector(
  (state: RootState) => state.auth
);
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrolled(scrollY > 100);
      setShowTop(scrollY > 300);
      setScrollPct((scrollY / scrollHeight) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      setMenuOpen(false);
    }
  };

  return (
    <>
      <style>{css}</style>

      {/* Scroll Progress */}
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} />

      {/* Back to Top */}
      <button className={`back-to-top${showTop ? " visible" : ""}`} onClick={scrollToTop}>↑</button>

      {/* ── Nav ── */}
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="container">
          <div className="logo">
            <img
              src={logo}
              alt="BotLeague Logo"
              onClick={() => (window.location.href = "/")}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {/* Fallback text logo if image fails */}
            <span style={{ display: "none" }}>BotLeague</span>
          </div>

          <ul className={`nav-links${menuOpen ? " active" : ""}`}>
            
            <li><a href="https://api.whatsapp.com/send/?phone=917775969089">Host Event</a></li>
            <li><a href="/Contact-Us">Contact us</a></li>
            <li><a href="/About-Us">About us</a></li>
            <li>
  {isAuthenticated ? (
    <a
      href="/profile"
      className="btn btn-secondary login"
      onClick={() => setMenuOpen(false)}
    >
      Dashboard
    </a>
  ) : (
    <a
      href="/login"
      className="btn btn-secondary login"
      onClick={() => setMenuOpen(false)}
    >
      Login
    </a>
  )}
</li>
          </ul>

          <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-video-bg">
          <video autoPlay muted loop playsInline>
            <source src="./vid/BotLeauge.MP4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-video-overlay" />
        <div className="grid-overlay" />
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              India's Unified Robotics Competition League
            </h1>
            <div>
              <div className="hero-pillars">
                {["One League", "One Rulebook", "One Platform"].map((p) => (
                  <div className="pillar-item" key={p}>
                    <div className="pillar-icon" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <div className="cta-buttons">
                <a href="/register" className="btn btn-primary">Register Now</a>
                <a href="#categories" className="btn btn-secondary" onClick={(e) => smoothScroll(e, "#categories")}>View Categories</a>
              </div>
            </div>
          </div>
          <div className="hero-spacer" />
        </div>
      </section>

      {/* ── Why BotLeague ── */}
      <section id="why" className="section">
        <div className="section-header">
          <h2>Why <span className="highlight">BotLeague?</span></h2>
          <p>India has talent. India has passion. What it needed was one unified competition system.</p>
        </div>
        <div className="audience-grid">
          {WHY_CARDS.map((c) => (
            <div className="feature-card" key={c.title}>
              <div className="feature-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="categories" className="section categories-section">
        <div className="section-header">
          <h2>Competition <span className="highlight">Categories</span></h2>
          <p>Four categories designed for every age and skill level</p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <div
              className="category-card"
              key={cat.title}
              style={{ "--category-color": cat.color } as React.CSSProperties}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = cat.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
            >
              <div className="category-header">
                <div
                  className="category-icon"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}, transparent)`,
                    border: `3px solid ${cat.color}`,
                  }}
                >
                  {cat.emoji}
                </div>
                <h3 style={{ color: cat.color, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{cat.title}</h3>
              </div>
              <p className="age-range">{cat.age}</p>
              <p className="category-tagline" style={{ borderLeft: `3px solid ${cat.color}` }}>{cat.tagline}</p>
              <div className="events-grid">
                {cat.events.map((ev) => (
                  <div className="event-item" key={ev.name} style={{ borderLeft: `3px solid ${cat.color}` }}>
                    <div className="event-icon" style={{ border: `2px solid ${cat.color}` }}>{ev.icon}</div>
                    <div className="event-name">{ev.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BotLeague For ── */}
      <section className="section">
        <div className="section-header">
          <h2><span className="highlight">BotLeague</span> For?</h2>
        </div>
        <div className="features-grid">
          {FOR_CARDS.map((c) => (
            <div className="feature-card" key={c.title}>
              <div className="feature-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="cta-section">
        <h2>Ready to Enter the League?</h2>
        <p>Compete • Host • Partner<br />Be part of India's official robotics competition movement.</p>
        <div className="cta-buttons cta-buttons-bottom">
          <a href="/register" className="btn">Register Now</a>
          <a href="https://api.whatsapp.com/send/?phone=917775969089" className="btn">Host an Event</a>
          <a href="mailto:contact@botleague.in" className="btn">Become a Partner</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer_rpz">
        <div className="footer-top_rpz">
          <div className="footer-logo_rpz">
            <div className="footer-logo-section_rpz">
              <div className="footer-logo-text_rpz">
                <img src={logo} alt="Bot-League Logo" onError={(e) => { (e.target as HTMLImageElement).alt = "BotLeague"; }} />
              </div>
            </div>
          </div>

          <div className="footer-nav-container_rpz">
            <div className="footer-nav_rpz">
              <a href="https://botmakerstech.in/">BotMakers</a>
              <a href="https://makersnext.in/">MakersNext</a>
            </div>
            <div className="footer-nav_rpz">
              <a href="https://botshop.in/">BotShop</a>
              <a href="https://roboplayzone.com/">Roboplayzone</a>
            </div>
            <div className="footer-nav_rpz">
              <a href="https://botleague.in/Contact-Us/">Contact Us</a>
              <a href="https://botleague.in/About-Us/">About Us</a>
            </div>
          </div>

          <div className="footer-social_rpz">
            {/* Instagram */}
            <a href="https://www.instagram.com/botleague/#" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://api.whatsapp.com/send/?phone=917775969089" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
            </a>
            {/* YouTube */}
            <a href="https://www.youtube.com/@botleague-w5g" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
              </svg>
            </a>
            {/* Email */}
            <a href="mailto:contact@botleague.in" className="social-icon_rpz">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-line_rpz" />
        <p className="footer-text_rpz">© 2026 BotLeauge. All rights reserved.</p>
      </footer>
    </>
  );
}