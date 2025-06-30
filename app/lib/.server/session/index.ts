import { Pool } from 'pg';
import crypto from 'node:crypto';

let pool: Pool | undefined;
const memorySessions = new Map<string, { username: string; expiresAt: number }>();

function useMemory() {
  const url = process.env.DATABASE_URL;
  return !url || url === 'local';
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    pool = new Pool({ connectionString });
  }

  return pool;
}

export async function init() {
  if (useMemory()) {
    return;
  }

  const p = getPool();
  await p.query(
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL
    )`,
  );
}

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  if (useMemory()) {
    memorySessions.set(token, { username, expiresAt });
    return token;
  }

  const p = getPool();
  await init();
  await p.query("INSERT INTO sessions (token, username, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [
    token,
    username,
  ]);

  return token;
}

export async function getSession(token: string): Promise<{ username: string } | null> {
  if (useMemory()) {
    const entry = memorySessions.get(token);

    if (entry && entry.expiresAt > Date.now()) {
      return { username: entry.username };
    }

    return null;
  }

  const p = getPool();
  const result = await p.query('SELECT username FROM sessions WHERE token = $1 AND expires_at > NOW()', [token]);

  return result.rowCount ? { username: result.rows[0].username } : null;
}

export async function deleteSession(token: string) {
  if (useMemory()) {
    memorySessions.delete(token);
    return;
  }

  const p = getPool();
  await p.query('DELETE FROM sessions WHERE token = $1', [token]);
}
