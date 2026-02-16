import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './__root.css';
import { useAuth } from '../Layouts/AuthContext';

function RootLayout() {
  const authContext = useAuth();
  console.log('authContext');
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
        IsAuthed: {JSON.stringify(authContext, null, 2)}
        {authContext.isAuthenticated ? (
          <div className="app-settings-icon">&#9776;</div>
        ) : (
          <Link to="/login" className="[&.active]:font-bold">Login</Link>
        )}
      </div>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout })
