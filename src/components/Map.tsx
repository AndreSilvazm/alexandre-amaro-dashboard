'use client';

import dynamic from 'next/dynamic';
import { ONG } from '@/data/mockData';

interface MapProps {
  ongs: ONG[];
  selectedONGs: ONG[];
  onONGClick: (ong: ONG) => void;
  onBoxSelect?: (ongs: ONG[]) => void;
  isFilterSelection?: boolean;
  searchLocation?: { lat: number; lng: number } | null;
  searchRadius?: number;
}

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0d2857] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    </div>
  ),
}) as React.ComponentType<MapProps>;

export default MapComponent;
