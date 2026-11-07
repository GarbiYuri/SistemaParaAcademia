import { useState } from 'react'
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  GraduationCap,
  ListChecks,
  Printer,
  Search,
  StickyNote,
  UserRound,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { api, formatters } from '../services/api.js'
import PortalLayout from '../components/PortalLayout.jsx'
import { Card, EmptyState, ErrorState, Input, Spinner, StatusBadge } from '../components/ui.jsx'

export default function PortalAluno() {
  const { sessao } = useAuth()
  const { data, loading, error, reload } = useAsync(() =>
    Promise.all([api.treinos.list(), api.exercicios.list(), api.usuarios.list(), api.funcionarios.list()]),
  )

  const [busca, setBusca] = useState('')

  const [treinos = [], exercicios = [], usuarios = [], funcionarios = []] = data || []

  const usuarioPorId = Object.fromEntries(usuarios.map((u) => [u.id, u]))
  const funcionarioPorId = Object.fromEntries(
    funcionarios.map((f) => [f.id_funcionario, f]),
  )

  const nomeProfessor = (id) => {
    const funcionario = funcionarioPorId[id]
    return funcionario ? usuarioPorId[funcionario.id_usuario]?.nome : null
  }

  const meusTreinos = treinos
    .filter((t) => t.id_aluno === sessao.id_aluno)
    .filter((t) => {
      const termo = busca.trim().toLowerCase()
      if (!termo) return true
      return [t.nome_treino, t.status, nomeProfessor(t.id_professor)]
        .some((campo) => String(campo || '').toLowerCase().includes(termo))
    })

  const exerciciosDoTreino = (idTreino) => exercicios.filter((e) => e.id_treino === idTreino)

  const totalExercicios = exerciciosDoTreinoIds(exercicios, meusTreinos)
  const professores = [
    ...new Set(meusTreinos.map((t) => nomeProfessor(t.id_professor)).filter(Boolean)),
  ]

  return (
    <PortalLayout>
      <div className="portal-print-head">
        <div>
          <strong>FATECFit</strong>
          <span>Fichas de treino — {sessao.usuario?.nome}</span>
        </div>
        <span>{new Date().toLocaleDateString('pt-BR')}</span>
      </div>

      <header className="portal-page-head">
        <div>
          <span className="eyebrow">Área do aluno</span>
          <h1>Olá, {sessao.usuario?.nome?.split(' ')[0] || 'aluno'} 👋</h1>
          <p className="page-subtitle">
            Aqui estão as fichas de treino que seu professor preparou para você. Elas são somente
            para consulta.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-subtle btn-md no-print"
          onClick={() => window.print()}
          disabled={loading || meusTreinos.length === 0}
        >
          <Printer size={16} /> Imprimir fichas
        </button>
      </header>

      <div className="portal-stats">
        <article className="portal-stat">
          <span className="stat-icon">
            <ClipboardList size={18} />
          </span>
          <div>
            <strong>{meusTreinos.length}</strong>
            <small>ficha(s) de treino</small>
          </div>
        </article>
        <article className="portal-stat">
          <span className="stat-icon green">
            <Dumbbell size={18} />
          </span>
          <div>
            <strong>{totalExercicios}</strong>
            <small>exercício(s) prescritos</small>
          </div>
        </article>
        <article className="portal-stat">
          <span className="stat-icon blue">
            <GraduationCap size={18} />
          </span>
          <div>
            <strong>{professores.length || '—'}</strong>
            <small>{professores.length === 1 ? 'professor responsável' : 'professores responsáveis'}</small>
          </div>
        </article>
      </div>

      <div className="portal-toolbar no-print">
        <div className="search-box">
          <Search size={16} />
          <Input
            placeholder="Buscar por nome do treino ou professor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <span className="counter-pill">Somente leitura</span>
      </div>

      {loading && (
        <Card>
          <Spinner label="Carregando suas fichas…" />
        </Card>
      )}

      {!loading && error && (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      )}

      {!loading && !error && meusTreinos.length === 0 && (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title={busca ? 'Nenhum treino encontrado' : 'Você ainda não tem treinos'}
            description={
              busca
                ? 'Tente outro termo de busca.'
                : 'Assim que seu professor montar uma ficha, ela aparecerá aqui automaticamente.'
            }
          />
        </Card>
      )}

      {!loading && !error && meusTreinos.length > 0 && (
        <div className="ficha-list">
          {meusTreinos.map((treino) => {
            const lista = exerciciosDoTreino(treino.id_treino)
            const professor = nomeProfessor(treino.id_professor)
            return (
              <Card key={treino.id_treino} className="ficha-card" padded={false}>
                <div className="ficha-head">
                  <div className="ficha-title">
                    <span className="ficha-icon">
                      <Dumbbell size={20} />
                    </span>
                    <div>
                      <h2>{treino.nome_treino}</h2>
                      <div className="ficha-meta">
                        <span>
                          <UserRound size={13} /> {professor || 'Professor não identificado'}
                        </span>
                        <span>
                          <CalendarDays size={13} /> Criado em {formatters.data(treino.data_criacao)}
                        </span>
                        {treino.data_atualizacao && (
                          <span>
                            <CalendarDays size={13} /> Atualizado em{' '}
                            {formatters.data(treino.data_atualizacao)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ficha-head-right">
                    <StatusBadge status={treino.status} />
                    <span className="chip">
                      <ListChecks size={12} /> {lista.length} exercício(s)
                    </span>
                  </div>
                </div>

                {lista.length === 0 ? (
                  <div className="ficha-empty">
                    <ClipboardList size={20} />
                    <span>O professor ainda não adicionou exercícios a esta ficha.</span>
                  </div>
                ) : (
                  <div className="ficha-table-wrap">
                    <table className="ficha-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Exercício</th>
                          <th>Séries</th>
                          <th>Repetições</th>
                          <th>Carga</th>
                          <th>Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((exercicio, index) => (
                          <tr key={exercicio.id_exercicio}>
                            <td className="ficha-index">{index + 1}</td>
                            <td data-label="Exercício">
                              <strong>{exercicio.nome_exercicio}</strong>
                            </td>
                            <td data-label="Séries" className="mono">{exercicio.series}</td>
                            <td data-label="Repetições" className="mono">{exercicio.repeticoes}</td>
                            <td data-label="Carga">
                              {exercicio.carga ? (
                                <span className="chip">{exercicio.carga}</span>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                            <td data-label="Observações" className="ficha-obs">
                              {exercicio.observacao ? (
                                <span>
                                  <StickyNote size={12} /> {exercicio.observacao}
                                </span>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="ficha-foot no-print">
                  <span>
                    <ShieldCheck size={14} /> Ficha prescrita pelo professor · somente leitura
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
                    <Printer size={14} /> Imprimir
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </PortalLayout>
  )
}

function exerciciosDoTreinoIds(exercicios, treinos) {
  const ids = new Set(treinos.map((t) => t.id_treino))
  return exercicios.filter((e) => ids.has(e.id_treino)).length
}
