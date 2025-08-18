import * as Y from 'yjs';
import { connectWS } from './wsClient.js';

(async () => {
  // Load Fabric (Vite/ESM friendly)
  const fabricModule = await import('fabric');
  const fabric = fabricModule.fabric || fabricModule;

  // ---- 1) Fabric setup ----
  const canvas = new fabric.Canvas('canvas', { isDrawingMode: true });

  // ---- Assign random color per user ----
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  console.log('[User] Assigned color:', userColor);

  const brush = new fabric.PencilBrush(canvas);
  brush.width = 4;
  brush.color = userColor;
  canvas.freeDrawingBrush = brush;

  // ---- 2) Yjs doc + strokes array ----
  const doc = new Y.Doc();
  const strokes = doc.getArray('strokes'); // append-only log of strokes

  // Helper: add a single stroke object to canvas
  function addStrokeToCanvas(strokeObj) {
    // Expecting { type: 'path', path: [...], stroke, strokeWidth, left, top, ... }
    const { path, type, ...opts } = strokeObj;
    if (!path) return;
    const pathObj = new fabric.Path(path, opts);
    canvas.add(pathObj);
    canvas.renderAll();
  }

  // ---- 3) Initial render (existing strokes) ----
  // In case the room already has data when we join.
  for (const s of strokes.toArray()) {
    addStrokeToCanvas(s);
  }

  // ---- 4) React to remote inserts only ----
  strokes.observe(event => {
    // If this transaction was created locally, skip (we already drew it)
    if (event.transaction.origin === 'local') return;

    // Walk the delta to find inserted strokes
    event.changes.delta.forEach(d => {
      if (d.insert) {
        for (const s of d.insert) {
          addStrokeToCanvas(s);
        }
      }
      // We’re not handling delete/retain yet; that’ll come with undo/eraser.
    });
  });

  // ---- 5) On local stroke finish, append to Y.Array ----
  canvas.on('path:created', (e) => {
    // Fabric 6: the created object is e.path (fallback to e.target)
    const obj = e.path || e.target;
    if (!obj) return;

    // Minimal, portable JSON for this path
    const strokeJson = obj.toObject([
      'path', 'stroke', 'strokeWidth', 'fill',
      'left', 'top', 'scaleX', 'scaleY',
      'skewX', 'skewY', 'flipX', 'flipY',
      'originX', 'originY', 'angle', 'opacity', 'visible'
    ]);
    strokeJson.type = 'path';

    // Use a transaction with origin='local' so our observer can ignore it
    doc.transact(() => {
      strokes.push([strokeJson]);
    }, 'local');
  });

  // ---- 6) Connect to backend (same as before) ----
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
