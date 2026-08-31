import { FaEnvelope, FaUsers, FaHandshake } from "react-icons/fa";
import "./contact.css";

const CARDS = [
  {
    icon: <FaEnvelope />,
    title: "General Enquiries & Information",
    desc: "For general questions and information about BotLeague.",
  },
  {
    icon: <FaUsers />,
    title: "Techfect Hosting & Partnerships",
    desc: "Contact us regarding techfects, competitions and registrations.",
  },
  {
    icon: <FaHandshake />,
    title: "Student & Team Support",
    desc: "Technical support and assistance for participants.",
  },
];

function ContactSection() {
  return (
    <section className="cu-contact-section" id="cu-get-in-touch">
      <div className="cu-container">
        <h2 className="cu-contact-heading">Get In Touch</h2>

        <div className="cu-contact-grid">
          {CARDS.map((card) => (
            <div className="cu-contact-card" key={card.title}>
              <div className="cu-icon-circle">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
