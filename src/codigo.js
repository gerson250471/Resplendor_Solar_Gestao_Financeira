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
 * Padronizado para somar estritamente a aba Parcelas para evitar dízimas
 */
function getResumoFinanceiro() {
  try {
    atualizarStatusParcelas(); 
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaParcelas = ss.getSheetByName("Parcelas");
    const abaVendas = ss.getSheetByName("Vendas");
    const hoje = new Date();
    
    let totalAcumulado = 0;
    let vendasMes = 0;
    let qtdAberto = 0, qtdUrgente = 0, qtdAtraso = 0;

    if (abaVendas) {
      const dv = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dv.length; i++) {
        let dataVenda = new Date(dv[i][2]);
        if (dataVenda instanceof Date && !isNaN(dataVenda.getTime())) {
          if (dataVenda.getMonth() === hoje.getMonth() && dataVenda.getFullYear() === hoje.getFullYear()) {
            vendasMes++;
          }
        }
      }
    }

    if (abaParcelas) {
      const dp = abaParcelas.getDataRange().getValues();
      for (let i = 1; i < dp.length; i++) {
        const status = dp[i][4]; 
        const valorRaw = dp[i][3]; 
        
        if (status !== "PAGO") {
          let valor = parseFloat(valorRaw);
          if (!isNaN(valor)) {
            totalAcumulado += Math.round(valor * 100);
          }
          
          if (status === "EM ABERTO") qtdAberto++;
          if (status === "URGENTE") qtdUrgente++;
          if (status === "Em Atraso") qtdAtraso++;
        }
      }
    }

    const saldoFinal = totalAcumulado / 100;

    return { 
      sucesso: true, 
      dados: { 
        total: saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
        vendasMes: vendasMes, 
        aberto: qtdAberto,
        urgente: qtdUrgente,
        atraso: qtdAtraso 
      } 
    };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- GESTÃO DE CLIENTES (CRM) ---
 */
function salvarCliente(dados) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let aba = ss.getSheetByName("Clientes");

    if (!aba) {
      aba = ss.insertSheet("Clientes");
      aba.appendRow(["ID", "Descrição", "Endereço", "Bairro", "Cidade", "Celular"]);
    }

    aba.appendRow([
      dados.id,
      dados.descricao,
      dados.endereco,
      dados.bairro,
      dados.cidade,
      dados.celular
    ]);

    return { sucesso: true, mensagem: "Cliente salvo com sucesso!" };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function listarClientes() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const aba = ss.getSheetByName("Clientes");
    if (!aba) return { sucesso: true, dados: [] };

    const valores = aba.getDataRange().getValues();
    valores.shift(); 

    const clientes = valores.map(linha => ({
      id: linha[0],
      descricao: linha[1],
      endereco: linha[2],
      bairro: linha[3],
      cidade: linha[4],
      celular: linha[5]
    }));

    return { sucesso: true, dados: clientes };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function eliminarCliente(id) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const aba = ss.getSheetByName("Clientes");
    const valores = aba.getDataRange().getValues();

    for (let i = valores.length - 1; i >= 1; i--) {
      if (valores[i][0].toString() === id.toString()) {
        aba.deleteRow(i + 1);
        return { sucesso: true, mensagem: "Registro removido." };
      }
    }
    return { sucesso: false, mensagem: "Cliente não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- LANÇAMENTO DE VENDAS ---
 */
function obterProximoIdVenda() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaVendas = ss.getSheetByName("Vendas");
    const anoAtual = new Date().getFullYear();

    if (!abaVendas) return { sucesso: true, id: `VEN-${anoAtual}-001` };

    const dv = abaVendas.getDataRange().getValues();
    let contagemAno = 0;

    for (let i = 1; i < dv.length; i++) {
      const dataVenda = new Date(dv[i][2]);
      if (dataVenda instanceof Date && !isNaN(dataVenda.getTime())) {
        if (dataVenda.getFullYear() === anoAtual) {
          contagemAno++;
        }
      }
    }

    const proximoNumero = contagemAno + 1;
    const numeroFormatado = proximoNumero.toString().padStart(3, '0');

    return { sucesso: true, id: `VEN-${anoAtual}-${numeroFormatado}` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function processarGravacao(venda, parcelas) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let abaVendas = ss.getSheetByName("Vendas");

    if (!abaVendas) {
      abaVendas = ss.insertSheet("Vendas");
      abaVendas.appendRow(["ID Venda", "CLIENTES DEVEDORES", "Data venda", "Valor Total", "Forma Pagamento", "Saldo Devedor", "Status"]);
    }

    let abaParcelas = ss.getSheetByName("Parcelas");
    if (!abaParcelas) {
      abaParcelas = ss.insertSheet("Parcelas");
      abaParcelas.appendRow(["ID Venda", "Número", "Vencimento", "Valor", "Status"]);
    }

    abaVendas.appendRow([
      venda.idVenda,
      venda.cliente,
      venda.dataVenda || new Date(),
      venda.valorTotal,
      venda.formaPagamento,
      venda.saldoDevedor,
      venda.status
    ]);

    if (parcelas && parcelas.length > 0) {
      const dadosParcelas = parcelas.map(p => [venda.idVenda, p.numero, p.vencimento, p.valor, p.status]);
      const ultimaLinha = abaParcelas.getLastRow() + 1;
      abaParcelas.getRange(ultimaLinha, 1, dadosParcelas.length, 5).setValues(dadosParcelas);
    }

    return { sucesso: true, mensagem: "Venda e parcelas registradas com sucesso!" };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- CONFIRMAÇÃO DE PAGAMENTOS ---
 */
function listarParcelasPendentes() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaVendas = ss.getSheetByName("Vendas");
    const abaParcelas = ss.getSheetByName("Parcelas");

    if (!abaVendas || !abaParcelas) return { sucesso: true, dados: [] };

    const valVendas = abaVendas.getDataRange().getValues();
    const mapaClientes = {};
    for (let i = 1; i < valVendas.length; i++) {
      mapaClientes[valVendas[i][0]] = valVendas[i][1]; 
    }

    const valParcelas = abaParcelas.getDataRange().getValues();
    const pendentes = [];

    for (let i = 1; i < valParcelas.length; i++) {
      if (valParcelas[i][4] !== "PAGO") {
        let vencimento = valParcelas[i][2];
        if (vencimento instanceof Date) {
          vencimento = vencimento.toISOString().split('T')[0];
        }

        pendentes.push({
          idVenda: valParcelas[i][0],
          cliente: mapaClientes[valParcelas[i][0]] || "Cliente Desconhecido",
          numero: valParcelas[i][1],
          vencimento: vencimento,
          valor: valParcelas[i][3],
          status: valParcelas[i][4]
        });
      }
    }

    pendentes.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
    return { sucesso: true, dados: pendentes };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function confirmarPagamentoParcela(idVenda, numeroParcela) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaParcelas = ss.getSheetByName("Parcelas");
    const abaVendas = ss.getSheetByName("Vendas");

    const valParcelas = abaParcelas.getDataRange().getValues();
    let valorPago = 0;

    for (let i = 1; i < valParcelas.length; i++) {
      if (valParcelas[i][0].toString() === idVenda.toString() && valParcelas[i][1].toString() === numeroParcela.toString()) {
        abaParcelas.getRange(i + 1, 5).setValue("PAGO");
        valorPago = parseFloat(valParcelas[i][3]);
        break;
      }
    }

    if (valorPago > 0) {
      const valVendas = abaVendas.getDataRange().getValues();
      for (let i = 1; i < valVendas.length; i++) {
        if (valVendas[i][0].toString() === idVenda.toString()) {
          let saldoAtual = Math.round(parseFloat(valVendas[i][5]) * 100);
          let abatimento = Math.round(valorPago * 100);
          let novoSaldo = (saldoAtual - abatimento) / 100;

          if (novoSaldo < 0.01) novoSaldo = 0; 
          abaVendas.getRange(i + 1, 6).setValue(novoSaldo);

          if (novoSaldo === 0) {
            abaVendas.getRange(i + 1, 7).setValue("CONCLUÍDO");
          }
          break;
        }
      }
    }

    return { sucesso: true, mensagem: "Pagamento confirmado!" };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- ATUALIZAÇÃO AUTOMÁTICA DE STATUS ---
 */
function atualizarStatusParcelas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaParcelas = ss.getSheetByName("Parcelas");
    if (!abaParcelas) return false;
    
    const dados = abaParcelas.getDataRange().getValues();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let alteracoes = 0;
    const colunaStatus = [[dados[0][4]]]; 
    
    for (let i = 1; i < dados.length; i++) {
      let statusAtual = dados[i][4];
      let dataVenc = new Date(dados[i][2]);
      let novoStatus = statusAtual;
      
      if (statusAtual !== "PAGO") {
        if (dataVenc instanceof Date && !isNaN(dataVenc.getTime())) {
          dataVenc.setHours(0, 0, 0, 0);
          const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
          
          if (diffDias < 0) novoStatus = "Em Atraso";
          else if (diffDias <= 10) novoStatus = "URGENTE";
          else novoStatus = "EM ABERTO";
          
          if (novoStatus !== statusAtual) alteracoes++;
        }
      }
      colunaStatus.push([novoStatus]);
    }
    
    if (alteracoes > 0) {
      abaParcelas.getRange(1, 5, colunaStatus.length, 1).setValues(colunaStatus);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * --- FUNÇÃO DE AUDITORIA: RECALCULAR SALDO DEVEDOR ---
 * Esta função sincroniza o saldo da aba 'Vendas' com a soma real
 * das parcelas não pagas na aba 'Parcelas'.
 */
/**
 * --- FUNÇÃO DE AUDITORIA: VALOR DA COMPRA - PARCELAS PAGAS ---
 */
function recalcularSaldosVendas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaVendas = ss.getSheetByName("Vendas");
    const abaParcelas = ss.getSheetByName("Parcelas");
    
    if (!abaVendas || !abaParcelas) return "Erro: Abas não encontradas.";

    const dadosVendas = abaVendas.getDataRange().getValues();
    const dadosParcelas = abaParcelas.getDataRange().getValues();
    
    let correcoesRealizadas = 0;

    // 1. Mapear o total já PAGO e se existe algum atraso real
    const mapaFinanceiro = {};

    for (let i = 1; i < dadosParcelas.length; i++) {
      const idVenda = dadosParcelas[i][0];
      const valorParcela = parseFloat(dadosParcelas[i][3]) || 0;
      const statusParc = dadosParcelas[i][4];

      if (!mapaFinanceiro[idVenda]) {
        mapaFinanceiro[idVenda] = { totalPago: 0, temAtraso: false };
      }

      if (statusParc === "PAGO") {
        // Soma o que já foi para o bolso do cliente
        mapaFinanceiro[idVenda].totalPago += Math.round(valorParcela * 100);
      } else if (statusParc === "Em Atraso") {
        // Marca se existe o "perigo" do atraso
        mapaFinanceiro[idVenda].temAtraso = true;
      }
    }

    // 2. Aplicar a regra: Valor Total - Pago
    for (let j = 1; j < dadosVendas.length; j++) {
      const idVendaVenda = dadosVendas[j][0];
      const valorCompra = Math.round(parseFloat(dadosVendas[j][3]) * 100); // Coluna D (Valor Total)
      const infoFinanceira = mapaFinanceiro[idVendaVenda] || { totalPago: 0, temAtraso: false };
      
      const saldoDevedorReal = (valorCompra - infoFinanceira.totalPago) / 100;
      const statusAtual = dadosVendas[j][6];
      
      let novoStatus = "EM ABERTO";
      
      if (saldoDevedorReal <= 0) {
        novoStatus = "CONCLUÍDO";
      } else if (infoFinanceira.temAtraso) {
        novoStatus = "EM ATRASO";
      }

      // Só atualiza se o saldo ou o status estiverem divergentes
      const saldoGravado = parseFloat(dadosVendas[j][5]);
      if (Math.abs(saldoGravado - saldoDevedorReal) > 0.001 || statusAtual !== novoStatus) {
        abaVendas.getRange(j + 1, 6).setValue(saldoDevedorReal); // Coluna F (Saldo Devedor)
        abaVendas.getRange(j + 1, 7).setValue(novoStatus);      // Coluna G (Status)
        correcoesRealizadas++;
      }
    }

    return { sucesso: true, mensagem: `Sincronização concluída. ${correcoesRealizadas} vendas ajustadas.` };

  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}