# Deploy no Hostinger (Node.js)

O projeto usa `output: 'standalone'` e um `server.js` na raiz — o Passenger do Hostinger executa esse arquivo automaticamente. Esse `server.js` carrega o servidor gerado em `.next/standalone/server.js`.

## Requisitos

- Plano com **hospedagem Node.js**.
- **Node.js 24** (definido em `.nvmrc` e em `engines` do `package.json`).

## Passos

1. **Enviar o código** (Git ou upload) para a pasta da aplicação.
2. No painel, criar a aplicação **Node.js**:
   - Versão do Node: **24**
   - Arquivo de inicialização / *Application startup file*: `server.js`
   - Pasta raiz: a pasta do projeto
   - Ambiente: `NODE_ENV=production`
3. **Variáveis de ambiente** (painel da aplicação): copie de `.env.example`
   - `NEXT_PUBLIC_SITE_URL` = seu domínio (ex.: `https://www.conectalapa.com.br`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secreta)
   - `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
4. **Instalar e buildar** (terminal SSH ou botões do painel):
   ```bash
   npm install
   npm run build
   ```
5. **Reiniciar** a aplicação (o Passenger sobe o `server.js`).

## Comandos

| Ação | Comando |
| --- | --- |
| Instalar | `npm install` |
| Build | `npm run build` |
| Start (Passenger) | executa `server.js` |
| Start manual | `npm start` |

## Domínio de imagens

O `next.config.mjs` libera automaticamente o host do Supabase Storage a partir de `NEXT_PUBLIC_SUPABASE_URL` (`/storage/v1/object/public/**`). Se usar outro CDN de imagens, adicione o host em `images.remotePatterns`.

## Checklist de produção

- [ ] Node 24 selecionado.
- [ ] `server.js` como arquivo de inicialização.
- [ ] `NODE_ENV=production` configurado.
- [ ] Todas as variáveis de ambiente configuradas.
- [ ] `npm run build` concluído sem erros.
- [ ] `NEXT_PUBLIC_SITE_URL` = domínio final (canonical/sitemap/RSS dependem disso).
- [ ] Redirect URLs do Supabase incluem `https://seu-dominio/auth/callback`.
- [ ] SSL/HTTPS ativo no domínio.
- [ ] Sitemap acessível em `/sitemap.xml` e RSS em `/rss.xml`.

## SSR e rotas

Quase todas as rotas são renderizadas sob demanda (SSR), pois leem sessão/cookies. `robots.txt` e `llms.txt` são estáticos. O middleware (`middleware.ts`) renova a sessão e protege `/admin`, `/publisher`, `/perfil` e `/favoritos`.
