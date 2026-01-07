"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Heart,
  Shield,
  AlertCircle,
  PawPrint,
  X,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Componente de patinhas flutuantes
function FloatingPaws() {
  const paws = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${15 + Math.random() * 10}s`,
    size: 16 + Math.random() * 24,
    opacity: 0.1 + Math.random() * 0.2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {paws.map((paw) => (
        <div
          key={paw.id}
          className="absolute text-white"
          style={{
            left: paw.left,
            bottom: '-50px',
            fontSize: `${paw.size}px`,
            opacity: paw.opacity,
            animation: `floatPaw ${paw.duration} linear infinite`,
            animationDelay: paw.delay,
          }}
        >
          🐾
        </div>
      ))}
    </div>
  );
}

// Partículas brilhantes animadas
function SparkleParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: 2 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `sparkle ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// Formas geométricas flutuantes
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Círculos */}
      <div
        className="absolute w-20 h-20 border-2 border-white/20 rounded-full"
        style={{
          top: '15%',
          right: '10%',
          animation: 'floatShape1 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-12 h-12 bg-white/10 rounded-full"
        style={{
          top: '60%',
          right: '25%',
          animation: 'floatShape2 6s ease-in-out infinite',
        }}
      />
      {/* Quadrados rotacionando */}
      <div
        className="absolute w-16 h-16 border-2 border-amber-400/30"
        style={{
          bottom: '20%',
          left: '15%',
          animation: 'rotateFloat 12s linear infinite',
        }}
      />
      <div
        className="absolute w-8 h-8 bg-emerald-400/20"
        style={{
          top: '30%',
          left: '20%',
          animation: 'rotateFloat 10s linear infinite reverse',
        }}
      />
      {/* Triângulo */}
      <div
        className="absolute"
        style={{
          top: '45%',
          right: '15%',
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '25px solid rgba(251, 191, 36, 0.2)',
          animation: 'floatShape1 7s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes floatShape1 {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(180deg);
          }
        }
        @keyframes floatShape2 {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.2);
          }
        }
        @keyframes rotateFloat {
          0% {
            transform: rotate(0deg) translateY(0);
          }
          25% {
            transform: rotate(90deg) translateY(-10px);
          }
          50% {
            transform: rotate(180deg) translateY(0);
          }
          75% {
            transform: rotate(270deg) translateY(10px);
          }
          100% {
            transform: rotate(360deg) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Modal de Contato
function ContactModal({ 
  isOpen, 
  onClose, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  type: 'password' | 'access';
}) {
  if (!isOpen) return null;

  const isPasswordReset = type === 'password';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Header colorido */}
        <div className="bg-gradient-to-r from-[#0d2857] to-emerald-500 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {isPasswordReset ? (
              <HelpCircle className="w-8 h-8" />
            ) : (
              <UserPlus className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-2xl font-bold">
            {isPasswordReset ? 'Recuperar Senha' : 'Solicitar Acesso'}
          </h3>
          <p className="text-white/80 text-sm mt-2">
            {isPasswordReset 
              ? 'Precisamos confirmar sua identidade'
              : 'Estamos felizes com seu interesse!'
            }
          </p>
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
            <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              {isPasswordReset ? (
                <>
                  <strong>🔐 Por questões de segurança</strong>, a recuperação de senha é feita diretamente com seu contato na FEBRACA.
                </>
              ) : (
                <>
                  <strong>🐾 Bem-vindo!</strong> O acesso ao painel é restrito a membros autorizados da FEBRACA.
                </>
              )}
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {isPasswordReset 
              ? 'Entre em contato com a equipe FEBRACA para redefinir sua senha:'
              : 'Para solicitar acesso, entre em contato com nossa equipe:'
            }
          </p>

          {/* Opções de contato */}
          <div className="space-y-3">
            <a
              href="mailto:contato@febraca.org.br?subject=Solicita%C3%A7%C3%A3o%20de%20Acesso%20ao%20Dashboard"
              className="flex items-center gap-4 p-4 bg-[#0d2857] hover:bg-[#1e4080] text-white rounded-xl transition-all group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Enviar Email</p>
                <p className="text-sm text-white/70">contato@febraca.org.br</p>
              </div>
            </a>

            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20acesso%20ao%20Dashboard%20FEBRACA."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">WhatsApp</p>
                <p className="text-sm text-white/70">Atendimento rápido</p>
              </div>
            </a>

            <a
              href="tel:+551199999999"
              className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all group"
            >
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-300 dark:group-hover:bg-gray-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Ligar</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">(11) 9999-9999</p>
              </div>
            </a>
          </div>

          {/* Dica */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              💡 Tenha em mãos seu CPF ou CNPJ para agilizar o atendimento
            </p>
          </div>
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
  const [modalType, setModalType] = useState<'password' | 'access' | null>(null);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Pequeno delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(username, password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Erro ao fazer login");
      setIsLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-8 h-8 border-4 border-[#0d2857] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-hero">
        {/* Floating Paws Animation */}
        <FloatingPaws />
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"
            style={{ animation: 'pulse 4s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
            style={{ animation: 'pulse 5s ease-in-out infinite', animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl"
            style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: '0.5s' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo com animação de entrada */}
          <div className="mb-12 animate-scale-in" style={{ animationDuration: '0.8s' }}>
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2"
                style={{ 
                  boxShadow: '0 0 40px rgba(255,255,255,0.3), 0 20px 60px rgba(0,0,0,0.3)' 
                }}
              >
                <Image
                  src="https://febraca.org.br/wp-content/uploads/2025/11/Logo-Febraca-2-1-1024x1024.png"
                  alt="FEBRACA Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="animate-slide-in-left" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
                <h1 
                  className="text-4xl font-bold tracking-tight"
                  style={{ 
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)' 
                  }}
                >
                  FEBRACA
                </h1>
                <p className="text-white/80 text-sm">
                  Federação Brasileira da Causa Animal
                </p>
              </div>
            </div>
          </div>

          <div className="animate-slide-in-left" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              O Único Dashboard
              <br />
              <span 
                className="text-amber-400 inline-block animate-gradient-move"
                style={{ 
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradientMove 3s linear infinite'
                }}
              >
                de ONGs do Brasil
              </span>
            </h2>
          </div>

          <p 
            className="text-xl text-white/90 mb-12 max-w-md leading-relaxed animate-slide-in-left"
            style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
          >
            A plataforma <strong>exclusiva</strong> que reúne todas as ONGs de proteção animal 
            do país em um só lugar. Dados completos, verificados e atualizados.
          </p>

          {/* Features com animações escalonadas */}
          <div className="space-y-6">
            <div
              className="flex items-center gap-4 animate-slide-in-left group cursor-pointer"
              style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <Heart className="w-6 h-6 group-hover:animate-pulse" />
              </div>
              <div className="group-hover:translate-x-2 transition-transform duration-300">
                <h3 className="font-semibold">100% das ONGs do Brasil</h3>
                <p className="text-white/70 text-sm">
                  O mapeamento mais completo que existe
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-4 animate-slide-in-left group cursor-pointer"
              style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <Shield className="w-6 h-6 group-hover:animate-pulse" />
              </div>
              <div className="group-hover:translate-x-2 transition-transform duration-300">
                <h3 className="font-semibold">Dados Exclusivos</h3>
                <p className="text-white/70 text-sm">
                  Informações que você não encontra em outro lugar
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-4 animate-slide-in-left group cursor-pointer"
              style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <PawPrint className="w-6 h-6 group-hover:animate-bounce" />
              </div>
              <div className="group-hover:translate-x-2 transition-transform duration-300">
                <h3 className="font-semibold">Pioneiros na Causa</h3>
                <p className="text-white/70 text-sm">
                  A primeira e única plataforma nacional
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative paw prints animados */}
        <div 
          className="absolute bottom-10 left-10 opacity-10"
          style={{ animation: 'floatShape2 8s ease-in-out infinite' }}
        >
          <PawPrint className="w-32 h-32" />
        </div>
        <div 
          className="absolute top-10 right-10 opacity-10 rotate-45"
          style={{ animation: 'floatShape1 6s ease-in-out infinite' }}
        >
          <PawPrint className="w-24 h-24" />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
        {/* Background decoration for right side */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 bg-[#0d2857]/5 dark:bg-blue-500/10 rounded-full blur-3xl"
            style={{ animation: 'pulse 6s ease-in-out infinite' }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl"
            style={{ animation: 'pulse 7s ease-in-out infinite', animationDelay: '2s' }}
          />
        </div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10 animate-scale-in">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg dark:shadow-gray-900/50 p-1 animate-float-up">
              <Image
                src="https://febraca.org.br/wp-content/uploads/2025/11/Logo-Febraca-2-1-1024x1024.png"
                alt="FEBRACA Logo"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">FEBRACA</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Federação Brasileira da Causa Animal
              </p>
            </div>
          </div>

          {/* Welcome text com animação */}
          <div className="text-center mb-10">
            <h2 
              className="text-3xl font-bold text-gray-800 dark:text-white mb-2 animate-slide-in-bottom"
              style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
            >
              Acesso Exclusivo
            </h2>
            <p 
              className="text-gray-500 dark:text-gray-400 animate-slide-in-bottom"
              style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
            >
              Entre para acessar o único painel completo de ONGs do Brasil
            </p>
          </div>

          {/* Login Form com animações */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
                <style jsx>{`
                  @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                  }
                  .animate-shake {
                    animation: shake 0.5s ease-in-out;
                  }
                `}</style>
              </div>
            )}

            {/* Username field com animação */}
            <div 
              className="space-y-2 animate-slide-in-bottom"
              style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
            >
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Usuário
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#0d2857]">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0d2857] dark:group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 focus:border-[#0d2857] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#0d2857]/10 dark:focus:ring-blue-500/20 focus:outline-none"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            {/* Password field com animação */}
            <div 
              className="space-y-2 animate-slide-in-bottom"
              style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#0d2857] dark:group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 focus:border-[#0d2857] dark:focus:border-blue-500 focus:ring-4 focus:ring-[#0d2857]/10 dark:focus:ring-blue-500/20 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-[#0d2857] dark:hover:text-blue-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div 
              className="flex items-center justify-between animate-slide-in-bottom"
              style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#0d2857] dark:text-blue-500 focus:ring-[#0d2857] dark:focus:ring-blue-500 bg-white dark:bg-gray-800 transition-transform group-hover:scale-110"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => setModalType('password')}
                className="text-sm text-[#0d2857] dark:text-blue-400 hover:text-[#022873] dark:hover:text-blue-300 font-medium transition-all hover:underline underline-offset-4"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit button com efeito ripple */}
            <div 
              className="animate-slide-in-bottom"
              style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-4 px-6 bg-gradient-to-r from-[#0d2857] to-[#1e4080] text-white font-semibold rounded-xl shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-[#0d2857]/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Entrar</span>
                    <svg 
                      className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <p 
            className="mt-8 text-center text-gray-500 dark:text-gray-400 animate-slide-in-bottom"
            style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}
          >
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={() => setModalType('access')}
              className="text-[#0d2857] dark:text-blue-400 hover:text-[#022873] dark:hover:text-blue-300 font-medium transition-all hover:underline underline-offset-4"
            >
              Solicite acesso
            </button>
          </p>

          {/* Footer */}
          <div 
            className="mt-12 text-center animate-fade-in"
            style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © 2026 FEBRACA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Contato */}
      <ContactModal 
        isOpen={modalType !== null} 
        onClose={() => setModalType(null)} 
        type={modalType || 'access'} 
      />
    </div>
  );
}
