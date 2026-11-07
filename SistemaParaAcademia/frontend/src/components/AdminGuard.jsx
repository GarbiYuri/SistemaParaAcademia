import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { destinoPorPerfil, ehPerfilAdministrativo } from './PortalGuard.jsx'

/**
 * Protege o sistema administrativo (dashboard, cadastros, financeiro...).
 * Somente administradores e recepcionistas entram; os demais voltam à sua área.
 */
export default function RequireAdmin({ children }) {
  const { sessao } = useAuth()
  const location = useLocation()

  if (!sessao) {
    return <Navigate to="/login" state={{ de: location.pathname }} replace />
  }

  if (!ehPerfilAdministrativo(sessao.perfil)) {
    return <Navigate to={destinoPorPerfil(sessao.perfil)} replace />
  }

  return children
}
