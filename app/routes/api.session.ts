import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getSession } from '~/lib/.server/session';
import { parseCookies } from '~/lib/api/cookies';

export async function loader({ request }: LoaderFunctionArgs) {
  const token = parseCookies(request.headers.get('Cookie')).session;

  if (!token) {
    return json({ isAuthenticated: false });
  }

  const session = await getSession(token);

  if (!session) {
    return json({ isAuthenticated: false });
  }

  return json({ isAuthenticated: true, username: session.username });
}
