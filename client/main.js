// Fabric + WS hookup

import * as Y from "https://cdn.jsdelivr.net/npm/yjs@13.6.8/dist/yjs.mjs";
import { connectWS } from './wsClient.js';

const statusEl = document.getElementById('status');

// When WS connects
statusEl.textContent = 'Connected';
statusEl.style.color = 'green';

// When WS disconnects or fails
statusEl.textContent = 'Disconnected';
statusEl.style.color = 'red';


const canvas = new fabric.Canvas('draw', {
  isDrawingMode: true
});

const doc = new Y.Doc();
const ymap = doc.getMap('drawing');

// Listen to local changes on the Fabric canvas
canvas.on('path:created', () => {
  // Serialize full canvas to JSON and store in Yjs map
  const json = canvas.toJSON();
  ymap.set('canvas', json);  // Will trigger an update
});

// Listen for remote changes to the Y.Doc and re-render canvas
ymap.observe(() => {
  const json = ymap.get('canvas');
  if (json) {
    canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
  }
});

// Connect to backend WS
connectWS(doc, 'test'); // room = test
