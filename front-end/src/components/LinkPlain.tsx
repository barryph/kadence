import { Link, type LinkComponent } from '@tanstack/react-router'
import './LinkPlain.css';

interface LinkPlainProps extends LinkComponent<"a", string> {
  children: React.ReactNode;
}

export default function LinkPlain({ children, to, ...props }: LinkPlainProps) {
  return (
    <Link to={to} className="link--plain [&.active]:font-bold" {...props}>{children}</Link>
  )
}
