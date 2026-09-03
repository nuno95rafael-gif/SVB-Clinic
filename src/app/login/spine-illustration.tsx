export function SpineIllustration() {
  const vertebrae: { x: number; y: number; w: number; rot: number }[] = [
    { x: 160, y: 46, w: 30, rot: -2 },
    { x: 152, y: 82, w: 32, rot: -4 },
    { x: 146, y: 120, w: 34, rot: -5 },
    { x: 144, y: 160, w: 35, rot: -3 },
    { x: 146, y: 200, w: 36, rot: 0 },
    { x: 154, y: 240, w: 37, rot: 4 },
    { x: 166, y: 278, w: 38, rot: 8 },
    { x: 180, y: 316, w: 39, rot: 10 },
    { x: 192, y: 356, w: 40, rot: 9 },
    { x: 198, y: 398, w: 41, rot: 6 },
    { x: 196, y: 440, w: 41, rot: 2 },
    { x: 186, y: 480, w: 42, rot: -3 },
    { x: 170, y: 518, w: 43, rot: -6 },
    { x: 152, y: 554, w: 44, rot: -6 },
    { x: 138, y: 588, w: 46, rot: -3 },
  ];

  const centerline = vertebrae.map((v) => `${v.x},${v.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 320 640"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vertebra" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d8ecff" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="240" r="260" fill="url(#glow)" />

      <polyline
        points={centerline}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {vertebrae.map((v, i) => (
        <rect
          key={i}
          x={v.x - v.w / 2}
          y={v.y - 8}
          width={v.w}
          height={16}
          rx={7}
          fill="url(#vertebra)"
          transform={`rotate(${v.rot} ${v.x} ${v.y})`}
        />
      ))}

      {/* pontos de cuidado — o mesmo motivo dos marcadores de dor da app */}
      <circle cx="222" cy="150" r="5" fill="#8fb84c" opacity="0.85" />
      <circle cx="100" cy="330" r="4.5" fill="#d9a441" opacity="0.85" />
      <circle cx="210" cy="470" r="5" fill="#4c9a6a" opacity="0.85" />
    </svg>
  );
}
