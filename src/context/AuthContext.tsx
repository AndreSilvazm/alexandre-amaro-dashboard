'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, findUser } from '@/data/users';

interface Session {
  user: Omit<User, 'password'>;
  expiresAt: number;
}

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'amaro_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

function clearSessionCookie() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function decodeSessionCookie(): Session | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookieEntry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SESSION_KEY}=`));

  if (!cookieEntry) {
    return null;
  }

  const value = cookieEntry.substring(SESSION_KEY.length + 1);

  try {
    return JSON.parse(decodeURIComponent(value)) as Session;
  } catch (error) {
    console.error('Erro ao parsear cookie de sessão:', error);
    clearSessionCookie();
    return null;
  }
}

function writeSessionCookie(session: Session) {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date(session.expiresAt).toUTCString();
  document.cookie = `${SESSION_KEY}=${encodeURIComponent(
    JSON.stringify(session)
  )}; expires=${expires}; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = () => {
      try {
        const session = decodeSessionCookie();

        if (session && session.expiresAt > Date.now()) {
          setUser(session.user);
        } else if (session) {
          clearSessionCookie();
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        clearSessionCookie();
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const foundUser = findUser(username, password);

    if (!foundUser) {
      return { success: false, error: 'Usuário ou senha inválidos' };
    }

    // Criar objeto de usuário sem a senha
    const userWithoutPassword: Omit<User, 'password'> = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      role: foundUser.role,
      permissions: foundUser.permissions,
      cargo: foundUser.cargo,
      img_url: foundUser.img_url,
    };

    // Criar sessão com expiração de 7 dias
    const session: Session = {
      user: userWithoutPassword,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    // Salvar nos cookies para que o servidor consiga ler a sessão
    writeSessionCookie(session);
    
    setUser(userWithoutPassword);
    
    return { success: true };
  };

  const logout = () => {
    clearSessionCookie();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
