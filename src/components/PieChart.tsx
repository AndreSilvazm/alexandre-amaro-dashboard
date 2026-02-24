import React from "react";

interface PieDatum {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieDatum[];
  size?: number;
  innerRadius?: number;
  legendColumns?: number;
}

const DEFAULT_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#6366f1",
  "#f97316",
  "#f43f5e",
  "#a855f7",
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, "Z"].join(" ");
}

export default function PieChart({ data, size = 180, innerRadius = 0, legendColumns = 1 }: PieChartProps) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  if (total <= 0) {
    return <p className="text-sm text-gray-500">Sem dados suficientes.</p>;
  }

  const radius = size / 2;
  let cumulative = 0;

  const slices = data
    .filter((datum) => datum.value > 0)
    .map((datum, index) => {
      const valuePercentage = (datum.value / total) * 100;
      const startAngle = cumulative * 360;
      cumulative += datum.value / total;
      const endAngle = cumulative * 360;
      const color = datum.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      return {
        path: describeArc(radius, radius, radius, startAngle, endAngle),
        label: datum.label,
        value: datum.value,
        percentage: Math.round(valuePercentage),
        color,
      };
    });

  const hasSingleSlice = slices.length === 1;

  return (
    <div className="flex flex-col gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {hasSingleSlice ? (
          <circle cx={radius} cy={radius} r={radius} fill={slices[0].color} opacity={0.9} />
        ) : (
          slices.map((slice, index) => (
            <path key={`${slice.label}-${index}`} d={slice.path} fill={slice.color} opacity={0.9} />
          ))
        )}
        {innerRadius > 0 && (
          <circle cx={radius} cy={radius} r={innerRadius} fill="white" className="dark:fill-gray-900" />
        )}
      </svg>
      <div
        className={`grid gap-2 text-sm text-gray-700 dark:text-gray-200`}
        style={{ gridTemplateColumns: `repeat(${legendColumns}, minmax(0, 1fr))` }}
      >
        {slices.map((slice) => (
          <div key={`legend-${slice.label}`} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
            <div className="flex-1">
              <p className="font-medium leading-tight">{slice.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {slice.value} • {slice.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
