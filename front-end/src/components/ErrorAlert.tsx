import './ErrorAlert.css';

interface IErrorAlert {
  className: string;
  message: string;
}

export function ErrorAlert({ className, message }: IErrorAlert) {
  return (
    <div className={`error_alert ${className}`}>{message}</div>
  );
}
