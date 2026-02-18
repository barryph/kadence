import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

const variantsMap = {
  'outline': 'button--outline',
} as const;
type TVariantsMap = keyof typeof variantsMap;
const colorsMap = {
  'go': 'button--go',
  'grey': 'button--grey',
} as const;
type TColorsMap = keyof typeof colorsMap;

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: TVariantsMap;
  color?: TColorsMap;
  isLoading?: boolean;
}

export default function Button({ children, className, variant, color, isLoading, ...props }: IButtonProps) {
  return (
    <button
      {...props}
      className={`button ${variant ? variantsMap[variant] : ''} ${color ? colorsMap[color] : ''} ${isLoading ? 'button--loading' : ''} ${className}`}
      disabled={isLoading}
    >
      {children}
    </button>
  );
};
