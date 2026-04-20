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

// 🚀 NOVA FUNÇÃO DE MODULARIZAÇÃO
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * --- LÓGICA DE INDICADORES (DASHBOARD) ---
 */
function getResumoFinanceiro() {
  try {
    // 🚀 Atualiza os status antes de contar
    atualizarStatusParcelas(); 
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaVendas = ss.getSheetByName("Vendas");
    const abaParcelas = ss.getSheetByName("Parcelas");
    const hoje = new Date();
    
    let total = 0, vendasMes = 0;
    let qtdAberto = 0, qtdUrgente = 0, qtdAtraso = 0;

    if (abaVendas) {
      const dv = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dv.length; i++) {
        let valorCru = dv[i][5]; // Saldo Devedor
        let saldo = 0;
        if (typeof valorCru === 'number') {
          saldo = valorCru;
        } else if (valorCru) {
          saldo = parseFloat(String(valorCru).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        }
        total += isNaN(saldo) ? 0 : saldo;

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
        if (status === "EM ABERTO") qtdAberto++;
        if (status === "URGENTE") qtdUrgente++;
        if (status === "EM ATRASO") qtdAtraso++;
      }
    }

    const totalFormatado = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(total);

    return { 
      sucesso: true, 
      dados: { 
        total: totalFormatado, 
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

    // Cria a aba se não existir
    if (!aba) {
      aba = ss.insertSheet("Clientes");
      aba.appendRow(["ID", "Descrição", "Endereço", "Bairro", "Cidade", "Celular"]);
    }

    // Usando appendRow (Inserção rápida)
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
    const cabecalho = valores.shift(); // Remove a primeira linha

    // Mapeia o array 2D para um array de objetos (Melhor prática em JS)
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

    // Loop de trás para frente é mais seguro ao deletar linhas
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

    // Se a aba Vendas não existir, retornamos a venda nº 1
    if (!abaVendas) return { sucesso: true, id: `VEN-${anoAtual}-001` };

    const dv = abaVendas.getDataRange().getValues();
    let contagemAno = 0;

    // Loop para encontrar todas as vendas do ano atual
    for (let i = 1; i < dv.length; i++) {
      const dataVenda = new Date(dv[i][2]); // Índice 2 é a Data da Venda
      if (dataVenda instanceof Date && !isNaN(dataVenda.getTime())) {
        if (dataVenda.getFullYear() === anoAtual) {
          contagemAno++;
        }
      }
    }

    // Calcula o próximo número e formata com 3 zeros (ex: 001, 015, 102)
    const proximoNumero = contagemAno + 1;
    const numeroFormatado = proximoNumero.toString().padStart(3, '0');

    return { sucesso: true, id: `VEN-${anoAtual}-${numeroFormatado}` };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- LANÇAMENTO DE VENDAS ---
 */
function processarGravacao(venda, parcelas) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let abaVendas = ss.getSheetByName("Vendas");

    // Se a aba Vendas não existir, cria com os cabeçalhos EXATOS informados
    if (!abaVendas) {
      abaVendas = ss.insertSheet("Vendas");
      abaVendas.appendRow([
        "ID Venda",
        "CLIENTES DEVEDORES",
        "Data venda",
        "Valor Total",
        "Forma Pagamento",
        "Saldo Devedor",
        "Status"
      ]);
    }

    let abaParcelas = ss.getSheetByName("Parcelas");

    // Se a aba Parcelas não existir, cria com os cabeçalhos EXATOS informados
    if (!abaParcelas) {
      abaParcelas = ss.insertSheet("Parcelas");
      abaParcelas.appendRow([
        "ID Venda",
        "Número",
        "Vencimento",
        "Valor",
        "Status"
      ]);
    }

    // Grava a Venda (A ordem do array bate exatamente com as colunas)
    abaVendas.appendRow([
      venda.idVenda,
      venda.cliente,
      venda.dataVenda || new Date(),
      venda.valorTotal,
      venda.formaPagamento,
      venda.saldoDevedor,
      venda.status
    ]);

    // Grava as Parcelas em lote (Muito mais rápido)
    if (parcelas && parcelas.length > 0) {
      const dadosParcelas = parcelas.map(p => [
        venda.idVenda,
        p.numero,
        p.vencimento,
        p.valor,
        p.status
      ]);

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

    // 1. Mapear clientes por ID da Venda (para mostrar o nome na tela)
    const valVendas = abaVendas.getDataRange().getValues();
    const mapaClientes = {};
    for (let i = 1; i < valVendas.length; i++) {
      mapaClientes[valVendas[i][0]] = valVendas[i][1]; // ID Venda -> Cliente
    }

    // 2. Buscar parcelas pendentes
    const valParcelas = abaParcelas.getDataRange().getValues();
    const pendentes = [];

    for (let i = 1; i < valParcelas.length; i++) {
      if (valParcelas[i][4] !== "PAGO") { // Se não estiver pago
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

    // Ordenar pelas datas de vencimento mais antigas primeiro
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

    // 1. Atualizar o status da Parcela
    const valParcelas = abaParcelas.getDataRange().getValues();
    let valorPago = 0;

    for (let i = 1; i < valParcelas.length; i++) {
      if (valParcelas[i][0].toString() === idVenda.toString() && valParcelas[i][1].toString() === numeroParcela.toString()) {
        abaParcelas.getRange(i + 1, 5).setValue("PAGO"); // Coluna E (Status)
        valorPago = parseFloat(valParcelas[i][3]); // Coluna D (Valor)
        break;
      }
    }

    // 2. Abater o Saldo Devedor na Venda
    if (valorPago > 0) {
      const valVendas = abaVendas.getDataRange().getValues();
      for (let i = 1; i < valVendas.length; i++) {
        if (valVendas[i][0].toString() === idVenda.toString()) {
          let saldoAtual = parseFloat(valVendas[i][5]); // Coluna F (Saldo Devedor)
          let novoSaldo = saldoAtual - valorPago;

          if (novoSaldo <= 0.01) novoSaldo = 0; // Trata dízimas perdidas

          abaVendas.getRange(i + 1, 6).setValue(novoSaldo); // Atualiza Saldo

          // Se quitou tudo, conclui a venda
          if (novoSaldo === 0) {
            abaVendas.getRange(i + 1, 7).setValue("CONCLUÍDO");
          }
          break;
        }
      }
    }

    return { sucesso: true, mensagem: "Pagamento confirmado com sucesso!" };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * --- ATUALIZAÇÃO AUTOMÁTICA DE STATUS DAS PARCELAS ---
 */
function atualizarStatusParcelas() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaParcelas = ss.getSheetByName("Parcelas");
    
    if (!abaParcelas) return false;
    
    const dados = abaParcelas.getDataRange().getValues();
    
    // Configurar a data de "Hoje" para meia-noite (para comparar apenas os dias, ignorando as horas)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let alteracoes = 0;
    
    // Criamos um array para armazenar a coluna de Status inteira
    const colunaStatus = [];
    colunaStatus.push([dados[0][4]]); // Mantém o cabeçalho "Status" intacto
    
    for (let i = 1; i < dados.length; i++) {
      let statusAtual = dados[i][4];
      let dataVenc = new Date(dados[i][2]);
      let novoStatus = statusAtual;
      
      // Regra 1: Se já estiver PAGO, o sistema não mexe!
      if (statusAtual !== "PAGO") {
        if (dataVenc instanceof Date && !isNaN(dataVenc.getTime())) {
          dataVenc.setHours(0, 0, 0, 0); // Zera as horas para cálculo perfeito
          
          // Cálculo de diferença de dias (Matemática de Datas em JS)
          const diffTempo = dataVenc.getTime() - hoje.getTime();
          const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24)); // Converte milissegundos para dias
          
          // Aplicando a sua regra de negócio:
          if (diffDias < 0) {
            novoStatus = "Em Atraso";
          } else if (diffDias <= 10) {
            novoStatus = "URGENTE";
          } else {
            novoStatus = "EM ABERTO";
          }
          
          // Verifica se houve mudança para contabilizar
          if (novoStatus !== statusAtual) alteracoes++;
        }
      }
      
      // Adiciona o status (novo ou antigo) na lista
      colunaStatus.push([novoStatus]);
    }
    
    // Regra de Ouro da Performance: Só escreve na planilha se houver mudanças
    if (alteracoes > 0) {
      abaParcelas.getRange(1, 5, colunaStatus.length, 1).setValues(colunaStatus);
    }
    
    return true;
  } catch (e) {
    console.error("Erro ao atualizar status: " + e.message);
    return false;
  }
}
