import { Link, type LinkComponent } from '@tanstack/react-router'
import './LinkPlain.css';

interface LinkPlainProps extends LinkComponent<"a", string> {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function LinkPlain({ children, to, className, ...props }: LinkPlainProps) {
  return (
    <Link to={to} className={`link--plain [&.active]:font-bold ${className ? className : ''}`} {...props}>{children}</Link>
  )
}
