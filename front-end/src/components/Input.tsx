import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  onInputClick?: () => void;
}

export default function Input({ onInputClick, className, label, ...props }: InputProps) {
  return (
    <div className="base_input_wrapper">
      <label>{label}</label>
      <input onClick={() => { onInputClick?.() }} className={`base_input ${className}`} {...props} />
    </div>
  );
}
