// IndexedDB 本地数据库封装
// 数据完全保存在浏览器本地，不上传任何服务器，离线可用。
//
// 数据模型：
//  diaries: { id, date:"YYYY-MM-DD", content, tagIds:[], createdAt, updatedAt }
//  tags:    { id, name }

let db = null;
const DB_NAME = "WeekDiaryDB";
const DB_VERSION = 1;

export function initDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("diaries")) {
        const store = d.createObjectStore("diaries", { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
      }
      if (!d.objectStoreNames.contains("tags")) {
        d.createObjectStore("tags", { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

// 读操作包装
function wrapRead(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 写操作包装（一次性事务里完成所有 put/add/delete）
function runWrite(storeName, mutate) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    mutate(tx.objectStore(storeName));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============ 日记 CRUD ============

export function addDiary(diary) {
  return runWrite("diaries", (store) => store.add(diary));
}

export function putDiary(diary) {
  return runWrite("diaries", (store) => store.put(diary));
}

export function getDiary(id) {
  const tx = db.transaction("diaries");
  return wrapRead(tx.objectStore("diaries").get(id));
}

export function deleteDiary(id) {
  return runWrite("diaries", (store) => store.delete(id));
}

export function getDiaryByDate(dateStr) {
  const tx = db.transaction("diaries");
  const index = tx.objectStore("diaries").index("date");
  return wrapRead(index.getAll(dateStr));
}

export function getAllDiaries() {
  const tx = db.transaction("diaries");
  return wrapRead(tx.objectStore("diaries").getAll());
}

// ============ 标签 CRUD ============

export function addTag(tag) {
  return runWrite("tags", (store) => store.add(tag));
}

export function putTag(tag) {
  return runWrite("tags", (store) => store.put(tag));
}

export function deleteTag(tagId) {
  return runWrite("tags", (store) => store.delete(tagId));
}

export function getAllTags() {
  const tx = db.transaction("tags");
  return wrapRead(tx.objectStore("tags").getAll());
}

// ============ 备份导出 ============

export async function exportAllData() {
  const diaries = await getAllDiaries();
  const tags = await getAllTags();
  return {
    version: 1,
    exportTime: new Date().toISOString(),
    diaries,
    tags
  };
}

// ============ 备份导入（合并模式，按 id 覆盖/新增，不清空本地） ============

export async function importAllData(backupData) {
  const diaries = backupData.diaries || [];
  const tags = backupData.tags || [];
  if (diaries.length) {
    await runWrite("diaries", (store) => diaries.forEach((d) => store.put(d)));
  }
  if (tags.length) {
    await runWrite("tags", (store) => tags.forEach((t) => store.put(t)));
  }
  return { diaryCount: diaries.length, tagCount: tags.length };
}
