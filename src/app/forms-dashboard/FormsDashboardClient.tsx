"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stateFlags } from "@/data/stateFlags";
import Header from "@/components/Header";
import PieChart from "@/components/PieChart";
import BarChart from "@/components/BarChart";
import type { FormSubmission } from "@/services/googleSheets";

interface FormsDashboardClientProps {
  submissions: FormSubmission[];
  lastUpdate?: string;
}

interface DistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

const STATE_FLAGS = stateFlags;

function normalizeStateValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

const STATE_NAME_ALIASES = Object.values(STATE_FLAGS).reduce<Record<string, string>>((acc, info) => {
  acc[normalizeStateValue(info.name)] = info.uf;
  return acc;
}, {});

function resolveStateFlag(state?: string) {
  if (!state) return undefined;
  const trimmed = state.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  if (STATE_FLAGS[upper]) {
    const info = STATE_FLAGS[upper];
    return { code: upper, url: info.flag_url_square, name: info.name };
  }

  const normalized = normalizeStateValue(trimmed);
  const aliasCode = STATE_NAME_ALIASES[normalized];
  if (aliasCode && STATE_FLAGS[aliasCode]) {
    const info = STATE_FLAGS[aliasCode];
    return { code: aliasCode, url: info.flag_url_square, name: info.name };
  }

  return undefined;
}

function getSubmissionStateCode(submission: FormSubmission) {
  return resolveStateFlag(submission.state)?.code || submission.state?.trim().toUpperCase();
}

function formatDisplayDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function normalizeAnswer(answer?: string) {
  return answer?.normalize("NFKC").trim().toLowerCase() || "";
}

function buildTopDistribution(
  submissions: FormSubmission[],
  selector: (submission: FormSubmission) => string,
  limit = 5,
): DistributionEntry[] {
  const counts = new Map<string, number>();

  submissions.forEach((submission) => {
    const key = selector(submission).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const total = submissions.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

function countBooleanAnswers(
  submissions: FormSubmission[],
  selector: (submission: FormSubmission) => string,
  positiveKeywords: string[] = ["sim"],
) {
  return submissions.reduce(
    (acc, submission) => {
      const answer = normalizeAnswer(selector(submission));
      if (!answer) return acc;
      if (positiveKeywords.some((keyword) => answer.includes(keyword))) {
        acc.yes += 1;
      } else {
        acc.no += 1;
      }
      return acc;
    },
    { yes: 0, no: 0 },
  );
}

function groupFoundationDecades(submissions: FormSubmission[]): DistributionEntry[] {
  const counts = new Map<string, number>();

  submissions.forEach((submission) => {
    const year = Number(submission.foundationYear);
    if (!year) return;
    const decade = Math.floor(year / 10) * 10;
    const label = `${decade}s`;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  if (counts.size === 0) {
    return [];
  }

  const total = [...counts.values()].reduce((acc, value) => acc + value, 0);
  return [...counts.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

function parseNumericValue(value?: string) {
  if (!value) return 0;
  const matches = value.replace(/\./g, "").match(/\d+/g);
  if (!matches) return 0;
  const numbers = matches
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, item) => acc + item, 0);
  return Math.round(sum / numbers.length);
}

interface BinaryChartOptions {
  positiveLabel: string;
  negativeLabel: string;
  positiveColor: string;
  negativeColor: string;
  positiveKeywords?: string[];
}

function buildBinaryPieData(answer: string | undefined, options: BinaryChartOptions) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return [];
  const keywords = options.positiveKeywords?.map((keyword) => keyword.toLowerCase()) || ["sim"];
  const isPositive = keywords.some((keyword) => normalized.includes(keyword));

  return [
    {
      label: options.positiveLabel,
      value: isPositive ? 1 : 0,
      color: options.positiveColor,
    },
    {
      label: options.negativeLabel,
      value: isPositive ? 0 : 1,
      color: options.negativeColor,
    },
  ];
}

function SingleSubmissionView({ submission }: { submission: FormSubmission }) {
  const volunteerCount = parseNumericValue(submission.volunteers);
  const cltEmployees = parseNumericValue(submission.cltEmployees);
  const pjEmployees = parseNumericValue(submission.pjEmployees);
  const staffCount = cltEmployees + pjEmployees;
  const stateFlagInfo = resolveStateFlag(submission.state);
  const sectionRef = useRef<HTMLElement | null>(null);
  const organizationTitle = submission.fantasyName || submission.legalName || "Organização sem nome";

  const handlePrintIndividual = useCallback(() => {
    if (typeof window === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;
    const printable = section.outerHTML;
    const headClone = document.head.cloneNode(true) as HTMLHeadElement;
    headClone.querySelectorAll("script").forEach((script) => script.remove());
    const headContent = headClone.innerHTML;
    const htmlClass = document.documentElement.getAttribute("class") || "";
    const bodyClass = document.body.getAttribute("class") || "";

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html class="${htmlClass}"><head><title>${organizationTitle} – FEBRACA</title>${headContent}<style>@page{margin:16mm;}body{padding:24px;background:#fff;}</style></head><body class="${bodyClass}">${printable}</body></html>`);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 250);
    });
  }, [organizationTitle]);

  const structureChartData = [
    { label: "Voluntários", value: volunteerCount, color: "#10b981" },
    { label: "Equipe fixa", value: staffCount, color: "#0ea5e9" },
  ].filter((entry) => entry.value > 0);

  const complianceChartData = [
    {
      label: "Transparência",
      value: normalizeAnswer(submission.transparency).startsWith("sim") ? 100 : 0,
      helper: submission.transparency || "Não informado",
      color: "#0ea5e9",
    },
    {
      label: "Termo de voluntário",
      value: normalizeAnswer(submission.volunteerTerm).includes("sim") ? 100 : 0,
      helper: submission.volunteerTerm || "Não informado",
      color: "#10b981",
    },
    {
      label: "Parcerias privadas",
      value: normalizeAnswer(submission.privatePartnerships).includes("sim") ? 100 : 0,
      helper: submission.privatePartnerships || "Não informado",
      color: "#f97316",
    },
    {
      label: "Termos públicos",
      value: normalizeAnswer(submission.collaborationTerm).includes("sim") ? 100 : 0,
      helper: submission.collaborationTerm || "Não informado",
      color: "#6366f1",
    },
  ];

  const volunteerTermChartData = buildBinaryPieData(submission.volunteerTerm, {
    positiveLabel: "Assinam termo",
    negativeLabel: "Sem termo",
    positiveColor: "#22c55e",
    negativeColor: "#f87171",
  });

  const parliamentaryChartData = buildBinaryPieData(submission.parliamentaryAmendments, {
    positiveLabel: "Já receberam",
    negativeLabel: "Nunca receberam",
    positiveColor: "#0ea5e9",
    negativeColor: "#94a3b8",
  });

  const animalsServedValue = parseNumericValue(submission.animalsServed);
  const animalsChartData = animalsServedValue || submission.animalsServed
    ? [{
        label: submission.animalsServed || "Capacidade declarada",
        value: Math.max(animalsServedValue, 1),
        helper: submission.animalsServed || undefined,
        color: "#10b981",
      }]
    : [];

  const foundationYear = Number(submission.foundationYear);
  const currentYear = new Date().getFullYear();
  const hasFoundationYear = Number.isFinite(foundationYear) && foundationYear > 1900 && foundationYear <= currentYear;
  const yearsOfOperation = hasFoundationYear ? Math.max(currentYear - foundationYear, 0) : null;
  const foundationChartData = yearsOfOperation !== null
    ? [{
        label: "Anos de atuação",
        value: Math.max(yearsOfOperation, 1),
        helper: `Desde ${foundationYear}`,
        color: "#0ea5e9",
      }]
    : [];

  const challengeChartData = submission.mainChallenge
    ? [{
        label: submission.mainChallenge,
        value: 1,
        helper: "Desafio prioritário declarado",
        color: "#f97316",
      }]
    : [];

  const speciesItems = submission.species
    ? submission.species
        .split(/[,;/]| e /i)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const adoptionValue = parseNumericValue(submission.adoptionsPerMonth);
  const adoptionChartData = submission.adoptionsPerMonth
    ? [{
        label: "Adoções por mês",
        value: Math.max(adoptionValue, 0),
        helper: submission.adoptionsPerMonth,
        color: "#8b5cf6",
      }]
    : [];

  return (
    <section ref={sectionRef} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Análise individual</p>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {organizationTitle}
            </h2>
          </div>
          <div className="inline-flex flex-col items-end gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {stateFlagInfo?.url && (
                <span className="inline-flex items-center justify-center w-8 h-5 rounded-md overflow-hidden border border-white/60 dark:border-white/10">
                  <img
                    src={stateFlagInfo.url}
                    alt={`Bandeira de ${stateFlagInfo.code}`}
                    width={32}
                    height={20}
                    className="object-cover"
                    loading="lazy"
                  />
                </span>
              )}
              {submission.city || "Cidade não informada"}
              {submission.state ? ` / ${submission.state}` : ""}
            </div>
            <button
              type="button"
              onClick={handlePrintIndividual}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:border-[#0d2857] hover:text-[#0d2857] dark:border-gray-700 dark:text-gray-200 dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition-colors"
            >
              Gerar PDF desta ONG
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3 text-sm text-gray-700 dark:text-gray-200">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Contato</p>
            <p>{submission.responsible || "Responsável não informado"}</p>
            <p>{submission.email || "Email não informado"}</p>
            <p>{submission.phone || "Telefone não informado"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Identidade</p>
            <p className="font-mono text-xs">{submission.cnpj || "CNPJ não informado"}</p>
            <p>{submission.foundationYear ? `Fundada em ${submission.foundationYear}` : "Ano não informado"}</p>
            <p>{submission.animalsServed || "Animais não informados"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Status</p>
            <p>Atualizado em {formatDisplayDate(submission.finishedAt || submission.startedAt) || "—"}</p>
            <p>Adesão ao FEBRACA Forms confirmada</p>
            <p>{submission.site || submission.instagram || "Sem canais digitais declarados"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estrutura humana</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comparativo entre voluntários e equipe fixa</p>
          </header>
          {structureChartData.length > 0 ? (
            <PieChart data={structureChartData} innerRadius={55} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados numéricos suficientes.</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            CLT: {submission.cltEmployees || "—"} • PJ: {submission.pjEmployees || "—"} • Voluntários: {submission.volunteers || "—"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Governança e formalização</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Indicadores binários convertidos em score</p>
          </header>
          <BarChart
            data={complianceChartData}
            maxValue={100}
            formatter={(value) => `${value}%`}
            emptyMessage="Sem respostas sobre governança."
          />
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {[{ label: "Jurídico", value: submission.legalDepartment }, { label: "Contábil", value: submission.accountingDepartment }, { label: "Comunicação", value: submission.marketingDepartment }].map(({ label, value }) => (
              <span
                key={label}
                className={`px-2 py-0.5 rounded-full border ${normalizeAnswer(value).includes("sim")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                  : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700"}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financiamento e transparência</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resumo textual para decisões rápidas</p>
          </header>
          <dl className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div>
              <dt className="text-xs uppercase tracking-widest text-gray-400">Fonte principal</dt>
              <dd>{submission.mainFundingSource || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-gray-400">Transparência</dt>
              <dd>{submission.transparency || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-gray-400">Parcerias públicas</dt>
              <dd>{submission.collaborationTerm || "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-gray-400">Parcerias privadas</dt>
              <dd>{submission.privatePartnerships || "Não informado"}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demandas e recados</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">O que a organização precisa agora</p>
          </header>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Maior desafio</p>
              <p>{submission.mainChallenge || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Melhorias prioritárias</p>
              <p>{submission.improvements || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Mensagem ao Congresso</p>
              <p>{submission.congressMessage || "Não informado"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Termos de voluntariado</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Formalização de vínculos com voluntários</p>
          </header>
          <PieChart data={volunteerTermChartData} innerRadius={55} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Declaração: {submission.volunteerTerm || "Não informado"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emendas parlamentares</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Captação de recursos públicos recentes</p>
          </header>
          <PieChart data={parliamentaryChartData} innerRadius={55} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Declaração: {submission.parliamentaryAmendments || "Não informado"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Animais atendidos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Volume atual sob cuidado</p>
          </header>
          <BarChart
            data={animalsChartData}
            formatter={(value) => value.toLocaleString("pt-BR")}
            emptyMessage="Sem informação sobre quantidade de animais."
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            {submission.animalsServed || "Sem detalhes adicionais"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tempo de fundação</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Histórico de atuação contínua</p>
          </header>
          <BarChart
            data={foundationChartData}
            formatter={(value) => (value === 1 ? "1 ano" : `${value} anos`)}
            emptyMessage="Sem informação sobre ano de fundação."
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maiores desafios</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Foco declarado para apoio</p>
          </header>
          <BarChart
            data={challengeChartData}
            formatter={() => "Prioridade"}
            emptyMessage="Sem desafios declarados."
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Perfil dos atendimentos</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Espécies foco e ritmo de adoções</p>
        </header>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Espécies atendidas</p>
            {speciesItems.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {speciesItems.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sem espécies informadas.</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Adoções mensais</p>
            <BarChart
              data={adoptionChartData}
              formatter={(value) => value.toLocaleString("pt-BR")}
              emptyMessage="Sem informação sobre adoções."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const LIST_PAGE_SIZE = 6;

export default function FormsDashboardClient({ submissions, lastUpdate }: FormsDashboardClientProps) {
  const [selectedState, setSelectedState] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const handleExportPDF = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  const stateOptions = useMemo(() => {
    const collator = new Intl.Collator("pt-BR");
    const optionMap = new Map<string, { code: string; label: string; name?: string }>();

    submissions.forEach((submission) => {
      const resolved = resolveStateFlag(submission.state);
      if (resolved) {
        optionMap.set(resolved.code, {
          code: resolved.code,
          label: `${resolved.code} • ${resolved.name}`,
          name: resolved.name,
        });
        return;
      }

      const fallbackState = submission.state?.trim();
      if (!fallbackState) return;
      const code = fallbackState.toUpperCase();
      if (!optionMap.has(code)) {
        optionMap.set(code, {
          code,
          label: code,
        });
      }
    });

    return [...optionMap.values()].sort((a, b) => collator.compare(a.name ?? a.label, b.name ?? b.label));
  }, [submissions]);

  const stateOptionMap = useMemo(() => {
    const map = new Map<string, { code: string; label: string; name?: string }>();
    stateOptions.forEach((option) => {
      map.set(option.code, option);
    });
    return map;
  }, [stateOptions]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedSubmissionId(null);
  }, [selectedState]);

  const filteredSubmissions = useMemo(() => {
    if (!selectedState || selectedState === "all") return submissions;
    return submissions.filter((submission) => getSubmissionStateCode(submission) === selectedState);
  }, [selectedState, submissions]);

  const totalPages = Math.max(1, Math.ceil(Math.max(filteredSubmissions.length, 1) / LIST_PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredSubmissions.slice(startIndex, startIndex + LIST_PAGE_SIZE);
  }, [currentPage, filteredSubmissions]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return filteredSubmissions.find((submission) => submission.id === selectedSubmissionId) || null;
  }, [filteredSubmissions, selectedSubmissionId]);

  useEffect(() => {
    if (!selectedSubmissionId) return;
    const stillInList = filteredSubmissions.some((submission) => submission.id === selectedSubmissionId);
    if (!stillInList) {
      setSelectedSubmissionId(null);
    }
  }, [filteredSubmissions, selectedSubmissionId]);

  useEffect(() => {
    if (!selectedSubmissionId) return;
    if (typeof window === "undefined") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedSubmissionId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSubmissionId]);

  useEffect(() => {
    if (!selectedSubmissionId) return;
    if (typeof document === "undefined") return;
    const { body } = document;
    if (!body) return;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [selectedSubmissionId]);

  const handleSelectSubmission = useCallback((submissionId: string) => {
    setSelectedSubmissionId((previous) => (previous === submissionId ? null : submissionId));
  }, []);

  const pageRangeStart = filteredSubmissions.length === 0 ? 0 : (currentPage - 1) * LIST_PAGE_SIZE + 1;
  const pageRangeEnd = filteredSubmissions.length === 0
    ? 0
    : Math.min(currentPage * LIST_PAGE_SIZE, filteredSubmissions.length);

  const analytics = useMemo(() => {
    const totalSubmissions = filteredSubmissions.length;
    const representedStates = new Set(
      filteredSubmissions.map((submission) => getSubmissionStateCode(submission) || "Não informado"),
    ).size;

    const transparencyCount = filteredSubmissions.filter((submission) =>
      normalizeAnswer(submission.transparency).startsWith("sim"),
    ).length;

    const collaborationCount = filteredSubmissions.filter((submission) =>
      normalizeAnswer(submission.collaborationTerm).startsWith("sim"),
    ).length;

    const legalDeptCount = filteredSubmissions.filter((submission) =>
      normalizeAnswer(submission.legalDepartment).includes("sim"),
    ).length;
    const accountingDeptCount = filteredSubmissions.filter((submission) =>
      normalizeAnswer(submission.accountingDepartment).includes("sim"),
    ).length;
    const marketingDeptCount = filteredSubmissions.filter((submission) =>
      normalizeAnswer(submission.marketingDepartment).includes("sim"),
    ).length;

    const fundingDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.mainFundingSource || "Não informado",
    );
    const challengeDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.mainChallenge || "Não informado",
    );
    const speciesDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.species || "Não informado",
      4,
    );
    const adoptionDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.adoptionsPerMonth || "Não informado",
      4,
    );
    const volunteerDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.volunteers || "Não informado",
      5,
    );
    const animalsDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) => submission.animalsServed || "Não informado",
    );
    const cityDistribution = buildTopDistribution(
      filteredSubmissions,
      (submission) =>
        [submission.city, submission.state].filter(Boolean).join(" / ") || "Local não informado",
      6,
    );

    const volunteerTermCounts = countBooleanAnswers(
      filteredSubmissions,
      (submission) => submission.volunteerTerm,
    );
    const parliamentaryCounts = countBooleanAnswers(
      filteredSubmissions,
      (submission) => submission.parliamentaryAmendments,
    );
    const privatePartnershipCounts = countBooleanAnswers(
      filteredSubmissions,
      (submission) => submission.privatePartnerships,
    );

    const foundationDecades = groupFoundationDecades(filteredSubmissions);

    const recentSubmissions = filteredSubmissions
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.finishedAt || a.startedAt || 0).getTime();
        const dateB = new Date(b.finishedAt || b.startedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6);

    return {
      totalSubmissions,
      representedStates,
      transparencyCount,
      collaborationCount,
      legalDeptCount,
      accountingDeptCount,
      marketingDeptCount,
      fundingDistribution,
      challengeDistribution,
      speciesDistribution,
      adoptionDistribution,
      volunteerDistribution,
      animalsDistribution,
      cityDistribution,
      volunteerTermCounts,
      parliamentaryCounts,
      privatePartnershipCounts,
      foundationDecades,
      recentSubmissions,
    };
  }, [filteredSubmissions]);

  const selectedStateLabel = selectedState === "all"
    ? undefined
    : stateOptionMap.get(selectedState)?.label || selectedState;

  const filterStatusText = selectedState === "all"
    ? `${submissions.length} respostas totais coletadas`
    : analytics.totalSubmissions > 0
      ? `${analytics.totalSubmissions} resposta(s) em ${selectedStateLabel}`
      : `Nenhuma resposta para ${selectedStateLabel}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header lastUpdate={lastUpdate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:space-y-4">
        <section className="bg-gradient-to-br from-[#0d2857] via-[#153b7d] to-emerald-600 text-white rounded-3xl shadow-xl border border-white/10 p-6 sm:p-8 print-page-break">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">FEBRACA • FORMULÁRIOS</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">
                Inteligência viva das ONGs de proteção animal
              </h1>
              <p className="text-white/80 mt-3 max-w-2xl">
                Explore os indicadores por estado e abra uma ONG específica na lista para visualizar os gráficos individuais completos.
              </p>
            </div>
            <div className="w-full max-w-sm bg-white/10 backdrop-blur rounded-2xl border border-white/30 p-4">
              <label className="text-xs uppercase tracking-widest text-white/70">Filtrar por estado</label>
              <div className="mt-2">
                <select
                  value={selectedState}
                  onChange={(event) => setSelectedState(event.target.value)}
                  className="w-full bg-white text-[#0d2857] font-semibold rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="all">Todos os estados</option>
                  {stateOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-white/70 mt-2">
                {filterStatusText}
              </p>
              <button
                type="button"
                onClick={handleExportPDF}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white text-[#0d2857] font-semibold text-sm shadow-lg shadow-black/20 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                Gerar PDF com gráficos
              </button>
              <p className="text-[11px] text-white/70 mt-2">
                Use esta opção para gerar um PDF completo (o navegador abrirá a janela de impressão, é só salvar em PDF).
              </p>
            </div>
          </div>
        </section>

        {analytics.totalSubmissions === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
            Nenhuma ONG corresponde ao estado selecionado. Escolha "Todos os estados" para visualizar novamente todos os gráficos.
          </div>
        )}

        {analytics.totalSubmissions > 0 && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total de formulários",
              value: analytics.totalSubmissions.toLocaleString("pt-BR"),
              helper: "Respostas completas",
            },
            {
              label: "Estados representados",
              value: analytics.representedStates.toString(),
              helper: "Com base nas cidades informadas",
            },
            {
              label: "ONGs com transparência",
              value: analytics.transparencyCount.toString(),
              helper: `${Math.round(
                (analytics.transparencyCount / Math.max(analytics.totalSubmissions, 1)) * 100,
              )}% da base`,
            },
            {
              label: "Parcerias públicas",
              value: analytics.collaborationCount.toString(),
              helper: "Termos ou convênios ativos",
            },
          ].map(({ label, value, helper }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{helper}</p>
            </div>
          ))}
        </section>
            <section className="grid gap-4 lg:grid-cols-3 print-page-break">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fontes de recursos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Como as ONGs financiam suas operações</p>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-gray-400">Top 5</span>
                </header>
                <BarChart
                  data={analytics.fundingDistribution.map((entry) => ({
                    label: entry.label,
                    value: entry.count,
                    helper: `${entry.percentage}% da base filtrada`,
                    color: "#0d2857",
                  }))}
                  emptyMessage="Nenhuma informação financeira nas respostas filtradas."
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Departamentos estruturados</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Governança interna declarada</p>
                </header>
                <div className="space-y-3">
                  {[{
                    label: "Jurídico",
                    value: analytics.legalDeptCount,
                  }, {
                    label: "Contábil",
                    value: analytics.accountingDeptCount,
                  }, {
                    label: "Comunicação & Marketing",
                    value: analytics.marketingDeptCount,
                  }].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{label}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200">
                        {value} / {analytics.totalSubmissions || 1}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 p-4 text-sm text-emerald-900 dark:text-emerald-200">
                  <p className="font-semibold">Insight rápido</p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-100">
                    Estruture treinamentos específicos onde não há equipes jurídicas ou contábeis formais.
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Voluntários ativos</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Faixas declaradas pelas organizações</p>
                </header>
                <PieChart
                  data={analytics.volunteerDistribution.map((entry, index) => ({
                    label: entry.label,
                    value: entry.count,
                    color: ["#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#6366f1"][index] ?? undefined,
                  }))}
                  innerRadius={50}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Termos de voluntariado</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Conformidade jurídica dos voluntários</p>
                </header>
                <PieChart
                  data={[
                    { label: "Assinam", value: analytics.volunteerTermCounts.yes, color: "#22c55e" },
                    { label: "Não assinam", value: analytics.volunteerTermCounts.no, color: "#ef4444" },
                  ]}
                  innerRadius={55}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Direcione mentorias para quem ainda não formaliza a atuação voluntária.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Emendas parlamentares</h3>
                  <PieChart
                    data={[
                      { label: "Já receberam", value: analytics.parliamentaryCounts.yes, color: "#0ea5e9" },
                      { label: "Ainda não", value: analytics.parliamentaryCounts.no, color: "#bae6fd" },
                    ]}
                    innerRadius={45}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Parcerias privadas</h3>
                  <PieChart
                    data={[
                      { label: "Possuem", value: analytics.privatePartnershipCounts.yes, color: "#f97316" },
                      { label: "Não possuem", value: analytics.privatePartnershipCounts.no, color: "#fed7aa" },
                    ]}
                    innerRadius={45}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-3 print-page-break">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top cidades e estados</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Onde as respostas estão concentradas</p>
                </header>
                <BarChart
                  data={analytics.cityDistribution.map((entry) => ({
                    label: entry.label,
                    value: entry.count,
                    helper: `${entry.percentage}% da base filtrada`,
                    color: "#0ea5e9",
                  }))}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Animais atendidos</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Capacidade atual declarada</p>
                </header>
                <BarChart
                  data={analytics.animalsDistribution.map((entry) => ({
                    label: entry.label,
                    value: entry.count,
                    helper: `${entry.percentage}% das respostas`,
                    color: "#10b981",
                  }))}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Décadas de fundação</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Perfil histórico das ONGs</p>
                </header>
                <BarChart
                  data={analytics.foundationDecades.map((entry) => ({
                    label: entry.label,
                    value: entry.count,
                    helper: `${entry.percentage}% da base`,
                    color: "#f43f5e",
                  }))}
                  emptyMessage="Nenhuma informação de ano declarada."
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Maiores desafios</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">O que trava a operação</p>
                </header>
                <BarChart
                  data={analytics.challengeDistribution.map((entry) => ({
                    label: entry.label,
                    value: entry.count,
                    helper: `${entry.percentage}% da base filtrada`,
                    color: "#f97316",
                  }))}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Perfil dos atendimentos</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Espécies foco e adoções</p>
                </header>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">Espécies</p>
                    <div className="mt-2 space-y-2">
                      {analytics.speciesDistribution.map((entry) => (
                        <span
                          key={entry.label}
                          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-100 border border-gray-100 dark:border-gray-700 mr-2"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {entry.label} • {entry.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">Adoções/mês</p>
                    <BarChart
                      data={analytics.adoptionDistribution.map((entry) => ({
                        label: entry.label,
                        value: entry.count,
                        helper: `${entry.percentage}%`,
                        color: "#8b5cf6",
                      }))}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark-border-gray-700 shadow-sm p-6">
                <header className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novas submissões</h2>
                  <p className="text-sm text-gray-500 dark-text-gray-400">Linha do tempo dos últimos envios</p>
                </header>
                <div className="space-y-4">
                  {analytics.recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-2 h-2 rounded-full bg-[#0d2857]" />
                        <span className="flex-1 w-px bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {submission.fantasyName || submission.legalName || "Organização sem nome"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDisplayDate(submission.finishedAt || submission.startedAt) || "Data não informada"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {submission.city || "Cidade não informada"}{submission.state ? ` • ${submission.state}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {analytics.recentSubmissions.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não há movimentação nas respostas filtradas.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lista de ONGs</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Role até aqui para navegar pelos cadastros e clique em uma linha para abrir o modal com os gráficos individuais.
              </p>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {filteredSubmissions.length} registro(s)
            </span>
          </div>

          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => {
              const organizationName = submission.fantasyName || submission.legalName || "Organização sem nome";
              const isSelected = submission.id === selectedSubmissionId;
              return (
                <article
                  key={submission.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSubmission(submission.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectSubmission(submission.id);
                    }
                  }}
                  className={`group cursor-pointer border border-gray-100 dark:border-gray-700 rounded-2xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2857] dark:focus-visible:ring-emerald-400 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-200/80 dark:hover:border-emerald-500/60 dark:hover:shadow-emerald-500/10 ${isSelected
                    ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-500/60 dark:bg-emerald-900/20"
                    : "bg-white dark:bg-gray-900/20"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{organizationName}</p>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400">CNPJ: {submission.cnpj || "Não informado"}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        {submission.city || "Cidade não informada"}
                        {submission.state ? ` - ${submission.state}` : ""}
                      </p>
                      <p>{formatDisplayDate(submission.finishedAt || submission.startedAt) || "Data não informada"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-gray-700 dark:text-gray-200">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Canais institucionais</p>
                      <p>{submission.email || "Email não informado"}</p>
                      {submission.site && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-300 truncate">{submission.site}</p>
                      )}
                      {submission.instagram && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{submission.instagram}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Identidade</p>
                      <p>{submission.foundationYear ? `Fundada em ${submission.foundationYear}` : "Ano não informado"}</p>
                      <p>{submission.animalsServed || "Animais não informados"}</p>
                      <p>{submission.species || "Espécies não informadas"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Estrutura</p>
                      <p>CLT: {submission.cltEmployees || "—"}</p>
                      <p>PJ: {submission.pjEmployees || "—"}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        {[{ label: "Jurídico", value: submission.legalDepartment }, { label: "Contábil", value: submission.accountingDepartment }, { label: "Comunicação", value: submission.marketingDepartment }].map(({ label, value }) => (
                          <span
                            key={`${submission.id}-${label}`}
                            className={`${normalizeAnswer(value).includes("sim")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700"
                              : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700"} px-2 py-0.5 rounded-full border`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-700 dark:text-gray-200">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Recursos & Transparência</p>
                      <p>Fonte principal: {submission.mainFundingSource || "Não informado"}</p>
                      <p>Transparência: {submission.transparency || "Não informado"}</p>
                      <p>Termos públicos: {submission.collaborationTerm || "Não informado"}</p>
                      <p>Parcerias privadas: {submission.privatePartnerships || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Voluntariado & demandas</p>
                      <p>Voluntários ativos: {submission.volunteers || "Não informado"}</p>
                      <p>Termo assinado: {submission.volunteerTerm || "Não informado"}</p>
                      <p>Adoções/mês: {submission.adoptionsPerMonth || "Não informado"}</p>
                      <p>Maior desafio: {submission.mainChallenge || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2 text-sm text-gray-700 dark:text-gray-200">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Melhorias desejadas</p>
                      <p className="mt-1">{submission.improvements || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Mensagem ao Congresso</p>
                      <p className="mt-1">{submission.congressMessage || "Não informado"}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    Clique para abrir o modal e analisar os gráficos completos desta ONG.
                    <span className="inline-flex items-center gap-1 text-[#0d2857] dark:text-emerald-300 font-semibold uppercase tracking-tight transition-transform duration-200 group-hover:translate-x-1">
                      Ver detalhes
                      <span aria-hidden className="text-base leading-none">↗</span>
                    </span>
                  </p>
                </article>
              );
            })}

            {filteredSubmissions.length === 0 && (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">
                Nenhuma resposta encontrada para o estado selecionado.
              </p>
            )}
          </div>

          {filteredSubmissions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Mostrando {pageRangeStart}-{pageRangeEnd} de {filteredSubmissions.length}
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

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
            onClick={() => setSelectedSubmissionId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="selected-submission-title"
            className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/95 dark:bg-gray-900/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Visão individual</p>
                <h2 id="selected-submission-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedSubmission.fantasyName || selectedSubmission.legalName || "Organização sem nome"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionId(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#0d2857] hover:text-[#0d2857] dark:hover:border-emerald-500 dark:hover:text-emerald-300 transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="p-6">
              <SingleSubmissionView submission={selectedSubmission} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
