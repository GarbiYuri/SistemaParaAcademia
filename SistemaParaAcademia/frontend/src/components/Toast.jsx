import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((atual) => [...atual, { id, message, type }])
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const remove = (id) => setToasts((atual) => atual.filter((t) => t.id !== id))

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{icons[toast.type] || icons.info}</span>
            <span className="toast-message">{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => remove(toast.id)} aria-label="Fechar">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
