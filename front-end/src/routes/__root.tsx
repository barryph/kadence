import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './__root.css';

const RootLayout = () => (
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
      <div className="app-settings-icon">&#9776;</div>
    </div>
    <Outlet />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })
