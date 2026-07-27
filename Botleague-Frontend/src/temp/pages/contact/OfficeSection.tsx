import "./office.css";

// Served from /public — see the note in Hero.tsx for why this is a string,
// not an import.
const officeImg = "/home-img/office.webp";

function OfficeSection() {
  return (
    <section className="cu-office-section">
      <div className="cu-container">

        {/* Office Card */}
        <div className="cu-office-card">
          <div className="cu-office-left">
            <h2>Visit Our Office</h2>
            <h4>Address</h4>
            <p>
              Second Floor, Manik Padma Smruti,
              <br />
              Ganraj Chowk, Lalit Estate,
              <br />
              Baner, Pune,
              <br />
              Maharashtra 411045
            </p>
          </div>

          <img src={officeImg} className="cu-office-image" alt="BotLeague Office" />
        </div>

        {/* Contact Info */}
        <div className="cu-info-card">
          <div>
            <span className="cu-small-title">Contact Info</span>
            <h2>
              We are always
              <br />
              happy to assist you
            </h2>
          </div>

          <div className="cu-info-box">
            <h5>Email Address</h5>
            <div className="cu-info-line" />
            <h6>contact@botleague.in</h6>
            <p>
              Monday - Friday
              <br />
              6 AM - 8 PM
            </p>
          </div>

          <div className="cu-info-box">
            <h5>Number</h5>
            <div className="cu-info-line" />
            <h6>+91 77759 69089</h6>
            <p>
              Monday - Friday
              <br />
              6 AM - 8 PM
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

export default OfficeSection;
