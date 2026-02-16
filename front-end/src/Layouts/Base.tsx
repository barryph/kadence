/**
 * The base layout used inside other layouts
 */

interface LayoutBaseProps {
  children: React.ReactNode;
}

export default function LayoutBase({ children }: LayoutBaseProps) {
  return (
    <div>
      {children}
    </div>
  )
}
