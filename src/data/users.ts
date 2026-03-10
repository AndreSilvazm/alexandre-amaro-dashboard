// Mock de usuários para autenticação
// Adicione novos usuários aqui conforme necessário

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "user";
  permissions: string[];
  img_url?: string | null;
  cargo: string;
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "alexandreAmaro",
    password: "0962312351",
    name: "Alexandre Amaro",
    role: "admin",
    permissions: [],
    img_url: "https://republicanos10.org.br/wp-content/uploads/2019/02/Alexandre-amaro.png",
    cargo: "Deputado Estadual",
  },

    {
    id: "2",
    username: "admin-arcanimal",
    password: "arcanimal2024@",
    name: "Perfil Arcanimal",
    role: "admin",
    permissions: ["allowUserViewFormsQuestions", "allowUserViewFormsQuestionsV2", "allowUserViewStories"],
    img_url: "",
    cargo: "Time desenvolvimento",
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

export function findUser(
  username: string,
  password: string,
  id?: string,
): User | null {
  if (username && password) {
    return (
      mockUsers.find(
        (user) => user.username === username && user.password === password,
      ) || null
    );
  } else {
    return mockUsers.find((user) => user.id === id) || null;
  }
}
