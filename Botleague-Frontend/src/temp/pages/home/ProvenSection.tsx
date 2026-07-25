export default function ProvenSection() {
  return (
    <section className="relative h-[420px] md:h-[520px] flex items-center justify-center text-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,.6),transparent_60%),conic-gradient(from_0deg_at_50%_50%,#1a0b3a,#3b1d8a,#12063a,#4a25a8,#1a0b3a)]">
      <div className="absolute inset-[-40%] opacity-40 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,rgba(200,170,255,.35)_0deg_3deg,transparent_3deg_12deg)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_30%,rgba(10,4,30,.55)_100%)]" />
      <h2
        className="relative font-display text-white font-black text-3xl md:text-6xl leading-snug px-6"
        style={{ textShadow: "0 0 30px rgba(160,120,255,.8)" }}
      >
        5 Years.<br />Multiple Premier Fests.<br />Proven.
      </h2>
    </section>
  );
}
