'use client';

import { useEffect, useState, useCallback, useRef, useId } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMapEvents, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import L, { LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ONG } from '@/data/mockData';
import { Square, MousePointer2 } from 'lucide-react';

// Color palette for states - vibrant and distinct colors (more saturated for better visibility)
const STATE_COLORS: Record<string, { color: string; name: string }> = {
  'AC': { color: '#DC2626', name: 'Acre' },           // Vermelho forte
  'AL': { color: '#059669', name: 'Alagoas' },        // Verde esmeralda
  'AP': { color: '#0891B2', name: 'Amapá' },          // Ciano
  'AM': { color: '#16A34A', name: 'Amazonas' },       // Verde
  'BA': { color: '#D97706', name: 'Bahia' },          // Âmbar escuro (mais visível!)
  'CE': { color: '#9333EA', name: 'Ceará' },          // Roxo vibrante
  'DF': { color: '#0D9488', name: 'Distrito Federal' }, // Teal
  'ES': { color: '#CA8A04', name: 'Espírito Santo' }, // Amarelo escuro
  'GO': { color: '#7C3AED', name: 'Goiás' },          // Violeta
  'MA': { color: '#2563EB', name: 'Maranhão' },       // Azul
  'MT': { color: '#EA580C', name: 'Mato Grosso' },    // Laranja escuro
  'MS': { color: '#0891B2', name: 'Mato Grosso do Sul' }, // Ciano escuro
  'MG': { color: '#E11D48', name: 'Minas Gerais' },   // Rosa forte
  'PA': { color: '#1D4ED8', name: 'Pará' },           // Azul royal
  'PB': { color: '#6D28D9', name: 'Paraíba' },        // Púrpura
  'PR': { color: '#047857', name: 'Paraná' },         // Verde escuro
  'PE': { color: '#B45309', name: 'Pernambuco' },     // Marrom/Laranja
  'PI': { color: '#C2410C', name: 'Piauí' },          // Laranja queimado
  'RJ': { color: '#1E40AF', name: 'Rio de Janeiro' }, // Azul marinho
  'RN': { color: '#5B21B6', name: 'Rio Grande do Norte' }, // Índigo
  'RS': { color: '#BE185D', name: 'Rio Grande do Sul' }, // Pink escuro
  'RO': { color: '#0369A1', name: 'Rondônia' },       // Azul céu escuro
  'RR': { color: '#A21CAF', name: 'Roraima' },        // Fúcsia
  'SC': { color: '#0284C7', name: 'Santa Catarina' }, // Azul claro
  'SP': { color: '#0d2857', name: 'São Paulo' },      // Azul FEBRACA (cor principal)
  'SE': { color: '#0F766E', name: 'Sergipe' },        // Teal escuro
  'TO': { color: '#B91C1C', name: 'Tocantins' },      // Vermelho escuro
};

const getStateColor = (stateCode: string): string => {
  return STATE_COLORS[stateCode]?.color || '#6B7280';
};

interface MapComponentProps {
  ongs: ONG[];
  selectedONGs: ONG[];
  onONGClick: (ong: ONG) => void;
  onBoxSelect?: (ongs: ONG[]) => void;
  isFilterSelection?: boolean; // true quando a seleção é automática por filtro
  searchLocation?: { lat: number; lng: number } | null; // Local da busca por proximidade
  searchRadius?: number; // Raio de busca em km
}

interface BoxSelectorProps {
  isActive: boolean;
  ongs: ONG[];
  onBoxSelect: (ongs: ONG[]) => void;
  selectionBounds: LatLngBounds | null;
  setSelectionBounds: (bounds: LatLngBounds | null) => void;
}

function BoxSelector({ isActive, ongs, onBoxSelect, selectionBounds, setSelectionBounds }: BoxSelectorProps) {
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useMapEvents({
    mousedown(e) {
      if (!isActive) return;
      setStartPoint(e.latlng);
      setIsDrawing(true);
      setSelectionBounds(null);
    },
    mousemove(e) {
      if (!isActive || !isDrawing || !startPoint) return;
      const bounds = new LatLngBounds(startPoint, e.latlng);
      setSelectionBounds(bounds);
    },
    mouseup(e) {
      if (!isActive || !isDrawing || !startPoint) return;
      setIsDrawing(false);
      
      const bounds = new LatLngBounds(startPoint, e.latlng);
      setSelectionBounds(bounds);
      
      // Find all ONGs within the selection bounds
      const selectedOngs = ongs.filter(ong => {
        const point = new LatLng(ong.lat, ong.lng);
        return bounds.contains(point);
      });
      
      if (selectedOngs.length > 0) {
        onBoxSelect(selectedOngs);
      }
      
      setStartPoint(null);
    },
  });

  return selectionBounds ? (
    <Rectangle
      bounds={selectionBounds}
      pathOptions={{
        color: '#0d2857',
        weight: 2,
        fillColor: '#0d2857',
        fillOpacity: 0.2,
        dashArray: '5, 5',
      }}
    />
  ) : null;
}

// Legend component
function MapLegend({ visibleStates }: { visibleStates: string[] }) {
  const legendStates = Object.entries(STATE_COLORS)
    .filter(([code]) => visibleStates.includes(code))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  if (legendStates.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[10] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 max-h-[300px] overflow-y-auto">
      <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0d2857] dark:bg-blue-400"></span>
        Legenda por Estado
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {legendStates.map(([code, { color, name }]) => (
          <div key={code} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-600 dark:text-gray-300 truncate" title={name}>
              {code} - {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para centralizar o mapa quando houver busca por proximidade
function MapCenterController({ location, radius }: { location: { lat: number; lng: number } | null; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      // Calcular zoom baseado no raio (maior raio = menor zoom)
      let zoom = 10;
      if (radius <= 10) zoom = 12;
      else if (radius <= 25) zoom = 11;
      else if (radius <= 50) zoom = 10;
      else if (radius <= 100) zoom = 9;
      else zoom = 8;
      
      map.setView([location.lat, location.lng], zoom, { animate: true });
    }
  }, [location, radius, map]);
  
  return null;
}

// Ícone customizado para o marcador de localização de busca
const searchLocationIcon = L.divIcon({
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #14b8a6, #06b6d4);
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  className: 'search-location-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function MapComponent({ ongs, selectedONGs, onONGClick, onBoxSelect, isFilterSelection = false, searchLocation = null, searchRadius = 50 }: MapComponentProps) {
  const [boxSelectMode, setBoxSelectMode] = useState(false);
  const [selectionBounds, setSelectionBounds] = useState<LatLngBounds | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  // Get unique states from visible ONGs
  const visibleStates = [...new Set(ongs.map(ong => ong.stateCode))];
  
  // Log para debug
  useEffect(() => {
    console.log('=== MAPA DEBUG ===');
    console.log('ONGs recebidas no mapa:', ongs.length);
    console.log('Estados no mapa:', visibleStates);
    
    // Verificar se há ONGs duplicadas ou de estados diferentes
    const estadosUnicos = [...new Set(ongs.map(o => o.stateCode))];
    if (estadosUnicos.length > 1) {
      console.log('⚠️ Múltiplos estados no mapa:', estadosUnicos);
      estadosUnicos.forEach(estado => {
        const count = ongs.filter(o => o.stateCode === estado).length;
        console.log(`   - ${estado}: ${count} ONGs`);
      });
    }
  }, [ongs, visibleStates]);

  // Gerar ID único para o container do mapa
  const mapContainerId = useId();

  const isSelected = (ong: ONG) => selectedONGs.some(s => s.id === ong.id);

  const handleBoxSelect = useCallback((selectedOngs: ONG[]) => {
    if (onBoxSelect) {
      onBoxSelect(selectedOngs);
    }
  }, [onBoxSelect]);

  const toggleBoxSelectMode = () => {
    setBoxSelectMode(!boxSelectMode);
    setSelectionBounds(null);
    
    // Toggle map dragging
    if (mapRef.current) {
      if (!boxSelectMode) {
        mapRef.current.dragging.disable();
        mapRef.current.getContainer().style.cursor = 'crosshair';
      } else {
        mapRef.current.dragging.enable();
        mapRef.current.getContainer().style.cursor = '';
      }
    }
  };

  const clearSelection = () => {
    setSelectionBounds(null);
  };

  // Fixed marker radius for all ONGs - very small
  const markerRadius = 1.5;

  return (
    <div className="relative h-full w-full">
      {/* Box Select Controls */}
      <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
        <button
          onClick={toggleBoxSelectMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-lg transition-all ${
            boxSelectMode
              ? 'bg-[#0d2857] text-white hover:bg-[#022873]'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
          }`}
          title={boxSelectMode ? 'Desativar seleção por área' : 'Ativar seleção por área'}
        >
          {boxSelectMode ? (
            <>
              <MousePointer2 size={18} />
              <span>Modo Normal</span>
            </>
          ) : (
            <>
              <Square size={18} />
              <span>Seleção por Área</span>
            </>
          )}
        </button>
        
        {selectionBounds && (
          <button
            onClick={clearSelection}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-lg bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            Limpar Área
          </button>
        )}

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all"
        >
          {showLegend ? 'Ocultar Legenda' : 'Mostrar Legenda'}
        </button>
      </div>

      {/* Box Select Mode Indicator */}
      {boxSelectMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10] bg-[#0d2857] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
          🖱️ Clique e arraste para selecionar ONGs na área
        </div>
      )}

      {/* Legend */}
      {showLegend && <MapLegend visibleStates={visibleStates} />}

      <MapContainer
        key={mapContainerId}
        center={[-15.7942, -47.8825]}
        zoom={4}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Controlador de centro do mapa para busca por proximidade */}
        <MapCenterController location={searchLocation} radius={searchRadius} />
        
        {/* Círculo de raio da busca por proximidade */}
        {searchLocation && (
          <>
            <Circle
              center={[searchLocation.lat, searchLocation.lng]}
              radius={searchRadius * 1000} // Converter km para metros
              pathOptions={{
                color: '#14b8a6',
                weight: 2,
                fillColor: '#14b8a6',
                fillOpacity: 0.1,
                dashArray: '10, 5',
              }}
            />
            <Marker 
              position={[searchLocation.lat, searchLocation.lng]}
              icon={searchLocationIcon}
            >
              <Tooltip permanent direction="top" offset={[0, -30]}>
                <span className="font-medium">📍 Local de busca</span>
              </Tooltip>
            </Marker>
          </>
        )}
        
        <BoxSelector
          isActive={boxSelectMode}
          ongs={ongs}
          onBoxSelect={handleBoxSelect}
          selectionBounds={selectionBounds}
          setSelectionBounds={setSelectionBounds}
        />
        
        {ongs.map((ong) => {
          const selected = isSelected(ong);
          const baseColor = getStateColor(ong.stateCode);
          // Só destaca visualmente se for seleção manual (não por filtro)
          const showSelectedStyle = selected && !isFilterSelection;
          
          return (
            <CircleMarker
              key={ong.id}
              center={[ong.lat, ong.lng]}
              radius={markerRadius}
              pathOptions={{
                fillColor: baseColor,
                fillOpacity: showSelectedStyle ? 1 : 0.8,
                color: showSelectedStyle ? '#ffffff' : baseColor,
                weight: showSelectedStyle ? 4 : 2,
                opacity: 1,
              }}
              eventHandlers={{
                click: () => !boxSelectMode && onONGClick(ong),
              }}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={0.95}
                className="custom-tooltip"
              >
                <div className="font-medium text-gray-800">{ong.name}</div>
                <div className="text-xs text-gray-500">{ong.city}, {ong.stateCode}</div>
              </Tooltip>
              <Popup>
                <div className="min-w-[280px] max-w-[320px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: baseColor }}
                    />
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${baseColor}20`, color: baseColor }}>
                      {ong.stateCode}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{ong.name}</h3>
                  {ong.shortName && (
                    <p className="text-xs text-[#0d2857] font-medium mb-2">{ong.shortName}</p>
                  )}
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-600 flex items-center gap-2">
                      <span>📍</span> {ong.city} • {ong.stateCode}
                    </p>
                    {ong.cnpj && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <span>🏢</span> {ong.cnpj}
                      </p>
                    )}
                    {ong.phone && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <span>📞</span> {ong.phone}
                      </p>
                    )}
                    {ong.email && (
                      <p className="text-gray-600 flex items-center gap-2 truncate">
                        <span>✉️</span> {ong.email}
                      </p>
                    )}
                    {ong.socios && ong.socios.length > 0 && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <span>👥</span> {ong.socios.length} sócio(s)
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onONGClick(ong)}
                    className={`mt-3 w-full py-2 px-4 rounded-lg text-white text-xs font-medium transition-all ${
                      selected
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-[#0d2857] hover:bg-[#022873]'
                    }`}
                  >
                    {selected ? '✕ Remover da Seleção' : '✓ Selecionar ONG'}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
