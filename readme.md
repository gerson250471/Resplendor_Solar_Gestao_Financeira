## ☀️ Resplendor Solar - Sistema de Gestão e CRM

Sistema centralizado para acompanhamento financeiro e Gestão de Relacionamento com o Cliente (CRM) desenvolvido sob medida para a Resplendor Solar.

Este projeto substitui processos tradicionais baseados em bases de dados locais (Access/VBA), migrando a operação para a nuvem através de uma arquitetura Serverless utilizando o ecossistema do Google.

## ✨ Funcionalidades Principais

### 1. 📊 Dashboard Financeiro

Visão em tempo real do Saldo Total em aberto.

Contagem automática de Vendas no Mês atual.

Monitorização de Parcelas Vencidas (Integração inteligente de datas).

### 2. 👥 Gestão de Clientes (CRM)

Registo e Edição Inteligente (Upsert): O sistema verifica automaticamente a existência do cliente. Se existir, atualiza; caso contrário, insere um novo.

Geração Automática de IDs: Criação sequencial de códigos únicos (ex: CLI-1, CLI-2) baseados no histórico da base de dados.

Prevenção de Duplicidade: Verificação automática por Nome e Telemóvel/Celular antes de gerar um novo registo.

Interface Reativa: Tabela com pesquisa em tempo real (Filtro por Nome, ID ou Cidade).

UX Premium: - Notificações Toast deslizantes para feedback visual (Sucesso/Erro).

Modal personalizado e seguro para confirmação de exclusão (Eliminação de alertas padrão do navegador).

### 3. 💰 Lançamento Financeiro

Registo centralizado de vendas associadas a clientes.

Geração e pré-visualização automática do plano de parcelamento.

Tratamento de dízimas e arredondamentos matemáticos precisos na divisão de valores (ex: ajuste de cêntimos na primeira parcela).

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando uma arquitetura SPA (Single Page Application).

### Frontend:

- HTML5 & CSS3

- Tailwind CSS (Estilização utilitária e design responsivo)

- Vanilla JavaScript (ES6+)

- Lucide Icons (Iconografia moderna)

### Backend e Base de Dados:

- Google Apps Script (V8): Motor de execução server-side.

- Google Sheets: Atuando como Base de Dados NoSQL, com separação lógica em abas (Clientes, Vendas, Parcelas).

### Ambiente de Desenvolvimento:

- CLASP (Command Line Apps Script Projects)

- Visual Studio Code

## 🚀 Como Executar / Fazer o Deploy

Como este projeto utiliza o CLASP, o processo de implementação é feito via linha de comandos:

Clone ou transfira os ficheiros do projeto para o seu ambiente local.

Certifique-se de que tem o Node.js e o CLASP instalados.

Efetue o login na sua conta Google:

```
clasp login
```

Associe o projeto ao ID do seu script (presente no ficheiro .clasp.json).

Envie o código atualizado para os servidores do Google:

```
clasp push
```

No painel do Google Apps Script, publique o projeto como um Web App.

## 👨‍💻 Desenvolvido por

MAJB Sistemas Desenvolvimento de Soluções Inteligentes 📍 Taubaté / SP - Brasil

Soli Deo Gloria
