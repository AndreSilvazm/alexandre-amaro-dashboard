"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Landmark,
  Target,
  Globe,
  AlertCircle,
  X,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import logoAmaro from "../../public/Logo.png";

const CONTACT_EMAIL = "gabinete@alexandreamaro.com.br";
const CONTACT_PHONE_LINK = "+5541999999999";
const CONTACT_PHONE_DISPLAY = "(41) 99999-9999";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Preciso de suporte para acessar o painel do Deputado Alexandre Amaro."
);
const WHATSAPP_URL = `https://wa.me/5541999999999?text=${WHATSAPP_MESSAGE}`;

type ModalKind = "password" | "access";

function ContactModal({
  isOpen,
  onClose,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: ModalKind;
}) {
  if (!isOpen) return null;

  const isPasswordReset = type === "password";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-[#02186b] via-[#0c2fa3] to-[#ffca27] px-6 py-8 text-white text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            {isPasswordReset ? (
              <HelpCircle className="h-8 w-8" />
            ) : (
              <UserPlus className="h-8 w-8" />
            )}
          </div>
          <h3 className="text-2xl font-bold">
            {isPasswordReset ? "Recuperar credenciais" : "Solicitar acesso"}
          </h3>
          <p className="mt-2 text-white/80 text-sm">
            {isPasswordReset
              ? "O gabinete valida a sua identidade antes de liberar uma nova senha."
              : "Preencha os dados com nosso time para receber usuário e senha exclusivos."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            {isPasswordReset ? (
              <p>
                <strong>🔒 Segurança primeiro.</strong> A redefinição é tratada diretamente pelo
                Gabinete do Deputado Alexandre Amaro.
              </p>
            ) : (
              <p>
                <strong>👋 Bem-vindo.</strong> Este painel é exclusivo para a equipe e parceiros do
                Deputado Alexandre Amaro.
              </p>
            )}
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Para {isPasswordReset ? "confirmar seus dados" : "solicitar credenciais"}, escolha o canal preferido:
          </p>
          <div className="space-y-3">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Suporte%20painel%20Alexandre%20Amaro`}
              className="flex items-center gap-4 rounded-2xl bg-[#02186b] p-4 text-white transition hover:bg-[#0c2fa3]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold">Email oficial</p>
                <p className="text-sm text-white/70">{CONTACT_EMAIL}</p>
              </div>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-emerald-500 p-4 text-white transition hover:bg-emerald-600"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold">WhatsApp do gabinete</p>
                <p className="text-sm text-white/70">Atendimento rápido e humanizado</p>
              </div>
            </a>
            <a
              href={`tel:${CONTACT_PHONE_LINK}`}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-900 transition hover:border-[#02186b] hover:bg-white dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#02186b] dark:bg-slate-900 dark:text-white">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold">Telefone direto</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{CONTACT_PHONE_DISPLAY}</p>
              </div>
            </a>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Tenha em mãos CNPJ ou documento oficial da sua instituição.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState<ModalKind | null>(null);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(username, password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erro ao fazer login");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#02186b] border-t-transparent" />
      </div>
    );
  }

  const highlights = [
    {
      title: "Rede de acompanhamento nacional",
      description: "Todas as ONGs validadas com contato direto com o gabinete.",
      icon: Globe,
    },
    {
      title: "Prioridades legislativas",
      description: "Demandas são ranqueadas para ações no plenário e nas comissões.",
      icon: Landmark,
    },
    {
      title: "Resposta rápida",
      description: "Priorizamos quem precisa de articulação imediata e recursos.",
      icon: Target,
    },
  ];

  const stats = [
    { label: "Estados monitorados", value: "1" },
    { label: "ONGs verificadas", value: "250+" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,202,39,0.15),_transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#02186b] via-[#02186b]/70 to-transparent opacity-90" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8 text-white">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-sm uppercase tracking-[0.5em]">
              <Sparkles className="h-4 w-4" />
              <span>Deputado Alexandre Amaro</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <Image
                    src={logoAmaro}
                    alt="Logomarca do Deputado Alexandre Amaro"
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Base Integrada de ONGs do
                <span className="block bg-gradient-to-r from-[#ffca27] via-white to-[#ffca27] bg-clip-text text-transparent">
                  Deputado Alexandre Amaro
                </span>
              </h1>
              <p className="max-w-2xl text-base text-white/80">
                Um painel estratégico para priorizar recursos, construir políticas públicas e responder rapidamente às
                demandas das organizações em cada estado.
              </p>
            </div>
            <div className="space-y-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="rounded-xl bg-white/15 p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-white/80">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-8 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-[#02186b] dark:text-white/70">
                  Login institucional
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  Entre com suas credenciais
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Somente membros autorizados pelo gabinete possuem acesso.
                </p>
              </div>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="username">
                    Usuário
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-[#02186b]" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-12 pr-4 text-gray-900 transition focus:border-[#02186b] focus:ring-4 focus:ring-[#02186b]/15 dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                      placeholder="Digite seu usuário"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="password">
                    Senha
                  </label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-[#02186b]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-12 pr-12 text-gray-900 transition focus:border-[#02186b] focus:ring-4 focus:ring-[#02186b]/15 dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#02186b]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#02186b] focus:ring-[#02186b]" />
                    Lembrar de mim
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalType("password")}
                    className="font-semibold text-[#02186b] transition hover:text-[#0c2fa3]"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#02186b] via-[#0c2fa3] to-[#02186b] py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-[#02186b]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>
              <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Ainda não tem acesso? {" "}
                <button
                  type="button"
                  onClick={() => setModalType("access")}
                  className="font-semibold text-[#02186b] hover:text-[#0c2fa3]"
                >
                  Fale com o gabinete
                </button>
              </p>
              <p className="mt-6 text-center text-xs text-gray-400">
                © 2026 Gabinete do Deputado Alexandre Amaro. Todos os direitos reservados.
              </p>
            </div>
          </section>
        </div>
      </div>
      <ContactModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType || "access"}
      />
    </div>
  );
}
