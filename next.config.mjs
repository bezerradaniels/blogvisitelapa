/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um build enxuto (server + arquivos mínimos) — ótimo para hospedagem Node.
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
