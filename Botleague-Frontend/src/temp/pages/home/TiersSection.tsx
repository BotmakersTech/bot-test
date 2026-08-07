import { useNavigate } from "react-router-dom";

const TIERS = [
  {
    name: "Free Tier",
    tagline: "Zero cost to start. No revenue share.",
    features: ["Rulebook + arena specs", "Registration platform", "Certificates + national ranking", "Promotion to BotLeague network"],
    cta: "Choose Free Tier",
  },
  {
    name: "Premium Tier – Full Service",
    tagline: "Arena rental + management fee. All registration revenue stays with your fest.",
    features: ["Everything in Model B", "On-site coordinator + trained judges", "Arena + mechanical tools (drill, grinder, welder)", "WhatsApp bot for all participants"],
    cta: "Choose Premium Tier",
  },
];

export default function TiersSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-[70px]">
      <div className="max-w-[1180px] mx-auto px-6">
        <h2 className="text-center text-[#2f3ef0] font-display text-2xl md:text-4xl mb-10">Your fest. BotLeague's infrastructure.</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-[860px] mx-auto">
          {TIERS.map((tier) => (
            <div key={tier.name} className="border-2 border-[#b9aefc] rounded-2xl p-7 flex flex-col gap-2">
              <h3 className="text-[#2f3ef0] text-lg font-bold">{tier.name}</h3>
              <p className="text-sm text-[#222] font-medium mb-1.5">{tier.tagline}</p>
              <ul className="flex flex-col gap-1.5 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="text-[13px] text-[#333] flex gap-2">
                    <span className="text-[#6d4ff0] font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/contact-us")}
                aria-label={tier.cta}
                className="mt-auto h-[34px] w-[150px] rounded-lg bg-linear-to-r from-[#2f3ef0] to-[#8b5cf6]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
