import "./office.css";

const officeImg = "/home-img/office.webp";

function OfficeSection() {
  return (
    <section className="cu-office-section">
      <div className="cu-container">

        <div className="cu-office-card">
          <div className="cu-office-left">
            <h2>Visit Our Office</h2>
            <h4>Address</h4>
            <p>
              Second Floor, Manik Padma Smruti,
              <br />
              Ganraj Chowk, Lalit Estate, Baner,
              <br />
              Pune, Maharashtra 411045
            </p>
          </div>

          <img src={officeImg} className="cu-office-image" alt="BotLeague Office" />
        </div>

        <div className="cu-info-card">
          <div className="cu-info-left">
            <span className="cu-small-title">Contact Info</span>
            <h2>
              We are always
              <br />
              happy to assist you
            </h2>
          </div>

          <div className="cu-info-right">
            <div className="cu-info-box">
              <h5>Email Address</h5>
              <h6>contact@botleague.in</h6>
              <p>
                Assistance hours:
                <br />
                Monday - Friday 6 am to 8 pm EST
              </p>
            </div>

            <div className="cu-info-box">
              <h5>Number</h5>
              <h6>+91 77759 69089</h6>
              <p>
                Assistance hours:
                <br />
                Monday - Friday 6 am to 8 pm EST
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default OfficeSection;