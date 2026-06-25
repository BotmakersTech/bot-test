export default function AdminSupportTicketsPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-gray-400 text-sm mt-1">Manage user-submitted support requests</p>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-orange-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Ticketing System</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Support ticket management is being integrated. In the meantime, monitor the support inbox
          at <span className="text-orange-400">developers.botmakers@gmail.com</span> for incoming requests.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:developers.botmakers@gmail.com"
            className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            Open Support Inbox
          </a>
        </div>
      </div>

      {/* Placeholder stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { label: "Open Tickets",     value: "—", color: "text-yellow-400" },
          { label: "Resolved Today",   value: "—", color: "text-green-400" },
          { label: "Avg Response Time",value: "—", color: "text-blue-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
