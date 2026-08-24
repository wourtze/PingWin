const WebSocket = require('ws');
const dgram = require('dgram');

// ПОДСТАВЬ СВОЙ АДРЕС ПОТОМ!
const WS_URL = 'ws://localhost:8080'; 

const ws = new WebSocket(WS_URL);
const udpSockets = new Map();

ws.on('open', () => {
  console.log('🟢 Подключено к прокси-серверу');
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg);
  if (data.type === 'data') {
    const socket = udpSockets.get(data.id);
    if (socket) {
      const buf = Buffer.from(data.data, 'base64');
      socket.send(buf, 0, buf.length, socket.port, socket.host);
    }
  }
});

const udp = dgram.createSocket('udp4');
udp.bind(12345, () => {
  console.log(`🎮 Перехватываем UDP на порту 12345`);
});

udp.on('message', (buf, rinfo) => {
  const id = `${rinfo.address}:${rinfo.port}`;
  udpSockets.set(id, { ...rinfo });
  
  ws.send(JSON.stringify({
    type: 'connect',
    id: id,
    host: rinfo.address,
    port: rinfo.port
  }));
  
  ws.send(JSON.stringify({
    type: 'data',
    id: id,
    data: buf.toString('base64')
  }));
});
