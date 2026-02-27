'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Filters from '@/components/Filters';
import StatsCards from '@/components/StatsCards';
import Map from '@/components/Map';
import ONGCharts from '@/components/ONGCharts';
import SelectedONGs from '@/components/SelectedONGs';
import ProximitySearch from '@/components/ProximitySearch';
import Confetti, { SuccessToast } from '@/components/Confetti';
import { ONG, fetchAllData, brazilStates } from '@/data/mockData';
import { RefreshCw, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';

const normalizeDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const [ongs, setOngs] = useState<ONG[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cnpjSearch, setCnpjSearch] = useState('');
  const [selectedONGs, setSelectedONGs] = useState<ONG[]>([]);
  const [isFilterSelection, setIsFilterSelection] = useState(false); // true quando seleção é automática por filtro
  
  // Estados para busca por proximidade
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  
  // Estados para animações de sucesso
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Função para carregar dados
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchAllData();
      
      if (result.error) {
        setError(result.error);
      } else {
        setOngs(result.ongs);
        setLastUpdate(result.lastUpdate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [loadData, isAuthenticated]);

  // Atualizar dados a cada 5 minutos
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData, isAuthenticated]);

  // Get cities based on selected state
  const cities = useMemo(() => {
    const filteredOngs = selectedState 
      ? ongs.filter(ong => ong.stateCode === selectedState)
      : ongs;
    const citySet = new Set(filteredOngs.map(ong => ong.city));
    return [...citySet].sort();
  }, [selectedState, ongs]);

  const matchesFilters = useCallback((ong: ONG) => {
    const matchesState = !selectedState || ong.stateCode.toUpperCase() === selectedState.toUpperCase();
    const matchesCity = !selectedCity || ong.city === selectedCity;
    const normalizedNameSearch = searchTerm.trim().toLowerCase();
    const matchesName =
      !normalizedNameSearch ||
      ong.name.toLowerCase().includes(normalizedNameSearch) ||
      (ong.shortName && ong.shortName.toLowerCase().includes(normalizedNameSearch));
    const normalizedCnpjSearch = normalizeDigits(cnpjSearch);
    const ongIdDigits = normalizeDigits(ong.id);
    const matchesCnpj =
      !normalizedCnpjSearch ||
      ongIdDigits.includes(normalizedCnpjSearch) ||
      normalizeDigits(ong.cnpj).includes(normalizedCnpjSearch) ||
      normalizeDigits(ong.cnpjBasico).includes(normalizedCnpjSearch);
    return matchesState && matchesCity && matchesName && matchesCnpj;
  }, [selectedState, selectedCity, searchTerm, cnpjSearch]);

  // Filter ONGs based on selected filters
  const filteredONGs = useMemo(() => {
    return ongs.filter(matchesFilters);
  }, [ongs, matchesFilters]);

  // Get unique cities count from filtered ONGs
  const uniqueCities = useMemo(() => {
    return new Set(filteredONGs.map((ong) => ong.city)).size;
  }, [filteredONGs]);

  // Get chart data - ONGs por estado
  const stateData = useMemo(() => {
    const stateCount: Record<string, number> = {};
    
    ongs.forEach(ong => {
      stateCount[ong.stateCode] = (stateCount[ong.stateCode] || 0) + 1;
    });
    
    return Object.entries(stateCount)
      .map(([stateCode, count]) => ({
        stateCode,
        state: brazilStates.find(s => s.code === stateCode)?.name || stateCode,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [ongs]);

  // Get chart data - Top 10 cidades (usa filteredONGs para refletir o filtro de estado)
  const cityData = useMemo(() => {
    const cityCount: Record<string, number> = {};
    
    filteredONGs.forEach(ong => {
      cityCount[ong.city] = (cityCount[ong.city] || 0) + 1;
    });
    
    return Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredONGs]);

  // Selecionar automaticamente todas as ONGs filtradas quando mudar o filtro de estado, cidade ou busca por nome
  useEffect(() => {
    const hasActiveFilter = selectedState || selectedCity || searchTerm || cnpjSearch;
    
    if (hasActiveFilter) {
      // Se há filtro ativo, seleciona todas as ONGs que correspondem ao filtro
      setSelectedONGs(filteredONGs);
      setIsFilterSelection(true);
    } else {
      // Se não há filtro, limpa a seleção
      setSelectedONGs([]);
      setIsFilterSelection(false);
    }
  }, [selectedState, selectedCity, searchTerm, cnpjSearch, filteredONGs]);

  // Handlers
  const handleONGClick = (ong: ONG) => {
    // Só permite selecionar se a ONG corresponde ao filtro atual
    if (!matchesFilters(ong)) {
      return;
    }
    
    setIsFilterSelection(false); // Marca como seleção manual
    setSelectedONGs((prev) => {
      const isSelected = prev.some((o) => o.id === ong.id);
      if (isSelected) {
        return prev.filter((o) => o.id !== ong.id);
      }
      return [...prev, ong];
    });
  };

  const handleRemoveONG = (ong: ONG) => {
    setIsFilterSelection(false); // Marca como seleção manual
    setSelectedONGs((prev) => prev.filter((o) => o.id !== ong.id));
  };

  const handleBoxSelect = (selectedOngs: ONG[]) => {
    // Filtra apenas ONGs que correspondem ao filtro atual
    const validOngs = selectedOngs.filter(matchesFilters);
    
    setIsFilterSelection(false); // Marca como seleção manual
    setSelectedONGs((prev) => {
      // Add new ONGs that aren't already selected
      const newONGs = validOngs.filter(ong => !prev.some(o => o.id === ong.id));
      return [...prev, ...newONGs];
    });
  };

  const handleClearFilters = () => {
    setSelectedState('');
    setSelectedCity('');
    setSearchTerm('');
    setCnpjSearch('');
  };

  const handleClearSelection = () => {
    setSelectedONGs([]);
  };

  // Handler para busca por proximidade
  const handleProximitySearchResult = (location: { lat: number; lng: number } | null, nearbyOngs: ONG[], radius: number) => {
    setSearchLocation(location);
    setSearchRadius(radius);
    if (location && nearbyOngs.length > 0) {
      // Limpa filtros de estado/cidade para mostrar todas as ONGs no mapa
      setSelectedState('');
      setSelectedCity('');
      // Seleciona as ONGs próximas encontradas
      setSelectedONGs(nearbyOngs);
      setIsFilterSelection(true); // Não destacar individualmente
    } else if (!location) {
      // Limpou a busca
      setSelectedONGs([]);
      setIsFilterSelection(false);
    }
  };

  // Handler para selecionar ONG da lista de proximidade
  const handleProximitySelectONG = (ong: ONG) => {
    setIsFilterSelection(false); // Marca como seleção manual
    setSelectedONGs([ong]); // Seleciona apenas essa ONG
  };

  const handleGenerateReport = () => {
    // Se não há ONGs selecionadas, usa todas as filtradas
    const ongsToExport = selectedONGs.length > 0 ? selectedONGs : filteredONGs;
    
    if (ongsToExport.length === 0) {
      alert('Nenhuma ONG disponível para gerar relatório.');
      return;
    }

    // Preparar dados para o Excel
    const excelData = ongsToExport.map(ong => ({
      'CNPJ': ong.id,
      'Razão Social': ong.name,
      'Nome Fantasia': ong.shortName || '',
      'Estado': ong.stateCode,
      'Cidade': ong.city,
      'Bairro': ong.neighborhood || '',
      'Endereço': ong.address || '',
      'CEP': ong.cep || '',
      'DDD': ong.ddd || '',
      'Telefone': ong.phone || '',
      'Email': ong.email || '',
      'Latitude': ong.lat,
      'Longitude': ong.lng,
      'Sócios': ong.socios?.map(s => `${s.nome} (${s.cargo})`).join('; ') || ''
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 18 },  // CNPJ
      { wch: 50 },  // Razão Social
      { wch: 30 },  // Nome Fantasia
      { wch: 5 },   // Estado
      { wch: 25 },  // Cidade
      { wch: 20 },  // Bairro
      { wch: 40 },  // Endereço
      { wch: 10 },  // CEP
      { wch: 5 },   // DDD
      { wch: 15 },  // Telefone
      { wch: 35 },  // Email
      { wch: 12 },  // Latitude
      { wch: 12 },  // Longitude
      { wch: 50 },  // Sócios
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'ONGs');

    // Gerar nome do arquivo com data e filtros
    const date = new Date().toISOString().split('T')[0];
    const filterInfo = selectedState ? `_${selectedState}` : '';
    const cityInfo = selectedCity ? `_${selectedCity.replace(/\s/g, '-')}` : '';
    const fileName = `FEBRACA_ONGs${filterInfo}${cityInfo}_${date}.xlsx`;

    // Fazer download
    XLSX.writeFile(wb, fileName);
    
    // Mostrar confetti e toast de sucesso! 🎉
    setShowConfetti(true);
    setSuccessMessage(`Relatório gerado com ${ongsToExport.length} ONGs!`);
    setShowSuccessToast(true);
  };

  // Mostrar loading enquanto verifica autenticação (DEPOIS de todos os hooks)
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#0d2857] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header lastUpdate={lastUpdate} onRefresh={loadData} isLoading={isLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Erro ao carregar dados</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2">
                Verifique se as planilhas do Google Sheets estão com permissão de acesso público.
              </p>
              <button 
                onClick={loadData}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && ongs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#0d2857]/20 border-t-[#0d2857] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🐾</span>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Carregando dados das ONGs...</p>
            <p className="text-sm text-gray-500">Buscando informações do Google Sheets</p>
          </div>
        )}

        {/* Main Content - only show when we have data */}
        {(!isLoading || ongs.length > 0) && (
          <>
            {/* Filters */}
            <Filters
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          cnpjSearch={cnpjSearch}
          setCnpjSearch={setCnpjSearch}
          cities={cities}
          onClearFilters={handleClearFilters}
          onClearSelection={handleClearSelection}
          onGenerateReport={handleGenerateReport}
          selectedCount={selectedONGs.length}
          filteredCount={filteredONGs.length}
        />

        {/* Stats Cards */}
        <StatsCards 
          ongsCount={filteredONGs.length} 
          citiesCount={uniqueCities} 
          selectedCount={selectedONGs.length}
          selectedCitiesCount={new Set(selectedONGs.map(o => o.city)).size}
        />

        {/* Proximity Search - Busca por proximidade */}
        <ProximitySearch
          ongs={ongs}
          onSearchResult={handleProximitySearchResult}
          onSelectONG={handleProximitySelectONG}
        />

        {/* Map Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0d2857]"></span>
            Mapa de ONGs
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              (Clique em um marcador ou use a seleção por área)
            </span>
          </h3>
          <div className="h-[500px] rounded-xl overflow-hidden">
            <Map
              key={`map-${selectedState}-${selectedCity}-${filteredONGs.length}-${searchLocation?.lat}`}
              ongs={searchLocation ? ongs : filteredONGs}
              selectedONGs={selectedONGs}
              onONGClick={handleONGClick}
              onBoxSelect={handleBoxSelect}
              isFilterSelection={isFilterSelection}
              searchLocation={searchLocation}
              searchRadius={searchRadius}
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-6">
          <ONGCharts stateData={stateData} cityData={cityData} selectedState={selectedState} />
        </div>

        {/* Selected ONGs Section */}
        <SelectedONGs
          selectedONGs={selectedONGs}
          onRemove={handleRemoveONG}
          onClearAll={handleClearSelection}
        />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2026 FEBRACA - Federação Brasileira da Causa Animal. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d2857] dark:hover:text-blue-400 transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d2857] dark:hover:text-blue-400 transition-colors">
                Termos de Uso
              </a>
              <a href="https://febraca.org.br" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0d2857] dark:text-blue-400 hover:text-[#022873] dark:hover:text-blue-300 font-medium transition-colors">
                febraca.org.br
              </a>
            </div>
          </div>
          {/* Desenvolvido por */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">Desenvolvido por</span>
            <a 
              href="https://arcanimal.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <img 
                src="https://arcanimal.com.br/assets/icons/logo.jpg" 
                alt="ArcAnimal" 
                className="w-5 h-5 rounded"
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ArcAnimal</span>
            </a>
          </div>
        </div>
      </footer>
      
      {/* Confetti e Toast de Sucesso */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      <SuccessToast 
        message={successMessage} 
        isVisible={showSuccessToast} 
        onClose={() => setShowSuccessToast(false)} 
      />
    </div>
  );
}