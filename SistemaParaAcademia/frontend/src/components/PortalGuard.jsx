import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// eslint-disable-next-line react-refresh/only-export-components
export function destinoPorPerfil(perfil) {
  if (perfil === 'professor') return '/portal/professor'
  if (perfil === 'administrador' || perfil === 'recepcionista') return '/'
  return '/portal/aluno'
}

// eslint-disable-next-line react-refresh/only-export-components
export function ehPerfilAdministrativo(perfil) {
  return perfil === 'administrador' || perfil === 'recepcionista'
}

export function RequireAuth({ children }) {
  const { sessao } = useAuth()
  const location = useLocation()

  if (!sessao) {
    return <Navigate to="/login" state={{ de: location.pathname }} replace />
  }

  return children
}

export function PortalRedirect() {
  const { sessao } = useAuth()

  if (!sessao) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={destinoPorPerfil(sessao.perfil)} replace />
}

export function RequirePerfil({ perfil, children }) {
  const { sessao } = useAuth()
  const location = useLocation()

  if (!sessao) {
    return <Navigate to="/login" state={{ de: location.pathname }} replace />
  }

  if (sessao.perfil !== perfil) {
    return <Navigate to={destinoPorPerfil(sessao.perfil)} replace />
  }

  return children
}
