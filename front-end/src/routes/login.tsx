import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import Input from '../components/Input';
import { useEffect, useState } from 'react';
import './login.css';
import { useAuth } from '../Layouts/AuthContext';
import Button from '../components/Button';
import LayoutEnsureNotAuthed from '../Layouts/EnsureNotAuthed';
import { ErrorAlert } from '../components/ErrorAlert';

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
  const [errorMessage, setErrorMessage] = useState<null | string>(null)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    setIsLoading(true)
    setErrorMessage(null)
    const response = await authContext.login(email, password);
    if (response.error) {
      setErrorMessage(response.error.message)
      setIsLoading(false);
      return;
    }
    // throw redirect({ to: search.redirect })
    router.navigate({ href: '/' })
  }

  return (
    <LayoutEnsureNotAuthed>
      <div className="container">
        <form className="login_form" onSubmit={(event) => handleSubmit(event)}>
          <h1>Login!</h1>
          {errorMessage && <ErrorAlert className="mb" message={errorMessage} />}
          <div className="input_row">
            <Input placeholder="Email" label="Email" onChange={event => setEmail(event.target.value)} />
          </div>
          <div className="input_row">
            <Input placeholder="Password" label="Password" onChange={event => setPassword(event.target.value)} type="password" />
          </div>
          <div className="input_row">
            <Button isLoading={isLoading} type="submit">Enter</Button>
          </div>
        </form>
      </div>
    </LayoutEnsureNotAuthed>
  )
}
