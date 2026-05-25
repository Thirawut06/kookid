import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/

/**
 * Local-dev-only middleware that mocks the /api/submit/* endpoints
 * so the browser doesn't flood the console with 404s.
 * In production (Vercel), the real serverless functions in api/ handle these routes.
 */
function apiMockPlugin() {
  return {
    name: 'mock-api-submit',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url?.startsWith('/api/submit/')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ data: null, mock: true }));
          });
          return;
        }

        if (req.method === 'POST' && req.url?.startsWith('/api/admin/login')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ token: "local-dev-mock-token", expiresAt: Date.now() + 3600000 }));
          });
          return;
        }

        if (req.method === 'GET' && req.url?.startsWith('/api/admin/data')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            profiles: [],
            interests: [],
            quizResults: [],
            eventRows: [],
            quizCount: 0,
            mock: true
          }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [apiMockPlugin(), react()],
});