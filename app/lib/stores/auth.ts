import { atom } from 'nanostores';
import { openDatabase, saveSession, getSession, deleteSession } from '~/lib/persistence/db';

export interface AuthState {
  isAuthenticated: boolean;
  username?: string;
}

export const authStore = atom<AuthState>({ isAuthenticated: false });

// Load session from IndexedDB on startup
openDatabase()
  .then(async (db) => {
    if (!db) {
      return;
    }

    try {
      const session = await getSession(db);

      if (session) {
        authStore.set({ isAuthenticated: true, username: session.username });
      }
    } catch (e) {
      console.error('Failed to load session', e);
    }
  })
  .catch((e) => console.error('Failed to open DB for auth', e));

export async function login(username: string, _password: string) {
  // A real app would verify credentials server-side
  const newState = { isAuthenticated: true, username };
  authStore.set(newState);

  const db = await openDatabase();

  if (db) {
    try {
      await saveSession(db, crypto.randomUUID(), username);
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }
}

export async function logout() {
  authStore.set({ isAuthenticated: false });

  const db = await openDatabase();

  if (db) {
    try {
      await deleteSession(db);
    } catch (e) {
      console.error('Failed to delete session', e);
    }
  }
}
