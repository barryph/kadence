import './Button.css';

export default function Button({ children, className, variant, color, ...props }) {
  const variantClasses = {
    'outline': 'button--outline',
  };
  const colorClasses = {
    'go': 'button--go',
    'grey': 'button--grey',
  };
  return (
    <div {...props} className={`button ${variantClasses[variant] || ''} ${colorClasses[color] || ''} ${className}`}>
      {children}
    </div >
  );
};
