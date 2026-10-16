/* sonar — render da playlist */
(function (root) {
  'use strict';

  const EMPTY_STATE =
    '[ biblioteca vazia ]\n' +
    '> adicione arquivos avulsos\n' +
    '  ou pastas inteiras\n' +
    '> [+ ARQUIVO]  [+ PASTA]';

  let el = null;
  let tracks = [];
  let currentId = null;

  function init(node) {
    el = node;
    renderEmpty();
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderEmpty() {
    el.innerHTML = '<li class="empty">' + EMPTY_STATE + '</li>';
  }

  function render(list, activeIndex) {
    tracks = list;
    if (!tracks.length) {
      renderEmpty();
      return;
    }
    el.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.dataset.index = String(i);
      if (i === activeIndex) li.classList.add('current');

      const marker = document.createElement('span');
      marker.className = 'marker';
      marker.textContent = i === activeIndex ? '►' : ' ';

      const idx = document.createElement('span');
      idx.className = 'idx';
      idx.textContent = String(i + 1).padStart(2, '0');

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = t.title;

      const dur = document.createElement('span');
      dur.className = 'dur';
      dur.textContent = t.duration ? fmtTime(t.duration) : '--:--';

      li.append(marker, idx, title, dur);
      li.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('sonar:play-index', { detail: { index: i } }));
      });
      el.appendChild(li);
    });
  }

  function highlight(activeIndex) {
    const items = el.querySelectorAll('li[data-index]');
    items.forEach((li) => {
      const isActive = Number(li.dataset.index) === activeIndex;
      li.classList.toggle('current', isActive);
      const marker = li.querySelector('.marker');
      if (marker) marker.textContent = isActive ? '►' : ' ';
    });
    const active = el.querySelector('li.current');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  root.SonarPlaylist = { init, render, highlight, renderEmpty, fmtTime };
})(window);
