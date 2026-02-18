import { createRootRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './__root.css';
import { useAuth } from '../Layouts/AuthContext';

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
        {/* <Link to="/" className="[&.active]:font-bold"> */}
        {/*   Home */}
        {/* </Link>{' '} */}
        {/* <Link to="/about" className="[&.active]:font-bold"> */}
        {/*   About */}
        {/* </Link> */}
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
            <Link to="/login" className="[&.active]:font-bold">Login</Link>
          )}
        </div>
      </div>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout })
