const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 8080 });
console.log('🟢 Сервер запущен на порту 8080');

const tunnels = new Map();

wss.on('connection', (ws) => {
  const id = Date.now() + Math.random();
  tunnels.set(id, { ws, targets: new Map() });
  console.log(`🔗 Клиент подключен: ${id}`);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      const tunnel = tunnels.get(id);
      
      if (data.type === 'connect') {
        const socket = net.createConnection(data.port, data.host);
        socket.on('data', (chunk) => {
          ws.send(JSON.stringify({
            type: 'data',
            id: data.id,
            data: chunk.toString('base64')
          }));
        });
        tunnel.targets.set(data.id, socket);
      }
      
      if (data.type === 'data') {
        const socket = tunnel.targets.get(data.id);
        if (socket) {
          socket.write(Buffer.from(data.data, 'base64'));
        }
      }
    } catch (e) {
      console.log('⚠️ Ошибка:', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Клиент отключен: ${id}`);
    const tunnel = tunnels.get(id);
    if (tunnel) {
      tunnel.targets.forEach(socket => socket.destroy());
      tunnels.delete(id);
    }
  });
});

console.log('✅ Сервер готов! Жду подключений...');
