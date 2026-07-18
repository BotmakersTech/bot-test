/** The stylized combat-robot silhouette used in the zero-robots "Add Your Robot" card — decorative only. */
export default function RobotBuildArt() {
  return (
    <div
      className="w-full md:w-[420px] h-[380px] rounded-2xl overflow-hidden relative flex-shrink-0"
      style={{ background: "radial-gradient(120% 100% at 50% 15%, #10151f 0%, #050709 60%, #000 100%)" }}
    >
      {/* circuit lines background */}
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 420 380" fill="none" stroke="#3aa0ff" strokeWidth="1" aria-hidden="true">
        <path d="M0 60 H90 V30 H180" />
        <path d="M0 140 H60 V190 H160" />
        <path d="M420 100 H340 V50 H260" />
        <path d="M420 220 H360 V270 H280" />
        <path d="M0 300 H120 V330" />
        <circle cx="90" cy="60" r="2.5" fill="#3aa0ff" stroke="none" />
        <circle cx="180" cy="30" r="2.5" fill="#3aa0ff" stroke="none" />
        <circle cx="340" cy="100" r="2.5" fill="#3aa0ff" stroke="none" />
        <circle cx="260" cy="50" r="2.5" fill="#3aa0ff" stroke="none" />
        <circle cx="120" cy="300" r="2.5" fill="#3aa0ff" stroke="none" />
      </svg>

      {/* badge / seal */}
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-gray-300/70 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
        <span className="text-[7px] leading-tight text-gray-200 font-semibold text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
          GLOBAL<br />ROBOTICS<br />CHAMPIONSHIP
        </span>
      </div>

      {/* robot silhouette */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 380" fill="none" aria-hidden="true">
        <defs>
          <filter id="robotBuildGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="210" cy="345" rx="130" ry="14" fill="#ff2d4a" opacity="0.15" />

        <path d="M150 250 L120 300 L110 340 L150 340 L165 300 Z" fill="#3a3f4a" />
        <path d="M260 250 L280 300 L300 340 L260 340 L245 300 Z" fill="#2c303a" />
        <ellipse cx="120" cy="345" rx="30" ry="14" fill="#1a1d22" />
        <ellipse cx="290" cy="345" rx="30" ry="14" fill="#151719" />

        <path d="M155 150 L265 150 L275 250 L145 250 Z" fill="#4a4f5c" />
        <path d="M175 160 L245 160 L250 235 L170 235 Z" fill="#2a2e37" />

        <path d="M190 170 L190 225" stroke="#ff2d4a" strokeWidth="3" filter="url(#robotBuildGlow)" />
        <path d="M230 170 L230 225" stroke="#2dc7ff" strokeWidth="3" filter="url(#robotBuildGlow)" />

        <path d="M180 90 Q210 70 240 90 L245 140 L175 140 Z" fill="#c7ccd6" />
        <path d="M190 105 L230 105 L232 128 L188 128 Z" fill="#101318" />
        <path d="M195 112 L225 112" stroke="#ff2d4a" strokeWidth="2" filter="url(#robotBuildGlow)" />

        <path d="M155 160 L100 190 L85 240 L110 260 L150 220 Z" fill="#3a3f4a" />
        <path d="M265 160 L320 185 L340 220 L315 245 L270 215 Z" fill="#2c303a" />
        <path d="M95 205 L125 225" stroke="#ff2d4a" strokeWidth="2.5" filter="url(#robotBuildGlow)" />
        <path d="M300 200 L325 220" stroke="#2dc7ff" strokeWidth="2.5" filter="url(#robotBuildGlow)" />

        <circle cx="155" cy="160" r="14" fill="#5a5f6c" />
        <circle cx="265" cy="160" r="14" fill="#40444f" />
      </svg>
    </div>
  );
}
