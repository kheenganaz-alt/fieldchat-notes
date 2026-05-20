import type {
  ExportRecord,
  FieldSession,
  Note,
  PhotoRecord,
  RoutePlan,
  RouteStop,
  TimestampEvent,
  UserProfile,
  UserSettings
} from "../types";

type StoreName =
  | "users"
  | "sessions"
  | "notes"
  | "timestamps"
  | "routes"
  | "stops"
  | "exports"
  | "settings"
  | "photos"
  | "meta";

export interface DbShape {
  users: UserProfile;
  sessions: FieldSession;
  notes: Note;
  timestamps: TimestampEvent;
  routes: RoutePlan;
  stops: RouteStop;
  exports: ExportRecord;
  settings: UserSettings;
  photos: PhotoRecord;
  meta: { id: string; value: unknown };
}

const dbName = "fieldchat-notes";
const dbVersion = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      const stores: StoreName[] = ["users", "sessions", "notes", "timestamps", "routes", "stops", "exports", "settings", "photos", "meta"];
      stores.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          if (name !== "meta" && name !== "users") {
            store.createIndex("userId", "userId", { unique: false });
          }
          if (["notes", "timestamps", "photos"].includes(name)) {
            store.createIndex("sessionId", "sessionId", { unique: false });
          }
          if (name === "stops") {
            store.createIndex("routeId", "routeId", { unique: false });
          }
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function tx<T>(storeName: StoreName, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function putRecord<K extends StoreName>(store: K, value: DbShape[K]) {
  await tx(store, "readwrite", (objectStore) => objectStore.put(value));
  return value;
}

export async function putRecords<K extends StoreName>(store: K, values: DbShape[K][]) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    values.forEach((value) => objectStore.put(value));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getRecord<K extends StoreName>(store: K, id: string) {
  return tx<DbShape[K]>(store, "readonly", (objectStore) => objectStore.get(id));
}

export async function deleteRecord(store: StoreName, id: string) {
  await tx(store, "readwrite", (objectStore) => objectStore.delete(id));
}

export async function getAll<K extends StoreName>(store: K) {
  return (await tx<DbShape[K][]>(store, "readonly", (objectStore) => objectStore.getAll())) ?? [];
}

export async function getByUser<K extends Exclude<StoreName, "meta" | "users">>(store: K, userId: string) {
  const db = await openDb();
  return new Promise<DbShape[K][]>((resolve, reject) => {
    const transaction = db.transaction(store, "readonly");
    const index = transaction.objectStore(store).index("userId");
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result as DbShape[K][]);
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex<K extends StoreName>(store: K, indexName: string, value: string) {
  const db = await openDb();
  return new Promise<DbShape[K][]>((resolve, reject) => {
    const transaction = db.transaction(store, "readonly");
    const index = transaction.objectStore(store).index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result as DbShape[K][]);
    request.onerror = () => reject(request.error);
  });
}
