/* sonar — motor de reprodução */
(function (root) {
  'use strict';

  let audio = null;
  let tracks = [];
  let index = -1;
  let urls = new Map(); // trackId -> objectURL

  const listeners = {
    trackChange: [],
    ended: [],
    time: [],
    state: [],
  };

  function on(evt, fn) {
    if (listeners[evt]) listeners[evt].push(fn);
  }

  function emit(evt, arg) {
    listeners[evt].forEach((fn) => fn(arg));
  }

  function init(audioEl) {
    audio = audioEl;
    audio.addEventListener('timeupdate', () => emit('time', audio.currentTime));
    audio.addEventListener('ended', () => emit('ended'));
    audio.addEventListener('play', () => emit('state'));
    audio.addEventListener('pause', () => emit('state'));
  }

  function setTracks(list) {
    tracks = list;
    if (index >= tracks.length) index = tracks.length - 1;
  }

  function urlFor(track) {
    if (!urls.has(track.id)) {
      urls.set(track.id, URL.createObjectURL(track.blob));
    }
    return urls.get(track.id);
  }

  function currentIndex() {
    return index;
  }

  function currentTrack() {
    return index >= 0 && index < tracks.length ? tracks[index] : null;
  }

  function load(i, autoplay) {
    if (i < 0 || i >= tracks.length) return;
    index = i;
    const track = tracks[i];
    audio.src = urlFor(track);
    emit('trackChange', { track, index: i });
    if (autoplay) {
      audio.play().catch(() => { });
    }
  }

  function toggle() {
    if (!audio.src) {
      if (tracks.length) load(0, true);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => { });
    } else {
      audio.pause();
    }
  }

  function next() {
    if (!tracks.length) return;
    load((index + 1) % tracks.length, true);
  }

  function prev() {
    if (!tracks.length) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    load((index - 1 + tracks.length) % tracks.length, true);
  }

  function seek(seconds) {
    if (!audio.src || !isFinite(seconds)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seconds));
  }

  function setVolume(v) {
    audio.volume = Math.max(0, Math.min(1, v));
  }

  function isPaused() {
    return audio.paused;
  }

  function stop() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    index = -1;
    emit('trackChange', { track: null, index: -1 });
  }

  function revokeAll() {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.clear();
  }

  root.SonarPlayer = {
    init, on, setTracks, load, toggle, next, prev, seek,
    setVolume, isPaused, currentTrack, currentIndex, stop, revokeAll,
  };
})(window);
