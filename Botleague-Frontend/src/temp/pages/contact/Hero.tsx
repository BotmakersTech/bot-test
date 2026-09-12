import { FaArrowRight } from "react-icons/fa";
// import Navbar from "./Navbar";
import "../../../styles/aboutUs.css";

function Hero() {
  const scrollToContent = () => {
    document.getElementById("cu-get-in-touch")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bl-about">
      <header className="bl-hero text-center px-4">
        <div className="mx-auto max-w-[900px] py-16 md:py-20">
          <h1 className="bl-hero-title">Contact Us</h1>
          <p className="bl-hero-sub mx-auto">
            Got a question about rules, arena specs, or partnering with BotLeague for your
            next competition? Reach out — we're happy to help you get it off the ground.
          </p>

          <button type="button" className="cu-explore-btn mt-8" onClick={scrollToContent}>
            <div className="cu-circle">
              <FaArrowRight />
            </div>
            <span>EXPLORE</span>
          </button>
        </div>
      </header>
    </div>
  );
}

export default Hero;