import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const standaloneDir = join(root, '.next', 'standalone');

if (!existsSync(standaloneDir)) {
  console.warn('Standalone build nao encontrado; nada para preparar.');
  process.exit(0);
}

const copies = [
  {
    from: join(root, '.next', 'static'),
    to: join(standaloneDir, '.next', 'static'),
    optional: false,
  },
  {
    from: join(root, 'public'),
    to: join(standaloneDir, 'public'),
    optional: true,
  },
];

for (const copy of copies) {
  if (!existsSync(copy.from)) {
    if (!copy.optional) {
      console.warn(`Origem nao encontrada: ${copy.from}`);
    }
    continue;
  }

  rmSync(copy.to, { recursive: true, force: true });
  mkdirSync(dirname(copy.to), { recursive: true });
  cpSync(copy.from, copy.to, { recursive: true });
}
