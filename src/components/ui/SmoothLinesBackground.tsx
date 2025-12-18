export function SmoothLinesBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.15 }}
      >
        {/* Flowing curved lines inspired by the reference */}
        <path
          d="M-100,450 C200,100 400,800 720,450 C1040,100 1240,800 1540,450"
          stroke="black"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M-100,200 C300,600 500,-100 720,200 C940,500 1140,0 1540,200"
          stroke="black"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M-100,700 C300,300 500,1000 720,700 C940,400 1140,900 1540,700"
          stroke="black"
          strokeWidth="1.2"
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
