import React from "react";
import LayoutBase from "./Base";

interface LayoutProtectedProps {
  children: React.ReactNode;
}

/**
 * Does not require user to be authed
 **/
function LayoutProtected({ children }: LayoutProtectedProps) {
  return (
    <LayoutBase>
      {children}
    </LayoutBase>
  )
}
export default React.memo(LayoutProtected);
