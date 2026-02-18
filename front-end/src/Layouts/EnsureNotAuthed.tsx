import React, { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import LayoutBase from "./Base";
import { useAuth } from "./AuthContext";

interface LayoutEnsureNotAuthedProps {
  children: React.ReactNode;
}

function LayoutEnsureNotAuthed({ children }: LayoutEnsureNotAuthedProps) {
  const router = useRouter();
  const authContext = useAuth()

  useEffect(() => {
    if (authContext.isAuthenticated) {
      router.navigate({ href: '/' })
    }
  }, [authContext.isAuthenticated, router])

  // Don't allow viewing the page if user is not authed
  if (authContext.isAuthenticated) {
    return null;
  }

  return (
    <LayoutBase>
      {children}
    </LayoutBase>
  )
}
export default React.memo(LayoutEnsureNotAuthed);
