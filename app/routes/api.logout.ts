import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { deleteSession } from '~/lib/.server/session';
import { parseCookies } from '~/lib/api/cookies';

export async function action({ request }: ActionFunctionArgs) {
  const token = parseCookies(request.headers.get('Cookie')).session;

  if (token) {
    await deleteSession(token);
  }

  return json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0',
      },
    },
  );
}
