# ☀️ Sistema Financeiro e CRM - Resplendor Solar

Sistema de gestão centralizada de alto desempenho, desenvolvido para a **Resplendor Solar**. Esta aplicação atua como um CRM integrado a um controle financeiro de lançamentos e baixas de parcelas.

---

## 🚀 Funcionalidades Principais

- **📊 Dashboard Inteligente:** Monitoramento em tempo real de Saldo Total, Volume de Vendas Mensais e Alerta de Parcelas Vencidas.
- **👥 CRM (Gestão de Clientes):** Cadastro robusto com validações de integridade, busca dinâmica e prevenção de duplicidade.
- **💰 Lançamentos Financeiros:** Registro de vendas com geração automática de parcelas e travas de segurança.
- **🔄 Auditoria de Saldos:** Função de recálculo automático para garantir que o saldo devedor seja sempre a prova de erros manuais.

---

## ⚖️ Regras de Negócio e Integridade Financeira

Para garantir a saúde financeira do sistema, a lógica de cálculo foi padronizada sob a **Regra de Ouro da Arrecadação**:

### 1. Cálculo do Saldo Devedor

O sistema não apenas subtrai parcelas, ele audita a venda constantemente através da fórmula:

> **Saldo Devedor = Valor Total da Venda - Somatória de Parcelas com Status "PAGO"**

### 2. Hierarquia de Status da Venda

O status da venda na aba principal é definido automaticamente seguindo esta prioridade:

1.  **CONCLUÍDO:** Se o Saldo Devedor for igual a 0.
2.  **EM ATRASO:** Se o Saldo Devedor for > 0 **E** existir pelo menos uma parcela com status "Em Atraso".
3.  **EM ABERTO:** Se o Saldo Devedor for > 0, mas todas as parcelas a vencer estiverem em dia.

### 3. Precisão Decimal

Todos os cálculos internos multiplicam os valores por 100 antes do processamento e dividem por 100 no registro final, eliminando erros de arredondamento de ponto flutuante comuns em JavaScript.

---

## 🏗️ Estrutura de Arquivos (Modular)

```text
📁 src
├── 📄 appsscript.json  # Manifesto e configurações
├── 📄 codigo.js        # Backend (Lógica de servidor e recálculos)
├── 📄 index.html       # Master Page (SPA Engine)
├── 📄 dashboard.html   # Painel de Indicadores
├── 📄 clientes.html    # Gestão de CRM
├── 📄 financeiro.html  # Lançamentos de Vendas
├── 📄 pagamentos.html  # Confirmação de Recebíveis
└── 📄 testes.js        # Unit Tests da lógica financeira
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
