import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyCertificate, type PublicVerificationResponse } from "../api/certificate.api";
import logo from "../../../assets/logo-white.png";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const RESULT_COPY: Record<string, { title: string; color: string; icon: string }> = {
  VALID: { title: "Certificate Verified", color: "#1fa952", icon: "✓" },
  REVOKED: { title: "Certificate Revoked", color: "#e04b4b", icon: "✕" },
  NOT_FOUND: { title: "Certificate Not Found", color: "#e04b4b", icon: "?" },
};

export default function VerifyCertificatePage() {
  const { certificateNumber: routeCertNumber } = useParams<{ certificateNumber: string }>();
  const [certificateNumber, setCertificateNumber] = useState(routeCertNumber ?? "");
  const [result, setResult] = useState<PublicVerificationResponse | null>(null);
  const [loading, setLoading] = useState(!!routeCertNumber);
  const [error, setError] = useState<string | null>(null);

  const runVerify = (number: string) => {
    if (!number.trim()) return;
    setLoading(true);
    setError(null);
    verifyCertificate(number.trim())
      .then(setResult)
      .catch(() => setError("Could not reach the verification service — try again shortly."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (routeCertNumber) runVerify(routeCertNumber);
  }, [routeCertNumber]);

  const copy = result ? RESULT_COPY[result.result] : null;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center px-6 py-12">
      <img src={logo} alt="BotLeague" className="h-8 mb-10" />

      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Certificate Verification</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Enter a certificate number, or scan the QR code on a BotLeague certificate.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runVerify(certificateNumber);
          }}
          className="flex gap-2 mb-8"
        >
          <input
            type="text"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder="e.g. CERT-000123"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={loading || !certificateNumber.trim()}
            className="rounded-lg bg-gradient-to-br from-[#4c8ee7] to-[#8c6cff] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? "Checking…" : "Verify"}
          </button>
        </form>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm text-center">{error}</div>
        )}

        {!error && result && copy && (
          <div className="rounded-2xl border p-6" style={{ borderColor: copy.color + "40", background: copy.color + "0d" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: copy.color + "22", color: copy.color }}
              >
                {copy.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: copy.color }}>{copy.title}</h2>
                <p className="text-xs text-gray-500 font-mono">{result.certificateNumber}</p>
              </div>
            </div>

            {result.result !== "NOT_FOUND" && (
              <div className="space-y-2 text-sm">
                {result.imageUrl && (
                  <img src={result.imageUrl} alt="Certificate preview" className="w-full rounded-lg mb-3 border border-white/10" />
                )}
                <Row label="Recipient" value={result.recipientName} />
                <Row label="Event" value={result.eventName} />
                <Row label="Sport" value={result.eventSportName} />
                <Row label="Certificate" value={result.label} />
                {result.teamName && <Row label="Team" value={result.teamName} />}
                {result.robotName && <Row label="Robot" value={result.robotName} />}
                {result.positionSnapshot && <Row label="Position" value={`#${result.positionSnapshot}`} />}
                <Row label="Issued" value={formatDate(result.issuedAt)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-medium">{value}</span>
    </div>
  );
}
