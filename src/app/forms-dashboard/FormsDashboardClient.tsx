"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function SingleSubmissionView({ submission }: { submission: FormSubmission }) {
  const volunteerCount = parseNumericValue(submission.volunteers);
  const cltEmployees = parseNumericValue(submission.cltEmployees);
  const pjEmployees = parseNumericValue(submission.pjEmployees);
  const staffCount = cltEmployees + pjEmployees;

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

  return (
    <section className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Análise individual</p>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {submission.fantasyName || submission.legalName || "Organização sem nome"}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {submission.city || "Cidade não informada"}
            {submission.state ? ` / ${submission.state}` : ""}
          </span>
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
    </section>
  );
}

const LIST_PAGE_SIZE = 6;

export default function FormsDashboardClient({ submissions, lastUpdate }: FormsDashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleExportPDF = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      const haystack = [
        submission.fantasyName,
        submission.legalName,
        submission.cnpj,
        submission.city,
        submission.state,
        submission.responsible,
        submission.mainChallenge,
        submission.mainFundingSource,
        submission.email,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [searchTerm, submissions]);

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

  const pageRangeStart = filteredSubmissions.length === 0 ? 0 : (currentPage - 1) * LIST_PAGE_SIZE + 1;
  const pageRangeEnd = filteredSubmissions.length === 0
    ? 0
    : Math.min(currentPage * LIST_PAGE_SIZE, filteredSubmissions.length);

  const analytics = useMemo(() => {
    const totalSubmissions = filteredSubmissions.length;
    const representedStates = new Set(
      filteredSubmissions.map((submission) => submission.state || "Não informado"),
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

  const hasComparativeData = analytics.totalSubmissions > 1;
  const singleSubmission = !hasComparativeData ? filteredSubmissions[0] : undefined;

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
                Explore todos os indicadores ou filtre por uma ONG específica para entender sua capacidade, demandas e impacto.
              </p>
            </div>
            <div className="w-full max-w-sm bg-white/10 backdrop-blur rounded-2xl border border-white/30 p-4">
              <label className="text-xs uppercase tracking-widest text-white/70">Pesquisar ONG, cidade, CNPJ ou responsável</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="flex-1 bg-white text-[#0d2857] font-semibold rounded-xl px-3 py-2 focus:outline-none"
                  placeholder="Ex.: Amor Animal, 0001-00, Curitiba"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="text-xs font-semibold text-white/80 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <p className="text-xs text-white/70 mt-2">
                {searchTerm
                  ? `${analytics.totalSubmissions} resultado(s) filtrado(s) de ${submissions.length}`
                  : `${submissions.length} respostas totais coletadas`}
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

        {analytics.totalSubmissions === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
            Nenhuma ONG corresponde ao filtro. Limpe a busca para visualizar novamente todos os gráficos.
          </div>
        )}

        {!hasComparativeData && singleSubmission && (
          <SingleSubmissionView submission={singleSubmission} />
        )}

        {hasComparativeData && (
          <>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lista detalhada</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todas as respostas com contato, estrutura e demandas específicas
              </p>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {analytics.totalSubmissions} registro(s)
            </span>
          </div>

          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => (
              <article
                key={submission.id}
                className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:border-emerald-200/70 dark:hover:border-emerald-600/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {submission.fantasyName || submission.legalName || "Organização sem nome"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Resp.: {submission.responsible || "Não informado"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <p>{submission.city || "Cidade não informada"}{submission.state ? ` - ${submission.state}` : ""}</p>
                    <p>{formatDisplayDate(submission.finishedAt || submission.startedAt) || "Data não informada"}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-gray-700 dark:text-gray-200">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">Contato</p>
                    <p>{submission.email || "Email não informado"}</p>
                    <p>{submission.phone || "Telefone não informado"}</p>
                    {submission.site && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-300 truncate">{submission.site}</p>
                    )}
                    {submission.instagram && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{submission.instagram}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">Identidade</p>
                    <p className="font-mono text-xs">{submission.cnpj || "CNPJ não informado"}</p>
                    <p>{submission.foundationYear ? `Fundada em ${submission.foundationYear}` : "Ano não informado"}</p>
                    <p>{submission.animalsServed || "Animais não informados"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">Estrutura</p>
                    <p>CLT: {submission.cltEmployees || "—"}</p>
                    <p>PJ: {submission.pjEmployees || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      {[{ label: "Jurídico", value: submission.legalDepartment }, { label: "Contábil", value: submission.accountingDepartment }, { label: "Comunicação", value: submission.marketingDepartment }].map(({ label, value }) => (
                        <span
                          key={`${submission.id}-${label}`}
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
              </article>
            ))}

            {filteredSubmissions.length === 0 && (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">
                Nenhuma resposta encontrada para o filtro informado.
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
    </div>
  );
}
