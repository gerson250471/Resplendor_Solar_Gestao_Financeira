/**
 * CONFIGURAÇÃO DINÂMICA DE AMBIENTE - MAJB SISTEMAS
*/

function doGet(e) {
  const configAtual = getConfig();
  const template = HtmlService.createTemplateFromFile('index');
  
  template.config = configAtual; 
  
  const output = template.evaluate();
  output.setTitle('Resplendor Solar - Gestão Centralizada')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        
  return output;
}

function getConfig() {
  const URL_ATUAL = ScriptApp.getService().getUrl();
  const ID_PRODUCAO = "1GY1tukFd1mOwhbwyZTvEXApHdktL5SuzaOKsqHHEEr8"; 
  const ID_HOMOLOGACAO = "1WWzsJIpwx8JE7yt6WKwDVt0OU3Mg_gQ3RY5ILH3yrlM"; 

  const ehHomologacao = URL_ATUAL.indexOf("script.google.com") !== -1 || URL_ATUAL.indexOf("homologacao") !== -1;

  return {
    spreadsheetId: ehHomologacao ? ID_HOMOLOGACAO : ID_PRODUCAO,
    ambiente: ehHomologacao ? "⚠️ HOMOLOGAÇÃO (TESTES)" : "✅ PRODUÇÃO",
    isDev: ehHomologacao
  };
}

// NOVA FUNÇÃO SEGURA PARA BUSCAR O ID
function getSpreadsheetId() {
  return getConfig().spreadsheetId;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * --- LÓGICA DE INDICADORES (DASHBOARD) ---
 */
function getResumoFinanceiro() {
  try {
    atualizarStatusParcelas();

    // UTILIZANDO A NOVA FUNÇÃO AQUI
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
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

    if (abaParcelas) {
      const dp = abaParcelas.getDataRange().getValues();
      for (let i = 1; i < dp.length; i++) {
        const dataVenc = new Date(dp[i][2]); 
        const valor = parseFloat(dp[i][3]) || 0; 
        const status = (dp[i][4] || "").toString().toUpperCase().trim(); 

        if (!isNaN(dataVenc.getTime())) {
          if (status === "PAGO") {
            if (dataVenc.getFullYear() === anoAtual) {
              valoresPagasMes[dataVenc.getMonth()] += Math.round(valor * 100);
            }
          } else if (status !== "") {
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

    const payloadPagas = [["Mês", "R$ Recebido", { role: 'style' }]];
    const payloadAReceber = [["Mês", "R$ A Receber", { role: 'style' }]];

    mesesLabel.forEach((m, i) => {
      payloadPagas.push([m, valoresPagasMes[i] / 100, "color: #10b981"]);
      let corBarra = "#3b82f6"; 
      if (i < mesAtual && valoresAReceberMes[i] > 0) {
        corBarra = "#ef4444"; 
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

function atualizarStatusParcelas() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
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

function gerarHashSeguro(usuario, senha) {
  const entradaCombinada = usuario.toLowerCase().trim() + senha;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, entradaCombinada);
  let hash = '';
  for (let i = 0; i < digest.length; i++) {
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hash += hex;
  }
  return hash;
}

function aplicarNovoHashSeguro() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const aba = ss.getSheetByName("Usuarios");
  const dados = aba.getDataRange().getValues();

  for (let i = 1; i < dados.length; i++) {
    const usuario = dados[i][1].toString().trim(); 
    const senhaPura = dados[i][2].toString().trim(); 
    
    if (senhaPura !== "" && senhaPura.length !== 64) {
      const novoHash = gerarHashSeguro(usuario, senhaPura);
      aba.getRange(i + 1, 3).setValue(novoHash); 
    }
  }
  Browser.msgBox("Segurança Atualizada", "Hashes recriados com a técnica de Salt (Login+Senha).", Browser.Buttons.OK);
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
          precisaTrocar: dados[i][4] === "SIM" 
        };
      }
    }
    return { sucesso: false, mensagem: "Usuário ou senha incorretos." };
  } catch (e) {
    return { sucesso: false, mensagem: "Erro: " + e.message };
  }
}

function atualizarSenhaDefinitiva(usuario, novaSenha) {
  const ss = SpreadsheetApp.openById(getSpreadsheetId());
  const aba = ss.getSheetByName("Usuarios");
  const dados = aba.getDataRange().getValues();
  
  for (let i = 1; i < dados.length; i++) {
    if (usuario === dados[i][1]) {
      const novoHash = gerarHashSeguro(usuario, novaSenha);
      aba.getRange(i + 1, 3).setValue(novoHash); 
      aba.getRange(i + 1, 5).setValue("NAO");    
      return true;
    }
  }
  return false;
}

function processarTrocaSenha(usuario, novaSenha) {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Usuarios");
    const dados = aba.getDataRange().getValues();
    
    for (let i = 1; i < dados.length; i++) {
      if (usuario === dados[i][1]) { 
        const novoHash = gerarHashSeguro(usuario, novaSenha);
        aba.getRange(i + 1, 3).setValue(novoHash); 
        aba.getRange(i + 1, 5).setValue("NAO");    
        return { sucesso: true };
      }
    }
    return { sucesso: false, mensagem: "Usuário não encontrado." };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}

function carregarListaClientes() {
  try {
    const ss = SpreadsheetApp.openById(getSpreadsheetId());
    const aba = ss.getSheetByName("Clientes");
    if (!aba) return { sucesso: false, mensagem: "Aba 'Clientes' não encontrada." };

    const dados = aba.getDataRange().getValues();
    const lista = [];

    for (let i = 1; i < dados.length; i++) {
      lista.push({
        id: dados[i][0],
        descricao: dados[i][1],
        celular: dados[i][2],
        cidade: dados[i][3],
        bairro: dados[i][4],
        endereco: dados[i][5]
      });
    }

    return { sucesso: true, dados: lista };
  } catch (e) {
    return { sucesso: false, mensagem: e.message };
  }
}