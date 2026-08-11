import { openDB } from 'idb';
import { Section, EmailSettings } from '@/types/priorities';

const DB_NAME = 'pv-local';
const STORE = 'handles';
const HANDLE_KEY = 'data-file';

export interface DataFile {
  sections: Section[];
  emailSettings?: EmailSettings;
  savedAt?: string;
}

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) { db.createObjectStore(STORE); }
  });
}

export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await getDB();
    return (await db.get(STORE, HANDLE_KEY)) ?? null;
  } catch { return null; }
}

export async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await getDB();
  await db.put(STORE, handle, HANDLE_KEY);
}

export async function verifyPermission(handle: FileSystemFileHandle, readWrite: boolean): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: readWrite ? 'readwrite' : 'read' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

export async function readFromHandle(handle: FileSystemFileHandle): Promise<DataFile> {
  const file = await handle.getFile();
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return { sections: parsed };
    return {
      sections: parsed.sections ?? [],
      emailSettings: parsed.emailSettings,
    };
  } catch { return { sections: [] }; }
}

export async function saveToHandle(handle: FileSystemFileHandle, data: DataFile): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2));
  await writable.close();
}

export async function pickNewFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'priorityviz-data.json',
      types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
    });
    return handle;
  } catch { return null; }
}

export async function pickOpenFile(): Promise<FileSystemFileHandle | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
    });
    return handle;
  } catch { return null; }
}
