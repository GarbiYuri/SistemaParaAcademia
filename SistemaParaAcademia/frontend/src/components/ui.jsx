import { useEffect } from 'react'
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react'

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Card({ children, className = '', padded = true }) {
  return <section className={`card ${padded ? 'padded' : ''} ${className}`}>{children}</section>
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export function IconButton({ label, icon: Icon, variant = 'ghost', ...props }) {
  return (
    <button type="button" className={`icon-btn icon-btn-${variant}`} title={label} aria-label={label} {...props}>
      <Icon size={16} />
    </button>
  )
}

export function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        {required && <em>*</em>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function Select({ children, ...props }) {
  return (
    <select className="input select" {...props}>
      {children}
    </select>
  )
}

export function Textarea(props) {
  return <textarea className="input textarea" rows={3} {...props} />
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

const STATUS_TONES = {
  ativo: 'green',
  pago: 'green',
  concluido: 'green',
  pendente: 'amber',
  inativo: 'gray',
  cancelado: 'gray',
  suspenso: 'red',
  inadimplente: 'red',
  atrasado: 'red',
  vencido: 'red',
}

export function StatusBadge({ status }) {
  if (!status) return <Badge tone="gray">—</Badge>
  const tone = STATUS_TONES[String(status).toLowerCase()] || 'neutral'
  return <Badge tone={tone}>{status}</Badge>
}

export function Modal({ open, title, description, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-btn icon-btn-ghost" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function FormActions({ onCancel, submitLabel = 'Salvar', loading = false, destructive = false }) {
  return (
    <div className="form-actions">
      <Button variant="subtle" onClick={onCancel} disabled={loading}>
        Cancelar
      </Button>
      <Button type="submit" variant={destructive ? 'danger' : 'primary'} disabled={loading}>
        {loading ? 'Salvando…' : submitLabel}
      </Button>
    </div>
  )
}

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="state-box">
      <Loader2 className="spin" size={26} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-error">
      <AlertTriangle size={26} />
      <strong>Não foi possível carregar</strong>
      <span>{message}</span>
      {onRetry && (
        <Button variant="subtle" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="state-box empty-state">
      <span className="empty-icon">
        <Icon size={24} />
      </span>
      <strong>{title}</strong>
      {description && <span>{description}</span>}
      {action}
    </div>
  )
}

export function DataTable({ columns, rows, loading, error, onRetry, empty, rowKey = 'id' }) {
  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!rows || rows.length === 0) return empty || <EmptyState title="Nenhum registro encontrado" />

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align ? `align-${col.align}` : ''}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[rowKey] ?? index}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label} className={col.align ? `align-${col.align}` : ''}>
                  {col.render ? col.render(row, index) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PersonCell({ name, detail, color }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <div className="person-cell">
      <span className="avatar" style={color ? { background: color } : undefined}>
        {initials}
      </span>
      <span className="person-text">
        <strong>{name || '—'}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </div>
  )
}
