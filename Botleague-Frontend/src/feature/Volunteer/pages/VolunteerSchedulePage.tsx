export default function VolunteerSchedulePage() {
  const schedule = [
    { time: "08:00 – 09:00", duty: "Registration Desk Setup", location: "Main Entrance" },
    { time: "09:00 – 12:00", duty: "Registration Desk",       location: "Main Entrance" },
    { time: "12:00 – 13:00", duty: "Lunch Break",             location: "Canteen" },
    { time: "13:00 – 17:00", duty: "Arena Assistance",        location: "Arena A / B" },
    { time: "17:00 – 18:00", duty: "Pack-Up & Close",         location: "All Areas" },
  ]

  return (
    <div className="min-h-full p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My Schedule</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your duty timetable for the event day</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-neutral-200">Event Day Schedule</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Confirm with your organiser for any last-minute changes</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {schedule.map((s, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <div className="shrink-0 w-32">
                <span className="text-xs font-mono font-semibold text-[#fa4715]">{s.time}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{s.duty}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{s.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300">
        This is a sample schedule. Your organiser will update your specific duties and timings.
      </div>
    </div>
  )
}
