import React, { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border flex items-center justify-between gap-3 animate-slide-up ${toast.type === 'success' ? 'bg-white border-emerald-500 text-emerald-900' :
                                toast.type === 'error' ? 'bg-white border-red-500 text-red-900' :
                                    'bg-white border-blue-500 text-slate-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
                            {toast.type === 'error' && <AlertTriangle className="text-red-500" size={20} />}
                            {toast.type === 'info' && <CheckCircle className="text-blue-500" size={20} />}
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
