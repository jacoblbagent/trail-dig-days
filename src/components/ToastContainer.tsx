import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { removeToast } from '../features/toast/toastSlice';

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((s) => s.toast.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const id = toasts[toasts.length - 1].id;
    const timer = setTimeout(() => dispatch(removeToast(id)), 2000);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => dispatch(removeToast(t.id))}>x</button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;