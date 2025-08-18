// browser client, uses native WebSocket
import * as Y from 'yjs';
import { TYPE, encodeFrame, decodeFrame } from '../protocol.js';

export async function connectWS(doc, roomName) {
  // If you used a proxy in vite.config.js and want same-origin:
  // const wsUrl = `ws://${location.host}/ws?room=${roomName}`;
  // Otherwise connect directly:
  const wsUrl = `ws://localhost:1234?room=${roomName}`;

  const ws = new WebSocket(wsUrl);
  ws.binaryType = 'arraybuffer';

  // When doc updates, send Yjs update frames to the server
  doc.on('update', update => {
    ws.send(encodeFrame(TYPE.UPDATE, new Uint8Array(update)));
    console.log('Sent update to server');
  });

  // Handle incoming frames from server
  ws.addEventListener('message', evt => {
    const buf = new Uint8Array(evt.data);
    const { type, payload } = decodeFrame(buf);
    if (type === TYPE.SYNC_STATE || type === TYPE.UPDATE) {
      Y.applyUpdate(doc, payload);
      console.log('Received update from server');
    }
  });

  // Return the WebSocket for status wiring in main.js
  return ws;
}
