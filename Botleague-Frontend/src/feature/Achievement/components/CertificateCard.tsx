import { useState } from "react"
import { Award, Download, ShieldCheck, Medal } from "lucide-react"
import { CATEGORY_LABELS, type IssuedCertificate } from "../../Certificates/api/certificate.api"

const POSITION_COLOR: Record<number, string> = { 1: "#eab308", 2: "#9ca3af", 3: "#b45309" }
const POSITION_LABEL: Record<number, string> = { 1: "1st Place", 2: "2nd Place", 3: "3rd Place" }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function CertificateCard({ certificate: c }: { certificate: IssuedCertificate }) {
  const [imgError, setImgError] = useState(false)
  const badgeText = c.positionSnapshot
    ? (POSITION_LABEL[c.positionSnapshot] ?? `#${c.positionSnapshot}`)
    : c.category ? CATEGORY_LABELS[c.category as keyof typeof CATEGORY_LABELS] ?? c.category : null

  return (
    <div className="bl-card">
      <div className="bl-card-image-wrap">
        {!imgError && c.imageUrl ? (
          <img src={c.imageUrl} alt={c.certificateLabel ?? c.eventName ?? "Certificate"} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="bl-card-image-fallback"><Award size={48} /></div>
        )}
        {badgeText && (
          <span className={"bl-card-badge" + (c.category === "WINNER" ? " bl-badge-winner" : "")} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {c.positionSnapshot && POSITION_COLOR[c.positionSnapshot] && <Medal size={12} color={POSITION_COLOR[c.positionSnapshot]} />}
            {badgeText}
          </span>
        )}
      </div>

      <div className="bl-card-body">
        <div className="bl-card-event">{c.eventName ?? "BotLeague Event"}</div>
        <div className="bl-card-sport">{c.eventSportName ?? "Competition"}{c.robotName ? ` · ${c.robotName}` : ""}</div>
      </div>

      <div className="bl-card-meta">
        <div>
          <div className="bl-card-meta-label">Issued</div>
          <div className="bl-card-meta-value">{formatDate(c.issuedAt)}</div>
        </div>
        <div className="bl-card-meta-num">{c.certificateNumber}</div>
      </div>

      {c.status === "REVOKED" ? (
        <div className="bl-card-revoked">Revoked{c.revokedReason ? `: ${c.revokedReason}` : ""}</div>
      ) : (
        <div className="bl-card-actions">
          <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="bl-card-btn">
            <Download size={13} /> Download
          </a>
          <a href={c.verificationUrl} target="_blank" rel="noreferrer" className="bl-card-btn bl-card-btn-outline">
            <ShieldCheck size={13} /> Verify
          </a>
        </div>
      )}
    </div>
  )
}
