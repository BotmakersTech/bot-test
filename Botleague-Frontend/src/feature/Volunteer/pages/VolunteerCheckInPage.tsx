import { useState } from "react"

export default function VolunteerCheckInPage() {
  const [status, setStatus] = useState<"idle" | "in" | "out">("idle")
  const [time, setTime] = useState<string | null>(null)

  const handle = (action: "in" | "out") => {
    setStatus(action)
    setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }))
  }

  return (
    <div className="min-h-full p-6 space-y-6 max-w-sm mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white">Check In / Out</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Record your arrival and departure for today's event</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-6 space-y-6 text-center">
        {status === "idle" && (
          <p className="text-neutral-400 text-sm">You haven't checked in yet today.</p>
        )}
        {status === "in" && (
          <div className="space-y-1">
            <p className="text-green-400 font-bold text-lg">Checked In ✓</p>
            <p className="text-neutral-400 text-sm">at {time}</p>
          </div>
        )}
        {status === "out" && (
          <div className="space-y-1">
            <p className="text-neutral-400 font-bold text-lg">Checked Out</p>
            <p className="text-neutral-500 text-sm">at {time}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handle("in")}
            disabled={status === "in" || status === "out"}
            className="flex-1 rounded-xl bg-green-500/15 border border-green-500/30 py-3 text-sm font-bold text-green-400 disabled:opacity-40 hover:bg-green-500/20 transition-colors"
          >
            Check In
          </button>
          <button
            onClick={() => handle("out")}
            disabled={status !== "in"}
            className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-sm font-bold text-red-400 disabled:opacity-40 hover:bg-red-500/20 transition-colors"
          >
            Check Out
          </button>
        </div>

        <p className="text-[11px] text-neutral-600">
          Your organiser manages the official attendance record. This is your personal reference.
        </p>
      </div>
    </div>
  )
}
