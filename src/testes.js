/**
 * SISTEMA DE TESTES UNITÁRIOS (Lógica Financeira)
 * * Como Analista, use estas funções para garantir que modificações no código
 * não quebrem a integridade dos cálculos de parcelas.
 */

function executarTestes() {
  console.log("--- Iniciando Testes Unitários ---");
  
  testarCalculoArredondamento();
  testarSomaTotalDasParcelas();
  
  console.log("--- Testes Finalizados ---");
}

/**
 * Verifica se a lógica de distribuir os centavos restantes
 * na primeira parcela está funcionando.
 */
function testarCalculoArredondamento() {
  const valorTotal = 100.00;
  const qtdParcelas = 3;
  
  // Simulando a lógica de cálculo
  const valorBase = Math.floor((valorTotal / qtdParcelas) * 100) / 100; // 33.33
  const resto = parseFloat((valorTotal - (valorBase * qtdParcelas)).toFixed(2)); // 0.01
  
  const primeiraParcela = valorBase + resto;
  
  if (primeiraParcela === 33.34) {
    console.log("✅ Teste Arredondamento: PASSOU (Primeira parcela ajustada para 33.34)");
  } else {
    console.error("❌ Teste Arredondamento: FALHOU (Esperado 33.34, obtido " + primeiraParcela + ")");
  }
}

/**
 * Garante que a soma de todas as parcelas geradas é RIGOROSAMENTE
 * igual ao valor total informado, evitando erros de saldo devedor.
 */
function testarSomaTotalDasParcelas() {
  const casosDeTeste = [
    { total: 100.00, parcelas: 3 },
    { total: 50.00, parcelas: 6 },
    { total: 1250.75, parcelas: 12 }
  ];
  
  casosDeTeste.forEach((caso, index) => {
    const parcelasGeradas = simularGeracaoDeParcelas(caso.total, caso.parcelas);
    const somaReal = parcelasGeradas.reduce((acc, p) => acc + p.valor, 0);
    
    if (Math.abs(somaReal - caso.total) < 0.001) {
      console.log(`✅ Caso ${index + 1}: PASSOU (Soma: ${somaReal} | Total: ${caso.total})`);
    } else {
      console.error(`❌ Caso ${index + 1}: FALHOU (Soma: ${somaReal} | Total: ${caso.total})`);
    }
  });
}

/**
 * Função auxiliar para simular a lógica de geração sem interagir com a UI
 */
function simularGeracaoDeParcelas(total, qtd) {
  const valorBase = Math.floor((total / qtd) * 100) / 100;
  const resto = parseFloat((total - (valorBase * qtd)).toFixed(2));
  
  let resultado = [];
  for (let i = 1; i <= qtd; i++) {
    resultado.push({
      numero: i,
      valor: (i === 1) ? (valorBase + resto) : valorBase
    });
  }
  return resultado;
}