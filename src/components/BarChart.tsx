import React from "react";

interface BarDatum {
  label: string;
  value: number;
  helper?: string;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  maxValue?: number;
  formatter?: (value: number) => string;
  emptyMessage?: string;
}

export default function BarChart({
  data,
  maxValue,
  formatter = (value) => value.toString(),
  emptyMessage = "Sem dados suficientes.",
}: BarChartProps) {
  if (!data.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  const computedMax = maxValue ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = `${Math.max((item.value / computedMax) * 100, 2)}%`;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
              <span className="text-gray-500 dark:text-gray-400">{formatter(item.value)}</span>
            </div>
            {item.helper && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{item.helper}</p>
            )}
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width,
                  backgroundColor: item.color ?? "#02186b",
                  opacity: 0.9,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
