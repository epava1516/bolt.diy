import { atom } from 'nanostores';

export interface AuthState {
  isAuthenticated: boolean;
  username?: string;
}

export const authStore = atom<AuthState>({ isAuthenticated: false });

async function loadSession() {
  try {
    const res = await fetch('/api/session');

    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as {
      isAuthenticated: boolean;
      username?: string;
    };

    if (data.isAuthenticated) {
      authStore.set({ isAuthenticated: true, username: data.username });
    }
  } catch (e) {
    console.error('Failed to load session', e);
  }
}

// Automatically load session on startup
loadSession();

export async function login(username: string, password: string) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error('Login failed');
    }

    const data = (await res.json()) as { username: string };
    authStore.set({ isAuthenticated: true, username: data.username });
  } catch (e) {
    console.error('Failed to login', e);
  }
}

export async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {
    console.error('Failed to logout', e);
  } finally {
    authStore.set({ isAuthenticated: false });
  }
}
