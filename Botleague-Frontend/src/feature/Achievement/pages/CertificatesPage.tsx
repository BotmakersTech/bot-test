import { useEffect, useState } from "react"
import { LayoutGrid, List, Download, Award } from "lucide-react"
import { getMyCertificates, type IssuedCertificate } from "../../Certificates/api/certificate.api"
import CertificateCard from "../components/CertificateCard"
import "../styles/CertificatesPage.css"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")

  useEffect(() => {
    getMyCertificates()
      .then(setCertificates)
      .catch(() => setError("Failed to load certificates"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bl-page">
      <div className="bl-shape bl-shape-tl" />
      <div className="bl-shape bl-shape-br" />

      <div className="bl-content">
        <div className="bl-page-header">
          <h1 className="bl-page-title">Certificates</h1>

          {!loading && !error && certificates.length > 0 && (
            <div className="bl-toggle-group">
              <button type="button" className={"bl-toggle-btn" + (view === "grid" ? " active" : "")} onClick={() => setView("grid")}>
                <LayoutGrid size={14} /> Grid
              </button>
              <button type="button" className={"bl-toggle-btn" + (view === "list" ? " active" : "")} onClick={() => setView("list")}>
                <List size={14} /> List
              </button>
            </div>
          )}
        </div>
        <p className="bl-page-subtitle">
          {loading ? "Loading…" : `${certificates.length} certificate${certificates.length !== 1 ? "s" : ""} earned`}
        </p>

        {error ? (
          <div className="bl-state-card bl-state-error">{error}</div>
        ) : loading ? (
          <div className="bl-state-card">Loading certificates…</div>
        ) : certificates.length === 0 ? (
          <div className="bl-state-card bl-state-empty">
            <div className="bl-state-icon">📜</div>
            <div className="bl-state-title">No certificates yet</div>
            <p>Certificates appear here once an event organizer generates them after results are finalized.</p>
          </div>
        ) : view === "grid" ? (
          <div className="bl-grid">
            {certificates.map(c => (
              <CertificateCard key={c.id} certificate={c} />
            ))}
          </div>
        ) : (
          <div className="bl-list">
            {certificates.map(c => (
              <div key={c.id} className="bl-list-item">
                <div className="bl-list-main">
                  <div className="bl-list-thumb">
                    {c.imageUrl ? <img src={c.imageUrl} alt="" /> : <Award size={20} />}
                  </div>
                  <div className="bl-list-text">
                    <div className="bl-list-event">{c.eventName ?? "BotLeague Event"}</div>
                    <div className="bl-list-sport">
                      {c.eventSportName ?? "Competition"} · {formatDate(c.issuedAt)}
                    </div>
                  </div>
                </div>
                <div className="bl-list-actions">
                  {c.status === "REVOKED" ? (
                    <span className="bl-card-revoked">Revoked</span>
                  ) : (
                    <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="bl-card-btn">
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
