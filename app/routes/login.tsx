import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { useStore } from '@nanostores/react';
import { authStore, login } from '~/lib/stores/auth';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const loader = () => json({});

export default function Login() {
  const auth = useStore(authStore);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/');
    }
  }, [auth.isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <form className="flex flex-col gap-4 m-auto w-80" onSubmit={handleSubmit}>
        <h1 className="text-2xl text-center text-bolt-elements-textPrimary">Login</h1>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="mt-2">
          Sign In
        </Button>
      </form>
    </div>
  );
}
