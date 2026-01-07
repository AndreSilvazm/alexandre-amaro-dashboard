'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  lastUpdate?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Header({ lastUpdate, onRefresh, isLoading }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Pegar inicial do nome do usuário
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 p-0.5 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 animate-glow-pulse">
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
                <h1 className="text-xl font-bold text-gray-800 group-hover:text-[#0d2857] transition-colors">Relatórios de ONGs Brasil</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">FEBRACA Dashboard</p>
                  {lastUpdate && (
                    <span className="text-xs text-gray-400 italic">
                      (Atualizado: {lastUpdate})
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Refresh button */}
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-sm">Atualizar</span>
              </button>
            )}

            {/* Notifications */}

            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#0d2857] to-emerald-500 rounded-xl flex items-center justify-center text-white font-semibold">
                {userInitial}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
