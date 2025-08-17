// SYNC_STATE (0x01)
//      Sent server → client only.
//      Contains a full snapshot of the current document state (Y.encodeStateAsUpdate(doc)).
//      Used when a new client joins: “Here’s everything so you’re up to date immediately.”

// UPDATE (0x02)
//      Sent both directions.
//      Contains an incremental Yjs update (Y.encodeStateAsUpdate after a change or Y.encodeStateAsUpdateV2 inside a client).
//      When a client edits, it sends an UPDATE with just the changes.
//      The server:
//          Applies it to the room’s Y.Doc.
//          Broadcasts that same update to all other clients so they stay synced.


// AWARENESS: 0x03
// 1. What is awareness in Yjs?
//      It’s ephemeral state per client (like “I’m drawing with a red brush at (100,100)”).
//      It’s not stored in the Y.Doc because it should vanish when a client disconnects.
//      It’s updated frequently — much more than the actual document updates — so it’s lightweight.

// We will frame messages like this:
// [1 byte: type][4 bytes: length][payload: <length> bytes ...]

// 1. type — a single byte (0x01 or 0x02).
// 2. length — a 32-bit unsigned integer in big-endian order telling how many bytes are in the payload.
// 3. payload — raw binary data (Uint8Array) containing a Yjs update.

export const TYPE = {
    SYNC_STATE: 0x01,
    UPDATE: 0x02,
    AWARENESS: 0x03
}

// Encode: frame
export function encodeFrame(type, payload) {
    const len = payload.length >>> 0;
    const header = Buffer.alloc(5);
    header.writeUInt8(type, 0);
    header.writeUInt32BE(len, 1);
    return Buffer.concat([header, Buffer.from(payload)]);
}

// Examle: If you send UPDATE with a 10-byte payload:
// type = 0x02
// len = 10 → 00 00 00 0A
// header = [02 00 00 00 0A]
// full frame = header + payload bytes

//  Decode: frame
export function decodeFrame(buffer) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer); // ensure Node Buffer
    if (buf.length < 5) throw new Error('Invalid frame');

    const type = buf.readUInt8(0);
    const len = buf.readUInt32BE(1);

    if (buf.length < 5 + len) throw new Error('Incomplete frame');

    const payload = buf.subarray(5, 5 + len);
    return { type, payload: new Uint8Array(payload) };
}


// Why not just send JSON?
// Two reasons:
//      Yjs updates are binary by nature. Turning them into JSON with base64 bloats them by ~33%.
//      Multiple messages per TCP packet. Without framing, you'd need to guess where one message ends and another begins. Our header solves this by being self-delimiting.

