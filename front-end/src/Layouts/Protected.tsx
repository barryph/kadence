import React, { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import LayoutBase from "./Base";
import { useAuth } from "./AuthContext";

interface LayoutProtectedProps {
  children: React.ReactNode;
}

function LayoutProtected({ children }: LayoutProtectedProps) {
  const router = useRouter();
  const authContext = useAuth()

  console.log('protected layout herheeherhehrehre')
  useEffect(() => {
    console.log('layout protec', authContext.isAuthenticated);
    if (!authContext.isAuthenticated) {
      // TODO: redirect with current url as redirect query param
      router.navigate({ href: '/login' })
      // throw redirect({
      //   to: '/login',
      //   search: {
      //     // Save current location for redirect after login
      //     redirect: location.href,
      //   },
      // })
    }
  }, [authContext.isAuthenticated, router])

  // Don't allow viewing the page if user is not authed
  if (!authContext.isAuthenticated) {
    return null;
  }

  return (
    <LayoutBase>
      {children}
    </LayoutBase>
  )
}
export default React.memo(LayoutProtected);
