// One Y.Doc per room, broadcast to members.

// room.js is the server-side brain that manages one collaborative drawing session (or room).
// protocol.js defines how messages are packaged, room.js defines what happens when they arrive.

// High-level purpose of room.js
// 1. Keeps one yjs doc per room.
// 2. Tracks all websocket clients currently in the room.
// 3. Handles incoming messages (e.g. drawing updates from clients)
// 4. Applies changes to yjs document.
// 5. Broadcasts changes to all other clients.

// [Client A] --> (update) --> [Room Doc] --> (broadcast) --> [Client B, Client C, ...]

import Y from 'yjs';
import { TYPE, encodeFrame, decodeFrame } from './protocol';

class Room {
    constructor(name) {
        this.name = name; // Room name
        this.doc = new Y.Doc(); // Yjs document, each room has it's own shared yjs document.
        this.clients = new Set(); // track connected websocket clients
    }

    // Add a new client to the room
    addClient(ws) {
        this.clients.add(ws);

        //  When client closes the connection --> remove it
        ws.on('close', () => {
            this.clients.delete(ws);
        });

        // Send the current full state as SYNC_STATE to the new client
        const fullState = Y.encodeStateAsUpdate(this.doc);
        ws.send(encodeFrame(TYPE.SYNC_STATE, fullState)); // The new user gets everything happened so far

        //  When client sends an update, apply it to the Yjs document
        ws.on('message', (message) => {
            const { type, payload } = decodeFrame(message);
            if (type === TYPE.UPDATE) {
                this.applyUpdate(payload, ws);
            }
        });
    }

    // Apply update to the yjs doc and broadcast it to all clients
    applyUpdate(update, originws) {
        // 1. Merge update into the doc
        Y.applyUpdate(this.doc, update);
        // 2. Broadcast the update to all other clients
        const msg = encodeFrame(TYPE.UPDATE, update);
        for (const client of this.clients) {
            if (client !== originws && client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }

}

export default Room;

// Why do we keep a Y.Doc on the server?
// 1. If all clients disconnect, the document still exists — so when someone reconnects, they can download the full state.
// 2. Without it, the server would just be a "dumb relay," and you'd need to rely on one client to hold the canonical document. This would be fragile.
// 3. Later, we can persist this Y.Doc (to Redis, Postgres, or disk) if we want permanent rooms that survive server restarts.