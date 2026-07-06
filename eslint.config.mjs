// Configuração ESLint (flat config).
// O Next 16 removeu o comando `next lint`; usamos o ESLint direto com o
// preset oficial do Next (Core Web Vitals + regras de React/Next).
import next from 'eslint-config-next';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'types/database.generated.ts'] },
  ...next,
];

export default config;
