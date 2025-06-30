/* src/lib/stores/auth.ts */
import { atom } from 'nanostores';
import type { AuthState } from '~/lib/stores/auth';

export interface AuthState {
  isAuthenticated: boolean;
  username?: string;
}

export const authStore = atom<AuthState>({ isAuthenticated: false });

// Carga la sesión desde el API al iniciar la app
async function initSession() {
  try {
    const res = await fetch('/api/session');
    if (res.ok) {
      const data = await res.json() as AuthState;
      authStore.set(data);
    }
  } catch (e) {
    console.error('Failed to load session', e);
  }
}

initSession();

// Login contra el endpoint API
export async function login(username: string, password: string) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json() as AuthState;
    authStore.set(data);
  } catch (e) {
    console.error('Failed to login', e);
    throw e;
  }
}

// Logout contra el endpoint API
export async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {
    console.error('Failed to logout', e);
  } finally {
    authStore.set({ isAuthenticated: false });
  }
}


/* src/lib/server/session.server.ts */
import { Pool } from 'pg';
import { createCookie } from 'remix';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sessionCookie = createCookie('sessionId', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

export async function getSession(request: Request) {
  const cookieHeader = request.headers.get('Cookie');
  const cookie = await sessionCookie.parse(cookieHeader);
  if (!cookie) return null;
  const { rows } = await pool.query('SELECT session_id, username FROM sessions WHERE session_id = $1', [cookie]);
  if (rows.length === 0) return null;
  return { sessionId: rows[0].session_id, username: rows[0].username };
}

export async function createSession(username: string) {
  const sessionId = crypto.randomUUID();
  await pool.query('INSERT INTO sessions(session_id, username) VALUES($1, $2)', [sessionId, username]);
  return sessionId;
}

export async function destroySession(request: Request) {
  const cookieHeader = request.headers.get('Cookie');
  const cookie = await sessionCookie.parse(cookieHeader);
  if (cookie) {
    await pool.query('DELETE FROM sessions WHERE session_id = $1', [cookie]);
  }
}

export { sessionCookie };

/* app/routes/api.login.ts */
import { json } from '@remix-run/cloudflare';
import type { ActionFunction } from '@remix-run/cloudflare';
import { createSession, sessionCookie } from '~/lib/server/session.server';

export const action: ActionFunction = async ({ request }) => {
  const { username, password } = await request.json();
  // aquí validas contra tu sistema de usuarios
  if (password !== 'secret') {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const sessionId = await createSession(username);
  const headers = new Headers();
  headers.append('Set-Cookie', await sessionCookie.serialize(sessionId));
  return json({ isAuthenticated: true, username }, { headers });
};

/* app/routes/api.session.ts */
import { json } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/cloudflare';
import { getSession } from '~/lib/server/session.server';

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return json({ isAuthenticated: false });
  return json({ isAuthenticated: true, username: session.username });
};

/* app/routes/api.logout.ts */
import { json } from '@remix-run/cloudflare';
import type { ActionFunction } from '@remix-run/cloudflare';
import { destroySession, sessionCookie } from '~/lib/server/session.server';

export const action: ActionFunction = async ({ request }) => {
  await destroySession(request);
  const headers = new Headers();
  headers.append('Set-Cookie', await sessionCookie.serialize('', { maxAge: 0 }));
  return json({ isAuthenticated: false }, { headers });
};
