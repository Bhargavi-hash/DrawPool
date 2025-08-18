export const TYPE = {
  SYNC_STATE: 0x01,
  UPDATE: 0x02,
  AWARENESS: 0x03 // if you add awareness later
};

export function encodeFrame(type, payload) {
  const len = payload.length >>> 0;
  const header = new Uint8Array(5);
  header[0] = type;
  header[1] = (len >>> 24) & 0xff;
  header[2] = (len >>> 16) & 0xff;
  header[3] = (len >>> 8) & 0xff;
  header[4] = len & 0xff;
  const frame = new Uint8Array(5 + payload.length);
  frame.set(header, 0);
  frame.set(payload, 5);
  return frame;
}

export function decodeFrame(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8.length < 5) throw new Error('frame too short');
  const type = u8[0];
  const len = (u8[1] << 24) | (u8[2] << 16) | (u8[3] << 8) | (u8[4]);
  if (u8.length < 5 + len) throw new Error('incomplete frame');
  const payload = u8.subarray(5, 5 + len);
  return { type, payload };
}
