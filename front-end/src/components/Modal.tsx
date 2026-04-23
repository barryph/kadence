import './Modal.css';

interface IModalProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  style?: Record<string, string & {}>;
  onFocusOut?: () => void;
  title: string;
}

export default function Modal({ children, className, style, onFocusOut, title }: IModalProps) {
  return (
    <div className={`modal__overlay ${className}`} style={style} onClick={onFocusOut}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__title">
          {title}
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
