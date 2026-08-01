import { useState } from "react"
import { Trophy, Bot, Users, Globe2, ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import "../styles/faqSection.css"

interface FaqItem {
  q: string
  a: string
}

interface FaqSection {
  icon: LucideIcon
  title: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    icon: Trophy,
    title: "General",
    items: [
      {
        q: "What is BotLeague?",
        a: "BotLeague is a competitive robotics platform where teams design, build, and battle robots across a variety of events — from beginner-friendly challenges to advanced international tournaments.",
      },
      {
        q: "Who can participate in BotLeague?",
        a: "Anyone with an interest in robotics can join — students, hobbyists, and professional teams are all welcome. Some events have age or category divisions, which are listed on each competition page.",
      },
      {
        q: "Do I need to be an expert to participate?",
        a: "Not at all. BotLeague has entry-level challenges designed for first-time builders, alongside advanced tracks for experienced teams, so you can start wherever your skill level is.",
      },
    ],
  },
  {
    icon: Bot,
    title: "Competitions",
    items: [
      {
        q: "What types of robotics competitions are available?",
        a: "We host combat robotics, maze-solving, line-following, sumo-bot, and innovation-showcase competitions, with new formats added throughout the season.",
      },
      {
        q: "Are the rules the same across all BotLeague events?",
        a: "Core safety and fair-play rules are consistent across every event, but weight classes, build specs, and scoring can vary by competition — always check the specific event rulebook.",
      },
      {
        q: "Can I participate in multiple competitions?",
        a: "Yes — teams are free to register for as many competitions as they'd like, as long as the schedules don't overlap and each robot meets that event's requirements.",
      },
    ],
  },
  {
    icon: Users,
    title: "Teams",
    items: [
      {
        q: "Can I create my own team?",
        a: "Absolutely. You can register a new team from your dashboard, invite members by email, and assign roles like builder, driver, and strategist.",
      },
      {
        q: "Can I join an existing team?",
        a: "Yes — you can request to join a public team or accept an invite link shared by a team captain from the Teams section.",
      },
      {
        q: "Can I compete without a team?",
        a: "Some individual-format events allow solo entries, but most BotLeague competitions are designed for teams of two or more to encourage collaboration.",
      },
    ],
  },
  {
    icon: Globe2,
    title: "International Opportunities",
    items: [
      {
        q: "Can BotLeague help me compete internationally?",
        a: "Yes — top-performing teams from regional and national events are invited to represent BotLeague at partner international competitions.",
      },
      {
        q: "How can I qualify for international competitions?",
        a: "Qualification is based on your ranking in national-level events. Standings are updated after every competition and posted on the leaderboard.",
      },
      {
        q: "What is the Battle of Robots pathway?",
        a: "Battle of Robots is BotLeague's flagship pathway: teams progress from local qualifiers, to nationals, to the international finals, earning points at each stage.",
      },
    ],
  },
]

function FAQAccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`faq-item ${isOpen ? "open" : ""}`}>
      <button type="button" className="faq-item-header" onClick={onToggle} aria-expanded={isOpen}>
        <span className="faq-question">{question}</span>
        <span className={`faq-chevron ${isOpen ? "open" : ""}`}>
          <ChevronDown size={18} color="#0162D1" strokeWidth={2} />
        </span>
      </button>

      <div className={`faq-answer-wrap ${isOpen ? "open" : ""}`}>
        <div className="faq-answer-inner">
          <div className="faq-answer">{answer}</div>
        </div>
      </div>
    </div>
  )
}

function FAQCard({ icon: Icon, title, items }: FaqSection) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="faq-card">
      <h3 className="faq-card-title">
        <span className="faq-card-icon">
          <Icon size={20} color="#0162D1" strokeWidth={2} />
        </span>
        {title}
      </h3>
      <div className="faq-items">
        {items.map((item, i) => (
          <FAQAccordionItem
            key={item.q}
            question={item.q}
            answer={item.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </div>
  )
}

export default function SupportPage() {
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
    <div className="min-h-screen bg-[#0a0c10] text-white pt-11.5 px-13 pb-17.5 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-gray-400 text-sm mt-1">Find answers or reach out to the BotLeague team</p>
      </div>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="faq-section-title text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Frequently Asked Questions
        </h2>
        <div className="faq-grid">
          {FAQ_SECTIONS.map((section) => (
            <FAQCard key={section.title} {...section} />
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
