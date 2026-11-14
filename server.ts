import http from 'node:http';
import dotenv from 'dotenv';
import express from 'express';
import next from 'next';
import { attachMultiplayerServer } from './server/index.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const nextApp = next({
    dev: !isProduction,
    hostname: '0.0.0.0',
    port: PORT,
  });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = express();
  app.disable('x-powered-by');

  const httpServer = http.createServer(app);
  const { roomManager } = attachMultiplayerServer(httpServer);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      mode: 'unified-nextjs-socketio',
      stats: roomManager.getHealthStats(),
    });
  });

  app.use((req, res) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PartyPlay Next.js + Socket.IO server listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`
    );
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start PartyPlay server:', err);
  process.exit(1);
});
