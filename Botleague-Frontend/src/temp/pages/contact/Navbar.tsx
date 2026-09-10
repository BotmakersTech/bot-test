import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/BrandLogo/BotLeagu-black.png";
import "./navbar.css";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Techfests", to: "/browse-events" },
  { label: "Contact Us", to: "/contact-us" },
  { label: "About Us", to: "/about-us" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`cu-nav${scrolled ? " cu-nav-scrolled" : ""}`}>
      <Link to="/" className="cu-nav-logo">
        <img src={logo} alt="BotLeague" />
      </Link>

      <ul className={`cu-nav-links${open ? " cu-nav-open" : ""}`}>
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>
          </li>
        ))}
        <li>
          <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
        </li>
      </ul>

      <button
        type="button"
        className="cu-nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ transform: open ? "rotate(45deg) translate(6px,6px)" : "none" }} />
        <span style={{ opacity: open ? 0 : 1 }} />
        <span style={{ transform: open ? "rotate(-45deg) translate(6px,-6px)" : "none" }} />
      </button>
    </nav>
  );
}

export default Navbar;
