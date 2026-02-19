import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react';
import LayoutEnsureNotAuthed from '../Layouts/EnsureNotAuthed';
import { useAuth } from '../Layouts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { ErrorAlert } from '../components/ErrorAlert';

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const authContext = useAuth()
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null)

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true)
    setErrorMessage(null)
    const response = await authContext.register(email, password, passwordConfirm);
    if (response.error) {
      setErrorMessage(response.error.message)
      setIsLoading(false);
      return;
    }
    router.navigate({ href: '/' })
  }

  return (
    <LayoutEnsureNotAuthed>
      <div className="container">
        <form onSubmit={(event) => handleSubmit(event)}>
          <h1>Sign Up!</h1>
          {errorMessage && <ErrorAlert className="mb" message={errorMessage} />}
          <div className="input_row">
            <Input placeholder="Email" label="Email" onChange={event => setEmail(event.target.value)} />
          </div>
          <div className="input_row">
            <Input placeholder="Password" label="Password" onChange={event => setPassword(event.target.value)} type="password" />
          </div>
          <div className="input_row">
            <Input placeholder="Password Confirm" label="Password Confirm" onChange={event => setPasswordConfirm(event.target.value)} type="password" />
          </div>
          <div className="input_row">
            <Button isLoading={isLoading} type="submit">Enter</Button>
          </div>
        </form>
      </div>
    </LayoutEnsureNotAuthed>
  )
}
