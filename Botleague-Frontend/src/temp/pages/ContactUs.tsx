import { useState, useEffect } from "react";

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
    position: fixed; top: 0; left: 0; height: 4px;
    background: linear-gradient(90deg, var(--primary-red), #ff7676);
    z-index: 1001; width: 0%; transition: width 0.1s ease;
  }

  /* ── Back to Top ── */
  .back-to-top {
    position: fixed; bottom: 30px; right: 30px;
    width: 50px; height: 50px;
    background: var(--primary-red); color: white;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; cursor: pointer;
    opacity: 0; visibility: hidden;
    transition: all 0.3s ease; z-index: 999;
    box-shadow: 0 5px 20px rgba(255,76,76,0.4);
    border: none;
  }
  .back-to-top.visible { opacity: 1; visibility: visible; }
  .back-to-top:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(255,76,76,0.6); }

  /* ── Nav ── */
  nav {
    position: fixed; top: 0; left: 0; width: 100%;
    background: rgba(10,10,10,0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 5%; z-index: 1000;
    transition: all 0.3s ease;
    border-bottom: 1px solid var(--border-color);
  }
  nav.scrolled {
    background: rgba(10,10,10,0.98);
    border-bottom-color: var(--border-color);
    box-shadow: 0 5px 30px rgba(255,76,76,0.1);
  }
  nav .container {
    display: flex; justify-content: space-between; align-items: center;
    max-width: 1400px; margin: 0 auto;

  }
  .logo { display: flex; align-items: center; cursor: pointer; }
  .logo img { height: 50px; width: auto; filter: drop-shadow(0 0 10px rgba(255,76,76,0.3)); }

  .nav-links { display: flex; list-style: none; gap: 2.5rem; align-items: center; }
  .nav-links li a {
    color: var(--text-primary); text-decoration: none; font-weight: 600;
    font-size: 1rem; text-transform: uppercase; letter-spacing: 1px;
    transition: all 0.3s ease; position: relative;
  }
  .nav-links li a::after {
    content: ''; position: absolute; bottom: -5px; left: 0;
    width: 0; height: 2px; background: var(--primary-red); transition: width 0.3s ease;
  }
  .nav-links li a:hover { color: var(--primary-red); }
  .nav-links li a:hover::after { width: 100%; }

  .mobile-menu-toggle {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; z-index: 1001; background: none; border: none;
  }
  .mobile-menu-toggle span {
    width: 28px; height: 3px; background: var(--primary-red);
    transition: all 0.3s ease; border-radius: 3px; display: block;
  }
  .mobile-menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(8px, 8px); }
  .mobile-menu-toggle.active span:nth-child(2) { opacity: 0; }
  .mobile-menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(7px, -7px); }

  /* ── Hero ── */
  .hero {
    position: relative; padding: 0; background: var(--dark-bg);
    overflow: hidden; height: 80vh; min-height: 400px;
    display: flex; align-items: center; justify-content: center;
    margin-top: 70px;
  }
  .hero img {
    object-position: bottom center;
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .hero-content {
    position: absolute; bottom: 0%; left: 50%;
    transform: translate(-50%); z-index: 2; text-align: center;
  }
  .hero h1 {
    font-size: 5rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 3px; margin-bottom: 0;
    background: linear-gradient(135deg, #FF4C4C 0%, #ff7676 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* ── Intro ── */
  .intro-section { padding: 4rem 5% 15px; background: var(--dark-bg); }
  .intro-content { max-width: 1000px; margin: 0 auto; text-align: center; }
  .intro-text { font-size: 2.5rem; color: var(--text-secondary); line-height: 1.8; font-weight: 700; }

  /* ── Section ── */
  .section { padding: 2rem 5% 1rem; max-width: 1400px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; position: relative; }
  .section-header::after {
    content: ''; position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%);
    width: 250px; height: 4px;
    background: linear-gradient(90deg, transparent, var(--primary-red), transparent);
  }
  .section-header h2 {
    font-size: 3rem; font-weight: 900; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 1rem; color: var(--primary-red);
  }

  /* ── Contact Cards ── */
  .contact-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 2.5rem; margin-bottom: 2rem;
  }
  .contact-card {
    background: rgba(255,76,76,0.05); padding: 3rem 2rem 1.5rem;
    border: 2px solid var(--border-color); border-radius: 12px;
    text-align: center; transition: all 0.3s ease;
    position: relative; overflow: hidden;
  }
  .contact-card::before {
    content: ''; position: absolute; top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,76,76,0.1), transparent);
    transition: left 0.5s ease;
  }
  .contact-card:hover::before { left: 100%; }
  .contact-card:hover {
    transform: translateY(-10px);
    border-color: var(--primary-red);
    background: rgba(255,76,76,0.1);
    box-shadow: 0 20px 60px rgba(255,76,76,0.3);
  }
  .contact-icon {
    width: 90px; height: 90px; margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, var(--primary-red), #ff7676);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem; box-shadow: 0 10px 30px var(--glow-red);
  }
  .contact-card h3 {
    font-size: 1.6rem; font-weight: 800; color: var(--text-primary);
    margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;
  }
  .contact-card p { font-size: 1rem; color: var(--text-tertiary); margin-bottom: 1.5rem; line-height: 1.6; }
  .contact-link {
    display: inline-block; color: var(--primary-red); text-decoration: none;
    font-size: 1.1rem; font-weight: 600; margin: 1.5rem 0; transition: all 0.3s ease;
  }
  .contact-link:hover { color: #ff7676; transform: translateX(5px); }
  .call-btn {
    color: #fff; background: #FF4C4C; padding: 10px 15px;
    border-radius: 5px; text-decoration: none; display: inline-block;
    transition: all 0.3s ease;
  }
  .call-btn:hover { background: #cc0000; }

  /* ── Location ── */
  .location-section { padding: 2rem 5% 1rem; background: var(--dark-bg); }
  .location-container {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 4rem; align-items: center;
    border: 2px solid var(--border-color);
    padding: 25px 15px; border-radius: 15px;
  }
  .location-info h2 {
    font-size: 2.5rem; font-weight: 900; color: var(--primary-red);
    text-align: center; text-transform: uppercase; margin-bottom: 2rem;
  }
  .location-details { display: flex; flex-direction: column; gap: 1.5rem; }
  .location-item { display: flex; align-items: flex-start; gap: 1.5rem; }
  .location-item-icon {
    width: 50px; height: 50px;
    background: linear-gradient(135deg, var(--primary-red), #ff7676);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
  }
  .location-item-text h4 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
  .location-item-text p { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; }
  .location-image {
    width: 100%; height: 500px; border-radius: 12px; overflow: hidden;
    border: 2px solid var(--border-color);
    box-shadow: 0 20px 60px rgba(255,76,76,0.2);
    background: var(--dark-secondary);
  }
  .location-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
  .location-image:hover img { transform: scale(1.05); }

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
    .hero { margin-top: 70px; }
    .hero h1 { font-size: 3.5rem; }
    .contact-grid { grid-template-columns: 1fr; }
    .location-container { grid-template-columns: 1fr; gap: 3rem; }
    .location-image { height: 400px; }
  }

  @media (max-width: 768px) {
    nav .container { padding: 0; }
    .nav-links {
      position: fixed; top: 0; right: -100%; width: 70%; height: 100vh;
      background: rgba(10,10,10,0.98); flex-direction: column;
      justify-content: center; align-items: center; gap: 2rem;
      transition: right 0.3s ease; border-left: 2px solid var(--border-color);
    }
    .nav-links.active { right: 0; }
    .mobile-menu-toggle { display: flex; }
    .hero { height: 50vh; min-height: 300px; margin-top: 70px; }
    .hero h1 { font-size: 3rem; }
    .intro-text { font-size: 1.1rem; }
    .section { padding: 3rem 5% 1rem; }
    .section-header h2 { font-size: 2rem; }
  }

  @media (max-width: 550px) {
    .hero { height: 40vh; min-height: 250px; }
    .hero h1 { font-size: 2.2rem; }
    .intro-text { font-size: 1rem; }
    .section-header h2 { font-size: 1.8rem; }
    .logo img { height: 40px; }
    .nav-links { width: 85%; }
    .footer-top_rpz { flex-direction: column; gap: 30px; }
    .footer-nav-container_rpz { flex-direction: row; gap: 25px; text-align: center; }
    .footer-nav_rpz { align-items: center; font-size: 0.85rem; gap: 12px; }
    .social-icon_rpz { width: 45px; height: 45px; }
    .social-icon_rpz svg { width: 20px; height: 20px; }
    .footer-text_rpz { font-size: 0.8rem; }
    .footer-logo-text_rpz { font-size: 1.5rem; }
  }
`;

// ─── Contact cards data ───────────────────────────────────────────────────────
const CONTACT_CARDS = [
  {
    icon: "📧",
    title: "General Enquiries & Information",
    desc: "For general questions and information about BotLeague",
  },
  {
    icon: "🤝",
    title: "Event Hosting & Partnerships",
    desc: "Interested in hosting events or partnering with us?",
  },
  {
    icon: "🎓",
    title: "Student & Team Support",
    desc: "Technical support and assistance for participants",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ContactUs() {
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
            <img src="../logo/bot.png" alt="BotLeague Logo" />
          </div>

          <ul className={`nav-links${menuOpen ? " active" : ""}`}>
          <li><a href="/register" onClick={() => setMenuOpen(false)}>Create Team</a></li>
            <li>
              <a
                href="https://api.whatsapp.com/send/?phone=917775969089"
                onClick={() => setMenuOpen(false)}
              >
                Host
              </a>
            </li>
            <li>
              <a
                href="mailto:contact@botleague.in"
                onClick={() => setMenuOpen(false)}
              >
                Partner
              </a>
            </li>
            <li>
              <a
                href="/Contact-Us"
                onClick={() => setMenuOpen(false)}
              >
                Contact us
              </a>
            </li>
            <li>
              <a
                href="/About-Us"
                onClick={() => setMenuOpen(false)}
              >
                About us
              </a>
            </li>
          </ul>

          <button
            className={`mobile-menu-toggle${menuOpen ? " active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <img src="../../../public/home-img/contact.png" alt="Contact Us Background" />
        <div className="hero-content">
          <h1>Contact Us</h1>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="intro-section">
        <div className="intro-content">
          <p className="intro-text">
            Have a question? Want to compete, host an event, or partner with us?
            We're here to help.
          </p>
        </div>
      </section>

      {/* ── Get In Touch ── */}
      <section className="section">
        <div className="section-header">
          <h2>Get In Touch</h2>
        </div>
        <div className="contact-grid">
          {CONTACT_CARDS.map((card) => (
            <div className="contact-card" key={card.title}>
              <div className="contact-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <a href="mailto:contact@botleague.in" className="contact-link">
                contact@botleague.in
              </a>
              <br />
              <a href="tel:+917775969089" className="call-btn">
                Call +91 77759 69089
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Office Location ── */}
      <section className="location-section">
        <div className="location-container">
          <div className="location-info">
            <h2>Visit Our Office</h2>
            <div className="location-details">
              <div className="location-item">
                <div className="location-item-icon">📍</div>
                <div className="location-item-text">
                  <h4>Address</h4>
                  <p>
                    Second Floor, Manik Padma Smruti,
                    <br />
                    Ganraj chowk, Lalit Estate, Baner,
                    <br />
                    Pune, Maharashtra 411045
                  </p>
                </div>
              </div>
              <div className="location-item">
                <div className="location-item-icon">⏰</div>
                <div className="location-item-text">
                  <h4>Our Contact</h4>
                  <p>Phone: +91 77759 69089</p>
                  <p>Email: contact@botleague.in</p>
                </div>
              </div>
            </div>
          </div>

          <div className="location-image">
            <img src="../../../public/home-img/office.webp" alt="Office Location" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer_rpz">
        <div className="footer-top_rpz">
          <div className="footer-logo_rpz">
            <div className="footer-logo-section_rpz">
              <div className="footer-logo-text_rpz">
                <img src="../../../public/logo/bot.png" alt="Bot-League Logo" />
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
            <a
              href="https://www.instagram.com/botleague/#"
              className="social-icon_rpz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramSVG />
            </a>
            <a
              href="https://api.whatsapp.com/send/?phone=917775969089"
              className="social-icon_rpz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppSVG />
            </a>
            <a
              href="https://www.youtube.com/@botleague-w5g"
              className="social-icon_rpz"
              target="_blank"
              rel="noopener noreferrer"
            >
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