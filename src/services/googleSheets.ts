import Papa from 'papaparse';

// URLs das planilhas do Google Sheets (exportadas como CSV)
const URL_ONGS = "https://docs.google.com/spreadsheets/d/1YVvp_w_r51028aAITKqrWtQDI8p9aOs3GQDIojtm4J4/export?format=csv&gid=400372920";
const URL_SOCIOS = "https://docs.google.com/spreadsheets/d/1gn4nwKL3mvzvRNozAoiBGO15M8MJA2YfaIcJhAS1WiY/export?format=csv&gid=1270428080";
const URL_FORMS = "https://docs.google.com/spreadsheets/d/16M-DnozXl-9eEA3sxH_5xstGshBimEJ9nPz-IyiYI-E/export?format=csv&gid=939834754";

// Interface para os dados brutos da planilha de ONGs
export interface ONGRaw {
  cnpj_basico: string;
  cnpj_completo: string;
  razao_social: string;
  nome_fantasia: string;
  uf: string;
  cidade: string;
  lat: string;
  lng: string;
  logradouro: string;
  bairro: string;
  cep: string;
  ddd1: string;
  telefone1: string;
  ddd2: string;
  telefone2: string;
  email: string;
}

// Interface para os dados brutos da planilha de Sócios
export interface SocioRaw {
  cnpj_basico: string;
  nome_socio: string;
  qualificacao_socio?: string;
}

// Interface para Sócio processado
export interface Socio {
  nome: string;
  cargo: string;
}

type FormSubmissionRaw = Record<string, string | undefined>;

const FORM_COLUMNS = {
  id: "ID",
  startTime: "Hora de início",
  endTime: "Hora de conclusão",
  lastModified: "Hora da última modificação",
  cnpj: "Digite aqui o CNPJ da sua ONG para começarmos.\n\nExemplo: 164922763/0001-00",
  fantasyName: "Qual o nome fantasia da sua ONG?",
  legalName: "Qual a razão social social (se houver)?",
  address: "Digite o endereço (Exemplo: Rua dos Ipes, 24)",
  city: "A cidade sede é? (Exemplo: São José)",
  state: "O Estado? (Exemplo: SP)\u00A0",
  contactEmail: "Qual o melhor email para comunicação? (Exemplo: animalfeliz@gmail.com)",
  phone: "Agora digite apenas os números do melhor telefone para contato (Exemplo: 41996543123)",
  responsible: "Qual o nome completo do gestor ou pessoa responsável pela ONG?",
  site: "Se tiverem um site, digite o endereço por favor. (Exemplo: www.animalfeliz.com.br)",
  instagram: "Possuem Instagram? Pode digitar o endereço por favor? (Exemplo: animal_feliz)",
  foundationYear: "Qual o ano de fundação da ONG? (Exemplo: 1992)",
  animalsServed: "Quantos animais são atendidos atualmente pela ONG?",
  cltEmployees: "Quantos colaboradores pagos a ONG possui atualmente em regime de CLT (com vinculo trabalhista e registro em carteira)?",
  pjEmployees: "Quantos colaboradores pagos a ONG possui atualmente apenas com vínculo PJ (via prestação de serviços, e sem vínculos trabalhistas)?",
  species: "Qual(is) espécie(s) de animal(is) a organização atende ou luta em prol (pensando no foco principal)?",
  adoptionsPerMonth: "Qual a média de adoções de animais realizadas por mês:",
  legalDepartment: "A sua organização possui um departamento jurídico?",
  accountingDepartment: "A sua organização possui um departamento contábil?",
  marketingDepartment: "A sua organização possui um departamento de comunicação/marketing?",
  transparency: "A sua organização possui uma aba de transparência em domínio virtual público (site ou redes sociais), contendo relatórios financeiros, balanços contábeis, contratos e relatórios de atividades?",
  collaborationTerm: "Possuem Termo de Colaboração, Convênio ou algum tipo de contrato prevendo repasse de recursos financeiros com a prefeitura local ou algum órgão público nesse momento?",
  parliamentaryAmendments: "Já receberam emendas parlamentares?",
  privatePartnerships: "Possuem parcerias com empresas privadas para captação de recursos atualmente?",
  mainFundingSource: "Qual é a principal fonte de recursos da ONG? (Onde a organização mais consegue receita financeira)",
  mainChallenge: "Qual a principal dificuldade da ONG atualmente? [Escolher apenas uma, sendo a mais prejudicial para o andamento das atividades]",
  volunteers: "Quantos voluntários ativos existem atualmente na sua ONG?\n",
  volunteerTerm: "Todos os seus voluntários assinam o Termo de Adesão ao Voluntário?",
  workWithPublicPower: "A sua ONG atua em conjunto com o poder público para melhorar a efetivação das leis de proteção animal na cidade?\n",
  improvements: "Resumidamente, o que você deseja ver de melhorias para as ONGs de proteção animal?\n",
  congressMessage: "Se você quisesse que a FEBRACA levasse uma mensagem sua no Congresso Nacional, para todos os deputados ouvirem, qual seria?\n",
  confirmation: "Você declara que todas as informações acima são verdadeiras?",
} as const;

export interface FormSubmission {
  id: string;
  startedAt: string;
  finishedAt: string;
  updatedAt: string;
  cnpj: string;
  fantasyName: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  responsible: string;
  site: string;
  instagram: string;
  foundationYear: string;
  animalsServed: string;
  cltEmployees: string;
  pjEmployees: string;
  species: string;
  adoptionsPerMonth: string;
  legalDepartment: string;
  accountingDepartment: string;
  marketingDepartment: string;
  transparency: string;
  collaborationTerm: string;
  parliamentaryAmendments: string;
  privatePartnerships: string;
  mainFundingSource: string;
  mainChallenge: string;
  volunteers: string;
  volunteerTerm: string;
  workWithPublicPower: string;
  improvements: string;
  congressMessage: string;
  confirmation: string;
}

// Interface para ONG processada (pronta para uso nos componentes)
export interface ONG {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  cnpj: string;
  cnpjBasico: string;
  ddd?: string;
  phone?: string;
  ddd2?: string;
  phone2?: string;
  whatsapp?: string;
  email: string;
  address: string;
  neighborhood: string;
  cep: string;
  socios: Socio[];
  // Campos opcionais para compatibilidade
  animals?: number;
  volunteers?: number;
  foundedYear?: number;
}

// Função para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  return cnpj;
}

// Função para extrair dígitos de um valor
function extractDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  return str.replace(/\D/g, '');
}

// Função para formatar telefone
export function formatPhone(ddd: string | null, telefone: string | null): { display: string; digits: string; isMobile: boolean } {
  const dddDigits = extractDigits(ddd);
  const telDigits = extractDigits(telefone);
  
  if (!telDigits) {
    return { display: '', digits: '', isMobile: false };
  }
  
  const isMobile = telDigits.length >= 1 && telDigits[0] === '9';
  let local = telDigits;
  
  // Limitar a 9 dígitos
  if (local.length > 9) {
    local = local.slice(-9);
  }
  
  let formatted: string;
  if (local.length === 8) {
    formatted = `${local.slice(0, 4)}-${local.slice(4)}`;
  } else if (local.length === 9) {
    formatted = `${local.slice(0, 5)}-${local.slice(5)}`;
  } else {
    formatted = local.length > 4 ? `${local.slice(0, -4)}-${local.slice(-4)}` : local;
  }
  
  const display = dddDigits ? `(${dddDigits.padStart(2, '0')}) ${formatted}` : formatted;
  const digits = dddDigits + local;
  
  return { display, digits, isMobile };
}

// Função para buscar CSV de uma URL
async function fetchCSV<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url, {
      cache: 'no-store', // Sempre buscar dados frescos
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Erro ao buscar CSV:', error);
    throw error;
  }
}

// Função para buscar ONGs
export async function fetchONGs(): Promise<ONGRaw[]> {
  return fetchCSV<ONGRaw>(URL_ONGS);
}

// Função para buscar Sócios
export async function fetchSocios(): Promise<SocioRaw[]> {
  return fetchCSV<SocioRaw>(URL_SOCIOS);
}

function getColumnValue(row: FormSubmissionRaw, columnKey: keyof typeof FORM_COLUMNS): string {
  const rawValue = row[FORM_COLUMNS[columnKey]];
  return typeof rawValue === 'string' ? rawValue.trim() : '';
}

export async function fetchFormSubmissions(): Promise<FormSubmission[]> {
  const rows = await fetchCSV<FormSubmissionRaw>(URL_FORMS);

  return rows
    .filter((row) => getColumnValue(row, 'cnpj'))
    .map((row, index) => {
      const cnpjRaw = getColumnValue(row, 'cnpj');
      const phoneInfo = formatPhone(null, getColumnValue(row, 'phone') || null);

      return {
        id: getColumnValue(row, 'id') || `submission-${index}`,
        startedAt: getColumnValue(row, 'startTime'),
        finishedAt: getColumnValue(row, 'endTime'),
        updatedAt: getColumnValue(row, 'lastModified'),
        cnpj: formatCNPJ(cnpjRaw),
        fantasyName: getColumnValue(row, 'fantasyName'),
        legalName: getColumnValue(row, 'legalName'),
        address: getColumnValue(row, 'address'),
        city: getColumnValue(row, 'city'),
        state: getColumnValue(row, 'state'),
        email: getColumnValue(row, 'contactEmail'),
        phone: phoneInfo.display || getColumnValue(row, 'phone'),
        responsible: getColumnValue(row, 'responsible'),
        site: getColumnValue(row, 'site'),
        instagram: getColumnValue(row, 'instagram'),
        foundationYear: getColumnValue(row, 'foundationYear'),
        animalsServed: getColumnValue(row, 'animalsServed'),
        cltEmployees: getColumnValue(row, 'cltEmployees'),
        pjEmployees: getColumnValue(row, 'pjEmployees'),
        species: getColumnValue(row, 'species'),
        adoptionsPerMonth: getColumnValue(row, 'adoptionsPerMonth'),
        legalDepartment: getColumnValue(row, 'legalDepartment'),
        accountingDepartment: getColumnValue(row, 'accountingDepartment'),
        marketingDepartment: getColumnValue(row, 'marketingDepartment'),
        transparency: getColumnValue(row, 'transparency'),
        collaborationTerm: getColumnValue(row, 'collaborationTerm'),
        parliamentaryAmendments: getColumnValue(row, 'parliamentaryAmendments'),
        privatePartnerships: getColumnValue(row, 'privatePartnerships'),
        mainFundingSource: getColumnValue(row, 'mainFundingSource'),
        mainChallenge: getColumnValue(row, 'mainChallenge'),
        volunteers: getColumnValue(row, 'volunteers'),
        volunteerTerm: getColumnValue(row, 'volunteerTerm'),
        workWithPublicPower: getColumnValue(row, 'workWithPublicPower'),
        improvements: getColumnValue(row, 'improvements'),
        congressMessage: getColumnValue(row, 'congressMessage'),
        confirmation: getColumnValue(row, 'confirmation'),
      };
    });
}

// Função principal para buscar todos os dados e fazer o relacionamento
export async function fetchAllData(): Promise<{ ongs: ONG[]; error: string | null; lastUpdate: string }> {
  try {
    console.log('🔄 Buscando dados das planilhas...');
    
    // Buscar ambas as planilhas em paralelo
    const [ongsRaw, sociosRaw] = await Promise.all([
      fetchONGs(),
      fetchSocios(),
    ]);
    
    console.log(`✅ ONGs carregadas: ${ongsRaw.length}`);
    console.log(`✅ Sócios carregados: ${sociosRaw.length}`);
    
    // Criar mapa de sócios por CNPJ básico para relacionamento rápido
    const sociosByCnpj = new Map<string, Socio[]>();
    
    for (const socio of sociosRaw) {
      const cnpjBasico = String(socio.cnpj_basico || '').trim();
      if (!cnpjBasico) continue;
      
      if (!sociosByCnpj.has(cnpjBasico)) {
        sociosByCnpj.set(cnpjBasico, []);
      }
      
      sociosByCnpj.get(cnpjBasico)!.push({
        nome: socio.nome_socio || 'Nome não informado',
        cargo: socio.qualificacao_socio || 'Sócio',
      });
    }
    
    // Mapear nomes de estados
    const stateNames: Record<string, string> = {
      'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
      'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
      'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
      'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
      'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
      'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
      'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
    };
    
    // Processar e relacionar ONGs com Sócios
    const ongs: ONG[] = [];
    const processedIds = new Set<string>(); // Para evitar duplicatas
    
    for (const ongRaw of ongsRaw) {
      const cnpjBasico = String(ongRaw.cnpj_basico || '').trim();
      const cnpjCompleto = String(ongRaw.cnpj_completo || cnpjBasico).trim();
      
      if (!cnpjCompleto) continue;
      
      // Evitar duplicatas - usar cnpj_completo como ID único
      if (processedIds.has(cnpjCompleto)) {
        console.warn(`⚠️ ONG duplicada ignorada: ${cnpjCompleto}`);
        continue;
      }
      processedIds.add(cnpjCompleto);
      
      // Parsear latitude e longitude
      const lat = parseFloat(ongRaw.lat);
      const lng = parseFloat(ongRaw.lng);
      
      // Ignorar ONGs sem coordenadas válidas
      if (isNaN(lat) || isNaN(lng)) continue;
      
      // Determinar telefones e WhatsApp
      const phone1Info = formatPhone(ongRaw.ddd1, ongRaw.telefone1);
      const phone2Info = formatPhone(ongRaw.ddd2, ongRaw.telefone2);
      
      // WhatsApp: usar o primeiro telefone que for celular (começa com 9)
      let whatsapp = '';
      if (phone1Info.isMobile && phone1Info.digits) {
        whatsapp = `55${phone1Info.digits}`;
      } else if (phone2Info.isMobile && phone2Info.digits) {
        whatsapp = `55${phone2Info.digits}`;
      }
      
      // Buscar sócios relacionados
      const socios = sociosByCnpj.get(cnpjBasico) || [];
      
      const stateCode = (ongRaw.uf || '').toUpperCase().trim();
      const ddd1 = extractDigits(ongRaw.ddd1);
      const ddd2 = extractDigits(ongRaw.ddd2);
      
      ongs.push({
        id: cnpjCompleto, // Usar CNPJ completo como ID único
        name: ongRaw.razao_social || 'Nome não informado',
        shortName: ongRaw.nome_fantasia || '',
        city: ongRaw.cidade || '',
        state: stateNames[stateCode] || stateCode,
        stateCode: stateCode,
        lat: lat,
        lng: lng,
        cnpj: formatCNPJ(cnpjCompleto),
        cnpjBasico: cnpjBasico,
        ddd: ddd1 || undefined,
        phone: phone1Info.display || undefined,
        ddd2: ddd2 || undefined,
        phone2: phone2Info.display || undefined,
        whatsapp: whatsapp || undefined,
        email: ongRaw.email || '',
        address: ongRaw.logradouro || '',
        neighborhood: ongRaw.bairro || '',
        cep: ongRaw.cep || '',
        socios: socios,
      });
    }
    
    console.log(`✅ ONGs processadas: ${ongs.length}`);
    
    const lastUpdate = new Date().toLocaleTimeString('pt-BR');
    
    return {
      ongs,
      error: null,
      lastUpdate,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    return {
      ongs: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados',
      lastUpdate: new Date().toLocaleTimeString('pt-BR'),
    };
  }
}

// Hook customizado para usar os dados (pode ser usado em componentes client)
export function createDataFetcher() {
  let cachedData: { ongs: ONG[]; lastUpdate: string } | null = null;
  let lastFetchTime = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  return async function getData(): Promise<{ ongs: ONG[]; error: string | null; lastUpdate: string }> {
    const now = Date.now();
    
    // Usar cache se ainda válido
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return { ...cachedData, error: null };
    }
    
    const result = await fetchAllData();
    
    if (!result.error && result.ongs.length > 0) {
      cachedData = { ongs: result.ongs, lastUpdate: result.lastUpdate };
      lastFetchTime = now;
    }
    
    return result;
  };
}
