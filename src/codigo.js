/**
 * ============================================================================
 * CONFIGURAÇÃO E MOTOR DO SISTEMA - MAJB SISTEMAS
 * ============================================================================
 */

function doGet(e) {
  const configAtual = getConfig();
  const template = HtmlService.createTemplateFromFile('index');
  
  // Passa as configurações para o HTML (Ativa a barra de homologação)
  template.config = configAtual; 
  
  const output = template.evaluate();
  output.setTitle('Resplendor Solar - Gestão Centralizada')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        
  return output;
}

function getConfig() {
  const URL_ATUAL = ScriptApp.getService().getUrl();
  
  // IDs das Planilhas de Banco de Dados
  const ID_PRODUCAO = "1GY1tukFd1mOwhbwyZTvEXApHdktL5SuzaOKsqHHEEr8"; 
  const ID_HOMOLOGACAO = "1WWzsJIpwx8JE7yt6WKwDVt0OU3Mg_gQ3RY5ILH3yrlM"; 

  const ehHomologacao = URL_ATUAL.indexOf("script.google.com") !== -1 || URL_ATUAL.indexOf("homologacao") !== -1;

  return {
    spreadsheetId: ehHomologacao ? ID_HOMOLOGACAO : ID_PRODUCAO,
    ambiente: ehHomologacao ? "⚠️ HOMOLOGAÇÃO (TESTES)" : "✅ PRODUÇÃO",
    isDev: ehHomologacao
  };
}

// Função centralizada para buscar o ID correto da Planilha
function getSpreadsheetId() {
  return getConfig().spreadsheetId;
}

// Permite importar os arquivos HTML modulares (dashboard, clientes, etc)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ============================================================================
 * MÓDULO DE CLIENTES
 * ============================================================================
 */

function salvarClienteNoServidor(obj) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Clientes");
    
    // Insere os dados na próxima linha vazia
    aba.appendRow([obj.id, obj.nome, obj.celular, obj.cidade, obj.bairro, obj.endereco]);
    return { sucesso: true };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function carregarListaClientes() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Clientes");
    const dados = aba.getDataRange().getValues();
    const lista = [];

    // Ignora o cabeçalho e coleta os clientes
    for (let i = 1; i < dados.length; i++) {
      lista.push({
        id: dados[i][0],
        nome: dados[i][1],
        celular: dados[i][2],
        cidade: dados[i][3]
      });
    }
    return { sucesso: true, dados: lista };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * ============================================================================
 * MÓDULO FINANCEIRO E DE VENDAS
 * ============================================================================
 */

function obterProximoIdVenda() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const aba = ss.getSheetByName("Vendas");
  
  // Calcula o próximo ID baseado no número da última linha
  return "VND-" + aba.getLastRow();
}

function salvarVendaNoServidor(venda, parcelas) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const abaVendas = ss.getSheetByName("Vendas");
    const abaParcelas = ss.getSheetByName("Parcelas");
    
    // 1. Grava o cabeçalho da Venda
    abaVendas.appendRow([venda.id, venda.cliente, venda.data, venda.valor, venda.metodo]);
    
    // 2. Grava todas as Parcelas de uma vez
    parcelas.forEach(p => {
      abaParcelas.appendRow([venda.id, venda.cliente, p.vencimento, p.valor, "EM ABERTO"]);
    });
    
    return { sucesso: true };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function obterListaParcelas() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Parcelas");
    const dados = aba.getDataRange().getValues();
    const lista = [];

    for (let i = 1; i < dados.length; i++) {
      const status = (dados[i][4] || "").toString().toUpperCase().trim();
      
      // Filtra apenas parcelas que não estão pagas
      if (status !== "" && status !== "PAGO") {
        lista.push({
          linha: i + 1,
          idVenda: dados[i][0] || "-",
          cliente: dados[i][1] || "-", 
          vencimento: new Date(dados[i][2]).toLocaleDateString('pt-BR'),
          valor: (parseFloat(dados[i][3]) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          status: status
        });
      }
    }
    return { sucesso: true, dados: lista };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

/**
 * ============================================================================
 * MÓDULO DASHBOARD
 * ============================================================================
 */

function getResumoFinanceiro() {
  try {
    atualizarStatusParcelas();
    
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const abaParcelas = ss.getSheetByName("Parcelas");
    const abaVendas = ss.getSheetByName("Vendas");
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let totalCents = 0, vendasMes = 0, aberto = 0, urgente = 0, atraso = 0;
    const pagasMes = new Array(12).fill(0);
    const receberMes = new Array(12).fill(0);

    // Contagem de Vendas do Mês Atual
    if (abaVendas) {
      const dv = abaVendas.getDataRange().getValues();
      for (let i = 1; i < dv.length; i++) {
        let d = new Date(dv[i][2]);
        if (!isNaN(d.getTime()) && d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
          vendasMes++;
        }
      }
    }

    // Soma das Parcelas
    if (abaParcelas) {
      const dp = abaParcelas.getDataRange().getValues();
      for (let i = 1; i < dp.length; i++) {
        const d = new Date(dp[i][2]);
        const val = parseFloat(dp[i][3]) || 0;
        const status = (dp[i][4] || "").toUpperCase().trim();
        
        if (!isNaN(d.getTime())) {
          if (status === "PAGO") {
            if(d.getFullYear() === anoAtual) {
              pagasMes[d.getMonth()] += Math.round(val * 100);
            }
          } else if (status !== "") {
            totalCents += Math.round(val * 100);
            if(status === "EM ABERTO") aberto++; 
            if(status === "URGENTE") urgente++; 
            if(status === "EM ATRASO") atraso++;
            
            if(d.getFullYear() === anoAtual) {
              receberMes[d.getMonth()] += Math.round(val * 100);
            }
          }
        }
      }
    }

    // Configuração dos Gráficos
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const gPagas = [["Mês", "R$ Recebido", { role: 'style' }]];
    const gRec = [["Mês", "R$ A Receber", { role: 'style' }]];
    
    meses.forEach((m, i) => {
      gPagas.push([m, pagasMes[i] / 100, "color: #10b981"]);
      let cor = (i < mesAtual && receberMes[i] > 0) ? "#ef4444" : "#3b82f6";
      gRec.push([m, receberMes[i] / 100, `color: ${cor}`]);
    });

    return {
      sucesso: true,
      dados: {
        total: (totalCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        vendasMes: vendasMes.toString(),
        aberto: aberto,
        urgente: urgente,
        atraso: atraso
      },
      graficos: { pagas: gPagas, receber: gRec }
    };
  } catch(e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function atualizarStatusParcelas() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Parcelas"); 
    if(!aba) return;

    const dados = aba.getDataRange().getValues();
    const hoje = new Date(); 
    hoje.setHours(0, 0, 0, 0);
    
    const novosStatus = [];

    for (let i = 1; i < dados.length; i++) {
      let st = (dados[i][4] || "").toUpperCase().trim();
      let d = new Date(dados[i][2]);
      let nSt = st;
      
      if (st !== "PAGO" && !isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        const diff = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        if (diff < 0) nSt = "EM ATRASO";
        else if (diff <= 10) nSt = "URGENTE";
        else nSt = "EM ABERTO";
      }
      novosStatus.push([nSt]);
    }
    
    if (novosStatus.length > 0) {
      aba.getRange(2, 5, novosStatus.length, 1).setValues(novosStatus);
    }
  } catch (e) {
    console.error("Erro na atualização de status: " + e.message);
  }
}

/**
 * ============================================================================
 * SEGURANÇA E LOGIN
 * ============================================================================
 */

function gerarHashSeguro(usuario, senha) {
  // Combina usuário e senha como Salt
  const entrada = usuario.toLowerCase().trim() + senha;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, entrada);
  
  let hash = '';
  for (let i = 0; i < digest.length; i++) {
    let b = digest[i]; 
    if (b < 0) b += 256;
    let hex = b.toString(16); 
    if (hex.length === 1) hex = '0' + hex;
    hash += hex;
  }
  return hash;
}

function validarAcesso(usuario, senha) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Usuarios");
    const dados = aba.getDataRange().getValues();
    const hashDigitado = gerarHashSeguro(usuario, senha);
    
    for (let i = 1; i < dados.length; i++) {
      if (usuario === dados[i][1] && hashDigitado === dados[i][2]) {
        return { 
          sucesso: true, 
          nome: dados[i][0], 
          nivel: dados[i][3], 
          precisaTrocar: (dados[i][4] || "").toString().toUpperCase().trim() === "SIM"
        };
      }
    }
    return { sucesso: false, mensagem: "Usuário ou senha incorretos. Acesso negado." };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function atualizarSenhaDefinitiva(usuario, novaSenha) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Usuarios");
    const dados = aba.getDataRange().getValues();
    
    for (let i = 1; i < dados.length; i++) {
      if (usuario === dados[i][1]) {
        aba.getRange(i + 1, 3).setValue(gerarHashSeguro(usuario, novaSenha)); 
        aba.getRange(i + 1, 5).setValue("NAO");    
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}