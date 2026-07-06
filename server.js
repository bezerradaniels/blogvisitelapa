// Ponto de entrada para o Passenger/Hostinger.
// O build usa `output: 'standalone'`, entao o servidor correto e o gerado em
// `.next/standalone/server.js`. Use `npm run dev` para desenvolvimento local.
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'production';

// O servidor standalone do Next le HOSTNAME; algumas hospedagens expõem HOST.
if (process.env.HOST && !process.env.HOSTNAME) {
  process.env.HOSTNAME = process.env.HOST;
}

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServer)) {
  console.error(
    'Build standalone nao encontrado. Rode `npm install` e `npm run build` antes de iniciar a aplicacao.',
  );
  process.exit(1);
}

require(standaloneServer);
