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

const SESSION_KEY = 'febraca_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        
        if (sessionData) {
          const session: Session = JSON.parse(sessionData);
          
          // Verificar se a sessão não expirou
          if (session.expiresAt > Date.now()) {
            setUser(session.user);
          } else {
            // Sessão expirada, remover do localStorage
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        localStorage.removeItem(SESSION_KEY);
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
    };

    // Criar sessão com expiração de 7 dias
    const session: Session = {
      user: userWithoutPassword,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    // Salvar no localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    setUser(userWithoutPassword);
    
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
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
