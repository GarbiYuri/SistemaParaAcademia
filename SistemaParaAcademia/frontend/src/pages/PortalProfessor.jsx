import { useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  ListChecks,
  Lock,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { api, formatters } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import PortalLayout from '../components/PortalLayout.jsx'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormActions,
  IconButton,
  Input,
  Modal,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
} from '../components/ui.jsx'

const STATUS_TREINO = ['Ativo', 'Inativo', 'Concluído', 'Suspenso']

const TREINO_VAZIO = { nome_treino: '', status: 'Ativo' }
const EXERCICIO_VAZIO = {
  nome_exercicio: '',
  series: '3',
  repeticoes: '12',
  carga: '',
  observacao: '',
}

export default function PortalProfessor() {
  const { sessao } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() =>
    Promise.all([
      api.alunos.list(),
      api.usuarios.list(),
      api.funcionarios.list(),
      api.treinos.list(),
      api.exercicios.list(),
    ]),
  )

  const [alunos = [], usuarios = [], funcionarios = [], treinos = [], exercicios = []] = data || []

  const [busca, setBusca] = useState('')
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState('')
  const [treinoAbertoId, setTreinoAbertoId] = useState(null)

  const [modalTreino, setModalTreino] = useState(false)
  const [treinoEditando, setTreinoEditando] = useState(null)
  const [formTreino, setFormTreino] = useState(TREINO_VAZIO)

  const [modalExercicio, setModalExercicio] = useState(false)
  const [exercicioEditando, setExercicioEditando] = useState(null)
  const [treinoDoExercicio, setTreinoDoExercicio] = useState(null)
  const [formExercicio, setFormExercicio] = useState(EXERCICIO_VAZIO)

  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const alunoPorId = useMemo(() => Object.fromEntries(alunos.map((a) => [a.id_aluno, a])), [alunos])

  const nomeDoAluno = (id) => {
    const aluno = alunoPorId[id]
    return aluno ? usuarioPorId[aluno.id_usuario]?.nome : null
  }
  const emailDoAluno = (id) => {
    const aluno = alunoPorId[id]
    return aluno ? usuarioPorId[aluno.id_usuario]?.email : null
  }
  const nomeDoProfessor = (id) => {
    const funcionario = funcionarios.find((f) => f.id_funcionario === id)
    return funcionario ? usuarioPorId[funcionario.id_usuario]?.nome : null
  }

  // Mantém o primeiro aluno selecionado sem precisar de efeito
  const alunoSelecionado =
    alunos.find((a) => String(a.id_aluno) === String(alunoSelecionadoId)) || alunos[0] || null

  const alunosFiltrados = alunos.filter((a) => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return true
    return [nomeDoAluno(a.id_aluno), emailDoAluno(a.id_aluno), a.status_matricula]
      .some((campo) => String(campo || '').toLowerCase().includes(termo))
  })

  const treinosDoAluno = alunoSelecionado
    ? treinos.filter((t) => t.id_aluno === alunoSelecionado.id_aluno)
    : []

  const exerciciosDoTreino = (idTreino) => exercicios.filter((e) => e.id_treino === idTreino)

  const ehMeuTreino = (treino) => treino && treino.id_professor === sessao.id_funcionario

  const totalTreinosDoAluno = (idAluno) => treinos.filter((t) => t.id_aluno === idAluno).length

  const limparFormulario = () => {
    setErroForm('')
  }

  /* ----------------------------- Treino: CRUD ----------------------------- */

  const abrirNovoTreino = () => {
    if (!alunoSelecionado) {
      toast('Selecione um aluno para criar o treino.', 'error')
      return
    }
    setTreinoEditando(null)
    setFormTreino(TREINO_VAZIO)
    limparFormulario()
    setModalTreino(true)
  }

  const abrirEdicaoTreino = (treino) => {
    if (!ehMeuTreino(treino)) {
      toast('Você só pode editar treinos prescritos por você.', 'error')
      return
    }
    setTreinoEditando(treino)
    setFormTreino({ nome_treino: treino.nome_treino || '', status: treino.status || 'Ativo' })
    limparFormulario()
    setModalTreino(true)
  }

  const salvarTreino = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      if (!alunoSelecionado) throw new Error('Selecione um aluno.')

      if (treinoEditando) {
        if (!ehMeuTreino(treinoEditando)) {
          throw new Error('Você só pode editar treinos prescritos por você.')
        }
        await api.treinos.update(treinoEditando.id_treino, {
          id_aluno: treinoEditando.id_aluno,
          id_professor: sessao.id_funcionario,
          nome_treino: formTreino.nome_treino.trim(),
          status: formTreino.status,
        })
        toast('Treino atualizado com sucesso.')
      } else {
        const criado = await api.treinos.create({
          id_aluno: alunoSelecionado.id_aluno,
          id_professor: sessao.id_funcionario,
          nome_treino: formTreino.nome_treino.trim(),
          status: formTreino.status,
        })
        setTreinoAbertoId(criado.id_treino)
        toast('Treino criado com sucesso.')
      }
      setModalTreino(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirTreino = async (treino) => {
    if (!ehMeuTreino(treino)) {
      toast('Você só pode excluir treinos prescritos por você.', 'error')
      return
    }
    if (
      !window.confirm(
        `Excluir o treino "${treino.nome_treino}"? Os exercícios dessa ficha também serão removidos.`,
      )
    ) {
      return
    }
    try {
      await api.treinos.remove(treino.id_treino)
      if (treinoAbertoId === treino.id_treino) setTreinoAbertoId(null)
      toast('Treino excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  /* --------------------------- Exercício: CRUD ---------------------------- */

  const abrirNovoExercicio = (treino) => {
    if (!ehMeuTreino(treino)) {
      toast('Você só pode alterar exercícios de treinos prescritos por você.', 'error')
      return
    }
    setExercicioEditando(null)
    setTreinoDoExercicio(treino)
    setFormExercicio(EXERCICIO_VAZIO)
    limparFormulario()
    setModalExercicio(true)
  }

  const abrirEdicaoExercicio = (treino, exercicio) => {
    if (!ehMeuTreino(treino)) {
      toast('Você só pode alterar exercícios de treinos prescritos por você.', 'error')
      return
    }
    setExercicioEditando(exercicio)
    setTreinoDoExercicio(treino)
    setFormExercicio({
      nome_exercicio: exercicio.nome_exercicio || '',
      series: String(exercicio.series ?? 3),
      repeticoes: exercicio.repeticoes || '',
      carga: exercicio.carga || '',
      observacao: exercicio.observacao || '',
    })
    limparFormulario()
    setModalExercicio(true)
  }

  const salvarExercicio = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      if (!treinoDoExercicio) throw new Error('Treino não identificado.')
      if (!ehMeuTreino(treinoDoExercicio)) {
        throw new Error('Você só pode alterar exercícios de treinos prescritos por você.')
      }

      const payload = {
        id_treino: treinoDoExercicio.id_treino,
        nome_exercicio: formExercicio.nome_exercicio.trim(),
        series: Number(formExercicio.series || 3),
        repeticoes: formExercicio.repeticoes.trim(),
        carga: formExercicio.carga.trim() || null,
        observacao: formExercicio.observacao.trim() || null,
      }

      if (exercicioEditando) {
        await api.exercicios.update(exercicioEditando.id_exercicio, payload)
        toast('Exercício atualizado.')
      } else {
        await api.exercicios.create(payload)
        toast('Exercício adicionado ao treino.')
      }
      setModalExercicio(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirExercicio = async (treino, exercicio) => {
    if (!ehMeuTreino(treino)) {
      toast('Você só pode alterar exercícios de treinos prescritos por você.', 'error')
      return
    }
    if (!window.confirm(`Excluir o exercício "${exercicio.nome_exercicio}"?`)) return
    try {
      await api.exercicios.remove(exercicio.id_exercicio)
      toast('Exercício excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  /* -------------------------------- Render -------------------------------- */

  const meuTotalTreinos = treinos.filter((t) => t.id_professor === sessao.id_funcionario).length
  const meuTotalExercicios = exercicios.filter((e) => {
    const treino = treinos.find((t) => t.id_treino === e.id_treino)
    return treino && treino.id_professor === sessao.id_funcionario
  }).length

  return (
    <PortalLayout>
      <header className="portal-page-head">
        <div>
          <span className="eyebrow">Área do professor</span>
          <h1>Olá, {sessao.usuario?.nome?.split(' ')[0] || 'professor'} 💪</h1>
          <p className="page-subtitle">
            Selecione um aluno para montar a ficha de treino. Você edita apenas os treinos que
            prescreveu — os demais ficam disponíveis para consulta.
          </p>
        </div>
        <Button icon={Plus} onClick={abrirNovoTreino} disabled={loading || !alunoSelecionado}>
          Novo treino
        </Button>
      </header>

      <div className="portal-stats">
        <article className="portal-stat">
          <span className="stat-icon blue">
            <Users size={18} />
          </span>
          <div>
            <strong>{alunos.length}</strong>
            <small>aluno(s) na academia</small>
          </div>
        </article>
        <article className="portal-stat">
          <span className="stat-icon green">
            <ClipboardList size={18} />
          </span>
          <div>
            <strong>{meuTotalTreinos}</strong>
            <small>treino(s) prescritos por você</small>
          </div>
        </article>
        <article className="portal-stat">
          <span className="stat-icon">
            <Dumbbell size={18} />
          </span>
          <div>
            <strong>{meuTotalExercicios}</strong>
            <small>exercício(s) nas suas fichas</small>
          </div>
        </article>
      </div>

      {loading && (
        <Card>
          <Spinner label="Carregando alunos e treinos…" />
        </Card>
      )}

      {!loading && error && (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      )}

      {!loading && !error && (
        <div className="professor-layout">
          <Card className="aluno-picker" padded={false}>
            <div className="aluno-picker-head">
              <div>
                <h2>Alunos</h2>
                <p>Escolha quem vai treinar hoje</p>
              </div>
              <Badge tone="neutral">{alunosFiltrados.length}</Badge>
            </div>

            <div className="aluno-picker-search">
              <div className="search-box">
                <Search size={15} />
                <Input
                  placeholder="Buscar aluno…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="aluno-list">
              {alunosFiltrados.length === 0 && (
                <EmptyState title="Nenhum aluno encontrado" description="Ajuste a busca." />
              )}
              {alunosFiltrados.map((aluno) => {
                const nome = nomeDoAluno(aluno.id_aluno) || `Aluno #${aluno.id_aluno}`
                const ativo = alunoSelecionado?.id_aluno === aluno.id_aluno
                return (
                  <button
                    type="button"
                    key={aluno.id_aluno}
                    className={`aluno-item ${ativo ? 'active' : ''}`}
                    onClick={() => setAlunoSelecionadoId(String(aluno.id_aluno))}
                  >
                    <span className="avatar">{formatters.iniciais(nome)}</span>
                    <span className="aluno-item-text">
                      <strong>{nome}</strong>
                      <small>{emailDoAluno(aluno.id_aluno) || 'Sem e-mail'}</small>
                    </span>
                    <span className="aluno-item-count">
                      {totalTreinosDoAluno(aluno.id_aluno)}
                      <small>treino(s)</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="professor-workspace">
            {!alunoSelecionado ? (
              <Card>
                <EmptyState
                  icon={Users}
                  title="Nenhum aluno cadastrado"
                  description="Cadastre alunos no sistema administrativo para montar treinos."
                />
              </Card>
            ) : (
              <>
                <Card className="aluno-resumo" padded={false}>
                  <div className="aluno-resumo-top">
                    <span className="avatar avatar-lg">
                      {formatters.iniciais(nomeDoAluno(alunoSelecionado.id_aluno) || '?')}
                    </span>
                    <div className="aluno-resumo-info">
                      <h2>{nomeDoAluno(alunoSelecionado.id_aluno) || `Aluno #${alunoSelecionado.id_aluno}`}</h2>
                      <p>{emailDoAluno(alunoSelecionado.id_aluno) || 'Sem e-mail cadastrado'}</p>
                      <div className="aluno-resumo-tags">
                        <StatusBadge status={alunoSelecionado.status_matricula} />
                        {alunoSelecionado.forma_pagamento_preferida && (
                          <span className="chip">{alunoSelecionado.forma_pagamento_preferida}</span>
                        )}
                        <span className="chip">
                          <CalendarDays size={12} /> Vence em{' '}
                          {formatters.data(alunoSelecionado.data_vencimento)}
                        </span>
                      </div>
                    </div>
                    <Button variant="subtle" size="sm" icon={Plus} onClick={abrirNovoTreino}>
                      Novo treino
                    </Button>
                  </div>
                </Card>

                {treinosDoAluno.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Dumbbell}
                      title="Nenhum treino para este aluno"
                      description="Monte a primeira ficha de treino deste aluno."
                      action={
                        <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovoTreino}>
                          Criar treino
                        </Button>
                      }
                    />
                  </Card>
                ) : (
                  <div className="ficha-list">
                    {treinosDoAluno.map((treino) => {
                      const lista = exerciciosDoTreino(treino.id_treino)
                      const meu = ehMeuTreino(treino)
                      const aberto = treinoAbertoId === treino.id_treino
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
                                    <UserRound size={13} />{' '}
                                    {meu
                                      ? 'Prescrito por você'
                                      : nomeDoProfessor(treino.id_professor) ||
                                        `Professor #${treino.id_professor}`}
                                  </span>
                                  <span>
                                    <CalendarDays size={13} /> {formatters.data(treino.data_criacao)}
                                  </span>
                                  <span>
                                    <ListChecks size={13} /> {lista.length} exercício(s)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="ficha-head-right">
                              <StatusBadge status={treino.status} />
                              {meu ? (
                                <Badge tone="green">Editável</Badge>
                              ) : (
                                <Badge tone="gray">
                                  <Lock size={11} /> Somente leitura
                                </Badge>
                              )}
                              <div className="row-actions">
                                {meu && (
                                  <>
                                    <IconButton
                                      label="Editar treino"
                                      icon={Pencil}
                                      onClick={() => abrirEdicaoTreino(treino)}
                                    />
                                    <IconButton
                                      label="Excluir treino"
                                      icon={Trash2}
                                      variant="danger"
                                      onClick={() => excluirTreino(treino)}
                                    />
                                  </>
                                )}
                                <button
                                  type="button"
                                  className="icon-btn icon-btn-ghost"
                                  onClick={() => setTreinoAbertoId(aberto ? null : treino.id_treino)}
                                  aria-label={aberto ? 'Recolher exercícios' : 'Ver exercícios'}
                                  title={aberto ? 'Recolher exercícios' : 'Ver exercícios'}
                                >
                                  <ChevronDown
                                    size={16}
                                    style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {aberto && (
                            <div className="ficha-body">
                              {lista.length === 0 ? (
                                <div className="ficha-empty">
                                  <ClipboardList size={20} />
                                  <span>Nenhum exercício nesta ficha ainda.</span>
                                  {meu && (
                                    <Button
                                      icon={Plus}
                                      variant="subtle"
                                      size="sm"
                                      onClick={() => abrirNovoExercicio(treino)}
                                    >
                                      Adicionar exercício
                                    </Button>
                                  )}
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
                                        {meu && <th className="align-right">Ações</th>}
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
                                          {meu && (
                                            <td data-label="Ações" className="align-right">
                                              <div className="row-actions">
                                                <IconButton
                                                  label="Editar exercício"
                                                  icon={Pencil}
                                                  onClick={() => abrirEdicaoExercicio(treino, exercicio)}
                                                />
                                                <IconButton
                                                  label="Excluir exercício"
                                                  icon={Trash2}
                                                  variant="danger"
                                                  onClick={() => excluirExercicio(treino, exercicio)}
                                                />
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {meu && lista.length > 0 && (
                                <div className="ficha-actions">
                                  <Button
                                    icon={Plus}
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => abrirNovoExercicio(treino)}
                                  >
                                    Adicionar exercício
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de treino */}
      <Modal
        open={modalTreino}
        onClose={() => setModalTreino(false)}
        title={treinoEditando ? 'Editar treino' : 'Novo treino'}
        description={
          treinoEditando
            ? 'Atualize o nome ou o status desta ficha.'
            : alunoSelecionado
              ? `A ficha será criada para ${nomeDoAluno(alunoSelecionado.id_aluno) || 'o aluno selecionado'} e assinada por você.`
              : 'Selecione um aluno.'
        }
      >
        <form onSubmit={salvarTreino} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Aluno">
            <Input
              value={
                treinoEditando
                  ? nomeDoAluno(treinoEditando.id_aluno) || `Aluno #${treinoEditando.id_aluno}`
                  : nomeDoAluno(alunoSelecionado?.id_aluno) || '—'
              }
              disabled
            />
          </Field>

          <Field label="Professor responsável">
            <Input value={sessao.usuario?.nome || 'Você'} disabled />
          </Field>

          <Field label="Nome do treino" required className="span-2">
            <Input
              value={formTreino.nome_treino}
              onChange={(e) => setFormTreino((f) => ({ ...f, nome_treino: e.target.value }))}
              placeholder="Ex.: Treino A — Hipertrofia"
              required
              autoFocus
            />
          </Field>

          <Field label="Status">
            <Select
              value={formTreino.status}
              onChange={(e) => setFormTreino((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUS_TREINO.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions
            onCancel={() => setModalTreino(false)}
            loading={salvando}
            submitLabel={treinoEditando ? 'Salvar alterações' : 'Criar treino'}
          />
        </form>
      </Modal>

      {/* Modal de exercício */}
      <Modal
        open={modalExercicio}
        onClose={() => setModalExercicio(false)}
        title={exercicioEditando ? 'Editar exercício' : 'Novo exercício'}
        description={
          treinoDoExercicio
            ? `Ficha: ${treinoDoExercicio.nome_treino}`
            : 'Adicione um exercício à ficha.'
        }
      >
        <form onSubmit={salvarExercicio} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Nome do exercício" required className="span-2">
            <Input
              value={formExercicio.nome_exercicio}
              onChange={(e) => setFormExercicio((f) => ({ ...f, nome_exercicio: e.target.value }))}
              placeholder="Ex.: Supino reto"
              required
              autoFocus
            />
          </Field>

          <Field label="Séries" required>
            <Input
              type="number"
              min="1"
              value={formExercicio.series}
              onChange={(e) => setFormExercicio((f) => ({ ...f, series: e.target.value }))}
              required
            />
          </Field>

          <Field label="Repetições" required>
            <Input
              value={formExercicio.repeticoes}
              onChange={(e) => setFormExercicio((f) => ({ ...f, repeticoes: e.target.value }))}
              placeholder="Ex.: 12 ou 8-10"
              required
            />
          </Field>

          <Field label="Carga">
            <Input
              value={formExercicio.carga}
              onChange={(e) => setFormExercicio((f) => ({ ...f, carga: e.target.value }))}
              placeholder="Ex.: 40 kg"
            />
          </Field>

          <Field label="Observações" className="span-2">
            <Textarea
              value={formExercicio.observacao}
              onChange={(e) => setFormExercicio((f) => ({ ...f, observacao: e.target.value }))}
              placeholder="Cadência, descanso, orientações…"
            />
          </Field>

          <FormActions
            onCancel={() => setModalExercicio(false)}
            loading={salvando}
            submitLabel={exercicioEditando ? 'Salvar alterações' : 'Adicionar exercício'}
          />
        </form>
      </Modal>
    </PortalLayout>
  )
}
