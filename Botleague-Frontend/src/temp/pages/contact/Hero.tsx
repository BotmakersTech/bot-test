import { FaArrowRight } from "react-icons/fa";
import Navbar from "./Navbar";
import "./hero.css";

// Served from /public — Vite serves public/ assets at the site root, so this
// is a URL string, not a build-time import (importing a path under public/
// as an ES module doesn't work the way it does for files under src/assets/).
const bg = "/home-img/contact.png";

function Hero() {
  const scrollToContent = () => {
    document.getElementById("cu-get-in-touch")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="cu-hero-section"
      style={{ background: `url(${bg}) center/cover no-repeat` }}
    >
      <Navbar />

      <div className="cu-overlay">
        <div className="cu-hero-content">
          <h1>Contact Us</h1>

          <button type="button" className="cu-explore-btn" onClick={scrollToContent}>
            <div className="cu-circle">
              <FaArrowRight />
            </div>
            <span>EXPLORE</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
