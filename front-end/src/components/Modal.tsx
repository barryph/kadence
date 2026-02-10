import { useEffect, useRef } from 'react';
import './Modal.css';


export default function Modal({ children, className, style, onFocusOut, title, ...props }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onFocusOut();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onFocusOut]);

  return (
    <div className={`modal__overlay ${className}`} style={style}>
      <div ref={modalRef} className="modal">
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
