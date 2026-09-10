import { useEffect, useState } from "react"
import { LayoutGrid, List, Download, Award, Search, CheckCircle2, XCircle } from "lucide-react"
import { getMyCertificates, verifyCertificate, type IssuedCertificate, type PublicVerificationResponse } from "../../Certificates/api/certificate.api"
import CertificateCard from "../components/CertificateCard"
import "../styles/CertificatesPage.css"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const VERIFY_RESULT_COPY: Record<PublicVerificationResponse["result"], { title: string; className: string }> = {
  VALID: { title: "Certificate Verified", className: "bl-verify-result-valid" },
  REVOKED: { title: "Certificate Revoked", className: "bl-verify-result-invalid" },
  NOT_FOUND: { title: "Certificate Not Found", className: "bl-verify-result-invalid" },
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")

  // Verify-by-number — independent of the "my certificates" list above, so
  // it also works for a certificate someone else shared (not necessarily
  // one of the logged-in user's own).
  const [verifyNumber, setVerifyNumber] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<PublicVerificationResponse | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    getMyCertificates()
      .then(setCertificates)
      .catch(() => setError("Failed to load certificates"))
      .finally(() => setLoading(false))
  }, [])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const number = verifyNumber.trim()
    if (!number) return
    setVerifying(true)
    setVerifyError(null)
    verifyCertificate(number)
      .then(setVerifyResult)
      .catch(() => setVerifyError("Could not reach the verification service — try again shortly."))
      .finally(() => setVerifying(false))
  }

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

        {/* Verify any certificate by number — separate from the "my
            certificates" list below, so it works for a certificate number
            shared by someone else too, not just the logged-in user's own. */}
        <div className="bl-verify-card">
          <p className="bl-verify-label">Verify a certificate</p>
          <form onSubmit={handleVerify} className="bl-verify-bar">
            <input
              type="text"
              value={verifyNumber}
              onChange={(e) => setVerifyNumber(e.target.value)}
              placeholder="Enter certificate number, e.g. CERT-000123"
              className="bl-verify-input"
            />
            <button type="submit" disabled={verifying || !verifyNumber.trim()} className="bl-verify-btn">
              <Search size={14} />
              {verifying ? "Checking…" : "Verify"}
            </button>
          </form>

          {verifyError && <p className="bl-verify-error">{verifyError}</p>}

          {!verifyError && verifyResult && (
            <div className={`bl-verify-result ${VERIFY_RESULT_COPY[verifyResult.result].className}`}>
              {verifyResult.result === "VALID" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <div className="bl-verify-result-text">
                <span className="bl-verify-result-title">{VERIFY_RESULT_COPY[verifyResult.result].title}</span>
                {verifyResult.result !== "NOT_FOUND" && (
                  <span className="bl-verify-result-detail">
                    {[verifyResult.recipientName, verifyResult.eventName, verifyResult.label].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="bl-state-card bl-state-error">{error}</div>
        ) : loading ? (
          <div className="bl-state-card">Loading certificates…</div>
        ) : certificates.length === 0 ? (
          <div className="bl-state-card bl-state-empty">
            <div className="bl-state-icon"><Award size={32} /></div>
            <div className="bl-state-title">No certificates yet</div>
            <p>Certificates appear here once a techfest organizer generates them after results are finalized.</p>
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
