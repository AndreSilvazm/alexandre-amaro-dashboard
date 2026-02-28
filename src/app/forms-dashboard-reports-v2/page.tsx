import FormsDashboardReportsClient from "./FormsDashboardReportsClient";
import useGetUserPermissions from "../hooks/useGetUserPermissions";
import { fetchFormReportsV2 } from "@/services/googleSheets";
import Link from "next/link";

function formatDisplayDate(value?: string) {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(parsed);
}

export default async function Page() {
    const { allowUserViewFormsQuestionsV2 } = await useGetUserPermissions();

    if (!allowUserViewFormsQuestionsV2) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl p-8 space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                        !
                    </div>
                    <h1 className="text-2xl font-semibold">Acesso restrito</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Você não possui permissão para visualizar os relatórios detalhados das ONGs. Solicite o acesso ao time FEBRACA ou
                        volte para o painel principal.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Link
                            href="mailto:contato@febraca.org.br"
                            className="flex-1 inline-flex items-center justify-center rounded-xl border border-amber-400 text-amber-700 dark:text-amber-400 px-4 py-2 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        >
                            Pedir acesso
                        </Link>
                        <Link
                            href="/dashboard"
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#0d2857] text-white px-4 py-2 text-sm font-semibold hover:bg-[#133776] transition-colors"
                        >
                            Voltar ao dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const entries = await fetchFormReportsV2();

    const lastTimestampIso = entries.reduce<string | undefined>((latest, entry) => {
        if (!entry.timestampISO) return latest;
        if (!latest) return entry.timestampISO;
        const latestDate = new Date(latest).getTime();
        const currentDate = new Date(entry.timestampISO).getTime();
        return currentDate > latestDate ? entry.timestampISO : latest;
    }, undefined);

    const fallbackTimestamp = entries[0]?.timestamp;
    const lastUpdate = formatDisplayDate(lastTimestampIso || fallbackTimestamp);

    return <FormsDashboardReportsClient entries={entries} lastUpdate={lastUpdate} />;
}