import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Dumbbell,
  Activity,
  Wallet,
  UserCog,
  Settings2,
  Menu,
  X,
  Zap,
  LogIn,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { destinoPorPerfil } from './PortalGuard.jsx'
import { formatters } from '../services/api.js'

const ROTULO_PERFIL = {
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
}

const NAV = [
  {
    group: 'Principal',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    group: 'Gestão',
    items: [
      { to: '/alunos', label: 'Alunos', icon: Users },
      { to: '/funcionarios', label: 'Funcionários', icon: BriefcaseBusiness },
      { to: '/treinos', label: 'Treinos', icon: Dumbbell },
      { to: '/exercicios', label: 'Exercícios', icon: Activity },
    ],
  },
  {
    group: 'Financeiro',
    items: [{ to: '/pagamentos', label: 'Pagamentos', icon: Wallet }],
  },
  {
    group: 'Sistema',
    items: [
      { to: '/usuarios', label: 'Usuários', icon: UserCog },
      { to: '/cadastros', label: 'Cadastros', icon: Settings2 },
    ],
  },
]

const TITLES = {
  '/': 'Dashboard',
  '/alunos': 'Alunos',
  '/funcionarios': 'Funcionários',
  '/treinos': 'Treinos',
  '/exercicios': 'Exercícios',
  '/pagamentos': 'Pagamentos',
  '/usuarios': 'Usuários',
  '/cadastros': 'Cadastros',
}

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="brand">
        <span className="brand-mark">
          <Zap size={20} strokeWidth={2.6} />
        </span>
        <span className="brand-text">
          <strong>FATEC<span>Fit</span></strong>
          <small>Gestão de academia</small>
        </span>
      </div>

      <nav className="nav">
        {NAV.map((group) => (
          <div className="nav-group" key={group.group}>
            <span className="nav-group-label">{group.group}</span>
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <div>
          <strong>Sistema local</strong>
          <small>API + MySQL conectados</small>
        </div>
      </div>
    </>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { sessao, sair, trocarPerfil } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = TITLES[location.pathname] || 'FATECFit'
  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  const perfis = Array.isArray(sessao?.perfis) ? sessao.perfis : [sessao?.perfil]
  const portalPerfil = perfis.includes('professor')
    ? 'professor'
    : perfis.includes('aluno')
      ? 'aluno'
      : null
  const rotuloPerfil = ROTULO_PERFIL[sessao?.perfil] || sessao?.cargo || 'Administrador'

  const abrirPortal = () => {
    if (!portalPerfil) return
    trocarPerfil(portalPerfil)
    navigate(destinoPorPerfil(portalPerfil))
  }

  const handleSair = () => {
    sair()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
          <X size={20} />
        </button>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <span>{title}</span>
            <small>{hoje}</small>
          </div>
          <div className="topbar-right">
            {portalPerfil && (
              <button type="button" className="btn btn-subtle btn-sm portal-entry" onClick={abrirPortal}>
                <LogIn size={15} />
                <span className="portal-entry-label">
                  {portalPerfil === 'professor' ? 'Portal do professor' : 'Portal do aluno'}
                </span>
              </button>
            )}
            <span className="live-pill">
              <span className="status-dot" /> Online
            </span>
            <div className="topbar-user">
              <span className={`badge ${sessao?.perfil === 'recepcionista' ? 'badge-info' : 'badge-amber'}`}>
                {rotuloPerfil}
              </span>
              <span className="user-chip" title={sessao?.usuario?.nome}>
                {formatters.iniciais(sessao?.usuario?.nome || 'FATECFit')}
              </span>
              <div className="topbar-user-text">
                <strong>{sessao?.usuario?.nome}</strong>
                <small>{sessao?.cargo || rotuloPerfil}</small>
              </div>
            </div>
            <button type="button" className="btn btn-subtle btn-sm" onClick={handleSair}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
