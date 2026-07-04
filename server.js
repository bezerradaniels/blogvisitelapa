// Servidor Next.js customizado.
// O Hostinger (hospedagem Node.js com Passenger) procura um ponto de entrada
// na raiz do projeto. Este arquivo inicia o Next em modo produção.
//
// Fluxo no Hostinger:
//   1. npm install
//   2. npm run build   (gera a pasta .next)
//   3. Passenger executa este server.js automaticamente
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
// O Passenger define a PORT via variável de ambiente.
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Pronto em http://${hostname}:${port}`);
  });
});
