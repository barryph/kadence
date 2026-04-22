import React from "react";
import LayoutBase from "./Base";

interface LayoutDefaultProps {
  children: React.ReactNode;
}

function LayoutDefault({ children }: LayoutDefaultProps) {
  return (
    <LayoutBase>
      {children}
    </LayoutBase>
  )
}
export default React.memo(LayoutDefault);
