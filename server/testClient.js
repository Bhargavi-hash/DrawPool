// testClient.js
import * as Y from 'yjs';
import WebSocket from 'ws';
import { TYPE, encodeFrame, decodeFrame } from './ws/protocol.js';

// Utility to encode/decode messages (matches protocol.js)
const MSG_UPDATE = 0x02;

function encodeUpdateMessage(update) {
    return encodeFrame(TYPE.UPDATE, update);
}

// Connect to a room
function connectClient(name) {
    const doc = new Y.Doc();
    const ws = new WebSocket('ws://localhost:1234?room=test');

    ws.binaryType = 'arraybuffer';

    ws.on('open', () => {
        console.log(`${name} connected`);

        // Apply a small update after 1s
        setTimeout(() => {
            const ymap = doc.getMap('drawing');
            ymap.set(`${name}-point`, { x: Math.random() * 500, y: Math.random() * 500 });
            const update = Y.encodeStateAsUpdate(doc);
            try {
                ws.send(encodeFrame(TYPE.UPDATE, Buffer.from(update)));
            } catch (err) {
                console.error('Send failed:', err);
            }
            console.log(`${name} sent update`);
        }, 1000);
    });

    ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const { type, payload } = decodeFrame(buf);
    if (type === TYPE.UPDATE) {
        Y.applyUpdate(doc, payload);
        console.log(`${name} received update:`, Array.from(doc.getMap('drawing').entries()));
    }
});

    ws.on('close', () => {
        console.log(`${name} disconnected`);
    });

    return { ws, doc };
}

// Create two clients
connectClient('Alice');
connectClient('Bob');
