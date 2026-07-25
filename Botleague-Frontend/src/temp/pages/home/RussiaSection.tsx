export default function RussiaSection() {
  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6">
        <h2 className="text-center text-[#7b3ff2] font-display font-extrabold text-2xl md:text-4xl leading-relaxed mb-10">
          India's only organisation competing at<br />Battle of Robots, Russia.
        </h2>
        <div className="border-2 border-[#cfc7f7] rounded-2xl p-6 md:p-9 grid md:grid-cols-2 gap-6 items-center">
          <div className="min-h-[200px] rounded-[15px] bg-linear-to-br from-[#1a1035] via-[#3b1d6e] to-[#6d28d9]" />
          <div>
            <h3 className="font-display text-[#b9aefc] tracking-widest text-base mb-2">BATTLE OF ROBOTS — RUSSIA</h3>
            <p className="text-sm leading-loose text-[#222] font-bold">India qualifier — 2027<br />1.5 kg category.</p>
            <p className="text-sm leading-loose text-[#222] mt-2">Hosted in India by BotLeague. Top performers earn the right to represent India at the international championship.</p>
          </div>
        </div>
        <div className="border-2 border-[#cfc7f7] rounded-2xl p-6 md:p-7 mt-6">
          <div className="font-sans text-[#6d4ff0] font-bold text-xs tracking-widest mb-2">MORE COMING</div>
          <h4 className="text-base font-display font-semibold text-[#7b3ff2] mb-1.5">International collaborations</h4>
          <p className="text-sm text-[#333] leading-relaxed">Additional international partnerships being confirmed. V7RC Taiwan already active. BotLeague's global reach is expanding.</p>
        </div>
      </div>
    </section>
  );
}
