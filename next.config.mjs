/** @type {import('next').NextConfig} */

// O host do Supabase Storage é derivado da URL pública do projeto, para liberar
// as imagens (capas, galeria, banners, avatares) no componente next/image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const remotePatterns = [];
if (supabaseHostname) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
    pathname: '/storage/v1/object/public/**',
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Build enxuto (server + arquivos mínimos) — ideal para hospedagem Node do Hostinger.
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns,
    // Tamanhos alinhados ao layout mobile-first e à capa 16:10.
    imageSizes: [64, 96, 128, 256, 384],
    deviceSizes: [360, 420, 640, 768, 1024, 1280],
  },
};

export default nextConfig;
