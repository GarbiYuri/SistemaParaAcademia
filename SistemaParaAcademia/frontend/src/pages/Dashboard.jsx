import { Link } from 'react-router-dom'
import {
  Users,
  BriefcaseBusiness,
  Dumbbell,
  Wallet,
  Plus,
  ArrowRight,
  Building2,
  Phone,
  Mail,
  Clock,
  Sparkles,
  CircleDollarSign,
  UserPlus,
  CalendarPlus,
  CreditCard,
} from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { api, formatters } from '../services/api'
import { PageHeader, Card, StatusBadge, Spinner, ErrorState, EmptyState } from '../components/ui.jsx'

const STATUS_COLORS = { Ativo: '', Inativo: 'blue', Suspenso: 'amber', Inadimplente: 'red' }

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        api.alunos.list(),
        api.funcionarios.list(),
        api.treinos.list(),
        api.pagamentos.list(),
        api.usuarios.list(),
        api.academias.list(),
      ]),
  )

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Dashboard" subtitle="Acompanhe os principais indicadores da academia." />
        <Card>
          <Spinner label="Carregando indicadores…" />
        </Card>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Dashboard" />
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      </>
    )
  }

  const [alunos = [], funcionarios = [], treinos = [], pagamentos = [], usuarios = [], academias = []] = data || []
  const usuarioPorId = Object.fromEntries(usuarios.map((u) => [u.id, u]))
  const alunoPorId = Object.fromEntries(alunos.map((a) => [a.id_aluno, a]))

  const alunosAtivos = alunos.filter((a) => a.status_matricula === 'Ativo').length
  const treinosAtivos = treinos.filter((t) => t.status === 'Ativo').length
  const receita = pagamentos.filter((p) => p.status === 'Pago').reduce((soma, p) => soma + Number(p.valor || 0), 0)
  const pendente = pagamentos.filter((p) => p.status === 'Pendente').reduce((soma, p) => soma + Number(p.valor || 0), 0)

  const statusMatricula = ['Ativo', 'Inativo', 'Suspenso', 'Inadimplente'].map((status) => ({
    status,
    total: alunos.filter((a) => a.status_matricula === status).length,
  }))
  const maiorStatus = Math.max(1, ...statusMatricula.map((s) => s.total))

  const pagamentosRecentes = [...pagamentos]
    .sort((a, b) => String(b.data_pagamento).localeCompare(String(a.data_pagamento)))
    .slice(0, 5)

  const academia = academias[0]

  const stats = [
    {
      label: 'Alunos ativos',
      value: alunosAtivos,
      hint: `${alunos.length} matriculados no total`,
      icon: Users,
      tone: '',
    },
    {
      label: 'Funcionários',
      value: funcionarios.length,
      hint: 'Equipe cadastrada',
      icon: BriefcaseBusiness,
      tone: 'blue',
    },
    {
      label: 'Treinos ativos',
      value: treinosAtivos,
      hint: `${treinos.length} fichas no sistema`,
      icon: Dumbbell,
      tone: 'green',
    },
    {
      label: 'Receita confirmada',
      value: formatters.moeda(receita),
      hint: `${formatters.moeda(pendente)} pendente`,
      icon: Wallet,
      tone: 'amber',
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        subtitle="Um panorama rápido da operação, do financeiro e das fichas de treino."
        actions={
          <>
            <Link to="/pagamentos" className="btn btn-subtle btn-md">
              <CircleDollarSign size={16} /> Registrar pagamento
            </Link>
            <Link to="/alunos" className="btn btn-primary btn-md">
              <Plus size={16} /> Novo aluno
            </Link>
          </>
        }
      />

      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles size={13} /> Bem-vindo de volta
          </span>
          <h2>Sua academia em um só lugar.</h2>
          <p>
            Gerencie alunos, equipe, treinos e mensalidades com uma visão clara do que importa.
            {academia ? ` Unidade ${academia.nome}, aberta das ${formatters.hora(academia.horaAbertura)} às ${formatters.hora(academia.horaFechamento)}.` : ' Cadastre sua unidade para começar.'}
          </p>
          <div className="hero-actions">
            <Link to="/treinos" className="btn btn-primary btn-md">
              Gerenciar treinos <ArrowRight size={16} />
            </Link>
            <Link to="/cadastros" className="btn btn-subtle btn-md">
              Configurar academia
            </Link>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        {stats.map(({ label, value, hint, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <div className="stat-top">
              <span className={`stat-icon ${tone}`}>
                <Icon size={19} />
              </span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-hint">{hint}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <Card>
            <div className="panel-head">
              <div>
                <h2>Pagamentos recentes</h2>
                <p>Movimentações mais novas registradas no caixa</p>
              </div>
              <Link to="/pagamentos" className="btn btn-ghost btn-sm">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>

            {pagamentosRecentes.length === 0 ? (
              <EmptyState
                title="Nenhum pagamento registrado"
                description="Registre a primeira mensalidade para acompanhar o financeiro."
                action={
                  <Link to="/pagamentos" className="btn btn-subtle btn-sm">
                    <Plus size={15} /> Novo pagamento
                  </Link>
                }
              />
            ) : (
              <div className="recent-list">
                {pagamentosRecentes.map((pagamento) => {
                  const aluno = alunoPorId[pagamento.id_aluno]
                  const usuario = aluno ? usuarioPorId[aluno.id_usuario] : null
                  return (
                    <div className="recent-item" key={pagamento.id_pagamento}>
                      <span className={`stat-icon ${pagamento.status === 'Pago' ? 'green' : 'amber'}`} style={{ width: 34, height: 34 }}>
                        <CreditCard size={16} />
                      </span>
                      <div className="recent-main">
                        <strong>{usuario?.nome || `Aluno #${pagamento.id_aluno}`}</strong>
                        <small>
                          {pagamento.forma_pagamento} · {formatters.data(pagamento.data_pagamento)}
                        </small>
                      </div>
                      <div className="recent-value">
                        {formatters.moeda(pagamento.valor)}
                        <small>
                          <StatusBadge status={pagamento.status} />
                        </small>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="panel-head">
              <div>
                <h2>Status das matrículas</h2>
                <p>Distribuição atual dos alunos</p>
              </div>
              <Link to="/alunos" className="btn btn-ghost btn-sm">
                Gerenciar <ArrowRight size={14} />
              </Link>
            </div>
            <div className="bar-chart">
              {statusMatricula.map(({ status, total }) => (
                <div className="bar-row" key={status}>
                  <div className="bar-labels">
                    <span>{status}</span>
                    <strong>{total}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${STATUS_COLORS[status] || ''}`}
                      style={{ width: `${(total / maiorStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <div className="panel-head">
              <div>
                <h2>Dados da academia</h2>
                <p>Informações da unidade principal</p>
              </div>
              <Link to="/cadastros" className="btn btn-ghost btn-sm">
                Editar
              </Link>
            </div>

            {academia ? (
              <div className="academy-lines">
                <div className="academy-line">
                  <span><Building2 size={14} /> Unidade</span>
                  <span>{academia.nome}</span>
                </div>
                <div className="academy-line">
                  <span><Phone size={14} /> Telefone</span>
                  <span>{academia.telefone || '—'}</span>
                </div>
                <div className="academy-line">
                  <span><Mail size={14} /> E-mail</span>
                  <span>{academia.email}</span>
                </div>
                <div className="academy-line">
                  <span><Clock size={14} /> Funcionamento</span>
                  <span>
                    {formatters.hora(academia.horaAbertura)} — {formatters.hora(academia.horaFechamento)}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Academia não cadastrada"
                description="Adicione os dados da unidade no menu Cadastros."
                action={
                  <Link to="/cadastros" className="btn btn-subtle btn-sm">
                    <Plus size={15} /> Cadastrar academia
                  </Link>
                }
              />
            )}
          </Card>

          <Card>
            <div className="panel-head">
              <div>
                <h2>Ações rápidas</h2>
                <p>Atalhos do dia a dia</p>
              </div>
            </div>
            <div className="quick-grid">
              <Link to="/alunos" className="quick-action">
                <UserPlus size={18} /> Novo aluno
              </Link>
              <Link to="/treinos" className="quick-action">
                <Dumbbell size={18} /> Novo treino
              </Link>
              <Link to="/pagamentos" className="quick-action">
                <CircleDollarSign size={18} /> Novo pagamento
              </Link>
              <Link to="/exercicios" className="quick-action">
                <CalendarPlus size={18} /> Novo exercício
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
