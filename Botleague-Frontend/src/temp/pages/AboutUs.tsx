import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";

// ─── Footer Social SVGs ───────────────────────────────────────────────────────
const InstagramSVG = () => (
  <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </svg>
);

const WhatsAppSVG = () => (
  <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const YouTubeSVG = () => (
  <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
  </svg>
);

const EmailSVG = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    position: fixed; top: 0; left: 0; height: 3px;
    background: linear-gradient(90deg, var(--primary-red), #ff7676);
    z-index: 1001; transition: width 0.1s ease;
  }

  /* ── Back to Top ── */
  .back-to-top {
    position: fixed; bottom: 30px; right: 30px;
    width: 50px; height: 50px;
    background: var(--primary-red); color: white;
    border: none; border-radius: 50%; font-size: 1.5rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    opacity: 0; visibility: hidden; transition: all 0.3s ease;
    z-index: 999; box-shadow: 0 5px 20px rgba(255,76,76,0.4);
  }
  .back-to-top.visible { opacity: 1; visibility: visible; }
  .back-to-top:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(255,76,76,0.6); }

  /* ── Nav ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0;
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(10px);
    z-index: 1000; padding: 1rem 5%;
    border-bottom: 1px solid var(--border-color);
    transition: all 0.3s ease;
  }
  nav.scrolled {
    background: rgba(10,10,10,0.98);
    box-shadow: 0 5px 20px rgba(255,76,76,0.1);
  }
  .container {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 1400px; margin: 0 auto;
  }
  .logo { font-size: 1.8rem; font-weight: 900; color: var(--primary-red); text-transform: uppercase; letter-spacing: 2px; cursor: pointer; }
  .logo img { height: 50px; width: auto; }

  .nav-links { display: flex; list-style: none; gap: 2rem; align-items: center; }
  .nav-links a {
    color: var(--text-secondary); text-decoration: none; font-weight: 600;
    font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px;
    transition: all 0.3s ease; position: relative;
  }
  .nav-links a::after {
    content: ''; position: absolute; bottom: -5px; left: 0;
    width: 0; height: 2px; background: var(--primary-red); transition: width 0.3s ease;
  }
  .nav-links a:hover { color: var(--primary-red); }
  .nav-links a:hover::after { width: 100%; }

  .mobile-menu-toggle {
    display: none; flex-direction: column; cursor: pointer;
    gap: 5px; z-index: 1001; background: none; border: none;
  }
  .mobile-menu-toggle span {
    width: 30px; height: 3px; background: var(--primary-red);
    transition: all 0.3s ease; border-radius: 3px; display: block;
  }
  .mobile-menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(8px, 8px); }
  .mobile-menu-toggle.active span:nth-child(2) { opacity: 0; }
  .mobile-menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(8px, -8px); }

  /* ── Hero ── */
  .hero {
    position: relative; padding-top: 105px; background: var(--dark-bg);
    overflow: hidden; height: 90vh; min-height: 400px;
    display: flex; align-items: center; justify-content: center;
  }
  .hero img {
    opacity: 0.75; width: 100%; object-position: top center;
    height: 100%; object-fit: cover; display: block;
  }
  .hero-content {
    position: absolute; bottom: -10%; left: 50%;
    transform: translate(-50%, -50%); z-index: 2; text-align: center;
  }
  .hero h1 {
    font-size: 5rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 3px; margin-bottom: 0;
    background: linear-gradient(135deg, #FF4C4C 0%, #ff7676 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* ── Section ── */
  .section { padding: 5rem 5% 1rem; max-width: 1400px; margin: 0 auto; }
  .section-alt { background: linear-gradient(135deg, var(--dark-tertiary) 0%, var(--dark-secondary) 100%); }

  .section-header { text-align: center; margin-bottom: 3rem; }

  .heading-contect { position: relative; font-size: 3rem; }
  .heading-contect::after {
    content: ''; position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%);
    width: 250px; height: 4px;
    background: linear-gradient(90deg, transparent, var(--primary-red), transparent);
  }

  .section-header h2 {
    font-size: 3rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 1rem; color: var(--primary-red);
  }

  .content-text { font-size: 1.15rem; color: var(--text-secondary); line-height: 1.9; margin-bottom: 2rem; }

  /* ── Story Grid ── */
  .story-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center; margin-bottom: 2rem;
  }
  .story-content { display: flex; flex-direction: column; gap: 1.5rem; }
  .story-image {
    width: 100%; height: 400px; border-radius: 12px; overflow: hidden;
    border: 3px solid var(--primary-red);
    box-shadow: 0 20px 60px rgba(255,76,76,0.3); position: relative;
  }
  .story-image::before {
    content: ''; position: absolute; inset: 0; border-radius: 10px; padding: 3px;
    background: linear-gradient(135deg, var(--primary-red), #ff7676);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    opacity: 0; transition: opacity 0.3s ease;
  }
  .story-image:hover::before { opacity: 1; }
  .story-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
  .story-image:hover img { transform: scale(1.05); }

  /* ── Image Content Layout ── */
  .image-content-layout {
    display: grid; grid-template-columns: 400px 1fr;
    gap: 4rem; align-items: start;
  }
  .feature-image {
    width: 100%; height: 100%; border-radius: 12px; overflow: hidden;
    border: 3px solid var(--primary-red);
    box-shadow: 0 20px 60px rgba(255,76,76,0.3);
    position: sticky; top: 120px;
  }
  .feature-image img { width: 100%; height: 100%; object-fit: cover; }

  /* ── Responsive image toggle ── */
  .img-desktop { display: block; }
  .img-mobile { display: none; }

  /* ── Vision Mission ── */
  .vm-container { max-width: 1200px; margin: 0 auto; text-align: center; padding-bottom: 50px; }
  .vm-grid {
    display: grid; grid-template-columns: 1fr auto 1fr;
    gap: 4rem; align-items: center; margin-bottom: 4rem;
  }
  .vm-item h3 {
    font-size: 2.5rem; font-weight: 900; color: var(--primary-red);
    margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 2px;
  }
  .vm-item p { font-size: 1.15rem; color: var(--text-secondary); line-height: 1.8; max-width: 500px; margin: 0 auto; }
  .vm-divider {
    width: 2px; height: 200px;
    background: linear-gradient(to bottom, transparent, var(--primary-red), transparent);
  }
  .vm-cta { margin-top: 3rem; }
  .btn-explore {
    padding: 1.3rem 4rem; font-size: 1.1rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 2px;
    background: linear-gradient(135deg, var(--primary-red) 0%, #cc0000 100%);
    color: var(--text-primary); border: none; border-radius: 50px;
    cursor: pointer; transition: all 0.3s ease; text-decoration: none;
    display: inline-block; font-family: 'Exo 2', sans-serif;
    box-shadow: 0 10px 30px rgba(255,76,76,0.4);
  }
  .btn-explore:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(255,76,76,0.6); }

  /* ── Values Grid ── */
  .values-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 2.5rem; }
  .value-card {
    background: rgba(255,76,76,0.05); padding: 1rem 2.5rem;
    border: 1px solid var(--border-color); border-radius: 8px;
    text-align: center; transition: all 0.3s ease;
  }
  .value-card:hover { transform: translateY(-5px); border-color: var(--primary-red); background: rgba(255,76,76,0.1); }
  .value-icon {
    width: 80px; height: 80px; margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, var(--primary-red), #ff7676);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem; box-shadow: 0 10px 30px var(--glow-red);
  }
  .value-icon img { max-width: 70%; }
  .value-card h4 { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; text-transform: uppercase; }

  /* ── Footer ── */
  .footer_rpz { background-color: #000; color: white; padding: 40px 20px 20px; font-family: 'Exo 2', sans-serif; }
  .footer-top_rpz { display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 30px; }
  .footer-logo_rpz { display: flex; align-items: center; flex-direction: column; gap: 12px; }
  .footer-logo-section_rpz { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .footer-logo-text_rpz { display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; gap: 4px; max-width: 350px; }
  .footer-logo-text_rpz img { width: 100%; }
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
    .hero h1 { font-size: 3.5rem; }
    .section-header h2 { font-size: 2.5rem; }
    .values-grid { grid-template-columns: repeat(2,1fr); }
    .story-grid { grid-template-columns: 1fr; gap: 2rem; }
    .image-content-layout { grid-template-columns: 1fr; gap: 3rem; }
    .feature-image { position: relative; top: 0; height: 400px; }
    .vm-grid { grid-template-columns: 1fr; gap: 3rem; }
    .vm-divider { width: 200px; height: 2px; background: linear-gradient(to right, transparent, var(--primary-red), transparent); justify-self: center; }
    .heading-contect { font-size: 2.5rem; }
  }

  @media (max-width: 768px) {
    .mobile-menu-toggle { display: flex; }
    .nav-links {
      position: fixed; top: 0; right: -100%; height: 100vh;
      width: 70%; max-width: 300px;
      background: rgba(10,10,10,0.98); backdrop-filter: blur(10px);
      flex-direction: column; justify-content: flex-start;
      padding: 100px 2rem 2rem; gap: 1.5rem;
      transition: right 0.3s ease;
      border-left: 1px solid var(--border-color);
      box-shadow: -5px 0 20px rgba(0,0,0,0.5);
    }
    .nav-links.active { right: 0; }
    .nav-links a { font-size: 1.1rem; width: 100%; padding: 0.5rem 0; }
    .nav-links a::after { bottom: 0; }
    .hero { padding-top: 80px; height: 50vh; min-height: 300px; }
    .hero h1 { font-size: 3rem; }
    .section { padding: 3rem 5% 1rem; }
    .section-header h2 { font-size: 2rem; }
    .story-image, .feature-image { height: 300px; }
    .vm-item h3 { font-size: 2rem; }
    .vm-item p { font-size: 1rem; }
    .vm-grid { gap: 2rem; }
    .values-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
    .img-desktop { display: none !important; }
    .img-mobile { display: block !important; }
  }

  @media (max-width: 550px) {
    .logo img { height: 40px; }
    .hero { height: 40vh; min-height: 250px; }
    .hero h1 { font-size: 2.2rem; }
    .section { padding: 2rem 5% 1rem; }
    .section-header h2 { font-size: 1.8rem; }
    .heading-contect { font-size: 1.5rem; }
    .heading-contect::after { width: 150px; }
    .vm-item h3 { font-size: 1.8rem; }
    .vm-divider { width: 150px; }
    .btn-explore { padding: 1rem 2.5rem; font-size: 0.95rem; }
    .story-image, .feature-image { height: 250px; }
    .content-text { font-size: 1rem; }
    .value-card { padding: 1.5rem; }
    .value-icon { width: 60px; height: 60px; font-size: 2rem; }
    .value-card h4 { font-size: 1.1rem; }
    .back-to-top { width: 40px; height: 40px; bottom: 20px; right: 20px; font-size: 1.2rem; }
    .footer-top_rpz { flex-direction: column; gap: 30px; }
    .footer-nav-container_rpz { flex-direction: row; gap: 25px; text-align: center; }
    .footer-nav_rpz { align-items: center; font-size: 0.85rem; gap: 12px; }
    .social-icon_rpz { width: 45px; height: 45px; }
    .social-icon_rpz svg { width: 20px; height: 20px; }
    .footer-text_rpz { font-size: 0.8rem; }
    .footer-logo-text_rpz { font-size: 1.5rem; }
  }
`;

// ─── Values data ──────────────────────────────────────────────────────────────
const VALUES = [
  { icon: "⚖️", label: "Fair & Transparent Events" },
  { icon: "🛡️", label: "Safety-First Standards" },
  { icon: "📚", label: "Learning Through Competition" },
  { icon: "🏆", label: "National Recognition" },
  { icon: "📈", label: "League Rankings" },
  { icon: null, imgSrc: "../../../public/home-img/Growth.png", imgAlt: "Sustainable growth", label: "Sustainable Growth" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutUs() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      setScrolled(scrollY > 100);
      setShowTop(scrollY > 300);
      setScrollPct((scrollY / scrollHeight) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <style>{css}</style>

      {/* Scroll Progress */}
      <div className="scroll-progress" style={{ width: `${scrollPct}%` }} />

      {/* Back to Top */}
      <button
        className={`back-to-top${showTop ? " visible" : ""}`}
        onClick={scrollToTop}
      >
        ↑
      </button>

      {/* ── Nav ── */}
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="container">
          <div
            className="logo"
            onClick={() => (window.location.href = "/")}
          >
            <img src={logo} alt="BotLeague Logo" />
          </div>

          <ul className={`nav-links${menuOpen ? " active" : ""}`}>
            <li><a href="/register" onClick={() => setMenuOpen(false)}>Create Team</a></li>
            <li><a href="https://api.whatsapp.com/send/?phone=917775969089" onClick={() => setMenuOpen(false)}>Host</a></li>
            <li><a href="mailto:contact@botleague.in" onClick={() => setMenuOpen(false)}>Partner</a></li>
            <li><a href="/Contact-Us" onClick={() => setMenuOpen(false)}>Contact Us</a></li>
            <li><a href="/About-Us" onClick={() => setMenuOpen(false)}>About Us</a></li>
          </ul>

          <button
            className={`mobile-menu-toggle${menuOpen ? " active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <img src="../../../public/home-img/about.png" alt="About Us Background" />
        <div className="hero-content">
          <h1>About Us</h1>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className="section">
        <div className="story-grid">
          <div className="story-content">
            <p className="content-text">
              India has always had strong technical talent and passion for robotics. However, competitions have remained fragmented — with different rules, inconsistent judging standards, safety gaps, and no clear progression path for participants. BotLeague was built to solve this.
            </p>
            <p className="content-text">
              By introducing a single national rulebook, league-based competition structure, and professionally managed arenas, BotLeague ensures that every participant competes on a transparent, safe, and equal platform, regardless of location.
            </p>
          </div>
          <div className="story-image">
            <img src="../../../public/home-img/about-us.png" alt="Robotics Competition Arena" />
          </div>
        </div>

        <div
          className="content-text heading-contect"
          style={{
            fontWeight: 700,
            color: "var(--primary-red)",
            textAlign: "center",
            marginTop: "3rem",
          }}
        >
          This is not just an event platform. This is a league.
        </div>
      </section>

      {/* ── Vision & Mission ── */}
      <section className="section section-alt">
        <div className="vm-container">
          <div className="vm-grid">
            <div className="vm-item">
              <h3>Vision</h3>
              <p>
                To build India's most trusted and unified robotics competition ecosystem, enabling innovation, skill development, and global exposure through structured competitive pathways.
              </p>
            </div>

            <div className="vm-divider" />

            <div className="vm-item">
              <h3>Mission</h3>
              <p>
                To create age-wise and skill-wise competition categories, To ensure fair play, safety, and transparent judging, To connect Indian robotics talent with national and global opportunities
              </p>
            </div>
          </div>

          <div className="vm-cta">
            <a href="/" className="btn-explore">Explore More</a>
          </div>
        </div>
      </section>

      {/* ── What BotLeague Represents ── */}
      <section className="section">
        <div className="section-header heading-contect">
          <h2>What BotLeague Represents</h2>
        </div>

        <div className="image-content-layout">
          {/* Desktop / Mobile responsive images */}
          <div className="feature-image" style={{ width: "100%", textAlign: "center" }}>
            <img
              src="../../../public/home-img/what.png"
              alt="Students building robots - desktop"
              className="img-desktop"
              style={{ display: "block", margin: "auto" }}
            />
            <img
              src="../../../public/home-img/about-mob.png"
              alt="Students building robots - mobile"
              className="img-mobile"
              style={{ display: "none", margin: "auto" }}
            />
          </div>

          {/* Values Grid */}
          <div className="values-grid">
            {VALUES.map((v) => (
              <div className="value-card" key={v.label}>
                <div className="value-icon">
                  {v.icon ? (
                    v.icon
                  ) : (
                    <img src={v.imgSrc} alt={v.imgAlt} />
                  )}
                </div>
                <h4>{v.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer_rpz">
        <div className="footer-top_rpz">
          <div className="footer-logo_rpz">
            <div className="footer-logo-section_rpz">
              <div className="footer-logo-text_rpz">
                <img src={logo} alt="Bot-League Logo" />
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
            <a href="https://www.instagram.com/botleague/#" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <InstagramSVG />
            </a>
            <a href="https://api.whatsapp.com/send/?phone=917775969089" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <WhatsAppSVG />
            </a>
            <a href="https://www.youtube.com/@botleague-w5g" className="social-icon_rpz" target="_blank" rel="noopener noreferrer">
              <YouTubeSVG />
            </a>
            <a href="mailto:contact@botleague.in" className="social-icon_rpz">
              <EmailSVG />
            </a>
          </div>
        </div>

        <div className="footer-line_rpz" />
        <p className="footer-text_rpz">© 2026 BotLeauge. All rights reserved.</p>
      </footer>
    </>
  );
}