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
    username: "tzzms",
    password: "0J28G22Y",
    name: "Carlos Pinotti",
    role: "admin",
    permissions: ["allowUserViewFormsQuestions"],
    img_url: "https://media.licdn.com/dms/image/v2/D4D03AQEFNHIlLMUqmA/profile-displayphoto-shrink_200_200/B4DZVsqzQNG4Ac-/0/1741284914703?e=2147483647&v=beta&t=6n_iCN1X9tfUcUF_DI7gag1AnKaf9NeoIftL9K_LeTM",
    cargo: "Diretor da Febraca",
  },

    {
    id: "2",
    username: "admin-arcanimal",
    password: "arcanimal2024@",
    name: "Perfil Arcanimal",
    role: "admin",
    permissions: ["allowUserViewFormsQuestions"],
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
