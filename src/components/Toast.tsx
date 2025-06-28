import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error';
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  message, 
  onClose, 
  duration = 4000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  const handleClose = () => {
    onClose(id);
  };

  return (
    <div className={`
      flex items-center p-4 rounded-lg shadow-lg border max-w-md w-full
      transform transition-all duration-300 ease-in-out
      ${type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
      }
    `}>
      <div className="flex-shrink-0 mr-3">
        {type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
      </div>
      
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 ml-3 p-1 rounded-full transition-colors
          ${type === 'success' 
            ? 'hover:bg-green-100 text-green-600' 
            : 'hover:bg-red-100 text-red-600'
          }
        `}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};