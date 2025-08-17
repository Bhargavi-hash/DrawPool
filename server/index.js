import WebSocket from 'ws';
import http from 'http';
import Room from './ws/room.js';

// Create an HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});
// Create a WebSocket server
const wss = new WebSocket.Server({ server });

const rooms = new Map(); // Map to hold rooms by name

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = url.searchParams.get('room') || 'default';

  // Check if the room already exists
  let room = rooms.get(roomName);
  // If not, create a new room
  if (!room) {
    room = new Room(roomName);
    rooms.set(roomName, room);
  }
  // Add the client to the room
  room.addClient(ws);

  // Clean up when the room is empty
  ws.on('close', () => {
    if (room.clients.size) {
      rooms.delete(roomName);
    }
  });
});

server.listen(1234, () => {
  console.log('Websocket server is running on port ws://localhost:1234');
});