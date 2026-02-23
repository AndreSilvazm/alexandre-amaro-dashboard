'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, RefreshCw, Moon, Sun, ChevronLeft, ChevronRight, Sparkles, X, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface HeaderProps {
  lastUpdate?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface StorySlide {
  id: string;
  badge: string;
  subtitle: string;
  title: string;
  description: string;
  highlights: string[];
  footnote: string;
  gradient: string;
  metrics?: Array<{ label: string; value: string; helper?: string }>;
  chart?: {
    title: string;
    subtitle?: string;
    items: Array<{ label: string; value: number; accent?: string; helper?: string }>;
    maxValue?: number;
    footer?: string;
  };
  floatingFacts?: Array<{ label: string; value: string; accent?: string }>;
  media?: {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
    shape?: 'logo' | 'portrait';
  };
}

const STORY_DURATION = 4500;

export default function Header({ lastUpdate, onRefresh, isLoading }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const storyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const clearStoryTimer = useCallback(() => {
    if (storyIntervalRef.current) {
      clearInterval(storyIntervalRef.current);
      storyIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.img_url]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Pegar inicial do nome do usuário
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';
  const hasProfilePhoto = Boolean(user?.img_url && !avatarError);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen((previous) => !previous);
  };

  const handleMobileNavLinkClick = () => {
    setIsMobileNavOpen(false);
  };

  const navLinks = useMemo(
    () => [
      { href: '/dashboard', label: 'Mapa e Relatórios' },
      { href: '/forms-dashboard', label: 'Formulários das ONGs', badge: 'Novo' },
    ],
    [],
  );

  const stories = useMemo<StorySlide[]>(
    () => [
      {
        id: 'febraca-intro',
        badge: 'Sobre a FEBRACA',
        subtitle: 'Quem somos',
        title: 'Conectamos e fortalecemos a causa animal',
        description:
          'A FEBRACA – Federação Brasileira da Causa Animal – é uma organização sem fins lucrativos que conecta, apoia e representa ONGs de proteção em todo o país.',
        highlights: [
          'Rede nacional oferece capacitações e mentorias para que as ONGs ganhem estrutura.',
          'Atuação direta em políticas públicas para defender a causa animal em Brasília e nos municípios.',
          'Projetos de apoio ajudam organizações a acessar recursos, gestão eficiente e visibilidade.',
        ],
        footnote: 'Fonte: febraca.org.br/sobre • 2026',
        gradient: 'from-[#0d2857] via-indigo-700 to-emerald-500',
        media: {
          src: 'https://febraca.org.br/wp-content/uploads/2025/11/Logo-Febraca-2-1-1024x1024.png',
          alt: 'Logo FEBRACA',
          caption: 'FEBRACA — Federação Brasileira da Causa Animal',
          shape: 'logo',
        },
      },
      {
        id: 'map-dashboard',
        badge: 'Novidades Mapa',
        subtitle: '/dashboard',
        title: 'Mapa mostra onde agir primeiro',
        description:
          'Refinamos o painel de mapas para que qualquer pessoa veja, em segundos, onde estão as ONGs mais ativas e quais regiões pedem reforço.',
        highlights: [
          'Filtros simples e botões de foco levam direto para o estado que precisa de atenção.',
          'Cards encostados no mapa mostram contato e urgência sem jargões.',
          'Resumo lateral avisa o que mudou desde a última visita e sugere próximos passos.',
        ],
        footnote: 'Atualização visual e de usabilidade • 2026',
        gradient: 'from-[#0d2857] via-sky-700 to-emerald-500',
      },
      {
        id: 'forms-dashboard',
        badge: 'Novidades Forms',
        subtitle: '/forms-dashboard',
        title: 'Formulários viraram dossiês claros',
        description:
          'Os formulários agora ocupam a tela inteira, com resumo rápido de contatos, estrutura humana e pedidos mais urgentes.',
        highlights: [
          'Visão única mostra uma ONG por vez com cartões grandes, fáceis de ler em reunião.',
          'Filtros e busca entendem nome, cidade e responsável sem precisar de códigos.',
          'Lista final destaca melhorias desejadas e mensagem ao Congresso para ação imediata.',
        ],
        footnote: 'Conteúdo atualizado em Fevereiro/2026',
        gradient: 'from-[#ff7a18] via-[#ff3d81] to-[#742ddd]',
      },
    ],
    [],
  );

  const openStories = () => {
    if (!stories.length) return;
    clearStoryTimer();
    setCurrentStoryIndex(0);
    setStoryProgress(0);
    setIsStoryPaused(false);
    setShowStories(true);
  };

  const closeStories = useCallback(() => {
    clearStoryTimer();
    setShowStories(false);
    setStoryProgress(0);
    setCurrentStoryIndex(0);
    setIsStoryPaused(false);
  }, [clearStoryTimer]);

  const handleNextStory = useCallback(() => {
    clearStoryTimer();
    setStoryProgress(0);
    setCurrentStoryIndex((previous) => {
      if (previous < stories.length - 1) {
        return previous + 1;
      }
      closeStories();
      return 0;
    });
  }, [clearStoryTimer, closeStories, stories.length]);

  const handlePrevStory = useCallback(() => {
    clearStoryTimer();
    setStoryProgress(0);
    setCurrentStoryIndex((previous) => (previous > 0 ? previous - 1 : 0));
  }, [clearStoryTimer]);

  const jumpToStory = useCallback(
    (index: number) => {
      if (index < 0 || index >= stories.length) return;
      clearStoryTimer();
      setStoryProgress(0);
      setIsStoryPaused(false);
      setCurrentStoryIndex(index);
    },
    [clearStoryTimer, stories.length],
  );

  useEffect(() => {
    clearStoryTimer();

    if (!showStories || isStoryPaused) {
      return;
    }

    const STEP = 40;
    const increment = (STEP / STORY_DURATION) * 100;

    storyIntervalRef.current = setInterval(() => {
      setStoryProgress((previous) => {
        const next = previous + increment;
        if (next >= 100) {
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, STEP);

    return () => clearStoryTimer();
  }, [showStories, isStoryPaused, currentStoryIndex, handleNextStory, clearStoryTimer]);

  useEffect(() => {
    setStoryProgress(0);
  }, [currentStoryIndex, showStories]);

  const totalStories = stories.length;
  const currentStory = stories[currentStoryIndex];
  const isLastStory = currentStoryIndex === Math.max(totalStories - 1, 0);

  const progressFor = (index: number) => {
    if (index < currentStoryIndex) return 100;
    if (index === currentStoryIndex) return storyProgress;
    return 0;
  };

  const handleStoryPointerDown = () => setIsStoryPaused(true);
  const handleStoryPointerUp = () => setIsStoryPaused(false);

  const displayedHighlights = currentStory?.highlights || [];

  const hasRightColumnContent = Boolean(
    (currentStory?.media && currentStory.media.src) ||
      (currentStory?.metrics && currentStory.metrics.length > 0) ||
      currentStory?.chart,
  );

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-600 p-0.5 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 animate-glow-pulse">
                <Image
                  src="https://febraca.org.br/wp-content/uploads/2025/08/cropped-Logo-Febraca-2-150x150.png"
                  alt="FEBRACA Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-[#0d2857] dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                  Relatórios de ONGs Brasil
                  <span className="text-[10px] uppercase tracking-wide bg-[#0d2857] text-white dark:bg-blue-500/80 dark:text-gray-900 px-2 py-0.5 rounded-full border border-[#0d2857]/40 dark:border-blue-400/40 font-semibold shadow-sm">
                    v2.0.0
                  </span>
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">FEBRACA Dashboard</p>
                  {lastUpdate && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                      (Atualizado: {lastUpdate})
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2 pl-6 border-l border-gray-200 dark:border-gray-700">
              {navLinks.map(({ href, label, badge }) => {
                const isActive = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#0d2857] text-white dark:bg-blue-500/80'
                        : 'text-gray-500 dark:text-gray-400 hover:text-[#0d2857] dark:hover:text-blue-300 hover:bg-gray-100/70 dark:hover:bg-gray-900'
                    }`}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span className="text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileNav}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-[#0d2857] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              aria-label={isMobileNavOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Refresh button */}
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">Atualizar</span>
              </button>
            )}

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* User menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-600">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.cargo || 'Cargo não informado'}</p>
                <button
                  type="button"
                  onClick={openStories}
                  className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0d2857] dark:text-emerald-200 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                >
                  Stories
                </button>
              </div>
              <button
                type="button"
                onClick={openStories}
                title="Ver novidades da plataforma"
                aria-label="Abrir stories da plataforma"
                className="relative group focus:outline-none"
              >
                <span className="sr-only">Abrir stories sobre as novidades da FEBRACA</span>
                <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-emerald-400 opacity-60 blur transition-all duration-300 group-hover:opacity-90" />
                <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-emerald-400 shadow-lg shadow-rose-500/20">
                  <div className="w-10 h-10 rounded-full border border-white/40 dark:border-white/10 bg-gradient-to-br from-[#0d2857] to-emerald-500 text-white font-semibold flex items-center justify-center overflow-hidden">
                    {hasProfilePhoto ? (
                      <img
                        src={user?.img_url || ''}
                        alt={user?.name ? `Foto de ${user.name}` : 'Foto do usuário'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 shadow shadow-emerald-500/50 animate-pulse" />
                </div>
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/95">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {navLinks.map(({ href, label, badge }) => {
              const isActive = pathname?.startsWith(href);
              return (
                <Link
                  key={`mobile-${href}`}
                  href={href}
                  onClick={handleMobileNavLinkClick}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0d2857] text-white border-[#0d2857]'
                      : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span>{label}</span>
                  {badge && (
                    <span className="text-[10px] uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      </header>
      {showStories && currentStory && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeStories}
          />
          <div
            className={`relative w-full max-w-xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl border border-white/20 text-white bg-gradient-to-br ${currentStory.gradient} flex flex-col`}
          >
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_45%)]" />
            {currentStory.floatingFacts?.map((fact, index) => {
              const positions = ['top-24 -left-10', 'bottom-20 -right-8', 'top-1/2 left-full'];
              return (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className={`absolute ${positions[index % positions.length]} hidden md:flex flex-col bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-left shadow-lg animate-[pulse_6s_ease-in-out_infinite]`}
                  style={{ animationDelay: `${index * 0.8}s` }}
                >
                  <span className="text-[10px] uppercase tracking-[0.5em] text-white/70">{fact.label}</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: fact.accent || '#ffffff' }}
                  >
                    {fact.value}
                  </span>
                </div>
              );
            })}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
              {stories.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => jumpToStory(index)}
                  className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 relative"
                  aria-label={`Ir para story ${index + 1}`}
                >
                  <div
                    className="h-full rounded-full relative transition-[width] duration-200"
                    style={{ width: `${progressFor(index)}%` }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white via-emerald-200 to-white animate-[pulse_4s_ease-in-out_infinite]" />
                    <span className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  </div>
                </button>
              ))}
            </div>
            {isStoryPaused && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/40 text-[11px] uppercase tracking-[0.4em]">
                Pausado
              </div>
            )}

            <button
              type="button"
              onClick={closeStories}
              className="absolute top-4 right-4 z-20 rounded-full bg-white/10 hover:bg-white/20 p-1.5 text-white transition-colors"
              title="Fechar stories"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              key={`story-content-${currentStory.id}`}
              className="relative z-10 p-8 lg:p-10 flex-1 overflow-y-auto"
              onMouseDown={handleStoryPointerDown}
              onMouseUp={handleStoryPointerUp}
              onMouseLeave={handleStoryPointerUp}
              onTouchStart={handleStoryPointerDown}
              onTouchEnd={handleStoryPointerUp}
              onTouchCancel={handleStoryPointerUp}
            >
              <div
                className={`flex flex-col gap-6 ${hasRightColumnContent ? 'lg:grid lg:grid-cols-[1.2fr,0.8fr] lg:gap-8' : ''}`}
                key={`story-columns-${currentStory.id}`}
              >
                <div
                  className="space-y-6 animate-slide-in-bottom"
                  style={{ animationDelay: '0.05s' }}
                >
                  <div className="text-[10px] uppercase tracking-[0.6em] text-white/60">
                    Toque e segure para pausar · Clique nas barras para pular
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                    <Sparkles className="w-4 h-4" />
                    <span>{currentStory.badge}</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.7em] text-white/70">{currentStory.subtitle}</p>
                    <h2 className="text-3xl sm:text-4xl font-semibold leading-tight mt-2">
                      {currentStory.title}
                    </h2>
                    <p className="mt-3 text-white/80 text-sm sm:text-base max-w-2xl">
                      {currentStory.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {displayedHighlights.map((highlight, index) => (
                      <div
                        key={highlight}
                        className="flex items-start gap-3 bg-white/10 rounded-2xl px-4 py-3 text-sm animate-slide-in-bottom"
                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                      >
                        <span className="mt-1 w-2 h-2 rounded-full bg-white" />
                        <p>{highlight}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                    <span className="opacity-80">{currentStory.footnote}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={isLastStory ? closeStories : handleNextStory}
                        className="px-3 py-1.5 rounded-full bg-white text-[#0d2857] font-semibold text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-black/20"
                      >
                        {isLastStory ? 'Concluir' : 'Próximo'}
                      </button>
                    </div>
                  </div>
                </div>

                {hasRightColumnContent && (
                  <div
                    className="space-y-5 animate-slide-in-bottom"
                    style={{ animationDelay: '0.15s' }}
                  >
                    {currentStory.media && currentStory.media.src && (
                      <div className="bg-white/10 rounded-[28px] border border-white/20 p-5 shadow-2xl shadow-black/30 text-center space-y-3">
                        <div
                          className={`mx-auto ${currentStory.media.shape === 'portrait' ? 'w-40 h-40 rounded-[24px]' : 'w-40 h-20 rounded-2xl'} overflow-hidden bg-white/90 flex items-center justify-center`}
                        >
                          <img
                            src={currentStory.media.src}
                            alt={currentStory.media.alt}
                            className={currentStory.media.shape === 'portrait' ? 'w-full h-full object-cover' : 'w-full h-full object-contain p-2'}
                            loading="lazy"
                          />
                        </div>
                        {(currentStory.media.caption || currentStory.media.credit) && (
                          <div className="text-xs text-white/80 space-y-0.5">
                            {currentStory.media.caption && <p className="font-semibold">{currentStory.media.caption}</p>}
                            {currentStory.media.credit && <p className="text-white/60">{currentStory.media.credit}</p>}
                          </div>
                        )}
                      </div>
                    )}
                    {currentStory.metrics && currentStory.metrics.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentStory.metrics.map((metric) => (
                          <div
                            key={`${currentStory.id}-${metric.label}`}
                            className="bg-white/10 rounded-3xl border border-white/20 px-4 py-4 text-sm shadow-lg shadow-black/20"
                          >
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">{metric.label}</p>
                            <p className="text-2xl font-bold mt-1">{metric.value}</p>
                            {metric.helper && <p className="text-xs text-white/70 mt-1">{metric.helper}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {currentStory.chart && (() => {
                      const chart = currentStory.chart;
                      const computedMax = chart.items.length > 0 ? Math.max(...chart.items.map((item) => item.value)) : 1;
                      const maxValue = chart.maxValue || computedMax || 1;

                      return (
                        <div className="bg-white/10 rounded-[28px] border border-white/20 p-5 shadow-2xl shadow-black/30">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.5em] text-white/70">{chart.subtitle || 'Resumo'}</p>
                              <h3 className="text-lg font-semibold">{chart.title}</h3>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.4em] text-white/60">Live</span>
                          </div>
                          <div className="mt-4 space-y-3">
                            {chart.items.map((item) => (
                              <div key={`${currentStory.id}-${item.label}`}>
                                <div className="flex items-center justify-between text-xs text-white/80">
                                  <span>{item.label}</span>
                                  <span>{item.helper || `${item.value}`}</span>
                                </div>
                                <div className="h-2 mt-1 bg-white/15 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${(item.value / maxValue) * 100}%`,
                                      backgroundColor: item.accent || '#ffffff',
                                      boxShadow: `0 0 12px ${(item.accent || '#ffffff')}66`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          {chart.footer && (
                            <p className="text-xs text-white/70 mt-4">{chart.footer}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="absolute inset-y-0 left-2 flex items-center z-10">
              <button
                type="button"
                onClick={handlePrevStory}
                disabled={currentStoryIndex === 0}
                className="p-2 rounded-full bg-white/15 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Story anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center z-10">
              <button
                type="button"
                onClick={handleNextStory}
                disabled={isLastStory}
                className="p-2 rounded-full bg-white/15 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Próximo story"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
