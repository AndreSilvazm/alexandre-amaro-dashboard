// Script para testar a leitura dos dados da planilha
const Papa = require('papaparse');

const URL_ONGS = "https://docs.google.com/spreadsheets/d/1YVvp_w_r51028aAITKqrWtQDI8p9aOs3GQDIojtm4J4/export?format=csv&gid=400372920";

async function testFetch() {
  try {
    console.log('Buscando dados da planilha...');
    const response = await fetch(URL_ONGS);
    const csvText = await response.text();
    
    // Parse com papaparse
    const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    // Verificar ONGs sem CNPJ completo
    const semCnpjCompleto = result.data.filter(ong => !ong.cnpj_completo || ong.cnpj_completo.trim() === '');
    console.log(`\n=== ONGs sem CNPJ Completo: ${semCnpjCompleto.length} ===`);
    semCnpjCompleto.slice(0, 5).forEach(ong => {
      console.log(`- ${ong.razao_social} | CNPJ Básico: ${ong.cnpj_basico}`);
    });
    
    // Simular o que o código faz - criar IDs
    const ids = result.data.map(ong => {
      const cnpjBasico = String(ong.cnpj_basico || '').trim();
      const cnpjCompleto = String(ong.cnpj_completo || cnpjBasico).trim();
      return cnpjCompleto;
    });
    
    // Verificar IDs duplicados
    const duplicados = ids.filter((item, index) => ids.indexOf(item) !== index);
    console.log(`\n=== IDs Duplicados após processamento: ${duplicados.length} ===`);
    [...new Set(duplicados)].forEach(id => {
      const count = ids.filter(i => i === id).length;
      const ongs = result.data.filter(o => (o.cnpj_completo || o.cnpj_basico) === id);
      console.log(`- ID "${id}": ${count} vezes`);
      ongs.forEach(o => console.log(`    -> ${o.razao_social} (CNPJ Completo: ${o.cnpj_completo}, Básico: ${o.cnpj_basico})`));
    });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testFetch();