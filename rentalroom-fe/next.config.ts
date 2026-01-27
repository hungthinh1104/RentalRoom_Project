import type { NextConfig } from "next";

import { config } from './src/lib/config';

// CSP for development allows localhost connections; production uses stricter policy
const isDev = process.env.NODE_ENV === 'development';

// Helper to extract origin from URL
const getOrigin = (urlStr: string) => {
  try {
    const url = new URL(urlStr);
    return url.origin;
  } catch {
    return null;
  }
};

const apiOrigin = getOrigin(config.api.url) || 'http://localhost:3000';
const socketOrigin = getOrigin(config.socket.url) || 'http://localhost:3000';
const serverOrigin = getOrigin(config.api.serverUrl) || 'http://localhost:3001';

// Allow both localhost and 127.0.0.1 for local dev
const getLocalVariants = (origin: string) => {
  if (origin.includes('localhost')) {
    return [origin, origin.replace('localhost', '127.0.0.1')];
  }
  return [origin];
};

const origins = new Set<string>();
if (isDev) {
  getLocalVariants(apiOrigin).forEach(o => origins.add(o));
  getLocalVariants(socketOrigin).forEach(o => {
    origins.add(o);
    // Add WebSocket variants
    origins.add(o.replace('http', 'ws'));
  });
  getLocalVariants(serverOrigin).forEach(o => origins.add(o));

  // Implicitly add 3000/3001 if not already covered, just to be safe for defaults
  origins.add('http://localhost:3000');
  origins.add('ws://localhost:3000');
  origins.add('http://localhost:3001');
} else {
  // Production origins
  origins.add('https://rental-room-api.azurewebsites.net');
  if (apiOrigin.startsWith('http')) origins.add(apiOrigin);
  if (serverOrigin.startsWith('http')) origins.add(serverOrigin);
}

const connectSrc = ["'self'", "https:", ...Array.from(origins)].join(' ');

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src ${connectSrc}`,
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "qr.sepay.vn",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Disable standalone output to avoid middleware NFT issues
  // output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/terms',
        destination: '/terms-of-service',
        permanent: true,
      },
      {
        source: '/privacy',
        destination: '/privacy-policy',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: `${process.env.BACKEND_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
