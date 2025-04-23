/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/worklets/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Next.js 15.3'de Turbopack yapılandırması için üst düzey anahtar
  turbopack: {
    // Gerekirse buraya Turbopack yapılandırmanızı ekleyebilirsiniz
  },
};

module.exports = nextConfig; 