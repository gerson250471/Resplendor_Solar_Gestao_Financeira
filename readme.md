# ☀️ Sistema Financeiro e CRM - Resplendor Solar

Sistema de gestão centralizada de alto desempenho, desenvolvido para a **Resplendor Solar**. Esta aplicação atua como um CRM (Customer Relationship Management) integrado a um controle financeiro de lançamentos e baixas de parcelas.

O projeto utiliza uma arquitetura moderna de **Single Page Application (SPA)** dentro do ecossistema Google Workspace, garantindo uma experiência de usuário fluida, rápida e sem recarregamentos de página.

---

## 🚀 Funcionalidades Principais

- **📊 Dashboard Inteligente:** Monitoramento em tempo real de Saldo Total, Volume de Vendas Mensais e Alerta de Parcelas Vencidas.
- **👥 CRM (Gestão de Clientes):** Cadastro robusto com validações de integridade, busca dinâmica e prevenção de duplicidade.
- **💰 Lançamentos Financeiros:** Registro de vendas com geração automática de parcelas e travas de segurança para métodos de pagamento à vista.
- **✅ Baixa de Parcelas:** Sistema de liquidação de débitos que atualiza automaticamente o saldo devedor e o status geral da venda na base de dados.

---

## 🛠️ Tecnologias e Arquitetura

Este projeto foi desenvolvido utilizando as melhores práticas de modularização para **Google Apps Script**, permitindo o desenvolvimento local via **VS Code**.

- **Linguagens:** JavaScript (ES6+), HTML5, CSS3.
- **Frameworks:** [Tailwind CSS](https://tailwindcss.com/) (Estilização UI).
- **Ícones:** [Lucide Icons](https://lucide.dev/).
- **Backend:** Google Apps Script (V8 Runtime).
- **Database:** Google Sheets API.
- **DevOps:** [CLASP](https://github.com/google/clasp) (Command Line Apps Script Projects).

---

## 🏗️ Estrutura de Arquivos (Modular)

```text
📁 src
├── 📄 appsscript.json  # Manifesto e configurações do projeto
├── 📄 codigo.js        # Backend (Lógica de servidor e integração com Sheets)
├── 📄 index.html       # Master Page (SPA Engine e Menu)
├── 📄 dashboard.html   # Módulo: Painel de Indicadores
├── 📄 clientes.html    # Módulo: Gestão de CRM
├── 📄 financeiro.html  # Módulo: Lançamentos de Vendas
└── 📄 pagamentos.html  # Módulo: Confirmação de Recebíveis
```

## 💻 Manual de Operação (CLI Clasp)

Para manter a integridade do código e facilitar o controle de versão, utilize os comandos abaixo no seu terminal:

Enviar alterações para a nuvem:

```
clasp push
```

Baixar alterações da nuvem:

```
clasp pull
```

Abrir o editor no navegador:

```
clasp open
```

Verificar versões e deploys:

```
clasp deployments
```

## 👨‍💻 Desenvolvido por

### MAJB Sistemas

Especialista em Análise de Dados e Desenvolvimento de Sistemas.

Localizada em **Taubaté/SP**, a MAJB Sistemas é liderada por um **Analista de Sistemas (Graduado em 2020)** focado na migração de soluções legadas (VBA/Access) para ecossistemas modernos em nuvem (JavaScript/Google Cloud).

"Transformando dados complexos em soluções simples e eficientes para o seu negócio."

"Tudo o que fizerem, façam de todo o coração, como para o Senhor." - Colossenses 3:23

© 2026 MAJB Sistemas - Todos os direitos reservados.
