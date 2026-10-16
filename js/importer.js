/* sonar — importação de arquivos e pastas */
(function (root) {
  'use strict';

  const AUDIO_EXT = ['mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus', 'weba', 'webm', 'mp4', 'mka'];

  function extOf(name) {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
  }

  function isAudio(file) {
    if (file.type && file.type.startsWith('audio/')) return true;
    return AUDIO_EXT.includes(extOf(file.name));
  }

  function cleanTitle(fileName) {
    let t = fileName.replace(/\.[^.]+$/, '');
    t = t.replace(/^\s*\d{1,3}\s*[-._)]\s*/, ''); // "01 - " / "01."
    return t.trim() || fileName;
  }

  function getDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const a = new Audio();
      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        resolve(val);
      };
      const timer = setTimeout(() => finish(0), 12000);
      a.preload = 'metadata';
      a.onloadedmetadata = () => {
        clearTimeout(timer);
        finish(isFinite(a.duration) ? a.duration : 0);
      };
      a.onerror = () => {
        clearTimeout(timer);
        finish(0);
      };
      a.src = url;
    });
  }

  function getCover(file) {
    return new Promise((resolve) => {
      if (!root.jsmediatags) return resolve(null);
      try {
        root.jsmediatags.read(file, {
          onSuccess: (tag) => {
            const pic = tag && tag.tags && tag.tags.picture;
            if (!pic || !pic.data || !pic.data.length) return resolve(null);
            let mime = pic.format || 'image/jpeg';
            if (mime === 'jpeg') mime = 'image/jpeg';
            if (!mime.startsWith('image/')) mime = 'image/' + mime;
            const bytes = new Uint8Array(pic.data);
            resolve(new Blob([bytes], { type: mime }));
          },
          onError: () => resolve(null),
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function importFiles(fileList, existing, onProgress) {
    const files = Array.from(fileList).filter(isAudio);
    const seen = new Set(existing.map((t) => t.fileName + '::' + t.size));
    let added = 0;
    let skipped = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const key = file.name + '::' + file.size;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      if (onProgress) {
        onProgress('lendo ' + (i + 1) + '/' + files.length + ' — ' + file.name);
      }
      const [duration, cover] = await Promise.all([getDuration(file), getCover(file)]);
      await window.SonarDB.add({
        title: cleanTitle(file.name),
        fileName: file.name,
        size: file.size,
        duration: duration || 0,
        blob: file,
        cover: cover || null,
        addedAt: Date.now(),
      });
      seen.add(key);
      added++;
    }

    return { added, skipped, total: files.length };
  }

  root.SonarImporter = { isAudio, importFiles, getCover, getDuration, cleanTitle };
})(window);
