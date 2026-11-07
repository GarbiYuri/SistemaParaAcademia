import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, GraduationCap, LogOut, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { destinoPorPerfil } from './PortalGuard.jsx'
import { formatters } from '../services/api.js'

const ROTULO = {
  aluno: 'Aluno',
  professor: 'Professor',
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
}

const TOM = {
  aluno: 'badge-info',
  professor: 'badge-green',
  administrador: 'badge-amber',
  recepcionista: 'badge-info',
}

export default function PortalLayout({ children }) {
  const { sessao, sair, trocarPerfil } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!sessao) return null

  const primeiroNome = (sessao.usuario?.nome || '').split(' ')[0]
  const portalAtual = destinoPorPerfil(sessao.perfil)
  const perfis = Array.isArray(sessao.perfis) ? sessao.perfis : [sessao.perfil]
  const temDoisPerfis = perfis.includes('aluno') && perfis.includes('professor')
  const perfilAdmin = perfis.includes('administrador')
    ? 'administrador'
    : perfis.includes('recepcionista')
      ? 'recepcionista'
      : null

  const handleSair = () => {
    sair()
    navigate('/login', { replace: true })
  }

  const alternarArea = (perfil) => {
    trocarPerfil(perfil)
    navigate(destinoPorPerfil(perfil))
  }

  const abrirAdmin = () => {
    if (!perfilAdmin) return
    trocarPerfil(perfilAdmin)
    navigate('/')
  }

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-topbar-inner">
          <Link to={portalAtual} className="portal-brand">
            <span className="brand-mark">
              <Zap size={18} strokeWidth={2.6} />
            </span>
            <span className="brand-text">
              <strong>
                FATEC<span>Fit</span>
              </strong>
              <small>Portal do aluno e do professor</small>
            </span>
          </Link>

          <nav className="portal-nav">
            {temDoisPerfis ? (
              <div className="portal-switch" role="group" aria-label="Alternar área de acesso">
                <button
                  type="button"
                  className={sessao.perfil === 'aluno' ? 'active' : ''}
                  onClick={() => alternarArea('aluno')}
                  title="Ir para a área do aluno"
                >
                  <GraduationCap size={15} /> Área do aluno
                </button>
                <button
                  type="button"
                  className={sessao.perfil === 'professor' ? 'active' : ''}
                  onClick={() => alternarArea('professor')}
                  title="Ir para a área do professor"
                >
                  <BriefcaseBusiness size={15} /> Área do professor
                </button>
              </div>
            ) : sessao.perfil === 'aluno' ? (
              <Link to="/portal/aluno" className={location.pathname === '/portal/aluno' ? 'active' : ''}>
                Meus treinos
              </Link>
            ) : (
              <Link to="/portal/professor" className={location.pathname === '/portal/professor' ? 'active' : ''}>
                Meus alunos
              </Link>
            )}

            {perfilAdmin && (
              <button
                type="button"
                className="portal-admin-link"
                onClick={abrirAdmin}
                title="Ir para o sistema administrativo"
              >
                <ShieldCheck size={15} /> Sistema administrativo
              </button>
            )}
          </nav>

          <div className="portal-topbar-user">
            <span className={`badge ${TOM[sessao.perfil] || 'badge-neutral'}`}>
              {ROTULO[sessao.perfil] || 'Acesso'}
            </span>
            <span className="avatar" title={sessao.usuario?.nome}>
              {formatters.iniciais(sessao.usuario?.nome || primeiroNome)}
            </span>
            <div className="portal-user-text">
              <strong>{sessao.usuario?.nome}</strong>
              <small>{sessao.cargo || ROTULO[sessao.perfil] || ''}</small>
            </div>
            <button type="button" className="btn btn-subtle btn-sm" onClick={handleSair}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="portal-content">{children}</main>

      <footer className="portal-footer">
        FATECFit · {sessao.perfil === 'professor' ? 'Área do professor' : sessao.perfil === 'aluno' ? 'Área do aluno' : (ROTULO[sessao.perfil] || 'Acesso')} · Acesso restrito
      </footer>
    </div>
  )
}
