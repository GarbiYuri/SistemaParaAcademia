import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Activity, ListChecks } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { api } from '../services/api'
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
  Textarea,
  DataTable,
  PersonCell,
  EmptyState,
  FormActions,
} from '../components/ui.jsx'

const FORM_VAZIO = {
  id_treino: '',
  nome_exercicio: '',
  series: '3',
  repeticoes: '12',
  carga: '',
  observacao: '',
}

export default function Exercicios() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.exercicios.list(), api.treinos.list(), api.alunos.list(), api.usuarios.list()]),
  )
  const [exercicios = [], treinos = [], alunos = [], usuarios = []] = data || []

  const [busca, setBusca] = useState('')
  const treinoFiltro = searchParams.get('treino') || ''
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const mudarTreinoFiltro = (valor) => {
    const proximos = new URLSearchParams(searchParams)
    if (valor) proximos.set('treino', valor)
    else proximos.delete('treino')
    setSearchParams(proximos, { replace: true })
  }

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const alunoPorId = useMemo(() => Object.fromEntries(alunos.map((a) => [a.id_aluno, a])), [alunos])
  const treinoPorId = useMemo(() => Object.fromEntries(treinos.map((t) => [t.id_treino, t])), [treinos])

  const nomeAlunoDoTreino = (treino) => {
    const aluno = alunoPorId[treino?.id_aluno]
    return aluno ? usuarioPorId[aluno.id_usuario]?.nome : null
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return exercicios.filter((e) => {
      const combinaTreino = !treinoFiltro || String(e.id_treino) === String(treinoFiltro)
      if (!combinaTreino) return false
      if (!termo) return true
      return [e.nome_exercicio, e.repeticoes, e.carga, e.observacao, treinoPorId[e.id_treino]?.nome_treino]
        .some((campo) => String(campo || '').toLowerCase().includes(termo))
    })
  }, [exercicios, treinoFiltro, busca, treinoPorId])

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm({ ...FORM_VAZIO, id_treino: treinoFiltro || '' })
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (exercicio) => {
    setEditando(exercicio)
    setForm({
      id_treino: String(exercicio.id_treino ?? ''),
      nome_exercicio: exercicio.nome_exercicio || '',
      series: String(exercicio.series ?? 3),
      repeticoes: exercicio.repeticoes || '',
      carga: exercicio.carga || '',
      observacao: exercicio.observacao || '',
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
        id_treino: Number(form.id_treino),
        nome_exercicio: form.nome_exercicio.trim(),
        series: Number(form.series || 3),
        repeticoes: form.repeticoes.trim(),
        carga: form.carga.trim() || null,
        observacao: form.observacao.trim() || null,
      }
      if (editando) {
        await api.exercicios.update(editando.id_exercicio, payload)
        toast('Exercício atualizado com sucesso.')
      } else {
        await api.exercicios.create(payload)
        toast('Exercício adicionado ao treino.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (exercicio) => {
    if (!window.confirm(`Excluir o exercício "${exercicio.nome_exercicio}"?`)) return
    try {
      await api.exercicios.remove(exercicio.id_exercicio)
      toast('Exercício excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'exercicio',
      label: 'Exercício',
      render: (e) => (
        <PersonCell
          name={e.nome_exercicio}
          detail={e.observacao || `Exercício #${e.id_exercicio}`}
          color="linear-gradient(135deg,#a7f3d0,#34d399)"
        />
      ),
    },
    {
      key: 'treino',
      label: 'Treino',
      render: (e) => {
        const treino = treinoPorId[e.id_treino]
        if (!treino) return `Treino #${e.id_treino}`
        const aluno = nomeAlunoDoTreino(treino)
        return (
          <span className="chip">
            <ListChecks size={12} /> {treino.nome_treino}
            {aluno ? ` · ${aluno}` : ''}
          </span>
        )
      },
    },
    {
      key: 'series',
      label: 'Séries × Repetições',
      align: 'center',
      render: (e) => <span className="mono">{e.series} × {e.repeticoes}</span>,
    },
    {
      key: 'carga',
      label: 'Carga',
      align: 'right',
      render: (e) => (e.carga ? <span className="chip">{e.carga}</span> : <span className="muted">—</span>),
    },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (e) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(e)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(e)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Exercícios"
        subtitle="Monte as fichas com séries, repetições e cargas de cada treino."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo exercício
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar exercício, carga ou treino…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select className="input select filter-select" value={treinoFiltro} onChange={(e) => mudarTreinoFiltro(e.target.value)}>
            <option value="">Todos os treinos</option>
            {treinos.map((t) => (
              <option key={t.id_treino} value={t.id_treino}>
                {t.nome_treino} — {nomeAlunoDoTreino(t) || `Aluno #${t.id_aluno}`}
              </option>
            ))}
          </Select>
          <span className="counter-pill">{filtrados.length} exercício(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id_exercicio"
          empty={
            <EmptyState
              icon={Activity}
              title={busca || treinoFiltro ? 'Nenhum exercício encontrado' : 'Nenhum exercício cadastrado'}
              description={
                busca || treinoFiltro
                  ? 'Ajuste os filtros ou crie um novo exercício.'
                  : 'Adicione exercícios às fichas de treino dos alunos.'
              }
              action={
                <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                  Adicionar exercício
                </Button>
              }
            />
          }
        />
      </Card>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar exercício' : 'Novo exercício'}
        description="Cada exercício pertence a uma ficha de treino."
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Treino" required className="span-2">
            <Select value={form.id_treino} onChange={set('id_treino')} required>
              <option value="">Selecione o treino…</option>
              {treinos.map((t) => (
                <option key={t.id_treino} value={t.id_treino}>
                  {t.nome_treino} — {nomeAlunoDoTreino(t) || `Aluno #${t.id_aluno}`}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Nome do exercício" required className="span-2">
            <Input value={form.nome_exercicio} onChange={set('nome_exercicio')} placeholder="Ex.: Supino reto" required />
          </Field>

          <Field label="Séries" required>
            <Input type="number" min="1" value={form.series} onChange={set('series')} required />
          </Field>

          <Field label="Repetições" required>
            <Input value={form.repeticoes} onChange={set('repeticoes')} placeholder="Ex.: 12 ou 8-10" required />
          </Field>

          <Field label="Carga">
            <Input value={form.carga} onChange={set('carga')} placeholder="Ex.: 40 kg" />
          </Field>

          <Field label="Observação" className="span-2">
            <Textarea value={form.observacao} onChange={set('observacao')} placeholder="Cadência, descanso, observações do professor…" />
          </Field>

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Adicionar exercício'} />
        </form>
      </Modal>
    </>
  )
}
