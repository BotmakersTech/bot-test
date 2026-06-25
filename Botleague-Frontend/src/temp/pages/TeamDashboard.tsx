import { useState } from "react";

const members = [
  { initials: "RB", name: "Ryan Blaze", role: "Driver", title: "Team Captain", isCapt: true },
  { initials: "AM", name: "Arjun Mehta", role: "Driver", title: "", isCapt: false },
  { initials: "VR", name: "Vihaan Rao", role: "Strategist", title: "", isCapt: false },
  { initials: "KM", name: "Karan Malhotra", role: "Mechanic", title: "", isCapt: false },
  { initials: "NI", name: "Neha Iyer", role: "Analyst", title: "", isCapt: false },
  { initials: "DS", name: "Devansh Singh", role: "Support", title: "", isCapt: false },
];

const events = [
  {
    month: "MAY",
    day: "28",
    name: "Inter College Rocket League 2024",
    organizer: "TechNova University",
    location: "Bangalore, Karnataka",
    status: "Registered",
    statusColor: "#22c55e",
  },
  {
    month: "JUN",
    day: "15",
    name: "National Tech Championship",
    organizer: "NITI Sports Council",
    location: "New Delhi, India",
    status: "Upcoming",
    statusColor: "#f59e0b",
  },
  {
    month: "JUL",
    day: "05",
    name: "Summer Showdown 2024",
    organizer: "Rocket League India",
    location: "Mumbai, Maharashtra",
    status: "Upcoming",
    statusColor: "#f59e0b",
  },
];

const styles: Record<string, React.CSSProperties> = {
  root: {
    background: "#111111",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#e5e5e5",
    padding: "24px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  headerLeft: {},
  headerTitle: { fontSize: "26px", fontWeight: 700, color: "#fff", margin: 0 },
  headerSub: { fontSize: "14px", color: "#9ca3af", marginTop: "2px" },
  orange: { color: "#f97316" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  bellWrap: { position: "relative", cursor: "pointer" },
  bellIcon: { fontSize: "22px", color: "#9ca3af" },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    borderRadius: "9999px",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "9999px",
    background: "#f97316",
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  // Team card
  teamCard: {
    background: "#1a1a1a",
    border: "1px solid #2d2d2d",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap" as const,
  },
  teamLogoWrap: {
    width: "100px",
    height: "100px",
    borderRadius: "9999px",
    border: "3px solid #f97316",
    overflow: "hidden",
    flexShrink: 0,
    background: "#222",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoText: {
    fontSize: "11px",
    fontWeight: 900,
    color: "#f97316",
    textAlign: "center" as const,
    letterSpacing: "1px",
  },
  teamInfo: { flex: 1, minWidth: "200px" },
  teamNameRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  teamName: { fontSize: "22px", fontWeight: 700, color: "#fff" },
  activeBadge: {
    background: "transparent",
    border: "1px solid #f97316",
    color: "#f97316",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "6px",
    padding: "2px 10px",
  },
  teamTagline: { color: "#9ca3af", fontSize: "13px", marginBottom: "10px" },
  teamMeta: { display: "flex", flexDirection: "column" as const, gap: "4px" },
  teamMetaRow: { display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af", fontSize: "13px" },
  teamRight: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: "12px",
    marginLeft: "auto",
  },
  editBtn: {
    background: "transparent",
    border: "1px solid #f97316",
    color: "#f97316",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  teamIds: { display: "flex", gap: "32px" },
  teamIdLabel: { fontSize: "12px", color: "#6b7280", marginBottom: "2px" },
  teamIdVal: { fontSize: "14px", fontWeight: 600, color: "#f97316" },

  // Stats
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#1a1a1a",
    border: "1px solid #2d2d2d",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  statLabel: { fontSize: "13px", color: "#9ca3af", marginBottom: "4px" },
  statValue: { fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 },
  statLink: { fontSize: "12px", color: "#f97316", marginTop: "6px", cursor: "pointer" },

  // Bottom grid
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  panel: {
    background: "#1a1a1a",
    border: "1px solid #2d2d2d",
    borderRadius: "12px",
    padding: "20px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  panelTitle: { fontSize: "16px", fontWeight: 700, color: "#fff" },
  viewAll: { color: "#f97316", fontSize: "13px", cursor: "pointer", fontWeight: 500 },

  // Member row
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #222",
  },
  memberAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "9999px",
    background: "#2a2a2a",
    border: "1px solid #3a3a3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    color: "#e5e5e5",
    flexShrink: 0,
  },
  memberName: { fontWeight: 600, fontSize: "14px", color: "#fff" },
  memberRole: { fontSize: "12px", color: "#6b7280", marginLeft: "6px" },
  captLabel: { color: "#f97316", fontSize: "12px", fontWeight: 600, marginLeft: "4px" },
  memberBadge: {
    marginLeft: "auto",
    background: "#222",
    border: "1px solid #333",
    color: "#9ca3af",
    fontSize: "11px",
    borderRadius: "6px",
    padding: "3px 12px",
  },
  captBadge: {
    marginLeft: "auto",
    background: "#22c55e22",
    border: "1px solid #22c55e55",
    color: "#22c55e",
    fontSize: "11px",
    borderRadius: "6px",
    padding: "3px 12px",
    fontWeight: 600,
  },

  // Event row
  eventRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "12px 0",
    borderBottom: "1px solid #222",
  },
  eventDate: {
    background: "#222",
    borderRadius: "8px",
    padding: "8px 12px",
    textAlign: "center" as const,
    minWidth: "48px",
    flexShrink: 0,
  },
  eventMonth: { fontSize: "10px", color: "#f97316", fontWeight: 700, letterSpacing: "1px" },
  eventDay: { fontSize: "22px", fontWeight: 800, color: "#fff", lineHeight: 1 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "3px" },
  eventOrg: { fontSize: "12px", color: "#9ca3af" },
  eventLoc: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
  seeAll: { color: "#f97316", fontSize: "13px", cursor: "pointer", fontWeight: 500, marginTop: "14px", display: "inline-block" },
};

export default function ApexDashboard() {
  const [hoveredEdit, setHoveredEdit] = useState(false);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>Dashboard</h1>
          <p style={styles.headerSub}>
            Welcome back! Here's what's happening with{" "}
            <span style={styles.orange}>your team.</span>
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.bellWrap}>
            <span style={styles.bellIcon}>🔔</span>
            <span style={styles.badge}>2</span>
          </div>
          <div style={styles.avatar}>TO</div>
        </div>
      </div>

      {/* Team Card */}
      <div style={styles.teamCard}>
        <div style={styles.teamLogoWrap}>
          <div style={{ textAlign: "center", padding: "8px" }}>
            <div style={{ fontSize: "28px" }}>🦊</div>
            <div style={styles.teamLogoText}>APEX{"\n"}IGNITORS</div>
          </div>
        </div>

        <div style={styles.teamInfo}>
          <div style={styles.teamNameRow}>
            <span style={styles.teamName}>Apex Ignitors</span>
            <span style={styles.activeBadge}>Active</span>
          </div>
          <div style={styles.teamTagline}>Igniting Passion, Powering Victory.</div>
          <div style={styles.teamMeta}>
            <div style={styles.teamMetaRow}>
              <span>🏛</span>
              <span>TechNova Institute of Technology</span>
            </div>
            <div style={styles.teamMetaRow}>
              <span>📍</span>
              <span>Bangalore, Karnataka, India</span>
            </div>
          </div>
        </div>

        <div style={styles.teamRight}>
          <button
            style={{
              ...styles.editBtn,
              background: hoveredEdit ? "#f9731622" : "transparent",
            }}
            onMouseEnter={() => setHoveredEdit(true)}
            onMouseLeave={() => setHoveredEdit(false)}
          >
            ✏️ Edit Team
          </button>
          <div style={styles.teamIds}>
            <div>
              <div style={styles.teamIdLabel}>Team ID</div>
              <div style={styles.teamIdVal}>RL-2024-1057</div>
            </div>
            <div>
              <div style={styles.teamIdLabel}>Member Since</div>
              <div style={styles.teamIdVal}>May 20, 2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { icon: "👥", bg: "#f9731622", label: "Members", value: "6", link: "View all members →" },
          { icon: "📅", bg: "#6366f122", label: "Events Joined", value: "3", link: "View events →" },
          { icon: "🏆", bg: "#3b82f622", label: "Matches Played", value: "5", link: "View matches →" },
          { icon: "📈", bg: "#22c55e22", label: "Win Rate", value: "60%", link: "Good going! 🔥" },
        ].map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: s.bg }}>{s.icon}</div>
            <div>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLink}>{s.link}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div style={styles.bottomGrid}>
        {/* Team Members */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Team Members</span>
            <span style={styles.viewAll}>View All</span>
          </div>
          {members.map((m, i) => (
            <div key={i} style={{ ...styles.memberRow, borderBottom: i === members.length - 1 ? "none" : "1px solid #222" }}>
              <div style={styles.memberAvatar}>{m.initials}</div>
              <div>
                <span style={styles.memberName}>{m.name}</span>
                {m.isCapt && <span style={styles.captLabel}>Team Captain</span>}
                <div style={styles.memberRole}>{m.role}</div>
              </div>
              <div style={m.isCapt ? styles.captBadge : styles.memberBadge}>
                {m.isCapt ? "Captain" : "Member"}
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Upcoming Events</span>
            <span style={styles.viewAll}>View Calendar</span>
          </div>
          {events.map((e, i) => (
            <div key={i} style={{ ...styles.eventRow, borderBottom: i === events.length - 1 ? "none" : "1px solid #222" }}>
              <div style={styles.eventDate}>
                <div style={styles.eventMonth}>{e.month}</div>
                <div style={styles.eventDay}>{e.day}</div>
              </div>
              <div style={styles.eventInfo}>
                <div style={styles.eventName}>{e.name}</div>
                <div style={styles.eventOrg}>Organized by {e.organizer}</div>
                <div style={styles.eventLoc}>📍 {e.location}</div>
              </div>
              <div style={{
                background: e.statusColor + "22",
                border: `1px solid ${e.statusColor}55`,
                color: e.statusColor,
                fontSize: "11px",
                borderRadius: "6px",
                padding: "3px 12px",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {e.status}
              </div>
            </div>
          ))}
          <span style={styles.seeAll}>See all events →</span>
        </div>
      </div>
    </div>
  );
}