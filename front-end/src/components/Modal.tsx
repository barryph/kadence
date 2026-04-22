import './Modal.css';

export default function Modal({ children, className, style, onFocusOut, title, ...props }) {
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
