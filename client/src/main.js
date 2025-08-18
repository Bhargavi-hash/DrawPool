import * as Y from 'yjs';
import { connectWS } from './wsClient.js';

(async () => {
  const fabricModule = await import('fabric');
  const fabric = fabricModule.fabric || fabricModule;

  const canvas = new fabric.Canvas('canvas', { isDrawingMode: true });

  const brush = new fabric.PencilBrush(canvas);
  brush.width = 4;
  brush.color = '#000';
  canvas.freeDrawingBrush = brush;

  const doc = new Y.Doc();
  const ymap = doc.getMap('drawing');

  // --- Rebuild canvas when Yjs updates (from others) ---
  ymap.observe(event => {
    if (event.transaction.origin === 'local') {
      console.log('[Yjs] Skipping local update');
      return;
    }

    const json = ymap.get('canvas');
    if (!json) return;

    console.log('[Yjs] Update from others:', json);
    canvas.clear();

    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // Build each object manually (we only handle paths here)
    if (Array.isArray(data.objects)) {
      data.objects.forEach(obj => {
        if (obj.type === 'path' || obj.type === 'Path') {
          const path = new fabric.Path(obj.path, obj);
          canvas.add(path);
        } else {
          console.warn('[Fabric] Unknown type:', obj.type);
        }
      });
    }
    canvas.renderAll();
    console.log('[Fabric] Canvas rebuilt:', canvas.getObjects());
  });

  // --- When you draw, send to Yjs ---
  canvas.on('path:created', () => {
    console.log('[Fabric] Path created!');
    const json = JSON.parse(JSON.stringify(canvas.toObject(['path', 'stroke', 'strokeWidth', 'left', 'top', 'version'])));
    console.log('[Yjs] Sending JSON:', json);
    ymap.set('canvas', json, 'local');  // tag this as local
  });

  // --- Connect to backend ---
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
