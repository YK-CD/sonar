/* sonar — temas de cor */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'sonar-theme';
  const THEMES = ['red', 'blue', 'yellow', 'green', 'purple'];
  const DEFAULT = 'green';

  let current = DEFAULT;

  function syncButtons() {
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-btn') === current);
    });
  }

  function apply(name) {
    if (!THEMES.includes(name)) name = DEFAULT;
    current = name;
    document.documentElement.setAttribute('data-theme', name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (e) { /* ignore */ }
    syncButtons();
    document.dispatchEvent(new CustomEvent('sonar:theme', { detail: { theme: name } }));
  }

  function init() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    apply(saved || DEFAULT);
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => apply(btn.getAttribute('data-theme-btn')));
    });
  }

  function getAccentRGB() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
    return raw || '95, 255, 135';
  }

  function currentTheme() {
    return current;
  }

  root.SonarThemes = { THEMES, init, apply, getAccentRGB, currentTheme };
})(window);
