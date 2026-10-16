/* sonar — persistência (IndexedDB com fallback em memória) */
(function (root) {
  'use strict';

  const DB_NAME = 'sonar-db';
  const DB_VERSION = 1;
  const STORE = 'tracks';

  let db = null;
  let memory = [];
  let memoryMode = false;

  function open() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        memoryMode = true;
        return resolve(false);
      }
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        memoryMode = true;
        return resolve(false);
      }
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => {
        db = req.result;
        resolve(true);
      };
      req.onerror = () => {
        memoryMode = true;
        resolve(false);
      };
      req.onblocked = () => {
        memoryMode = true;
        resolve(false);
      };
    });
  }

  function withStore(mode, fn) {
    return new Promise((resolve, reject) => {
      if (memoryMode || !db) return reject(new Error('modo memória'));
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function getAll() {
    if (memoryMode) return Promise.resolve(memory.slice());
    return withStore('readonly', (s) => s.getAll());
  }

  function add(track) {
    if (memoryMode) {
      const rec = Object.assign({}, track, { id: Date.now() + Math.random() });
      memory.push(rec);
      return Promise.resolve(rec.id);
    }
    return withStore('readwrite', (s) => s.add(track));
  }

  function remove(id) {
    if (memoryMode) {
      memory = memory.filter((t) => t.id !== id);
      return Promise.resolve();
    }
    return withStore('readwrite', (s) => s.delete(id));
  }

  function clear() {
    if (memoryMode) {
      memory = [];
      return Promise.resolve();
    }
    return withStore('readwrite', (s) => s.clear());
  }

  function isMemoryMode() {
    return memoryMode;
  }

  root.SonarDB = { open, getAll, add, remove, clear, isMemoryMode };
})(window);
