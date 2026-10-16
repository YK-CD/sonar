/* sonar — bootstrap */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const audio = $('#audio');
  const statusEl = $('#status');
  const clockEl = $('#clock');
  const countEl = $('#track-count');
  const playlistHint = $('#playlist-hint');
  const nowHint = $('#now-hint');
  const titleEl = $('#track-title');
  const metaEl = $('#track-meta');
  const seekEl = $('#seek');
  const timeCur = $('#time-cur');
  const timeDur = $('#time-dur');
  const volumeEl = $('#volume');
  const volValue = $('#vol-value');
  const btnPlay = $('#btn-play');
  const btnPrev = $('#btn-prev');
  const btnNext = $('#btn-next');
  const btnFiles = $('#btn-add-files');
  const btnFolder = $('#btn-add-folder');
  const btnClear = $('#btn-clear');
  const fileInput = $('#file-input');
  const folderInput = $('#folder-input');

  let tracks = [];
  let seeking = false;

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function setCount() {
    countEl.textContent = '[' + tracks.length + ']';
    playlistHint.textContent = tracks.length
      ? tracks.length + ' faixa(s) na biblioteca'
      : 'aguardando entrada de áudio';
  }

  async function refreshPlaylist() {
    tracks = await window.SonarDB.getAll();
    tracks.sort((a, b) => a.addedAt - b.addedAt);
    window.SonarPlayer.setTracks(tracks);
    window.SonarPlaylist.render(tracks, window.SonarPlayer.currentIndex());
    setCount();
  }

  function updatePlayBtn() {
    btnPlay.textContent = window.SonarPlayer.isPaused() ? '▶' : '❚❚';
  }

  async function handleImport(input) {
    const files = input.files;
    if (!files || !files.length) return;
    setStatus('importando ' + files.length + ' arquivo(s)...');
    try {
      const result = await window.SonarImporter.importFiles(files, tracks, setStatus);
      await refreshPlaylist();
      let msg = result.added + ' adicionada(s)';
      if (result.skipped) msg += ', ' + result.skipped + ' duplicada(s) ignorada(s)';
      setStatus(msg);
      if (window.SonarPlayer.currentIndex() === -1 && tracks.length) {
        window.SonarPlayer.load(0, false);
      }
    } catch (e) {
      console.error(e);
      setStatus('erro ao importar: ' + (e && e.message ? e.message : e));
    }
    input.value = '';
  }

  function wire() {
    btnFiles.addEventListener('click', () => fileInput.click());
    btnFolder.addEventListener('click', () => folderInput.click());
    fileInput.addEventListener('change', () => handleImport(fileInput));
    folderInput.addEventListener('change', () => handleImport(folderInput));

    btnClear.addEventListener('click', async () => {
      if (!tracks.length) return;
      if (!confirm('Remover todas as músicas da biblioteca?')) return;
      window.SonarPlayer.stop();
      window.SonarPlayer.revokeAll();
      await window.SonarDB.clear();
      window.SonarCover.clear();
      titleEl.textContent = '— nada tocando —';
      metaEl.textContent = '';
      timeCur.textContent = '0:00';
      timeDur.textContent = '0:00';
      seekEl.value = '0';
      await refreshPlaylist();
      setStatus('biblioteca limpa');
      updatePlayBtn();
    });

    btnPlay.addEventListener('click', () => window.SonarPlayer.toggle());
    btnNext.addEventListener('click', () => window.SonarPlayer.next());
    btnPrev.addEventListener('click', () => window.SonarPlayer.prev());

    seekEl.addEventListener('input', () => {
      seeking = true;
      const d = audio.duration || 0;
      const t = (Number(seekEl.value) / 1000) * d;
      timeCur.textContent = window.SonarPlaylist.fmtTime(t);
    });
    seekEl.addEventListener('change', () => {
      const d = audio.duration || 0;
      window.SonarPlayer.seek((Number(seekEl.value) / 1000) * d);
      seeking = false;
    });

    volumeEl.addEventListener('input', () => {
      const v = Number(volumeEl.value);
      window.SonarPlayer.setVolume(v);
      volValue.textContent = Math.round(v * 100) + '%';
      try {
        localStorage.setItem('sonar-volume', String(v));
      } catch (e) { /* ignore */ }
    });

    document.addEventListener('sonar:play-index', (e) => {
      window.SonarPlayer.load(e.detail.index, true);
    });

    window.SonarPlayer.on('trackChange', ({ track, index }) => {
      window.SonarPlaylist.highlight(index);
      if (!track) return;
      titleEl.textContent = track.title;
      const bits = [];
      if (track.duration) bits.push(window.SonarPlaylist.fmtTime(track.duration));
      if (track.fileName && track.fileName !== track.title) bits.push(track.fileName);
      metaEl.textContent = bits.join(' · ');
      timeDur.textContent = track.duration ? window.SonarPlaylist.fmtTime(track.duration) : '0:00';
      setStatus('tocando: ' + track.title);
      window.SonarCover.render(track.cover);
      updatePlayBtn();
    });

    window.SonarPlayer.on('state', () => {
      updatePlayBtn();
      setStatus(window.SonarPlayer.isPaused() ? 'pausado' : 'tocando');
      window.SonarViz.resume();
    });

    window.SonarPlayer.on('ended', () => {
      window.SonarPlayer.next();
    });

    audio.addEventListener('timeupdate', () => {
      if (seeking) return;
      const d = audio.duration || 0;
      const t = audio.currentTime || 0;
      timeCur.textContent = window.SonarPlaylist.fmtTime(t);
      seekEl.value = d ? String(Math.round((t / d) * 1000)) : '0';
    });

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        window.SonarPlayer.toggle();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        window.SonarPlayer.seek(audio.currentTime + 10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        window.SonarPlayer.seek(audio.currentTime - 10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        volumeEl.value = String(Math.min(1, Number(volumeEl.value) + 0.05));
        volumeEl.dispatchEvent(new Event('input'));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        volumeEl.value = String(Math.max(0, Number(volumeEl.value) - 0.05));
        volumeEl.dispatchEvent(new Event('input'));
      } else if (e.code === 'KeyN') {
        window.SonarPlayer.next();
      } else if (e.code === 'KeyP') {
        window.SonarPlayer.prev();
      }
    });
  }

  function tickClock() {
    const now = new Date();
    clockEl.textContent =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
  }

  async function boot() {
    window.SonarThemes.init();
    window.SonarCover.init($('#cover-ascii'));
    window.SonarPlaylist.init($('#playlist'));
    window.SonarPlayer.init(audio);
    window.SonarViz.init(audio, $('#visualizer'));

    let vol = 0.8;
    try {
      const saved = localStorage.getItem('sonar-volume');
      if (saved !== null) vol = Math.max(0, Math.min(1, Number(saved)));
    } catch (e) { /* ignore */ }
    volumeEl.value = String(vol);
    volValue.textContent = Math.round(vol * 100) + '%';
    window.SonarPlayer.setVolume(vol);

    wire();
    tickClock();
    setInterval(tickClock, 1000);

    setStatus('abrindo biblioteca...');
    const persisted = await window.SonarDB.open();
    await refreshPlaylist();
    if (!persisted) {
      setStatus('aviso: IndexedDB indisponível — biblioteca só nesta sessão');
    } else if (tracks.length) {
      setStatus(tracks.length + ' faixa(s) carregada(s)');
      window.SonarPlayer.load(0, false);
    } else {
      setStatus('pronto — adicione músicas para começar');
    }
    updatePlayBtn();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
