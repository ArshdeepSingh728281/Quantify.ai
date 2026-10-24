"use client";

type SparklineProps = {
  points?: number[];
  negative?: boolean;
};

export default function Sparkline({
  points = [],
  negative = false,
}: SparklineProps) {
  // Keep the chart compact like the reference design
  const width = 150;
  const height = 32;

  const cleanPoints = Array.isArray(points)
    ? points
        .map((point) => Number(point))
        .filter((point) => Number.isFinite(point))
    : [];

  /*
   * If there isn't enough data, show a subtle placeholder.
   */
  if (cleanPoints.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#44444c"
          strokeWidth="1.5"
          strokeDasharray={negative ? "4 4" : undefined}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const min = Math.min(...cleanPoints);
  const max = Math.max(...cleanPoints);

  const range = max - min || 1;

  const paddingX = 2;
  const paddingY = 4;

  const coordinates = cleanPoints.map(
    (value, index) => {
      const x =
        paddingX +
        (index / (cleanPoints.length - 1)) *
          (width - paddingX * 2);

      const y =
        height -
        paddingY -
        ((value - min) / range) *
          (height - paddingY * 2);

      return {
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y)
          ? y
          : height / 2,
      };
    }
  );

  /*
   * Smooth cubic curve.
   */
  let path = `M ${coordinates[0].x} ${coordinates[0].y}`;

  for (
    let i = 1;
    i < coordinates.length;
    i++
  ) {
    const previous = coordinates[i - 1];
    const current = coordinates[i];

    const controlX =
      (previous.x + current.x) / 2;

    path += `
      C
      ${controlX} ${previous.y},
      ${controlX} ${current.y},
      ${current.x} ${current.y}
    `;
  }

  const first = coordinates[0];
  const last =
    coordinates[coordinates.length - 1];

  const lastY = Number.isFinite(last.y)
    ? last.y
    : height / 2;

  const areaPath = `
    ${path}
    L ${last.x} ${height}
    L ${first.x} ${height}
    Z
  `;

  const gradientId = negative
    ? "sparkline-negative-gradient"
    : "sparkline-positive-gradient";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={
              negative
                ? "#77777f"
                : "#bd8cff"
            }
            stopOpacity="0.16"
          />

          <stop
            offset="100%"
            stopColor={
              negative
                ? "#77777f"
                : "#bd8cff"
            }
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {/* AREA */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />

      {/* LINE */}
      <path
        d={path}
        fill="none"
        stroke={
          negative
            ? "#77777f"
            : "#bd8cff"
        }
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={
          negative ? "4 4" : undefined
        }
      />

      {/* END DOT */}
      <circle
        cx={last.x}
        cy={lastY}
        r="3"
        fill={
          negative
            ? "#77777f"
            : "#bd8cff"
        }
      />
    </svg>
  );
}