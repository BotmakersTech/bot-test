import { useState } from "react"

const FAQS = [
  {
    q: "How do I register my team for an event?",
    a: "Go to Events in the sidebar, find an open event, and click Register. You'll need an active team with at least the minimum required members and a registered robot.",
  },
  {
    q: "How do I create a team?",
    a: "Navigate to My Team → Create Team. Fill in your team details, add members by their BotLeague ID, and upload a team logo. The team captain can manage membership.",
  },
  {
    q: "How do I add a robot to my team?",
    a: "Go to My Robots and click Add Robot. Fill in the specifications — weight, dimensions, type, and sport. The robot will appear when registering for compatible events.",
  },
  {
    q: "Why can't I see my match schedule?",
    a: "Match schedules are published by the event organizer after registration closes. Check the Matches section or your event page for updates.",
  },
  {
    q: "How do I contact the event organizer?",
    a: "Each event has a dedicated chat room for registered teams. You can also send a notification via the event page to reach the organizer.",
  },
  {
    q: "How do I reset my password?",
    a: "Click Forgot Password on the login page and enter your registered email. You'll receive a reset link within a few minutes.",
  },
  {
    q: "My team member didn't receive a verification email.",
    a: "Ask them to check their spam folder. They can also re-trigger verification from their profile Settings page.",
  },
  {
    q: "How are rankings calculated?",
    a: "Rankings are based on match wins, points scored, and tournament bracket progression. The exact formula may vary per event. Check the Rankings page for live standings.",
  },
]

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.open(
      `mailto:developers.botmakers@gmail.com?subject=BotLeague Support: ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`,
      "_blank"
    )
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-gray-400 text-sm mt-1">Find answers or reach out to the BotLeague team</p>
      </div>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium text-white">{faq.q}</span>
                <span className="shrink-0 text-gray-500 text-xs">{open === i ? "▲" : "▼"}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-400 border-t border-white/5">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Contact Support
        </h2>

        {submitted ? (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-white mb-1">Message Sent</h3>
            <p className="text-sm text-gray-400">
              Your email client should have opened. We'll reply to you within 1–2 business days.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-sm text-orange-400 hover:text-orange-300 transition"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Your Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail…"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Or email us directly at{" "}
                <a href="mailto:developers.botmakers@gmail.com" className="text-orange-400 hover:underline">
                  developers.botmakers@gmail.com
                </a>
              </p>
              <button
                type="submit"
                className="rounded-xl bg-[#fa4715] hover:bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition"
              >
                Send Message
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
