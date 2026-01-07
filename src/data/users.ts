// Mock de usuários para autenticação
// Adicione novos usuários aqui conforme necessário

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin',
    name: 'Administrador',
    role: 'admin',
  },
  // Adicione mais usuários aqui:
  // {
  //   id: '2',
  //   username: 'usuario',
  //   password: 'senha123',
  //   name: 'Nome do Usuário',
  //   role: 'user',
  // },
];

export function findUser(username: string, password: string): User | null {
  return mockUsers.find(
    (user) => user.username === username && user.password === password
  ) || null;
}
