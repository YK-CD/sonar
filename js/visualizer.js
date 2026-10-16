/* sonar — visualizador de barras (Web Audio API) */
(function (root) {
  'use strict';

  let audioEl = null;
  let canvas = null;
  let ctx = null;
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let data = null;
  let rafId = 0;
  let connected = false;

  function init(audio, node) {
    audioEl = audio;
    canvas = node;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    loop();
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(64 * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensureContext() {
    if (connected || !audioEl) return;
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source = audioCtx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      data = new Uint8Array(analyser.frequencyBinCount);
      connected = true;
    } catch (e) {
      connected = false;
    }
  }

  function resume() {
    ensureContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
  }

  function accent() {
    return window.SonarThemes.getAccentRGB() || '95,255,135';
  }

  function drawIdle(w, h) {
    ctx.strokeStyle = 'rgba(' + accent() + ',0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 2);
    ctx.lineTo(w, h - 2);
    ctx.stroke();
  }

  function drawActive(w, h) {
    analyser.getByteFrequencyData(data);
    const bins = 40;
    const step = Math.floor(data.length / bins);
    const gap = 2;
    const bw = (w - gap * (bins - 1)) / bins;
    const parts = accent().split(',').map((v) => parseInt(v, 10) || 0);
    for (let i = 0; i < bins; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j];
      const v = sum / step / 255;
      const bh = Math.max(2, v * (h - 4));
      const bright = 0.45 + 0.55 * v;
      const r = Math.min(255, Math.round(parts[0] * bright));
      const g = Math.min(255, Math.round(parts[1] * bright));
      const b = Math.min(255, Math.round(parts[2] * bright));
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(i * (bw + gap), h - bh - 1, bw, bh);
    }
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (!canvas || !ctx) return;
    const w = canvas.getBoundingClientRect().width;
    const h = 64;
    ctx.clearRect(0, 0, w, h);
    if (connected && analyser && audioEl && !audioEl.paused && !audioEl.ended) {
      drawActive(w, h);
    } else {
      drawIdle(w, h);
    }
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
  }

  root.SonarViz = { init, resume, destroy };
})(window);
