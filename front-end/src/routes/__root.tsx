import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './__root.css';
import { useAuth } from '../Layouts/AuthContext';
import LinkPlain from '../components/LinkPlain';

function RootLayout() {
  const authContext = useAuth();
  const router = useRouter();

  function handleLogout() {
    authContext.logout();
    router.navigate({ href: '/login' })
  }

  return (
    <>
      <div className="site-header">
        <div className="app-name font-header">
          Fit<span>Trick</span>
        </div>
        <div className="site_header__right">
          {authContext.isAuthenticated ? (
            <>
              <div className="app-settings-icon">&#9776;</div>
              <button onClick={handleLogout} className="logout_button">Logout</button>
            </>
          ) : (
            <>
              <LinkPlain to="/login">Login</LinkPlain>
              <LinkPlain to="/register">Register</LinkPlain>
            </>
          )}
        </div>
      </div>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout })
