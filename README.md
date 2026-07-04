# Visite Lapa

Site em **Next.js 14** (App Router) pronto para deploy em hospedagem **Node.js** do Hostinger e para vincular seu domínio próprio.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Build de produção

```bash
npm run build
npm start
```

---

## Deploy no Hostinger (hospedagem Node.js)

O Hostinger usa **Passenger** para servir apps Node.js. Ele precisa de um arquivo de
entrada na raiz — este projeto já inclui o `server.js`.

### 1. Enviar para o GitHub

```bash
git init
git add .
git commit -m "Projeto inicial Visite Lapa (Next.js)"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/visitelapa.git
git push -u origin main
```

### 2. Configurar no hPanel

1. Acesse **hPanel → Sites → Node.js** (ou **Avançado → Node.js**).
2. Crie a aplicação:
   - **Versão do Node.js:** 20.9 ou superior (exigido pelo Next 16).
   - **Application root:** pasta onde o projeto ficará (ex.: `visitelapa`).
   - **Application startup file:** `server.js`
3. **Importar do GitHub:** em muitos planos há a opção de conectar o repositório
   diretamente. Caso não haja, faça upload dos arquivos ou clone via SSH no diretório.

### 3. Instalar e buildar

No terminal Node do hPanel (ou via SSH), dentro da pasta do app:

```bash
npm install
npm run build
```

Depois clique em **Restart** na aplicação Node.js do hPanel.

> **Importante:** rode `npm run build` toda vez que atualizar o código (ele gera a
> pasta `.next`, que não vai para o Git). O `server.js` só serve o build já gerado.

### 4. Vincular o domínio

1. Em **hPanel → Domínios**, aponte seu domínio para o site (ou configure os
   nameservers do Hostinger no seu registrador).
2. Na configuração da aplicação Node.js, associe o domínio/subdomínio.
3. Ative o **SSL grátis** (Let's Encrypt) em **Segurança → SSL**.

---

## Estrutura

```
visitelapa/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── .gitignore
├── .nvmrc              # versão do Node (20)
├── next.config.mjs     # output: standalone
├── package.json
├── server.js           # ponto de entrada do Passenger/Hostinger
└── README.md
```

## Alternativa: VPS

Se usar um **VPS do Hostinger** em vez da hospedagem compartilhada, o fluxo
recomendado é rodar `npm run build && npm start` sob um gerenciador de processos
(PM2) e usar Nginx como proxy reverso para a porta `3000`.
