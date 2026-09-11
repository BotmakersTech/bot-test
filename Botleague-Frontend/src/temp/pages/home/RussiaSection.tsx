export default function RussiaSection() {
  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="text-center mb-10">
          <div className="font-sans text-[#6d4ff0] font-bold text-xs tracking-[3px] uppercase mb-2">Global Gateway</div>
          <h2 className="text-[#7b3ff2] font-display font-extrabold text-2xl md:text-4xl leading-relaxed">
            India&rsquo;s official partner for Battle of Robots.
          </h2>
        </div>
        <div className="border-2 border-[#cfc7f7] rounded-2xl p-6 md:p-9 grid md:grid-cols-2 gap-6 items-center">
          <div className="min-h-[200px] rounded-[15px] bg-linear-to-br from-[#1a1035] via-[#3b1d6e] to-[#6d28d9] flex items-center justify-center">
            <span className="font-display text-white/80 text-lg tracking-[2px]">2027 · INDIA QUALIFIER</span>
          </div>
          <div>
            <h3 className="font-display text-[#b9aefc] tracking-widest text-base mb-2">BATTLE OF ROBOTS — RUSSIA</h3>
            <p className="text-sm leading-loose text-[#222] font-bold">India Qualifier — 2027<br />Hosted in India by BotLeague.</p>
            <p className="text-sm leading-loose text-[#222] mt-2">Top performers earn the right to represent India at the international championship.</p>
          </div>
        </div>
        <div className="border-2 border-[#cfc7f7] rounded-2xl p-6 md:p-7 mt-6">
          <div className="font-sans text-[#6d4ff0] font-bold text-xs tracking-widest mb-2">MORE COMING</div>
          <h4 className="text-base font-display font-semibold text-[#7b3ff2] mb-1.5">International collaborations</h4>
          <p className="text-sm text-[#333] leading-relaxed">
            Additional international partnerships are being confirmed — V7RC Taiwan is already active, and BotLeague&rsquo;s global reach is expanding. Further collaborations are in progress.
          </p>
        </div>
      </div>
    </section>
  );
}
