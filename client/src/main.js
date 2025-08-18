import * as Y from 'yjs';
import { connectWS } from './wsClient.js';

(async () => {
  const fabricModule = await import('fabric');
  const fabric = fabricModule.fabric || fabricModule;

  // Fabric canvas
  const canvas = new fabric.Canvas('canvas', { isDrawingMode: true });

  // Explicitly create and set the drawing brush
  const brush = new fabric.PencilBrush(canvas);
  brush.width = 4;
  brush.color = '#000';
  canvas.freeDrawingBrush = brush;

  // Yjs doc and shared map
  const doc = new Y.Doc();
  const ymap = doc.getMap('drawing');

  // Whenever the Yjs map changes, update Fabric canvas
  ymap.observe(() => {
    const json = ymap.get('canvas');
    if (json) {
      canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
    }
  });

  // Whenever user draws, update Yjs
  canvas.on('path:created', () => {
    const json = canvas.toJSON();
    ymap.set('canvas', json);
  });

  // Connect to backend (room 'test')
  connectWS(doc, 'test').then(ws => {
    const statusEl = document.getElementById('status');
    ws.addEventListener('open', () => {
      statusEl.textContent = 'Connected';
      statusEl.style.color = 'green';
    });
    ws.addEventListener('close', () => {
      statusEl.textContent = 'Disconnected';
      statusEl.style.color = 'red';
    });
    ws.addEventListener('error', () => {
      statusEl.textContent = 'Error';
      statusEl.style.color = 'orange';
    });
  });
})();
