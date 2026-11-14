import http from 'node:http';
import dotenv from 'dotenv';
import { attachMultiplayerServer } from './index.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3001);

const httpServer = http.createServer((req, res) => {
  if (req.url === '/api/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        mode: 'standalone-socketio',
        stats: roomManager.getHealthStats(),
      })
    );
    return;
  }

  if (!req.url?.startsWith('/socket.io')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const { roomManager } = attachMultiplayerServer(httpServer);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`PartyPlay standalone Socket.IO server listening on http://0.0.0.0:${PORT}`);
});
