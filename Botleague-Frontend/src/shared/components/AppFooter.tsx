import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { ChevronUp } from "lucide-react";

import "../../styles/app-footer.css";

const LOGO_URL = "https://botleague.in/logo/bot.png";

const footerColumns = [
  {
    title: "Education",
    links: [
      "Email Marketing",
      "Social Media Marketing",
      "Search Engine Optimization",
      "Product Development",
      "Web Development",
    ],
  },
  {
    title: "Business",
    links: [
      "Digital Marketing Agency",
      "SEO Agency",
      "PPC Agency",
      "Content Marketing Agency",
      "Internet Marketing Agency",
      "Locations",
      "Industries We Serve",
    ],
  },
  {
    title: "Developer & IT",
    links: [
      "Internet Marketing",
      "Content Marketing",
      "Social Media",
      "Web Design",
      "Seo",
      "PPC",
      "Amazon",
    ],
  },
  {
    title: "Company",
    links: [
      "About us",
      "Contact us",
      "SEO Checker",
      "Tools",
      "Marketing Guides",
      "Careers",
    ],
  },
];

export default function AppFooter() {
  const handleTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="app-footer">
      <div className="app-footer-cta">
        <p>LET&apos;S FIND HARMONY TOGETHER.</p>

        <form className="app-footer-form">
          <input type="email" placeholder="Enter Email Id" aria-label="Email address" />
          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="app-footer-body">
        <button
          type="button"
          className="app-footer-top"
          aria-label="Back to top"
          onClick={handleTop}
        >
          <ChevronUp size={34} strokeWidth={3} />
        </button>

        <div className="app-footer-inner">
          <section className="app-footer-brand" aria-label="BotLeague contact details">
            <img src={LOGO_URL} alt="BotLeague" className="app-footer-logo" />
            <address>
              Second Floor, Manik Padma Smruti,<br />
              Ganraj chowk, Lalit Estate, Baner,<br />
              Pune, Maharashtra 411045
            </address>
            <p>Phone: +91 77759 69089</p>
            <p>
              Email: <a href="mailto:contact@botleague.in">contact@botleague.in</a>
            </p>

            <div className="app-footer-socials" aria-label="Social links">
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            </div>
          </section>

          <nav className="app-footer-links" aria-label="Footer navigation">
            {footerColumns.map((column) => (
              <section key={column.title} className="app-footer-column">
                <h2>{column.title}</h2>
                {column.links.map((link) => (
                  <a href="#" key={link}>{link}</a>
                ))}
              </section>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
