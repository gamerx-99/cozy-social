import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Rooms } from './rooms.js';
import { networkInterfaces } from 'node:os';
const root = fileURLToPath(new URL('../', import.meta.url));
const prod = process.argv.includes('--production');
const server = http.createServer();
if (prod) {
  const base = resolve(root, 'dist');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
  server.on('request', async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(base + sep)) { res.writeHead(403).end(); return; }
      const data = await readFile(file); res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(data);
    } catch { res.writeHead(404).end('Not found'); }
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: { server } }, appType: 'mpa' });
  server.on('request', vite.middlewares);
}
const rooms = new Rooms();
const ws = new WebSocketServer({ noServer: true, maxPayload: 4096 });
server.on('upgrade', (req, socket, head) => { if (req.url === '/ws') ws.handleUpgrade(req, socket, head, client => ws.emit('connection', client)); });
ws.on('connection', socket => {
  const hosts = Object.values(networkInterfaces()).flat().filter(n => n.family === 'IPv4' && !n.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)).map(n => n.address);
  socket.send(JSON.stringify({ type: 'network', hosts }));
  socket.alive = true; let count = 0, reset = Date.now();
  socket.on('pong', () => { socket.alive = true; });
  socket.on('message', raw => {
    if (Date.now() - reset > 1000) { reset = Date.now(); count = 0; }
    if (++count > 80) return;
    try { rooms.handle(socket, JSON.parse(raw.toString())); } catch { rooms.fail(socket, 'ข้อมูลไม่ถูกต้อง'); }
  });
  socket.on('error', () => {}); socket.on('close', () => rooms.leave(socket));
});
setInterval(() => rooms.tick(), 100);
setInterval(() => { for (const s of ws.clients) { if (!s.alive) s.terminate(); else { s.alive = false; s.ping(); } } }, 15000);
server.listen(Number(process.env.PORT || 5188), '0.0.0.0', () => console.log(`Cozy Social → http://localhost:${server.address().port}`));

