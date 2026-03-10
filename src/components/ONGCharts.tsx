'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ChartData {
  name: string;
  value: number;
}

interface ONGChartsProps {
  stateData: { state: string; stateCode: string; count: number }[];
  cityData: { city: string; count: number }[];
  selectedState?: string;
}

const COLORS = [
  '#02186b', '#ffca27', '#0c2fa3', '#10B981', '#EC4899',
  '#0EA5E9', '#14B8A6', '#F97316', '#6366F1', '#EF4444'
];

export default function ONGCharts({ stateData, cityData, selectedState }: ONGChartsProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cores dinâmicas baseadas no tema
  const tickColor = mounted && resolvedTheme === 'dark' ? '#E5E7EB' : '#6B7280';
  const gridColor = mounted && resolvedTheme === 'dark' ? '#374151' : '#E5E7EB';
  const tooltipBg = mounted && resolvedTheme === 'dark' ? '#1F2937' : 'white';
  const tooltipTextColor = mounted && resolvedTheme === 'dark' ? '#F9FAFB' : '#1F2937';

  const stateChartData: ChartData[] = stateData.map(item => ({
    name: item.stateCode,
    value: item.count,
  }));

  const cityChartData: ChartData[] = cityData.map(item => ({
    name: item.city,
    value: item.count,
  }));

  // Título dinâmico para o gráfico de cidades
  const cityChartTitle = selectedState 
    ? `Top 10 Cidades - ${selectedState}` 
    : 'Top 10 Cidades com Mais ONGs';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ONGs by State Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 card-hover transition-colors duration-300">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#02186b]"></span>
          ONGs por Estado
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stateChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0}
                tick={{ fontSize: 12, fill: tickColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: tickColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  padding: '12px 16px',
                }}
                labelStyle={{ fontWeight: 'bold', color: tooltipTextColor }}
                itemStyle={{ color: tooltipTextColor }}
                formatter={(value) => [`${value} ONGs`, 'Quantidade']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stateChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Cities Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 card-hover transition-colors duration-300">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          {cityChartTitle}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cityChartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 12, fill: tickColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                tick={{ fontSize: 12, fill: tickColor }}
                tickLine={{ stroke: gridColor }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  padding: '12px 16px',
                }}
                labelStyle={{ fontWeight: 'bold', color: tooltipTextColor }}
                itemStyle={{ color: tooltipTextColor }}
                formatter={(value) => [`${value} ONGs`, 'Quantidade']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {cityChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
