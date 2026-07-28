(function () {
  'use strict';

  const DB_NAME = 'xiaoturing-academy-notes';
  const DB_VERSION = 1;
  const STORE_NAME = 'notes';
  const SCHEMA = 'xiaoturing-academy-notes';
  const EXPORT_VERSION = 1;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('本地笔记读写失败'));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('本地笔记事务失败'));
      transaction.onabort = () => reject(transaction.error || new Error('本地笔记事务已取消'));
    });
  }

  let dbPromise;
  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('当前浏览器不支持本地笔记存储'));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          const store = db.objectStoreNames.contains(STORE_NAME)
            ? request.transaction.objectStore(STORE_NAME)
            : db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          if (!store.indexNames.contains('courseId')) store.createIndex('courseId', 'courseId', { unique: false });
          if (!store.indexNames.contains('updatedAt')) store.createIndex('updatedAt', 'updatedAt', { unique: false });
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => db.close();
          resolve(db);
        };
        request.onerror = () => reject(request.error || new Error('无法打开本地笔记'));
        request.onblocked = () => reject(new Error('请关闭其他课程页后重试'));
      });
    }
    return dbPromise;
  }

  function withStore(mode, callback) {
    return openDatabase().then(async db => {
      const transaction = db.transaction(STORE_NAME, mode);
      const done = transactionDone(transaction);
      const result = await callback(transaction.objectStore(STORE_NAME), transaction);
      await done;
      return result;
    });
  }

  function all() {
    return withStore('readonly', store => requestResult(store.getAll()))
      .then(notes => notes.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt)));
  }

  function get(id) {
    return withStore('readonly', store => requestResult(store.get(id)));
  }

  function put(note) {
    return withStore('readwrite', store => requestResult(store.put(note))).then(() => note);
  }

  function remove(id) {
    return withStore('readwrite', store => requestResult(store.delete(id)));
  }

  function anchorKey(note) {
    return [note.courseId, note.blockId, note.exact, note.prefix, note.suffix].join('\u241f');
  }

  function validateNote(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const stringFields = ['id', 'courseId', 'courseTitle', 'route', 'blockId', 'exact', 'prefix', 'suffix', 'thought'];
    if (stringFields.some(key => typeof value[key] !== 'string')) return null;
    if (!value.id || !value.courseId || !value.route || !value.blockId || !value.exact.trim()) return null;
    if (value.exact.length > 10000 || value.thought.length > 100000 || value.prefix.length > 200 || value.suffix.length > 200) return null;
    const numberFields = ['startHint', 'endHint', 'createdAt', 'updatedAt'];
    if (numberFields.some(key => !Number.isFinite(Number(value[key])))) return null;
    const startHint = Math.max(0, Number(value.startHint));
    const endHint = Math.max(startHint, Number(value.endHint));
    const createdAt = Number(value.createdAt);
    const updatedAt = Number(value.updatedAt);
    if (createdAt <= 0 || updatedAt <= 0) return null;
    return {
      id: value.id.slice(0, 200),
      courseId: value.courseId.slice(0, 200),
      courseTitle: value.courseTitle.slice(0, 500),
      route: value.route.slice(0, 500),
      blockId: value.blockId.slice(0, 500),
      exact: value.exact,
      prefix: value.prefix,
      suffix: value.suffix,
      thought: value.thought,
      startHint,
      endHint,
      createdAt,
      updatedAt
    };
  }

  function validateImport(payload) {
    if (!payload || payload.schema !== SCHEMA || payload.version !== EXPORT_VERSION || !Array.isArray(payload.notes)) {
      throw new Error('这不是小图灵笔记导出文件，或版本不受支持');
    }
    if (payload.notes.length > 10000) throw new Error('导入文件里的笔记数量异常');
    const notes = payload.notes.map(validateNote);
    if (notes.some(note => !note)) throw new Error('导入文件包含损坏或不安全的笔记字段');
    return notes;
  }

  async function importPayload(payload) {
    const incoming = validateImport(payload);
    const existing = await all();
    const ids = new Set(existing.map(note => note.id));
    const anchors = new Set(existing.map(anchorKey));
    const additions = [];
    for (const note of incoming) {
      const key = anchorKey(note);
      if (ids.has(note.id) || anchors.has(key)) continue;
      ids.add(note.id);
      anchors.add(key);
      additions.push(note);
    }
    if (!additions.length) return { added: 0, skipped: incoming.length };
    await withStore('readwrite', store => {
      additions.forEach(note => store.add(note));
      return Promise.resolve();
    });
    return { added: additions.length, skipped: incoming.length - additions.length };
  }

  function exportPayload(notes) {
    return {
      schema: SCHEMA,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      notes
    };
  }

  window.AcademyNotesStore = {
    DB_NAME,
    SCHEMA,
    EXPORT_VERSION,
    all,
    get,
    put,
    remove,
    importPayload,
    exportPayload,
    validateImport
  };
})();
