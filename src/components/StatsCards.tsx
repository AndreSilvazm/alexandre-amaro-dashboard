'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, MapPin, CheckCircle } from 'lucide-react';

// Hook para animar contagem de números
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const prevEndRef = useRef(end);
  
  useEffect(() => {
    // Se o valor mudou, anima
    if (prevEndRef.current !== end) {
      prevEndRef.current = end;
    }
    
    if (end === 0) {
      setCount(0);
      return;
    }
    
    let startTime: number | null = null;
    const startValue = 0;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOut);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
}

interface StatsCardsProps {
  ongsCount: number;
  citiesCount: number;
  selectedCount?: number;
  selectedCitiesCount?: number;
}

export default function StatsCards({ ongsCount, citiesCount, selectedCount = 0, selectedCitiesCount = 0 }: StatsCardsProps) {
  const hasSelection = selectedCount > 0;
  
  // Animar os números
  const animatedOngsCount = useCountUp(hasSelection ? selectedCount : ongsCount);
  const animatedCitiesCount = useCountUp(hasSelection ? selectedCitiesCount : citiesCount);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 card-hover border-l-4 border-[#0d2857] group transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {hasSelection ? (
                'ONGs Selecionadas'
              ) : (
                <span className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-300">
                  <span>ONGs Exibidas</span>
                  <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Feature
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                    Novas adicionadas: 84+
                  </span>
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white tabular-nums">
              {animatedOngsCount.toLocaleString()}
            </p>
            {hasSelection && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">de {ongsCount.toLocaleString()} exibidas</p>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${hasSelection ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-[#0d2857]/10 dark:bg-blue-900/30'}`}>
            {hasSelection ? (
              <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Building2 className="w-7 h-7 text-[#0d2857] dark:text-blue-400" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 card-hover border-l-4 border-emerald-500 group transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {hasSelection ? 'Cidades Selecionadas' : 'Cidades'}
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white tabular-nums">
              {animatedCitiesCount.toLocaleString()}
            </p>
            {hasSelection && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">de {citiesCount} disponíveis</p>
            )}
          </div>
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <MapPin className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
