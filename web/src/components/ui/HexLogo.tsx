export function HexLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <polygon
        points="14,2 25,8.5 25,19.5 14,26 3,19.5 3,8.5"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="1.5"
      />
      <polygon
        points="14,7 20,10.5 20,17.5 14,21 8,17.5 8,10.5"
        fill="#14b8a6"
        fillOpacity="0.2"
        stroke="#14b8a6"
        strokeWidth="1"
      />
    </svg>
  );
}
