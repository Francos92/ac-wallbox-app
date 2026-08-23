// Persistenza locale (IndexedDB) — funziona offline, sopravvive alla chiusura
// accidentale dell'app. Tre magazzini: drafts (lavoro in corso, autosalvato),
// archive (protocolli conclusi con il PDF già generato), profile (dati
// riutilizzabili: Prüfer, Messgerät, Adapter).

const DB_NAME = 'brabaPrueftoolDB';
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('archive')) {
        const archive = db.createObjectStore('archive', { keyPath: 'id' });
        archive.createIndex('moduleType', 'moduleType', { unique: false });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('equipment')) {
        db.createObjectStore('equipment', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('wallboxListe')) {
        db.createObjectStore('wallboxListe', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---- Drafts (lavoro in corso) -------------------------------------------

export async function saveDraft(draft) {
  const db = await openDB();
  const toSave = { ...draft, updatedAt: new Date().toISOString() };
  await tx(db, 'drafts', 'readwrite', (store) => store.put(toSave));
  return toSave;
}

export async function getActiveDraft(moduleType) {
  const db = await openDB();
  const all = await tx(db, 'drafts', 'readonly', (store) => store.getAll());
  const candidates = all.filter((d) => d.moduleType === moduleType);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return candidates[0];
}

export async function deleteDraft(id) {
  const db = await openDB();
  await tx(db, 'drafts', 'readwrite', (store) => store.delete(id));
}

// ---- Archive (protocolli conclusi) --------------------------------------

export async function saveArchiveEntry(entry) {
  const db = await openDB();
  const toSave = { ...entry, savedAt: new Date().toISOString() };
  await tx(db, 'archive', 'readwrite', (store) => store.put(toSave));
  return toSave;
}

export async function listArchive(moduleType) {
  const db = await openDB();
  const all = await tx(db, 'archive', 'readonly', (store) => store.getAll());
  const filtered = moduleType ? all.filter((e) => e.moduleType === moduleType) : all;
  return filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

export async function deleteArchiveEntry(id) {
  const db = await openDB();
  await tx(db, 'archive', 'readwrite', (store) => store.delete(id));
}

// ---- Profile (Prüfer / Messgerät / Adapter di default) ------------------

const PROFILE_KEY = 'default';

export async function getProfile() {
  const db = await openDB();
  const result = await tx(db, 'profile', 'readonly', (store) => store.get(PROFILE_KEY));
  return result || null;
}

export async function saveProfile(profile) {
  const db = await openDB();
  const toSave = { key: PROFILE_KEY, ...profile };
  await tx(db, 'profile', 'readwrite', (store) => store.put(toSave));
  return toSave;
}

// ---- Equipment (Ladestation-Vorlagen zur Wiederverwendung) --------------

export async function listEquipment() {
  const db = await openDB();
  return tx(db, 'equipment', 'readonly', (store) => store.getAll());
}

export async function saveEquipment(item) {
  const db = await openDB();
  await tx(db, 'equipment', 'readwrite', (store) => store.put(item));
}

export async function deleteEquipment(id) {
  const db = await openDB();
  await tx(db, 'equipment', 'readwrite', (store) => store.delete(id));
}

// ---- Wallbox-Liste (aus Excel importierte Prüfliste, monatlich ersetzt) ---

const WALLBOX_LISTE_KEY = 'current';

export async function saveWallboxListe(rows) {
  const db = await openDB();
  const record = { key: WALLBOX_LISTE_KEY, rows, loadedAt: new Date().toISOString() };
  await tx(db, 'wallboxListe', 'readwrite', (store) => store.put(record));
  return record;
}

export async function getWallboxListe() {
  const db = await openDB();
  const result = await tx(db, 'wallboxListe', 'readonly', (store) => store.get(WALLBOX_LISTE_KEY));
  return result || null;
}
