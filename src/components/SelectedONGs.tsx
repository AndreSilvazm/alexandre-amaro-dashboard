'use client';

import { useMemo, useState } from 'react';
import { ONG } from '@/data/mockData';
import { MapPin, Phone, Mail, Home, X, Users, ChevronDown, ChevronUp, MessageCircle, Copy, Check } from 'lucide-react';

interface SelectedONGsProps {
  selectedONGs: ONG[];
  onRemove: (ong: ONG) => void;
  onClearAll: () => void;
}

function ONGCard({ ong, onRemove }: { ong: ONG; onRemove: () => void }) {
  const [showSocios, setShowSocios] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ong.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Formatar número para WhatsApp
  const formatWhatsApp = (whatsapp: string | undefined) => {
    if (!whatsapp) return null;
    // Remove tudo que não é número
    const numbers = whatsapp.replace(/\D/g, '');
    // Adiciona 55 se não começar com 55
    const fullNumber = numbers.startsWith('55') ? numbers : `55${numbers}`;
    return fullNumber;
  };

  const whatsappNumber = formatWhatsApp(ong.whatsapp);
  const whatsappMessage = encodeURIComponent(`Olá! Estou entrando em contato através do portal FEBRACA. Gostaria de saber mais sobre a ${ong.shortName || ong.name}.`);

  return (
    <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
      {/* Header with remove button */}
      <div className="bg-gradient-to-r from-[#0d2857] to-emerald-500 px-4 py-3 text-white">
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/40 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
        <h4 className="font-bold text-sm leading-tight pr-8" title={ong.name}>
          {ong.shortName || ong.name}
        </h4>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {ong.city} • {ong.stateCode}
          </span>
        </div>

        {/* CNPJ */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{ong.cnpj}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
            title="Copiar CNPJ"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Phone(s) */}
        <div className="flex items-start gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            {ong.phone && <span className="text-gray-700 dark:text-gray-300">{ong.phone}</span>}
            {ong.phone2 && <span className="text-gray-500 dark:text-gray-400">{ong.phone2}</span>}
            {!ong.phone && !ong.phone2 && <span className="text-gray-400 dark:text-gray-500">Telefone não informado</span>}
          </div>
        </div>

        {/* WhatsApp Button */}
        {whatsappNumber ? (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar WhatsApp
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
            <MessageCircle className="w-5 h-5" />
            WhatsApp não disponível
          </div>
        )}

        {/* Email - Mostrar endereço + Botão de ação */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-300 truncate" title={ong.email || 'Não informado'}>
              {ong.email || 'Email não informado'}
            </span>
          </div>
          {ong.email ? (
            <a
              href={`mailto:${ong.email}?subject=Contato%20via%20FEBRACA&body=Ol%C3%A1!%20Estou%20entrando%20em%20contato%20atrav%C3%A9s%20do%20portal%20FEBRACA.`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0d2857] hover:bg-[#1e4080] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all"
            >
              <Mail className="w-5 h-5" />
              Enviar Email
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed">
              <Mail className="w-5 h-5" />
              Email não disponível
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <Home className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700 dark:text-gray-300">
            {ong.address.toUpperCase()} {ong.neighborhood.toUpperCase()} — CEP: {ong.cep}
          </span>
        </div>

        {/* Socios */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <button
            onClick={() => setShowSocios(!showSocios)}
            className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{ong.socios.length} sócio(s)</span>
              <span className="text-[#0d2857] dark:text-blue-400 hover:underline">— ver lista</span>
            </span>
            {showSocios ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showSocios && (
            <div className="mt-2 pl-6 space-y-1">
              {ong.socios.map((socio, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{socio.nome}</span>
                  {socio.cargo && (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">({socio.cargo})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SelectedONGs({ selectedONGs, onRemove, onClearAll }: SelectedONGsProps) {
  const [activeONG, setActiveONG] = useState<ONG | null>(null);
  const sortedONGs = useMemo(() => {
    return [...selectedONGs].sort((a, b) => {
      const nameA = (a.shortName || a.name).toLocaleLowerCase('pt-BR');
      const nameB = (b.shortName || b.name).toLocaleLowerCase('pt-BR');
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }, [selectedONGs]);

  const handleRemove = (ong: ONG) => {
    onRemove(ong);
    if (activeONG && activeONG.id === ong.id) {
      setActiveONG(null);
    }
  };

  const handleClearAll = () => {
    onClearAll();
    setActiveONG(null);
  };

  if (selectedONGs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors duration-300">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Nenhuma ONG Selecionada</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Clique no mapa ou use os filtros para selecionar ONGs e adicionar ao relatório.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0d2857]"></span>
          ONGs Selecionadas
          <span className="ml-2 px-3 py-1 bg-[#0d2857]/10 dark:bg-blue-900/30 text-[#0d2857] dark:text-blue-400 text-sm font-semibold rounded-full">
            {selectedONGs.length}
          </span>
        </h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium transition-colors flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Limpar Seleção
        </button>
      </div>

      <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {sortedONGs.map((ong) => (
          <div
            key={ong.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 bg-white/40 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{ong.shortName || ong.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ong.city} • {ong.stateCode}</p>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveONG(ong)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0d2857] dark:text-blue-300 border border-[#0d2857]/30 dark:border-blue-800 rounded-xl hover:bg-[#0d2857]/10 dark:hover:bg-blue-900/30 transition-colors"
              >
                Ver detalhes
              </button>
              <button
                type="button"
                onClick={() => handleRemove(ong)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                title="Remover ONG"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-[#0d2857]/10 dark:bg-blue-900/30 rounded-xl">
          <p className="text-2xl font-bold text-[#0d2857] dark:text-blue-400">
            {selectedONGs.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">ONGs Selecionadas</p>
        </div>
        <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {selectedONGs.reduce((sum, ong) => sum + ong.socios.length, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total de Sócios</p>
        </div>
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {new Set(selectedONGs.map(o => o.city)).size}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cidades</p>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(selectedONGs.map(o => o.stateCode)).size}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Estados</p>
        </div>
      </div>

      {activeONG && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActiveONG(null)} />
          <div className="relative z-10 w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setActiveONG(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-500 shadow-md hover:text-gray-700 flex items-center justify-center"
              aria-label="Fechar detalhes"
            >
              <X className="w-4 h-4" />
            </button>
            <ONGCard ong={activeONG} onRemove={() => handleRemove(activeONG)} />
          </div>
        </div>
      )}
    </div>
  );
}
