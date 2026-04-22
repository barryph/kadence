import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import './__root.css';
import { useAuth } from '../Layouts/AuthContext';
import LinkPlain from '../components/LinkPlain';
import { useEffect, useRef, useState } from 'react';

function NavDrawer({ onLogout, isOpen, onClose }: { onLogout: () => void, isOpen: boolean, onClose: () => void }) {
  const navRef = useRef(null);
  const router = useRouter();

  // Close the nav drawer on route change
  router.subscribe('onBeforeNavigate', () => {
    onClose();
  });

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  }, [onClose]);

  return (
    <div ref={navRef} className={`nav-sidebar ${isOpen ? 'open' : ''}`}>
      <div onClick={() => onClose()} className="nav-close-icon">&#9776;</div>
      <div className='nav-items'>
        <LinkPlain to="/" className="nav-item">Home</LinkPlain>
        <LinkPlain to="/events" className="nav-item">Activity Hub</LinkPlain>
        <button onClick={onLogout} className="logout_button nav-item">Logout</button>
      </div>
    </div >
  )
}

function RootLayout() {
  const authContext = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  function handleLogout() {
    authContext.logout();
    router.navigate({ href: '/login' })
  }

  function handleCloseNav() {
    setIsSidebarOpen(false);
  }
  function handleOpenNav(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    event.stopPropagation();
    setIsSidebarOpen(true);
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
              <NavDrawer onLogout={handleLogout} isOpen={isSidebarOpen} onClose={handleCloseNav} />
              {!isSidebarOpen && (
                <div onClick={(event) => handleOpenNav(event)} className="app-settings-icon">&#9776;</div>
              )}
            </>
          ) : (
            <>
              <LinkPlain to="/login">Login</LinkPlain>
              <LinkPlain to="/register">Register</LinkPlain>
            </>
          )}
        </div>
      </div >
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout })
