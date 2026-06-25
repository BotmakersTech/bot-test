export default function Spinner({ size = 20 }) {
  return (
    <span
      style={{
        width:        size,
        height:       size,
        border:       "2px solid rgba(255,255,255,0.2)",
        borderTop:    "2px solid #fff",
        borderRadius: "50%",
        display:      "inline-block",
        animation:    "spin 0.7s linear infinite",
        flexShrink:   0,
      }}
    />
  );
}