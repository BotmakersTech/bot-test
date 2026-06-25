import type { Robot } from "../types/types";
import {
  truncateText,
  formatDate,
  getCategoryLabel,
} from "../utils/robotUtils";

interface RobotCardProps {
  robot: Robot;
  onSelect: (robot: Robot) => void;

  statusConfig: any;
  categoryColors: any;
  categoryIcons: any;
  controlTypeLabel: any;
  THEME: any;
}
export default function RobotCard({
  robot,
  onSelect,
  statusConfig,
  categoryColors,
  categoryIcons,
  controlTypeLabel,
  THEME,
}: RobotCardProps) {


            const status = statusConfig[robot.status];
            const catColor = categoryColors[robot.robotType];
            const catIcon = categoryIcons[robot.robotType];

            return (
              <div
                key={robot.id}
                style={{
                 background: `
linear-gradient(
180deg,
rgba(46, 46, 46, 0.98) 0%,
rgba(39, 39, 39, 0.96) 100%
)
`,
              border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px", padding: "28px",
minHeight: "210px",backdropFilter: "blur(18px)",
                  display: "flex", gap: "32px", alignItems: "flex-start",
                  cursor: "pointer", transition: "all 0.2s ease",
                  position: "relative", overflow: "hidden"
                }}
                onClick={() => onSelect(robot)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = `1px solid ${catColor}40`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 12px 30px rgba(0,0,0,0.4)`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = "1px solid rgba(255,255,255,0.08)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: "3px", background: catColor, borderRadius: "16px 0 0 16px"
                }} />

                {/* Robot Image */}
                <div style={{
                  width: "125px", height: "125px", borderRadius: "14px", flexShrink: 0,
                  background: robot.robotIMG
                    ? `url(${robot.robotIMG}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${catColor}22, ${catColor}44)`,
                  border: `1px solid ${catColor}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "3rem",
                  boxShadow: `0 0 20px ${catColor}18`
                }}>
                  {!robot.robotIMG && catIcon}
                </div>

                {/* Info */}
                <div
  style={{
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "12px",
  }}
>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
                      {robot.robotName}
                    </h2>
                    <span style={{
                      background: `${catColor}20`, border: `1px solid ${catColor}50`,
                      color: catColor, borderRadius: "6px",
                      fontSize: "0.68rem", padding: "3px 10px", fontWeight: 700,
                      letterSpacing: "0.06em"
                    }}>{catIcon} {getCategoryLabel(robot.robotType)}</span>
                    <span style={{
                      background: status.bg, color: status.color,
                      borderRadius: "999px", fontSize: "0.68rem",
                      padding: "3px 10px", fontWeight: 700,
                      display: "flex", alignItems: "center", gap: "4px"
                    }}>
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: status.color, display: "inline-block"
                      }} />
                      {status.label}
                    </span>
                  </div>

                  <div style={{ color: THEME.textSecondary, fontSize: "0.95rem", marginBottom: "12px", lineHeight: 1.8,
maxWidth: "90%" }}>
                    {truncateText(robot.description, 120)}  
                  </div>

                  {/* Spec pills */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[
                      { label: "Code", value: robot.robotCode, icon: "🔖" },
                      { label: "Weight", value: robot.weightClass, icon: "⚖️" },
                      { label: "Control", value: controlTypeLabel[robot.controlType], icon: "🕹️" },
                      { label: "Added", value: formatDate(robot.createdAt), icon: "📅" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px", padding: "10px 14px",
                        fontSize: "0.75rem", color: "#d1d5db"
                      }}>
                        <span style={{ opacity: 0.7 }}>{icon} {label}: </span>
                        <span style={{ color: THEME.text, fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{
                  color: "rgba(255,255,255,0.2)", fontSize: "1.8rem", alignSelf: "center", flexShrink: 0
                }}>→</div>
              </div>
            );}