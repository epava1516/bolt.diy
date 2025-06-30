import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createSession } from '~/lib/.server/session';

export async function action({ request }: ActionFunctionArgs) {
  const { username, password } = await request.json<{ username?: string; password?: string }>();

  if (!username || !password) {
    return json({ error: 'Username and password required' }, { status: 400 });
  }

  const token = await createSession(username);

  return json(
    { ok: true, username },
    {
      headers: {
        'Set-Cookie': `session=${token}; HttpOnly; Path=/; SameSite=Lax`,
      },
    },
  );
}
