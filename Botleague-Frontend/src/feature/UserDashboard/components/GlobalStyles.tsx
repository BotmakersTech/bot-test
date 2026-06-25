
export default function GlobalStyles () {
    return(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Syne:wght@400;600;700;800&display=swap');

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(250,71,21,0.45); }
      70%  { box-shadow: 0 0 0 14px rgba(250,71,21,0); }
      100% { box-shadow: 0 0 0 0 rgba(250,71,21,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes barGrow {
      from { width: 0; }
    }
    .fade-up { animation: fadeUp 0.5s ease both; }
    .fade-up-1 { animation: fadeUp 0.5s 0.08s ease both; }
    .fade-up-2 { animation: fadeUp 0.5s 0.16s ease both; }
    .fade-up-3 { animation: fadeUp 0.5s 0.24s ease both; }
    .fade-up-4 { animation: fadeUp 0.5s 0.32s ease both; }

    .stat-card:hover { border-color: rgba(250,71,21,0.35) !important; transform: translateY(-2px); }
    .stat-card { transition: border-color 0.2s, transform 0.2s; }

    .team-pill:hover { background: rgba(250,71,21,0.18) !important; border-color: rgba(250,71,21,0.4) !important; }
    .team-pill { transition: background 0.2s, border-color 0.2s; cursor: pointer; }

    .tab-btn { transition: all 0.2s; }
    .tab-btn:hover { color: #fff !important; }

    .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .action-btn { transition: opacity 0.2s, transform 0.2s; }
  `}</style>
);}