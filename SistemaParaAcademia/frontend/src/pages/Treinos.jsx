import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, ListChecks, Dumbbell } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { api, formatters } from '../services/api'
import { useToast } from '../components/Toast.jsx'
import {
  PageHeader,
  Card,
  Button,
  IconButton,
  Modal,
  Field,
  Input,
  Select,
  DataTable,
  PersonCell,
  StatusBadge,
  EmptyState,
  FormActions,
} from '../components/ui.jsx'

const STATUS = ['Ativo', 'Inativo', 'Concluído', 'Suspenso']

const FORM_VAZIO = { id_aluno: '', id_professor: '', nome_treino: '', status: 'Ativo' }

export default function Treinos() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        api.treinos.list(),
        api.alunos.list(),
        api.usuarios.list(),
        api.funcionarios.list(),
        api.exercicios.list(),
      ]),
  )
  const [treinos = [], alunos = [], usuarios = [], funcionarios = [], exercicios = []] = data || []

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const alunoPorId = useMemo(() => Object.fromEntries(alunos.map((a) => [a.id_aluno, a])), [alunos])
  const funcionarioPorId = useMemo(
    () => Object.fromEntries(funcionarios.map((f) => [f.id_funcionario, f])),
    [funcionarios],
  )

  const nomeAluno = useCallback(
    (id) => {
      const aluno = alunoPorId[id]
      return aluno ? usuarioPorId[aluno.id_usuario]?.nome : null
    },
    [alunoPorId, usuarioPorId],
  )
  const nomeProfessor = useCallback(
    (id) => {
      const funcionario = funcionarioPorId[id]
      return funcionario ? usuarioPorId[funcionario.id_usuario]?.nome : null
    },
    [funcionarioPorId, usuarioPorId],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return treinos
    return treinos.filter((t) =>
      [t.nome_treino, t.status, nomeAluno(t.id_aluno), nomeProfessor(t.id_professor)]
        .some((campo) => String(campo || '').toLowerCase().includes(termo)),
    )
  }, [treinos, busca, nomeAluno, nomeProfessor])

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (treino) => {
    setEditando(treino)
    setForm({
      id_aluno: String(treino.id_aluno ?? ''),
      id_professor: String(treino.id_professor ?? ''),
      nome_treino: treino.nome_treino || '',
      status: treino.status || 'Ativo',
    })
    setErroForm('')
    setModalAberto(true)
  }

  const salvar = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const payload = {
        id_aluno: Number(form.id_aluno),
        id_professor: Number(form.id_professor),
        nome_treino: form.nome_treino.trim(),
        status: form.status,
      }
      if (editando) {
        await api.treinos.update(editando.id_treino, payload)
        toast('Treino atualizado com sucesso.')
      } else {
        await api.treinos.create(payload)
        toast('Treino criado com sucesso.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (treino) => {
    if (!window.confirm(`Excluir o treino "${treino.nome_treino}"?`)) return
    try {
      await api.treinos.remove(treino.id_treino)
      toast('Treino excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'treino',
      label: 'Treino',
      render: (t) => (
        <div className="person-cell">
          <span className="avatar" style={{ background: 'linear-gradient(135deg,#d7ff7a,#34d399)' }}>
            <Dumbbell size={15} />
          </span>
          <span className="person-text">
            <strong>{t.nome_treino}</strong>
            <small>Ficha #{t.id_treino}</small>
          </span>
        </div>
      ),
    },
    {
      key: 'aluno',
      label: 'Aluno',
      render: (t) => <PersonCell name={nomeAluno(t.id_aluno) || `Aluno #${t.id_aluno}`} />,
    },
    {
      key: 'professor',
      label: 'Professor',
      render: (t) => (nomeProfessor(t.id_professor) || `Funcionário #${t.id_professor}`),
    },
    {
      key: 'exercicios',
      label: 'Exercícios',
      align: 'center',
      render: (t) => (
        <span className="chip">
          <ListChecks size={12} /> {exercicios.filter((e) => e.id_treino === t.id_treino).length}
        </span>
      ),
    },
    { key: 'data_criacao', label: 'Criado em', render: (t) => formatters.data(t.data_criacao) },
    { key: 'status', label: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (t) => (
        <div className="row-actions">
          <Link to={`/exercicios?treino=${t.id_treino}`} className="icon-btn icon-btn-ghost" title="Ver exercícios">
            <ListChecks size={16} />
          </Link>
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(t)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(t)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Treinos"
        subtitle="Fichas de treino prescritas pelos professores para cada aluno."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo treino
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar por treino, aluno ou professor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="counter-pill">{filtrados.length} treino(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id_treino"
          empty={
            <EmptyState
              title={busca ? 'Nenhum treino encontrado' : 'Nenhum treino criado'}
              description={busca ? 'Ajuste a busca e tente novamente.' : 'Crie a primeira ficha de treino da academia.'}
              action={
                !busca && (
                  <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                    Criar treino
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar treino' : 'Novo treino'}
        description="Vincule a ficha a um aluno e a um professor (funcionário)."
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Nome do treino" required className="span-2">
            <Input value={form.nome_treino} onChange={set('nome_treino')} placeholder="Ex.: Treino A — Hipertrofia" required />
          </Field>

          <Field label="Aluno" required>
            <Select value={form.id_aluno} onChange={set('id_aluno')} required>
              <option value="">Selecione o aluno…</option>
              {alunos.map((a) => (
                <option key={a.id_aluno} value={a.id_aluno}>
                  {nomeAluno(a.id_aluno) || `Aluno #${a.id_aluno}`}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Professor" required>
            <Select value={form.id_professor} onChange={set('id_professor')} required>
              <option value="">Selecione o professor…</option>
              {funcionarios.map((f) => (
                <option key={f.id_funcionario} value={f.id_funcionario}>
                  {nomeProfessor(f.id_funcionario) || `Funcionário #${f.id_funcionario}`}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Observação" hint="A data de criação é definida automaticamente pelo servidor." className="span-2">
            <Input value={editando ? formatters.data(editando.data_criacao) : 'Hoje'} disabled />
          </Field>

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Criar treino'} />
        </form>
      </Modal>
    </>
  )
}
