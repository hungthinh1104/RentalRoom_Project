export const config = {
    api: {
        // Client-side should always use relative proxy path for unification and origin-agnostic behavior.
        // Server-side needs the absolute URL for fetch in Node environment.
        url: typeof window === 'undefined'
            ? process.env.BACKEND_API_URL || 'http://localhost:3001'
            : '/api',
        // Legacy mapping or specific server-side direct access
        serverUrl: process.env.BACKEND_API_URL || 'http://localhost:3001',
    },
    socket: {
        // Socket.io connection URL - usually frontend port if proxied, or direct backend
        url: process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
    },
    auth: {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        secret: process.env.NEXTAUTH_SECRET,
    },
    site: {
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    imagekit: {
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    },
} as const;

// Helper to check if we are in development mode
export const isDev = process.env.NODE_ENV === 'development';
