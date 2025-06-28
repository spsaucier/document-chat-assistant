import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, type, message };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast('success', message);
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast('error', message);
  }, [showToast]);

  return {
    toasts,
    showSuccess,
    showError,
    removeToast,
  };
};