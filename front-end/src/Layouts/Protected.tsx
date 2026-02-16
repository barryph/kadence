import React, { useEffect } from "react";
import { redirect } from "@tanstack/react-router";
import LayoutBase from "./Base";
import { useAuth } from "./AuthContext";

interface LayoutProtectedProps {
  children: React.ReactNode;
}

function LayoutProtected({ children }: LayoutProtectedProps) {
  const authContext = useAuth()
  console.log('authContext', authContext);
  // TODO: Fetch user,
  // if not authed redirect to login
  // if authed save auth to store
  // useEffect(() => {
  // }, [])

  // if (!user) return null;
  useEffect(() => {
    if (!authContext.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      })
    }
  }, [])

  return (
    <LayoutBase>
      {children}
    </LayoutBase>
  )
}
export default React.memo(LayoutProtected);
