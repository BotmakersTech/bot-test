import plane from "../../../../assets/Auth/plane.svg";
import star from "../../../../assets/Auth/Star-two.svg";

interface OverviewProps {
  description?: string | null;
}

export default function Overview({ description }: OverviewProps) {
  return (
    <section
      className="overview"
      style={{
        "--plane": `url(${plane})`,
        "--star": `url(${star})`,
      } as React.CSSProperties}
    >
      <h2>OVERVIEW</h2>
      <p>{description || "No overview has been added for this techfest yet."}</p>
    </section>
  );
}
