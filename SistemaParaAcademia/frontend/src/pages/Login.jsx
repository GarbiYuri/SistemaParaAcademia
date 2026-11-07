import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { destinoPorPerfil } from '../components/PortalGuard.jsx'

const CONTAS_DEMO = [
  {
    perfil: 'Aluno',
    nome: 'Ana Beatriz Souza',
    email: 'ana.souza@email.com',
    senha: 'senha123',
    tom: 'info',
  },
  {
    perfil: 'Professor',
    nome: 'Marcos Vinícius Almeida',
    email: 'marcos.almeida@fatecfit.com',
    senha: 'senha123',
    tom: 'green',
  },
  {
    perfil: 'Administrador',
    nome: 'Roberto Nunes Filho',
    email: 'roberto.nunes@fatecfit.com',
    senha: 'senha123',
    tom: 'amber',
  },
  {
    perfil: 'Recepcionista',
    nome: 'Juliana Prado Nunes',
    email: 'juliana.nunes@fatecfit.com',
    senha: 'senha123',
    tom: 'info',
  },
]

const OPCOES_PERFIL = {
  aluno: {
    titulo: 'Entrar como aluno',
    descricao: 'Ver minhas fichas de treino, exercícios e orientações.',
    icone: GraduationCap,
    tom: 'aluno',
  },
  professor: {
    titulo: 'Entrar como professor',
    descricao: 'Gerenciar meus alunos e montar/editar treinos.',
    icone: BriefcaseBusiness,
    tom: 'professor',
  },
  administrador: {
    titulo: 'Entrar como administrador',
    descricao: 'Gerenciar alunos, funcionários, treinos e financeiro.',
    icone: ShieldCheck,
    tom: 'administrador',
  },
  recepcionista: {
    titulo: 'Entrar como recepcionista',
    descricao: 'Atender alunos e operar o sistema de gestão da academia.',
    icone: ClipboardList,
    tom: 'recepcionista',
  },
}

export default function Login() {
  const { sessao, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarDemo, setMostrarDemo] = useState(false)
  const [escolha, setEscolha] = useState(null)

  if (sessao) {
    return <Navigate to={destinoPorPerfil(sessao.perfil)} replace />
  }

  const destino = location.state?.de

  const destinoFinal = (dados) => {
    const portalDoPerfil = destinoPorPerfil(dados.perfil)
    if (!destino) return portalDoPerfil

    const perfilAdministrativo =
      dados.perfil === 'administrador' || dados.perfil === 'recepcionista'
    const destinoPortal = destino.startsWith('/portal')

    if (perfilAdministrativo) return destinoPortal ? portalDoPerfil : destino
    if (!destinoPortal) return portalDoPerfil

    const esperado = destino.startsWith('/portal/professor') ? 'professor' : 'aluno'
    return dados.perfil === esperado ? destino : portalDoPerfil
  }

  const submit = async (event) => {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const dados = await entrar(email.trim(), senha)
      if (dados.requer_escolha) {
        setEscolha(dados)
        return
      }
      navigate(destinoFinal(dados), { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const escolherPerfil = async (perfil) => {
    setErro('')
    setEnviando(true)
    try {
      const dados = await entrar(email.trim(), senha, perfil)
      navigate(destinoFinal(dados), { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const preencher = (conta) => {
    setEmail(conta.email)
    setSenha(conta.senha)
    setErro('')
  }

  const voltar = () => {
    setEscolha(null)
    setErro('')
    setSenha('')
  }

  return (
    <div className="login-shell">
      <section className="login-aside">
        <div className="login-aside-glow" aria-hidden="true" />

        <div className="login-brand">
          <span className="brand-mark">
            <Activity size={20} strokeWidth={2.6} />
          </span>
          <span className="brand-text">
            <strong>
              FATEC<span>Fit</span>
            </strong>
            <small>Portal e gestão da academia</small>
          </span>
        </div>

        <div className="login-aside-content">
          <span className="hero-badge">
            <Sparkles size={13} /> Área exclusiva
          </span>
          <h1>
            Sua academia,
            <br />
            em um só lugar.
          </h1>
          <p>
            Alunos acompanham a ficha prescrita pelo professor. Professores montam e atualizam os
            treinos. A equipe administrativa cuida dos cadastros, do financeiro e da gestão da
            academia — tudo com um único login.
          </p>

          <ul className="login-benefits">
            <li>
              <span className="login-benefit-icon">
                <Dumbbell size={17} />
              </span>
              <div>
                <strong>Ficha sempre à mão</strong>
                <small>Séries, repetições, cargas e observações do treino.</small>
              </div>
            </li>
            <li>
              <span className="login-benefit-icon">
                <GraduationCap size={17} />
              </span>
              <div>
                <strong>Professor monta o treino</strong>
                <small>Crie fichas, adicione exercícios e acompanhe seus alunos.</small>
              </div>
            </li>
            <li>
              <span className="login-benefit-icon">
                <ShieldCheck size={17} />
              </span>
              <div>
                <strong>Permissões separadas</strong>
                <small>Cada perfil vê apenas o que pode acessar.</small>
              </div>
            </li>
          </ul>
        </div>

        <p className="login-aside-foot">
          Acesso restrito a alunos, professores e equipe administrativa da FATECFit.
        </p>
      </section>

      <section className="login-main">
        {escolha ? (
          <div className="login-card">
            <header className="login-head">
              <span className="login-eyebrow">Escolha o acesso</span>
              <h2>Como você quer entrar?</h2>
              <p>
                Olá, <strong>{escolha.usuario?.nome?.split(' ')[0] || 'usuário'}</strong>. Sua conta
                possui mais de um perfil de acesso. Escolha por onde quer entrar.
              </p>
            </header>

            {erro && (
              <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <div className="login-perfis">
              {escolha.perfis.map((perfil) => {
                const opcao = OPCOES_PERFIL[perfil]
                if (!opcao) return null
                const Icone = opcao.icone
                return (
                  <button
                    type="button"
                    key={perfil}
                    className={`login-perfil-card ${opcao.tom}`}
                    onClick={() => escolherPerfil(perfil)}
                    disabled={enviando}
                  >
                    <span className="login-perfil-icon">
                      <Icone size={20} />
                    </span>
                    <span className="login-perfil-text">
                      <strong>{opcao.titulo}</strong>
                      <small>{opcao.descricao}</small>
                    </span>
                    <ArrowRight size={18} className="login-perfil-arrow" />
                  </button>
                )
              })}
            </div>

            <p className="login-perfis-hint">
              Você poderá alternar entre as áreas depois, sem sair do portal.
            </p>

            <button type="button" className="login-back" onClick={voltar} disabled={enviando}>
              <ArrowLeft size={15} /> Usar outra conta
            </button>
          </div>
        ) : (
          <div className="login-card">
            <header className="login-head">
              <span className="login-eyebrow">Entrar</span>
              <h2>Bem-vindo de volta</h2>
              <p>Use seu e-mail e senha cadastrados na academia.</p>
            </header>

            <form onSubmit={submit} className="login-form">
              {erro && (
                <div className="form-error" role="alert">
                  {erro}
                </div>
              )}

              <label className="field">
                <span className="field-label">E-mail</span>
                <span className="login-input-wrap">
                  <Mail size={16} />
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </span>
              </label>

              <label className="field">
                <span className="field-label">Senha</span>
                <span className="login-input-wrap">
                  <Lock size={16} />
                  <input
                    className="input"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>

              <button type="submit" className="btn btn-primary btn-md login-submit" disabled={enviando}>
                {enviando ? 'Entrando…' : 'Entrar'}
                {!enviando && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="login-demo">
              <button
                type="button"
                className={`login-demo-toggle ${mostrarDemo ? 'open' : ''}`}
                onClick={() => setMostrarDemo((v) => !v)}
                aria-expanded={mostrarDemo}
              >
                <span>
                  <Sparkles size={14} /> Contas de demonstração
                </span>
                <ChevronDown size={15} />
              </button>

              {mostrarDemo && (
                <div className="login-demo-list">
                  {CONTAS_DEMO.map((conta) => (
                    <button
                      type="button"
                      key={conta.email}
                      className="login-demo-item"
                      onClick={() => preencher(conta)}
                      title="Preencher este login"
                    >
                      <span className={`badge badge-${conta.tom}`}>{conta.perfil}</span>
                      <span className="login-demo-text">
                        <strong>{conta.nome}</strong>
                        <small>{conta.email}</small>
                      </span>
                      <span className="login-demo-senha">senha123</span>
                    </button>
                  ))}
                  <p className="login-demo-hint">
                    Alunos, professores e equipe administrativa usam este mesmo login. Quem tem
                    mais de um perfil escolhe a área após entrar.
                  </p>
                </div>
              )}
            </div>

            <footer className="login-footer">
              <span>Equipe administrativa?</span>
              <span>Use o mesmo login para acessar a gestão da academia.</span>
            </footer>
          </div>
        )}
      </section>
    </div>
  )
}
