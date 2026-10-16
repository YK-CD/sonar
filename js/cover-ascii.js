/* sonar — capa em ASCII */
(function (root) {
  'use strict';

  const COLS = 60;
  const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const PLACEHOLDER =
    '┌────────────────────────┐\n' +
    '│                        │\n' +
    '│      [ SEM CAPA ]      │\n' +
    '│                        │\n' +
    '└────────────────────────┘';

  let el = null;
  let lastGrid = null; // { chars: [], w, h } para repintar no trocar de tema

  function init(node) {
    el = node;
    clear();
    document.addEventListener('sonar:theme', () => {
      if (lastGrid) paint(lastGrid);
    });
  }

  function clear() {
    lastGrid = null;
    if (el) el.innerHTML = '<span class="cover-inner">' + PLACEHOLDER + '</span>';
  }

  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function toGrid(img) {
    const w = COLS;
    const h = Math.max(10, Math.min(48, Math.round((img.height / img.width) * COLS * 0.5)));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const chars = [];
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3] / 255;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) * a;
      const idx = Math.min(RAMP.length - 1, Math.round((lum / 255) * (RAMP.length - 1)));
      chars.push({ ch: RAMP[idx], lum: lum / 255 });
    }
    return { chars, w, h };
  }

  function paint(grid) {
    if (!el) return;
    const [r, g, b] = (window.SonarThemes.getAccentRGB() || '95,255,135')
      .split(',')
      .map((v) => parseInt(v.trim(), 10) || 0);
    let html = '';
    for (let row = 0; row < grid.h; row++) {
      for (let col = 0; col < grid.w; col++) {
        const cell = grid.chars[row * grid.w + col];
        if (cell.ch === ' ') {
          html += ' ';
          continue;
        }
        const boost = 0.4 + 0.75 * cell.lum;
        const rr = Math.min(255, Math.round(r * boost));
        const gg = Math.min(255, Math.round(g * boost));
        const bb = Math.min(255, Math.round(b * boost));
        const esc = cell.ch === '<' ? '&lt;' : cell.ch === '>' ? '&gt;' : cell.ch === '&' ? '&amp;' : cell.ch;
        html += '<span style="color:rgb(' + rr + ',' + gg + ',' + bb + ')">' + esc + '</span>';
      }
      html += '\n';
    }
    el.innerHTML = '<span class="cover-inner">' + html + '</span>';
  }

  function render(coverBlob) {
    if (!coverBlob) {
      clear();
      return Promise.resolve();
    }
    return loadImage(coverBlob)
      .then((img) => {
        lastGrid = toGrid(img);
        paint(lastGrid);
      })
      .catch(() => {
        clear();
      });
  }

  root.SonarCover = { init, render, clear };
})(window);
