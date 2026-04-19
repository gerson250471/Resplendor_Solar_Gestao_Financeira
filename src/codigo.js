/**
 * SISTEMA FINANCEIRO E CRM - RESPLENDOR SOLAR
 * Desenvolvido por: MAJB SISTEMAS
 * Local: Taubaté/SP
 * Arquivo: codigo.js (Backend executado nos servidores do Google)
 */

const SPREADSHEET_ID = "1GY1tukFd1mOwhbwyZTvEXApHdktL5SuzaOKsqHHEEr8";

/**
 * PONTO DE ENTRADA WEB APP
 * Serve o arquivo index.html consolidado.
 * * Correção do Erro de Referência: Separamos a criação do template 
 * da aplicação de títulos e meta tags para garantir a compatibilidade
 * com o compilador V8 do Apps Script via CLASP.
 */
function doGet(e) {
  // 1. Cria o template a partir do ficheiro HTML
  const template = HtmlService.createTemplateFromFile('index');
  
  // 2. Avalia o template gerando um objeto HtmlOutput
  const output = template.evaluate();
  
  // 3. Aplica as configurações ao objeto HtmlOutput
  output.setTitle('Resplendor Solar - Gestão Centralizada');
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  
  return output;
}

/**
 * --- LÓGICA DE INDICADORES (DASHBOARD) ---
 */
function getResumoFinanceiro() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const abaVendas = ss.getSheetByName("Vendas");
    const abaParcelas = ss.getSheetByName("Parcelas");
    const hoje = new Date();
    let total = 0, vendasMes = 0, vencidas = 0;

    if (abaVendas) {
      const dv = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dv.length; i++) {
        // 1. Trata o Saldo Devedor (Índice 5)
        let valorCru = dv[i][5];
        let saldo = 0;
        
        if (typeof valorCru === 'number') {
          saldo = valorCru;
        } else if (valorCru) {
          // Remove pontos de milhar, troca vírgula por ponto e remove letras/símbolos
          saldo = parseFloat(String(valorCru).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
        }
        
        // Garante que não adicionaremos 'NaN' (Not a Number) caso o campo estivesse vazio
        total += isNaN(saldo) ? 0 : saldo; 
        
        // 2. Calcula as Vendas do Mês atual (Índice 2 é a Data)
        let dataVenda = new Date(dv[i][2]);
        // Adicionada verificação rigorosa para garantir que a data é válida (.getTime())
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
        const dataVenc = new Date(dp[i][2]); // Assume coluna 2 como Vencimento
        const status = dp[i][4]; // Assume coluna 4 como Status
        
        if (dataVenc instanceof Date && !isNaN(dataVenc.getTime())) {
          if (dataVenc < hoje && status !== "PAGO") {
            vencidas++;
          }
        }
      }
    }

    // 3. Formata o Total para o Padrão Brasileiro (ex: 1.500,00)
    const totalFormatado = new Intl.NumberFormat('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(total);

    return { 
      sucesso: true, 
      dados: { 
        total: totalFormatado, 
        vendasMes: vendasMes, 
        vencidas: vencidas 
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

    // O SEGREDO ESTÁ AQUI: getDisplayValues() puxa tudo como string (texto puro),
    // igualzinho ao que está visível na célula, evitando erros de formatação de CPF/Número
    const valores = aba.getDataRange().getDisplayValues();
    let linhaExistente = -1;
    
    // Garante que a busca é feita sem espaços nas pontas
    const idBusca = String(dados.id).trim();

    for (let i = 1; i < valores.length; i++) {
      if (String(valores[i][0]).trim() === idBusca) {
        linhaExistente = i + 1; // +1 porque array em JS começa no 0 e a planilha começa na linha 1
        break;
      }
    }

    if (linhaExistente > -1) {
      // 🔄 ATUALIZAÇÃO DE REGISTRO EXISTENTE
      aba.getRange(linhaExistente, 1, 1, 6).setValues([[
        idBusca, 
        dados.descricao, 
        dados.endereco, 
        dados.bairro, 
        dados.cidade, 
        dados.celular
      ]]);
      return { sucesso: true, mensagem: "Cadastro atualizado com sucesso!" };
      
    } else {
      // ➕ INSERÇÃO DE NOVO REGISTRO
      aba.appendRow([
        idBusca, 
        dados.descricao, 
        dados.endereco, 
        dados.bairro, 
        dados.cidade, 
        dados.celular
      ]);
      return { sucesso: true, mensagem: "Novo cliente salvo com sucesso!" };
    }
    
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
function processarGravacao(venda, parcelas) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let abaVendas = ss.getSheetByName("Vendas");
    if (!abaVendas) {
        abaVendas = ss.insertSheet("Vendas");
        abaVendas.appendRow(["ID Venda", "Cliente", "Data", "Valor Total", "Forma Pgto", "Saldo Devedor", "Status"]);
    }
    
    let abaParcelas = ss.getSheetByName("Parcelas");
    if (!abaParcelas) {
        abaParcelas = ss.insertSheet("Parcelas");
        abaParcelas.appendRow(["ID Venda", "Nº Parcela", "Vencimento", "Valor", "Status"]);
    }

    // Grava a Venda
    abaVendas.appendRow([
      venda.idVenda, 
      venda.cliente, 
      venda.dataVenda || new Date(), 
      venda.valorTotal, 
      venda.formaPagamento, 
      venda.saldoDevedor, 
      venda.status
    ]);

    // Grava as Parcelas em lote (Muito mais rápido que appendRow dentro de loop)
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

    return { sucesso: true, mensagem: "Venda e parcelas registadas com sucesso!" };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}