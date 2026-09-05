import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useRef, useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Toast.module.css';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const seq = useRef(0);
    const navigate = useNavigate();
    const show = useCallback((t) => {
        const id = ++seq.current;
        setItems((prev) => [...prev, { ...t, id }]);
        window.setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }, 4200);
    }, []);
    const api = useMemo(() => ({ show }), [show]);
    return (_jsxs(ToastContext.Provider, { value: api, children: [children, items.length ? (_jsx("div", { className: s.host, children: items.map((t) => (_jsxs("div", { className: s.toast, role: "status", children: [t.emoji ? (_jsx("span", { className: s.emoji, "aria-hidden": true, children: t.emoji })) : null, _jsx("span", { children: t.message }), t.actionLabel && t.actionTo ? (_jsx("button", { type: "button", className: s.action, onClick: () => {
                                setItems((prev) => prev.filter((i) => i.id !== t.id));
                                navigate(t.actionTo);
                            }, children: t.actionLabel })) : null] }, t.id))) })) : null] }));
}
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
