import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import Input from '../components/Input';
import { useEffect, useState } from 'react';
import { useAuth } from '../Layouts/AuthContext';
import Button from '../components/Button';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const authContext = useAuth()
  const router = useRouter();

  useEffect(() => {
    if (authContext.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  }, [])

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setIsLoading(true)
    try {
      await authContext.login(email, password);
    } catch (err) {
      console.error('Failed to login, login', err);
      setIsLoading(false);
      return;
    }
    // TODO: rediret to search.redirect
    // throw redirect({ to: search.redirect })
    console.log('done')
    // throw redirect({ to: '/' })
    router.navigate({ href: '/' })
  }

  return (
    <div>
      <h1>Login!</h1>
      <Input placeholder="Email" label="Email" onChange={event => setEmail(event.target.value)} />
      <Input placeholder="Password" label="Password" onChange={event => setPassword(event.target.value)} type="password" />
      <Button onClick={handleSubmit}>Login</Button>
    </div>
  )
}
