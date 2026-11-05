// Offline storage (architecture §9.3): IndexedDB with four stores, behind a small key-value
// interface so tests and browsers without IndexedDB use the in-memory variant.
//   device          client_device_id and, per user, the server's device_id
//   active_session  head of the running session, last nonce, pending request, start Idempotency-Key
//   outbox          events and buffered heartbeats per session, in order
//   cache           last squad and balance data for the offline view

export const STORE_NAMES = ['device', 'active_session', 'outbox', 'cache'] as const;
export type StoreName = (typeof STORE_NAMES)[number];

export interface KvStore {
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  put(store: StoreName, key: string, value: unknown): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  /** Entries whose key starts with `prefix`, sorted by key. */
  list<T>(store: StoreName, prefix?: string): Promise<{ key: string; value: T }[]>;
  clear(store: StoreName): Promise<void>;
}

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

export function createMemoryStore(): KvStore {
  const data = new Map<StoreName, Map<string, unknown>>(STORE_NAMES.map((s) => [s, new Map()]));
  const of = (s: StoreName) => data.get(s) as Map<string, unknown>;
  return {
    get: async <T,>(s: StoreName, k: string) => clone(of(s).get(k)) as T | undefined,
    put: async (s, k, v) => void of(s).set(k, clone(v)),
    delete: async (s, k) => void of(s).delete(k),
    list: async <T,>(s: StoreName, prefix = '') =>
      [...of(s).entries()]
        .filter(([k]) => k.startsWith(prefix))
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, value]) => ({ key, value: clone(value) as T })),
    clear: async (s) => void of(s).clear(),
  };
}

const DB_NAME = 'rewarded';
const DB_VERSION = 1;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = factory.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      for (const s of STORE_NAMES) if (!open.result.objectStoreNames.contains(s)) open.result.createObjectStore(s);
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('indexeddb_blocked'));
  });
}

/** IndexedDB store; falls back to memory when IndexedDB is missing or refuses to open. */
export function createIdbStore(factory: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB): KvStore {
  if (!factory) return createMemoryStore();
  const memory = createMemoryStore();
  const dbp: Promise<IDBDatabase | null> = openDb(factory).catch(() => null);
  const tx = async <T,>(store: StoreName, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>, fallback: () => Promise<T>): Promise<T> => {
    const db = await dbp;
    if (!db) return fallback();
    return req(run(db.transaction(store, mode).objectStore(store)));
  };
  return {
    get: <T,>(s: StoreName, k: string) => tx<T | undefined>(s, 'readonly', (o) => o.get(k) as IDBRequest<T | undefined>, () => memory.get<T>(s, k)),
    put: async (s, k, v) => {
      await tx(s, 'readwrite', (o) => o.put(clone(v), k), () => memory.put(s, k, v).then(() => k));
    },
    delete: async (s, k) => {
      await tx<unknown>(s, 'readwrite', (o) => o.delete(k) as IDBRequest<unknown>, () => memory.delete(s, k));
    },
    list: async <T,>(s: StoreName, prefix = '') => {
      const db = await dbp;
      if (!db) return memory.list<T>(s, prefix);
      const store = db.transaction(s, 'readonly').objectStore(s);
      const range = prefix ? IDBKeyRange.bound(prefix, `${prefix}￿`) : undefined;
      const [keys, values] = await Promise.all([req(store.getAllKeys(range)), req(store.getAll(range))]);
      return keys.map((key, i) => ({ key: String(key), value: values[i] as T })).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    },
    clear: async (s) => {
      await tx<unknown>(s, 'readwrite', (o) => o.clear() as IDBRequest<unknown>, () => memory.clear(s));
    },
  };
}

/** Asks the browser to keep our storage (after the first completed session, §9.3). */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
