'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, X, Loader2 } from 'lucide-react';
import { ONG } from '@/data/mockData';

interface ProximitySearchProps {
  ongs: ONG[];
  onSearchResult: (location: { lat: number; lng: number } | null, nearbyOngs: ONG[], radius: number) => void;
  onSelectONG: (ong: ONG) => void;
}

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

// Função para calcular distância entre dois pontos (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Hook customizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProximitySearch({ ongs, onSearchResult, onSelectONG }: ProximitySearchProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<GeocodingResult | null>(null);
  const [nearbyOngs, setNearbyOngs] = useState<(ONG & { distance: number })[]>([]);
  const [radius, setRadius] = useState(50); // km
  const [error, setError] = useState<string | null>(null);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  
  // Estados para autocomplete
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce do texto de busca para não fazer muitas requisições
  const debouncedSearch = useDebounce(searchAddress, 300);

  // Buscar sugestões de endereço
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Se for CEP, não buscar sugestões
    const digits = query.replace(/\D/g, '');
    if (digits.length >= 8) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const formattedSuggestions: AddressSuggestion[] = data.map((item: { display_name: string; lat: string; lon: string }) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Efeito para buscar sugestões quando o texto muda
  useEffect(() => {
    if (debouncedSearch && !searchLocation) {
      fetchSuggestions(debouncedSearch);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, fetchSuggestions, searchLocation]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selecionar uma sugestão
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSearchAddress(suggestion.displayName.split(',').slice(0, 3).join(', '));
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Fazer a busca automaticamente
    const nearby = findNearbyOngs(suggestion.lat, suggestion.lng, radius);
    setNearbyOngs(nearby);
    setSearchLocation({
      lat: suggestion.lat,
      lng: suggestion.lng,
      displayName: suggestion.displayName
    });
    onSearchResult({ lat: suggestion.lat, lng: suggestion.lng }, nearby, radius);
    setError(null);
  };

  // Navegação por teclado nas sugestões
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Verificar se é um CEP (8 dígitos)
  const isCEP = (text: string): boolean => {
    const digits = text.replace(/\D/g, '');
    return digits.length === 8;
  };

  // Buscar endereço pelo CEP usando ViaCEP
  const geocodeCEP = async (cep: string): Promise<GeocodingResult | null> => {
    try {
      const digits = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      
      if (data && !data.erro) {
        // ViaCEP retorna endereço, precisamos converter para coordenadas
        const address = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
        return geocodeAddress(address);
      }
      return null;
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      return null;
    }
  };

  // Geocoding usando Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=br`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    } catch (err) {
      console.error('Erro no geocoding:', err);
      return null;
    }
  };

  // Função principal de geocoding que detecta CEP ou endereço
  const geocode = async (input: string): Promise<GeocodingResult | null> => {
    if (isCEP(input)) {
      // Primeiro tenta buscar pelo CEP
      const cepResult = await geocodeCEP(input);
      if (cepResult) return cepResult;
    }
    // Se não for CEP ou falhar, tenta como endereço normal
    return geocodeAddress(input);
  };

  // Buscar ONGs próximas a uma localização
  const findNearbyOngs = useCallback((lat: number, lng: number, radiusKm: number) => {
    const nearby = ongs
      .map(ong => ({
        ...ong,
        distance: calculateDistance(lat, lng, ong.lat, ong.lng)
      }))
      .filter(ong => ong.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
    return nearby;
  }, [ongs]);

  // Handler de busca por endereço
  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    const result = await geocode(searchAddress);
    
    if (result) {
      setSearchLocation(result);
      const nearby = findNearbyOngs(result.lat, result.lng, radius);
      setNearbyOngs(nearby);
      onSearchResult({ lat: result.lat, lng: result.lng }, nearby, radius);
    } else {
      setError('Endereço ou CEP não encontrado. Tente digitar cidade e estado (ex: São Paulo, SP) ou um CEP válido.');
      setSearchLocation(null);
      setNearbyOngs([]);
    }
    
    setIsSearching(false);
  };

  // Handler para usar localização atual (GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }
    
    setIsUsingGPS(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchLocation({
          lat: latitude,
          lng: longitude,
          displayName: 'Sua localização atual'
        });
        const nearby = findNearbyOngs(latitude, longitude, radius);
        setNearbyOngs(nearby);
        onSearchResult({ lat: latitude, lng: longitude }, nearby, radius);
        setIsUsingGPS(false);
      },
      (err) => {
        setError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setIsUsingGPS(false);
        console.error('Erro GPS:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Atualizar busca quando raio muda
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (searchLocation) {
      const nearby = findNearbyOngs(searchLocation.lat, searchLocation.lng, newRadius);
      setNearbyOngs(nearby);
      onSearchResult({ lat: searchLocation.lat, lng: searchLocation.lng }, nearby, newRadius);
    }
  };

  // Limpar busca
  const handleClear = () => {
    setSearchAddress('');
    setSearchLocation(null);
    setNearbyOngs([]);
    setError(null);
    onSearchResult(null, [], 0);
  };

  // Formatar distância
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg p-6 mb-6 border border-emerald-100 dark:border-emerald-800 transition-colors duration-300">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Navigation className="w-5 h-5 text-white" />
        </div>
        <div>
          <span>Buscar ONGs Próximas</span>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Encontre as ONGs mais próximas de um endereço ou da sua localização
          </p>
        </div>
      </h3>

      <div className="space-y-4">
        {/* Barra de busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              ref={inputRef}
              type="text"
              value={searchAddress}
              onChange={(e) => {
                setSearchAddress(e.target.value);
                setSearchLocation(null); // Limpar localização ao digitar
                setSelectedSuggestionIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Digite um endereço, CEP ou cidade..."
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 animate-spin" />
            )}
            
            {/* Dropdown de sugestões */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                      index === selectedSuggestionIndex 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm line-clamp-2">
                      {suggestion.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchAddress.trim()}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Buscar
          </button>
          
          <button
            onClick={handleUseCurrentLocation}
            disabled={isUsingGPS}
            className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-[#02186b] dark:border-blue-400 text-[#02186b] dark:text-blue-400 rounded-xl font-medium hover:bg-[#02186b] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title="Usar minha localização atual"
          >
            {isUsingGPS ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Minha Localização</span>
          </button>

          {searchLocation && (
            <button
              onClick={handleClear}
              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center"
              title="Limpar busca"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Slider de raio */}
        <div className="flex items-center gap-4 bg-white rounded-xl p-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Raio de busca:
          </label>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-sm font-bold text-emerald-600 min-w-[60px] text-right">
            {radius} km
          </span>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Resultados */}
        {searchLocation && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header do resultado */}
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">📍 {searchLocation.displayName.split(',').slice(0, 3).join(', ')}</p>
                  <p className="text-sm text-emerald-100">
                    {nearbyOngs.length} ONG{nearbyOngs.length !== 1 ? 's' : ''} encontrada{nearbyOngs.length !== 1 ? 's' : ''} em um raio de {radius} km
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de ONGs próximas */}
            {nearbyOngs.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {nearbyOngs.slice(0, 10).map((ong, index) => (
                  <div
                    key={ong.id}
                    onClick={() => onSelectONG(ong)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    {/* Posição */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Info da ONG */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {ong.shortName || ong.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {ong.city}, {ong.stateCode}
                      </p>
                    </div>

                    {/* Distância */}
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {formatDistance(ong.distance)}
                      </p>
                      <p className="text-xs text-gray-400">de distância</p>
                    </div>
                  </div>
                ))}
                
                {nearbyOngs.length > 10 && (
                  <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
                    ... e mais {nearbyOngs.length - 10} ONGs
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma ONG encontrada neste raio.</p>
                <p className="text-sm">Tente aumentar o raio de busca.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
