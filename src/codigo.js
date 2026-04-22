/**
 * SISTEMA FINANCEIRO E CRM - RESPLENDOR SOLAR
 * Desenvolvido por: MAJB SISTEMAS
 * Local: Taubaté/SP
 */

const SPREADSHEET_ID = "1GY1tukFd1mOwhbwyZTvEXApHdktL5SuzaOKsqHHEEr8";

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  const output = template.evaluate();
  output.setTitle('Resplendor Solar - Gestão Centralizada');
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * --- LÓGICA DE INDICADORES (DASHBOARD) ---
 */
function getResumoFinanceiro() {
  try {
    // 🚀 Atualiza status (Atraso/Urgente) antes de processar
    atualizarStatusParcelas(); 
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaParcelas = ss.getSheetByName("Parcelas");
    const abaVendas = ss.getSheetByName("Vendas");
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let totalCentavosAReceber = 0;
    let contadorVendasMes = 0;
    let qtdAberto = 0, qtdUrgente = 0, qtdAtraso = 0;

    const valoresPagasMes = new Array(12).fill(0);
    const valoresAReceberMes = new Array(12).fill(0);
    const mesesLabel = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // 1. CONTAGEM DE VENDAS (Aba Vendas - Coluna C)
    if (abaVendas) {
      const dv = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dv.length; i++) {
        let dataVenda = new Date(dv[i][2]);
        if (!isNaN(dataVenda.getTime())) {
          if (dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual) {
            contadorVendasMes++;
          }
        }
      }
    }

    // 2. PROCESSAMENTO DE PARCELAS (Aba Parcelas - Colunas C, D, E)
    if (abaParcelas) {
      const dp = abaParcelas.getDataRange().getValues();
      for (let i = 1; i < dp.length; i++) {
        const dataVenc = new Date(dp[i][2]); // Coluna C
        const valor = parseFloat(dp[i][3]) || 0; // Coluna D
        const status = (dp[i][4] || "").toString().toUpperCase().trim(); // Coluna E

        if (!isNaN(dataVenc.getTime())) {
          if (status === "PAGO") {
            if (dataVenc.getFullYear() === anoAtual) {
              valoresPagasMes[dataVenc.getMonth()] += Math.round(valor * 100);
            }
          } else if (status !== "") {
            // SOMA GLOBAL PARA OS CARDS (Bate com a planilha: 175, 264, 14)
            totalCentavosAReceber += Math.round(valor * 100);
            
            if (status === "EM ABERTO") qtdAberto++;
            if (status === "URGENTE") qtdUrgente++;
            if (status === "EM ATRASO") qtdAtraso++;

            if (dataVenc.getFullYear() === anoAtual) {
              valoresAReceberMes[dataVenc.getMonth()] += Math.round(valor * 100);
            }
          }
        }
      }
    }

    // --- 3. PREPARAÇÃO DOS GRÁFICOS COM CORES DINÂMICAS ---
    const payloadPagas = [["Mês", "R$ Recebido", { role: 'style' }]];
    const payloadAReceber = [["Mês", "R$ A Receber", { role: 'style' }]];

    mesesLabel.forEach((m, i) => {
      // Pagos sempre Verde
      payloadPagas.push([m, valoresPagasMes[i] / 100, "color: #10b981"]); 

      // Previsão: Vermelho para meses passados com valores pendentes
      let corBarra = "#3b82f6"; // Azul padrão
      if (i < mesAtual && valoresAReceberMes[i] > 0) {
        corBarra = "#ef4444"; // Vermelho Alerta
      }
      payloadAReceber.push([m, valoresAReceberMes[i] / 100, `color: ${corBarra}`]);
    });

    return { 
      sucesso: true, 
      dados: { 
        total: (totalCentavosAReceber / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 
        vendasMes: contadorVendasMes.toString(), 
        aberto: qtdAberto, 
        urgente: qtdUrgente, 
        atraso: qtdAtraso 
      },
      graficos: { pagas: payloadPagas, receber: payloadAReceber }
    };
  } catch (e) { 
    return { sucesso: false, mensagem: e.message }; 
  }
}

/**
 * --- MOTOR DE ATUALIZAÇÃO AUTOMÁTICA ---
 */
function atualizarStatusParcelas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const aba = ss.getSheetByName("Parcelas");
    if (!aba) return;
    
    const dados = aba.getDataRange().getValues();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const colunaStatus = [];

    for (let i = 1; i < dados.length; i++) {
      let statusAtual = (dados[i][4] || "").toString().toUpperCase().trim();
      let dataVenc = new Date(dados[i][2]);
      let novoStatus = statusAtual;
      
      if (statusAtual !== "PAGO" && !isNaN(dataVenc.getTime())) {
        dataVenc.setHours(0, 0, 0, 0);
        const diffTempo = dataVenc.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24));
        
        if (diffDias < 0) {
          novoStatus = "EM ATRASO";
        } else if (diffDias <= 10) {
          novoStatus = "URGENTE";
        } else {
          novoStatus = "EM ABERTO";
        }
      }
      colunaStatus.push([novoStatus]);
    }

    if (colunaStatus.length > 0) {
      aba.getRange(2, 5, colunaStatus.length, 1).setValues(colunaStatus);
    }
  } catch (e) {
    console.error("Erro ao atualizar status: " + e.message);
  }
}