import { useEffect, useState } from "react"
import { getMyCertificates, type IssuedCertificate } from "../../Certificates/api/certificate.api"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const POSITION_LABEL: Record<number, string> = { 1: "🥇 1st Place", 2: "🥈 2nd Place", 3: "🥉 3rd Place" }

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyCertificates()
      .then(setCertificates)
      .catch(() => setError("Failed to load certificates"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Certificates</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${certificates.length} certificate${certificates.length !== 1 ? "s" : ""} earned`}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading certificates…</div>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <div className="text-5xl mb-4">📜</div>
          <h2 className="text-lg font-semibold text-white mb-2">No certificates yet</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Certificates appear here once an event organizer generates them after results are finalized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {certificates.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 p-6 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-yellow-500/5" />
              <div className="absolute top-3 right-3 text-3xl opacity-30">🏆</div>

              <div className="relative">
                <p className="text-xs text-yellow-500/70 uppercase tracking-widest font-semibold mb-3">
                  {c.certificateLabel ?? "Certificate of Achievement"}
                </p>
                <h2 className="text-xl font-bold text-white mb-1">{c.eventName ?? "BotLeague Event"}</h2>
                <p className="text-sm text-gray-400 mb-1">
                  {c.eventSportName ?? "Competition"}{c.robotName ? ` · ${c.robotName}` : ""}
                </p>
                {c.positionSnapshot && (
                  <p className="text-sm text-yellow-400 font-semibold mb-2">
                    {POSITION_LABEL[c.positionSnapshot] ?? `#${c.positionSnapshot}`}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-gray-600">Issued</p>
                    <p className="text-sm text-gray-300">{formatDate(c.issuedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Certificate No.</p>
                    <p className="font-mono text-xs text-gray-500">{c.certificateNumber}</p>
                  </div>
                </div>

                {c.status === "REVOKED" ? (
                  <p className="mt-3 text-xs font-semibold text-red-400">Revoked{c.revokedReason ? `: ${c.revokedReason}` : ""}</p>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-semibold py-2 transition-colors"
                    >
                      Download PDF
                    </a>
                    <a
                      href={c.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold py-2 transition-colors"
                    >
                      Verify
                    </a>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-yellow-500/15">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500/50 to-transparent" />
                    <span className="text-xs text-yellow-500/50">BotLeague</span>
                    <div className="h-0.5 flex-1 bg-gradient-to-l from-yellow-500/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
