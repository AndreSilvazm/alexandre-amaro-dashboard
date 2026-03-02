"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import PieChart from "@/components/PieChart";
import BarChart from "@/components/BarChart";
import { stateFlags } from "@/data/stateFlags";
import type { StateFlagInfo } from "@/data/stateFlags";
import type {
  FormReportV2Entry,
  FormReportV2ImportanceScores,
} from "@/services/googleSheets";

interface FormsDashboardReportsClientProps {
  entries: FormReportV2Entry[];
  lastUpdate?: string;
}

interface DistributionDatum {
  label: string;
  value: number;
  helper?: string;
}

interface RankedItem extends DistributionDatum {
  percentage: number;
}

const CARD_CLASS =
  "bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/60 dark:shadow-black/30 p-6";
const ITEMS_PER_PAGE = 10;

const IMPORTANCE_LABELS: Record<keyof FormReportV2ImportanceScores, string> = {
  training: "Capacitação da equipe e voluntários",
  fundraising: "Captação de recursos",
  transparency: "Transparência e prestação de contas",
  partnerships: "Parcerias com empresas e governo",
  technology: "Adoção de tecnologia",
  communication: "Comunicação e marketing",
  discounts: "Benefícios e descontos com empresas",
  animalPlatform: "Plataforma para cadastro de animais",
};

function tryParseDate(value?: string) {
  if (!value) return undefined;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return undefined;
  const [, day, month, year, hour = "00", minute = "00", second = "00"] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function normalizeLabel(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function buildDistribution<T>(items: T[], selector: (item: T) => string) {
  const counts = new Map<string, DistributionDatum>();

  items.forEach((item) => {
    const label = normalizeLabel(selector(item));
    if (!label) return;
    const key = label.toLowerCase();
    const current = counts.get(key);
    if (current) {
      current.value += 1;
    } else {
      counts.set(key, { label, value: 1 });
    }
  });

  return [...counts.values()].sort((a, b) => b.value - a.value);
}

function withPercentages(data: DistributionDatum[], total: number): DistributionDatum[] {
  if (total <= 0) return data;
  return data.map((item) => ({
    ...item,
    helper: `${Math.round((item.value / total) * 100)}%`,
  }));
}

function toRankedList(data: DistributionDatum[], total: number): RankedItem[] {
  return data.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));
}

function toPieData(data: DistributionDatum[], limit?: number) {
  const sliced = typeof limit === "number" ? data.slice(0, limit) : data;
  return sliced.map((item) => ({ label: item.label, value: item.value }));
}

const STATE_FLAGS = stateFlags;

function normalizeStateText(value?: string) {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

const STATE_NAME_LOOKUP = Object.values(STATE_FLAGS).reduce<Record<string, StateFlagInfo>>((acc, info) => {
  const normalized = normalizeStateText(info.name);
  if (normalized) {
    acc[normalized] = info;
  }
  return acc;
}, {});

function extractCodeFromStateLabel(value?: string) {
  if (!value) return undefined;
  const parenthesisMatch = value.match(/\(([A-Za-z]{2})\)/);
  if (parenthesisMatch) {
    const candidate = parenthesisMatch[1].toUpperCase();
    if (STATE_FLAGS[candidate]) return candidate;
  }
  const genericMatches = value.match(/\b([A-Za-z]{2})\b/g);
  if (genericMatches) {
    const usable = genericMatches
      .map((token) => token.toUpperCase())
      .find((token) => Boolean(STATE_FLAGS[token]));
    if (usable) return usable;
  }
  return undefined;
}

interface ResolvedStateFlagInfo {
  code: string;
  name: string;
  flagUrl: string;
}

function getStateFlagInfo(state?: string, stateCode?: string): ResolvedStateFlagInfo | undefined {
  const normalizedCode = stateCode?.trim().toUpperCase();
  if (normalizedCode && STATE_FLAGS[normalizedCode]) {
    const info = STATE_FLAGS[normalizedCode];
    return { code: normalizedCode, name: info.name, flagUrl: info.flag_url_square };
  }

  const derivedCode = extractCodeFromStateLabel(state);
  if (derivedCode && STATE_FLAGS[derivedCode]) {
    const info = STATE_FLAGS[derivedCode];
    return { code: derivedCode, name: info.name, flagUrl: info.flag_url_square };
  }

  const normalizedName = normalizeStateText(state);
  if (normalizedName && STATE_NAME_LOOKUP[normalizedName]) {
    const info = STATE_NAME_LOOKUP[normalizedName];
    return { code: info.uf, name: info.name, flagUrl: info.flag_url_square };
  }

  return undefined;
}

export default function FormsDashboardReportsClient({ entries, lastUpdate }: FormsDashboardReportsClientProps) {
  const totalEntries = entries.length;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("all");
  const [cnpjQuery, setCnpjQuery] = useState("");
  const modalPrintableRef = useRef<HTMLDivElement | null>(null);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    [],
  );

  const stateOptions = useMemo(() => {
    const labels = Array.from(
      new Set(
        entries
          .map((entry) => entry.state?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );
    return labels.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = cnpjQuery.replace(/\D/g, "");
    return entries.filter((entry) => {
      const stateMatches = stateFilter === "all" || normalizeLabel(entry.state) === normalizeLabel(stateFilter);
      if (!stateMatches) return false;
      if (!normalizedQuery) return true;
      const entryDigits = (entry.cnpj || "").replace(/\D/g, "");
      return entryDigits.includes(normalizedQuery);
    });
  }, [entries, stateFilter, cnpjQuery]);

  const filteredTotal = filteredEntries.length;
  const hasActiveFilter = stateFilter !== "all" || cnpjQuery.trim().length > 0;

  const orderedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const nameA = normalizeLabel(a.organization) || "Organização";
      const nameB = normalizeLabel(b.organization) || "Organização";
      const comparison = nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
      if (comparison !== 0) return comparison;
      const dateA = tryParseDate(a.timestampISO || a.timestamp);
      const dateB = tryParseDate(b.timestampISO || b.timestamp);
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    });
  }, [filteredEntries]);

  const getEntryKey = (entry: FormReportV2Entry, fallbackIndex: number) =>
    `${entry.cnpj}-${entry.timestampISO || entry.timestamp || fallbackIndex}`;

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTotal, stateFilter, cnpjQuery]);

  const totalPages = Math.max(1, Math.ceil(Math.max(1, orderedEntries.length) / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return orderedEntries.slice(start, end);
  }, [currentPage, orderedEntries]);

  const pageRangeStart = orderedEntries.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageRangeEnd = Math.min(orderedEntries.length, currentPage * ITEMS_PER_PAGE);

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return null;
    return orderedEntries.find((entry, index) => getEntryKey(entry, index) === selectedEntryKey) || null;
  }, [orderedEntries, selectedEntryKey]);

  useEffect(() => {
    if (!selectedEntryKey) return;
    const stillExists = orderedEntries.some((entry, index) => getEntryKey(entry, index) === selectedEntryKey);
    if (!stillExists) {
      setSelectedEntryKey(null);
    }
  }, [orderedEntries, selectedEntryKey]);

  const statesRepresented = useMemo(() => {
    const stateSet = new Set<string>();
    filteredEntries.forEach((entry) => {
      const stateInfo = normalizeLabel(entry.stateCode || entry.state);
      if (stateInfo) {
        stateSet.add(stateInfo.toUpperCase());
      }
    });
    return stateSet;
  }, [filteredEntries]);

  const indicatesBrandCount = useMemo(
    () =>
      filteredEntries.filter((entry) => normalizeLabel(entry.indicatesBrand).toLowerCase().startsWith("sim")).length,
    [filteredEntries],
  );

  const distributorCount = useMemo(
    () =>
      filteredEntries.filter((entry) =>
        normalizeLabel(entry.purchaseChannel).toLowerCase().includes("distribuidor"),
      ).length,
    [filteredEntries],
  );

  const localCommerceCount = useMemo(
    () =>
      filteredEntries.filter((entry) =>
        normalizeLabel(entry.purchaseChannel).toLowerCase().includes("comércio local"),
      ).length,
    [filteredEntries],
  );

  const rationVolumeData = useMemo(
    () => withPercentages(buildDistribution(filteredEntries, (entry) => entry.rationVolume).slice(0, 6), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const dogBrandsData = useMemo(
    () => withPercentages(buildDistribution(filteredEntries, (entry) => entry.dogFoodBrand).slice(0, 6), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const purchaseChannelData = useMemo(
    () => toPieData(buildDistribution(filteredEntries, (entry) => entry.purchaseChannel), 6),
    [filteredEntries],
  );

  const supportNeedsData = useMemo(
    () => withPercentages(buildDistribution(filteredEntries, (entry) => entry.institutionalSupportNeed).slice(0, 5), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const donationPriorityData = useMemo(
    () => toPieData(buildDistribution(filteredEntries, (entry) => entry.donationPriority), 6),
    [filteredEntries],
  );

  const returnReasonsData = useMemo(
    () => withPercentages(buildDistribution(filteredEntries, (entry) => entry.returnReason).slice(0, 6), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const intakeReasonsData = useMemo(
    () => withPercentages(buildDistribution(filteredEntries, (entry) => entry.intakeReason).slice(0, 6), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const purchaseFactorsList = useMemo(
    () => toRankedList(buildDistribution(filteredEntries, (entry) => entry.purchaseFactor).slice(0, 4), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const qualitySignalsList = useMemo(
    () => toRankedList(buildDistribution(filteredEntries, (entry) => entry.qualityAssessment).slice(0, 4), filteredTotal),
    [filteredEntries, filteredTotal],
  );

  const importanceAverages = useMemo(() => {
    const accumulator = Object.keys(IMPORTANCE_LABELS).reduce<Record<string, { sum: number; count: number }>>((acc, key) => {
      acc[key] = { sum: 0, count: 0 };
      return acc;
    }, {});

    filteredEntries.forEach((entry) => {
      (Object.keys(IMPORTANCE_LABELS) as Array<keyof FormReportV2ImportanceScores>).forEach((key) => {
        const value = entry.importance[key];
        if (typeof value === "number") {
          accumulator[key].sum += value;
          accumulator[key].count += 1;
        }
      });
    });

    return (Object.keys(IMPORTANCE_LABELS) as Array<keyof FormReportV2ImportanceScores>)
      .map((key) => {
        const { sum, count } = accumulator[key];
        return {
          key,
          label: IMPORTANCE_LABELS[key],
          value: count > 0 ? Number((sum / count).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  const indicatesBrandPercentage = filteredTotal > 0 ? Math.round((indicatesBrandCount / filteredTotal) * 100) : 0;
  const distributorPercentage = filteredTotal > 0 ? Math.round((distributorCount / filteredTotal) * 100) : 0;
  const localCommercePercentage = filteredTotal > 0 ? Math.round((localCommerceCount / filteredTotal) * 100) : 0;

  const statesPreview = Array.from(statesRepresented).slice(0, 6).join(", ");

  const formatEntryTimestamp = (entry: FormReportV2Entry) => {
    const parsed = tryParseDate(entry.timestampISO || entry.timestamp);
    if (parsed) return dateFormatter.format(parsed);
    return entry.timestamp || "Data não informada";
  };

  const closeModal = () => setSelectedEntryKey(null);

  const handlePrintSelected = useCallback(() => {
    if (typeof window === "undefined" || !selectedEntry) return;
    const target = modalPrintableRef.current;
    if (!target) return;

    const printable = target.outerHTML;
    const headClone = document.head.cloneNode(true) as HTMLHeadElement;
    headClone.querySelectorAll("script").forEach((script) => script.remove());
    const headContent = headClone.innerHTML;
    const htmlClass = document.documentElement.getAttribute("class") || "";
    const bodyClass = document.body.getAttribute("class") || "";
    const title = `${selectedEntry.organization || "ONG"} – FEBRACA`;
    const isDarkMode = document.documentElement.classList.contains("dark");
    const bodyBackground = isDarkMode ? "#050916" : "#f8fafc";
    const bodyColor = isDarkMode ? "#f8fafc" : "#0f172a";
    const inlineStyles = `@page{margin:12mm;}body{padding:24px;background:${bodyBackground};color:${bodyColor};font-family:'Inter',system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}*,*:before,*:after{-webkit-print-color-adjust:exact;print-color-adjust:exact;}img{max-width:100%;height:auto;} .modal-panel-appear,.modal-content-reveal{animation:none !important;} .printable-modal{max-height:none !important;height:auto !important;overflow:visible !important;} .printable-modal .sticky{position:relative !important;top:auto !important;}`;

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(
      `<!doctype html><html class="${htmlClass}"><head><title>${title}</title>${headContent}<style>${inlineStyles}</style></head><body class="${bodyClass}">${printable}</body></html>`,
    );
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 250);
    });
  }, [selectedEntry]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header lastUpdate={lastUpdate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm shadow-gray-200/70 dark:shadow-black/30 p-4">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Filtro principal</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selecione o estado de referência</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Todo o dashboard abaixo reflete automaticamente as ONGs do estado selecionado, facilitando comparações regionais.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <label
              htmlFor="state-filter-top"
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]"
            >
              Estado
            </label>
            <select
              id="state-filter-top"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="bg-transparent text-base text-gray-800 dark:text-gray-100 focus:outline-none"
            >
              <option value="all" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                Todos
              </option>
              {stateOptions.map((state) => (
                <option
                  key={state}
                  value={state}
                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                >
                  {state}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={`${CARD_CLASS} bg-gradient-to-br from-white to-emerald-50/60 dark:from-gray-900 dark:to-gray-900/40`}>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Nova leitura FEBRACA</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                Necessidades declaradas nas compras de ração e apoio institucional
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
                Este painel resume {filteredTotal} respostas
                {hasActiveFilter && filteredTotal !== totalEntries ? ` (de ${totalEntries} totais)` : ""} das ONGs sobre consumo de
                ração, prioridades de doação e fortalezas institucionais. Use os gráficos para identificar padrões por canal de
                compra, marcas preferidas e gargalos estruturais que a FEBRACA pode endereçar primeiro.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">ONGs respondentes</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{filteredTotal}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {hasActiveFilter && filteredTotal !== totalEntries ? `Filtradas de ${totalEntries} respostas` : "Rodada atual"}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estados representados</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{statesRepresented.size || "—"}</p>
                {statesPreview && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{statesPreview}</p>
                )}
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Indicam marca ao adotante</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{indicatesBrandPercentage}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{indicatesBrandCount} respostas positivas</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Compram do distribuidor</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{distributorPercentage}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{distributorCount} organizações</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Canais locais ainda representam {localCommercePercentage}% ({localCommerceCount} respostas), sinalizando espaço para negociações regionais.
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Consumo mensal</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Volume médio de ração</h2>
              </div>
            </div>
            <BarChart
              data={rationVolumeData}
              formatter={(value) => `${value} resp.`}
              emptyMessage="Ainda não recebemos respostas sobre volume."
            />
          </div>

          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Preferências</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marcas para cães</h2>
              </div>
            </div>
            <BarChart
              data={dogBrandsData}
              formatter={(value) => `${value} resp.`}
              emptyMessage="Sem marcas informadas ainda."
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Onde compram</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canais de aquisição</h2>
              </div>
            </div>
            <PieChart data={purchaseChannelData} legendColumns={2} />
          </div>

          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Prioridade declarada</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tipo de doação prioritária</h2>
              </div>
            </div>
            <PieChart data={donationPriorityData} legendColumns={2} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Fortalecimento institucional</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tipos de apoio mais pedidos</h2>
              </div>
            </div>
            <BarChart
              data={supportNeedsData}
              formatter={(value) => `${value} resp.`}
              emptyMessage="Sem pedidos de apoio suficientes."
            />
          </div>

          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Critérios de escolha</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fatores para compra e avaliação</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-2">Fatores de compra</p>
                <div className="space-y-2">
                  {purchaseFactorsList.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 dark:text-gray-100">{item.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-2">Como avaliam a qualidade</p>
                <div className="space-y-2">
                  {qualitySignalsList.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 dark:text-gray-100">{item.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Pós-adoção</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Motivos de devolução</h2>
              </div>
            </div>
            <BarChart
              data={returnReasonsData}
              formatter={(value) => `${value} resp.`}
              emptyMessage="Nenhuma devolução registrada nesta amostra."
            />
          </div>

          <div className={CARD_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Origem dos resgates</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Principais causas de entrada</h2>
              </div>
            </div>
            <BarChart
              data={intakeReasonsData}
              formatter={(value) => `${value} resp.`}
              emptyMessage="Sem dados suficientes sobre entradas."
            />
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Média das notas (1 a 4)</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Agenda de fortalecimento institucional</h2>
            </div>
          </div>
          <div className="space-y-4">
            {importanceAverages.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <p className="text-gray-800 dark:text-gray-100 font-medium">{item.label}</p>
                  <span className="text-gray-500 dark:text-gray-400">{item.value.toFixed(2)} / 4</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${(item.value / 4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/60 dark:shadow-black/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lista de ONGs respondentes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use o filtro de estado no topo e refine por CNPJ abaixo para chegar rapidamente à organização desejada. Paginação mantém a leitura leve.
              </p>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">{filteredEntries.length} registro(s)</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <label htmlFor="cnpj-query" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                CNPJ
              </label>
              <input
                id="cnpj-query"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Digite os números"
                value={cnpjQuery}
                onChange={(event) => setCnpjQuery(event.target.value)}
                className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {paginatedEntries.map((entry, index) => {
              const organizationName = entry.organization || "Organização sem nome";
              const locationLabel = entry.state || "Estado não informado";
              const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
              const cardKey = getEntryKey(entry, absoluteIndex);
              const isSelected = selectedEntryKey === cardKey;

              return (
                <article
                  key={cardKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEntryKey(cardKey)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedEntryKey(cardKey);
                    }
                  }}
                  className={`group border border-gray-100 dark:border-gray-800 rounded-2xl p-4 transition-all duration-200 bg-white/80 dark:bg-gray-900/60 hover:-translate-y-0.5 hover:border-emerald-200/70 dark:hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2857] dark:focus-visible:ring-emerald-400 ${isSelected ? "border-emerald-300 dark:border-emerald-500/60" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{organizationName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{locationLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">CNPJ</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{entry.cnpj}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    Clique para abrir o modal com detalhes completos.
                    <span className="inline-flex items-center gap-1 text-[#0d2857] dark:text-emerald-300 font-semibold uppercase tracking-tight transition-transform duration-200 group-hover:translate-x-1">
                      Ver detalhes
                      <span aria-hidden className="text-base leading-none">↗</span>
                    </span>
                  </p>
                </article>
              );
            })}

            {orderedEntries.length === 0 && (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">
                Ainda não recebemos respostas neste formulário.
              </p>
            )}
          </div>

          {orderedEntries.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Mostrando {pageRangeStart}-{pageRangeEnd} de {orderedEntries.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0d2857] hover:text-[#0d2857] dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-500 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0d2857] hover:text-[#0d2857] dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {selectedEntry && (() => {
        const supportNeed = selectedEntry.institutionalSupportNeed || "—";
        const donationPriority = selectedEntry.donationPriority || selectedEntry.productDonationNeed || "—";
        const donationNeed = selectedEntry.productDonationNeed || "—";
        const financialUse = selectedEntry.financialUse || "—";
        const rationVolume = selectedEntry.rationVolume || "—";
        const purchaseChannel = selectedEntry.purchaseChannel || "—";
        const purchaseFactor = selectedEntry.purchaseFactor || "—";
        const indicatesBrand = selectedEntry.indicatesBrand || "Sem resposta";
        const qualityAssessment = selectedEntry.qualityAssessment || "Sem avaliação";
        const dogFoodBrand = selectedEntry.dogFoodBrand || "—";
        const catFoodBrand = selectedEntry.catFoodBrand || "—";
        const returnRate = selectedEntry.returnRate || "—";
        const returnReason = selectedEntry.returnReason || "Sem motivo informado";
        const intakeReason = selectedEntry.intakeReason || "Sem registro";
        const handlesAnimals = selectedEntry.handlesAnimals || "Sem resposta";
        const timestampLabel = formatEntryTimestamp(selectedEntry);
        const stateFlagInfo = getStateFlagInfo(selectedEntry.state, selectedEntry.stateCode);
        const stateDisplayLabel = stateFlagInfo
          ? `${stateFlagInfo.name} (${stateFlagInfo.code})`
          : selectedEntry.state || "—";

        type HighlightChip = { label: string; value: string };
        const highlightChips: HighlightChip[] = (
          [
            supportNeed && { label: "Apoio prioritário", value: supportNeed },
            donationPriority && { label: "Doação prioritária", value: donationPriority },
            donationNeed && { label: "Produtos necessários", value: donationNeed },
            financialUse && { label: "Uso do recurso financeiro", value: financialUse },
          ] as Array<HighlightChip | false>
        ).filter((chip): chip is HighlightChip => Boolean(chip && chip.value && chip.value !== "—"));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm modal-overlay-appear" onClick={closeModal} />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="selected-entry-title"
              ref={modalPrintableRef}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl modal-panel-appear printable-modal"
            >
              <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 px-6 py-4 backdrop-blur">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Visão detalhada</p>
                  <h2 id="selected-entry-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedEntry.organization || "Organização sem nome"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintSelected}
                    className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-[#0d2857] dark:text-emerald-200 hover:bg-[#0d2857] hover:text-white dark:hover:text-gray-900 dark:hover:bg-emerald-300 transition-colors"
                  >
                    Gerar PDF
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#0d2857] hover:text-[#0d2857] dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 modal-content-reveal">
                <div className="rounded-3xl bg-gradient-to-br from-[#0d2857] via-[#1d3b63] to-[#1f5b5f] text-white p-6 shadow-xl shadow-black/20">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {stateFlagInfo && (
                        <span className="inline-flex items-center justify-center w-12 h-8 rounded-xl border border-white/40 bg-white/10 overflow-hidden">
                          <img
                            src={stateFlagInfo.flagUrl}
                            alt={`Bandeira de ${stateFlagInfo.name}`}
                            width={48}
                            height={32}
                            className="object-cover"
                            loading="lazy"
                          />
                        </span>
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-[0.5em] text-white/70">Estado principal</p>
                        <p className="text-2xl font-semibold">{stateDisplayLabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.5em] text-white/70">Último envio</p>
                      <p className="text-sm font-semibold">{timestampLabel}</p>
                      <p className="text-xs text-white/80 mt-1">CNPJ • {selectedEntry.cnpj}</p>
                    </div>
                  </div>
                  {highlightChips.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {highlightChips.map((chip) => (
                        <span
                          key={`${selectedEntry.cnpj}-${chip.label}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-[11px] uppercase tracking-[0.25em]"
                        >
                          <span className="text-white/70">{chip.label}</span>
                          <span className="font-semibold text-white tracking-normal normal-case">{chip.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-emerald-50/40 dark:from-gray-900 dark:to-emerald-950/20 p-5">
                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-700 dark:text-emerald-200">Canais e consumo</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Volume mensal</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{rationVolume}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Canal de compra</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{purchaseChannel}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Fator decisivo</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{purchaseFactor}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Avaliação de qualidade</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{qualityAssessment}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Cuida diretamente de animais?</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{handlesAnimals}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-950/30 p-5">
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-600 dark:text-gray-200">Marcas e recomendação</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Marca para cães</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{dogFoodBrand}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Marca para gatos</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{catFoodBrand}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Indica ao adotante?</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{indicatesBrand}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-gray-600 dark:text-gray-300">Entrada mais comum</dt>
                        <dd className="font-semibold text-gray-900 dark:text-white">{intakeReason}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-rose-50/60 dark:from-gray-900 dark:to-rose-950/20 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.4em] text-rose-700 dark:text-rose-200">Pós-adoção</p>
                    <span className="text-xs text-rose-700/70 dark:text-rose-200/70">{returnRate}</span>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-200">Motivo da devolução</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{returnReason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-200">Origem dos resgates</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{intakeReason}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-5">
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400 mb-3">Notas de importância (1 a 4)</p>
                  <div className="space-y-3">
                    {(Object.keys(IMPORTANCE_LABELS) as Array<keyof FormReportV2ImportanceScores>).map((key) => (
                      <div key={`${selectedEntry.cnpj}-${key}`}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-200">{IMPORTANCE_LABELS[key]}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {selectedEntry.importance[key] !== null && selectedEntry.importance[key] !== undefined
                              ? selectedEntry.importance[key]
                              : "Sem nota"}
                          </span>
                        </div>
                        <div className="h-1.5 mt-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#0d2857] via-[#4b5a76] to-[#4a7b73]"
                            style={{ width: `${(((selectedEntry.importance[key] ?? 0) as number) / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
