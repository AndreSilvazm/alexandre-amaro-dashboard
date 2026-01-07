import Papa from 'papaparse';

// URLs das planilhas do Google Sheets (exportadas como CSV)
const URL_ONGS = "https://docs.google.com/spreadsheets/d/1YVvp_w_r51028aAITKqrWtQDI8p9aOs3GQDIojtm4J4/export?format=csv&gid=400372920";
const URL_SOCIOS = "https://docs.google.com/spreadsheets/d/1gn4nwKL3mvzvRNozAoiBGO15M8MJA2YfaIcJhAS1WiY/export?format=csv&gid=1270428080";

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
