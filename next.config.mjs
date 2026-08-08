/** @type {import('next').NextConfig} */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const nextPolyfillModule = require.resolve('next/dist/build/polyfills/polyfill-module');
const modernPolyfillModule = fileURLToPath(
  new URL('./lib/polyfills/modernBrowsers.js', import.meta.url),
);

// O host do Supabase Storage é derivado da URL pública do projeto, para liberar
// as imagens (capas, galeria, banners, avatares) no componente next/image.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaeanrxnwqodlaltcfks.supabase.co';
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const remotePatterns = [];
if (supabaseHostname) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
    pathname: '/storage/v1/object/public/**',
  });
  // Signed URLs (bucket privado user-photos: fotos respeitam a visibilidade do perfil).
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
    pathname: '/storage/v1/object/sign/**',
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Build enxuto (server + arquivos mínimos) — ideal para hospedagem Node do Hostinger.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns,
    // Mantém as variantes processadas em cache para evitar novo trabalho do
    // servidor e nova busca no Supabase a cada auditoria/expiração curta.
    minimumCacheTTL: 2678400,
    // Tamanhos alinhados ao layout mobile-first e à capa 16:10.
    imageSizes: [64, 96, 128, 256, 384],
    deviceSizes: [360, 420, 640, 768, 1024, 1280],
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // O App Router importa um conjunto fixo de polyfills. Para os navegadores
      // modernos suportados pelo Next 16, só URL.canParse ainda precisa de
      // fallback em parte da faixa; o restante gera o alerta de JS legado.
      config.resolve.alias[nextPolyfillModule] = modernPolyfillModule;
    }
    return config;
  },
};

export default nextConfig;
