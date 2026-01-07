'use client';

import { brazilStates } from '@/data/mockData';
import { Search, Filter, MapPin, X, FileText, RotateCcw } from 'lucide-react';

interface FiltersProps {
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  cities: string[];
  onClearFilters: () => void;
  onClearSelection: () => void;
  onGenerateReport: () => void;
  selectedCount: number;
  filteredCount: number;
}

export default function Filters({
  selectedState,
  setSelectedState,
  selectedCity,
  setSelectedCity,
  searchTerm,
  setSearchTerm,
  cities,
  onClearFilters,
  onClearSelection,
  onGenerateReport,
  selectedCount,
  filteredCount,
}: FiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* State Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0d2857]" />
            Filtrar por Estado
          </label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCity('');
            }}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white transition-all"
          >
            <option value="">Todos os Estados</option>
            {brazilStates.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            Filtrar por Cidade
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white transition-all"
            disabled={!selectedState && cities.length === 0}
          >
            <option value="">Todas as Cidades</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-500" />
            Pesquisar por Nome
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome da ONG..."
              className="w-full px-4 py-3 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar Filtros
        </button>

        <button
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Limpar Seleção ({selectedCount})
        </button>

        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-6 py-2.5 btn-primary text-white font-medium rounded-xl shadow-lg ml-auto"
        >
          <FileText className="w-4 h-4" />
          Gerar Relatório {selectedCount > 0 ? `(${selectedCount})` : `(${filteredCount})`}
        </button>
      </div>
    </div>
  );
}
