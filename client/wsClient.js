// WS + protocol glue.
import { TYPE, encodeFrame, decodeFrame } from '../server/ws/protocol.js';
import * as Y from 'yjs';
import WebSocket from 'isomorphic-ws'; // Use browser WebSocket if native

export function connectWS(doc, roomName) {
  const ws = new WebSocket(`ws://localhost:1234?room=${roomName}`);
//   const ws = new WebSocket(`ws://localhost:1234`);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    console.log('Connected to backend');
  };

  ws.onmessage = (event) => {
    const data = new Uint8Array(event.data);
    const { type, payload } = decodeFrame(Buffer.from(data));
    if (type === TYPE.SYNC_STATE || type === TYPE.UPDATE) {
      Y.applyUpdate(doc, payload);
    }
  };

  // Whenever our doc changes, push updates to server
  doc.on('update', (update) => {
    ws.send(encodeFrame(TYPE.UPDATE, update));
  });

  ws.onclose = () => {
    console.warn('Disconnected from backend');
  };

  return ws;
}
