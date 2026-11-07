import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, CalendarClock } from 'lucide-react'
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
  Badge,
  EmptyState,
  FormActions,
} from '../components/ui.jsx'

const FORMAS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'GymPass', 'TotalPass']
const STATUS = ['Ativo', 'Inativo', 'Suspenso', 'Inadimplente']

const FORM_VAZIO = {
  id_usuario: '',
  id_responsavel: '',
  forma_pagamento_preferida: 'Pix',
  status_matricula: 'Ativo',
  data_vencimento: '',
}

export default function Alunos() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.alunos.list(), api.usuarios.list(), api.responsaveis.list()]),
  )
  const [alunos = [], usuarios = [], responsaveis = []] = data || []

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const responsavelPorId = useMemo(
    () => Object.fromEntries(responsaveis.map((r) => [r.id_responsavel, r])),
    [responsaveis],
  )

  const usuariosDisponiveis = useMemo(
    () => usuarios.filter((u) => editando ? true : !alunos.some((a) => a.id_usuario === u.id)),
    [usuarios, alunos, editando],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return alunos
    return alunos.filter((a) => {
      const usuario = usuarioPorId[a.id_usuario]
      return [usuario?.nome, usuario?.email, a.status_matricula, a.forma_pagamento_preferida]
        .some((campo) => String(campo || '').toLowerCase().includes(termo))
    })
  }, [alunos, usuarioPorId, busca])

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (aluno) => {
    setEditando(aluno)
    setForm({
      id_usuario: String(aluno.id_usuario ?? ''),
      id_responsavel: String(aluno.id_responsavel ?? ''),
      forma_pagamento_preferida: aluno.forma_pagamento_preferida || 'Pix',
      status_matricula: aluno.status_matricula || 'Ativo',
      data_vencimento: String(aluno.data_vencimento || '').slice(0, 10),
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
        id_usuario: Number(form.id_usuario),
        id_responsavel: form.id_responsavel ? Number(form.id_responsavel) : null,
        forma_pagamento_preferida: form.forma_pagamento_preferida,
        status_matricula: form.status_matricula,
        data_vencimento: form.data_vencimento || null,
      }
      if (editando) {
        await api.alunos.update(editando.id_aluno, payload)
        toast('Aluno atualizado com sucesso.')
      } else {
        await api.alunos.create(payload)
        toast('Aluno matriculado com sucesso.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (aluno) => {
    const usuario = usuarioPorId[aluno.id_usuario]
    if (!window.confirm(`Excluir a matrícula de "${usuario?.nome || `Aluno #${aluno.id_aluno}`}"?`)) return
    try {
      await api.alunos.remove(aluno.id_aluno)
      toast('Aluno excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const hoje = new Date().toISOString().slice(0, 10)

  const columns = [
    {
      key: 'aluno',
      label: 'Aluno',
      render: (a) => {
        const usuario = usuarioPorId[a.id_usuario]
        return <PersonCell name={usuario?.nome || `Aluno #${a.id_aluno}`} detail={usuario?.email || 'Usuário vinculado'} />
      },
    },
    {
      key: 'responsavel',
      label: 'Responsável',
      render: (a) => {
        const r = responsavelPorId[a.id_responsavel]
        if (!r) return <span className="muted">—</span>
        return <PersonCell name={r.nome} detail={r.telefone || r.email} color="linear-gradient(135deg,#93c5fd,#38bdf8)" />
      },
    },
    {
      key: 'forma_pagamento_preferida',
      label: 'Forma de pagamento',
      render: (a) => (a.forma_pagamento_preferida ? <span className="chip">{a.forma_pagamento_preferida}</span> : '—'),
    },
    {
      key: 'status_matricula',
      label: 'Status',
      render: (a) => <StatusBadge status={a.status_matricula} />,
    },
    {
      key: 'data_vencimento',
      label: 'Vencimento',
      render: (a) => {
        if (!a.data_vencimento) return '—'
        const vencido = String(a.data_vencimento).slice(0, 10) < hoje && a.status_matricula === 'Ativo'
        return (
          <span className="chip">
            <CalendarClock size={12} /> {formatters.data(a.data_vencimento)}
            {vencido && <Badge tone="red">vencido</Badge>}
          </span>
        )
      },
    },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (a) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(a)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(a)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Alunos"
        subtitle="Matrículas, responsáveis e condições de pagamento dos alunos da academia."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo aluno
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar aluno por nome, e-mail ou status…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="counter-pill">{filtrados.length} aluno(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id_aluno"
          empty={
            <EmptyState
              title={busca ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
              description={busca ? 'Ajuste a busca e tente novamente.' : 'Matricule um aluno a partir de um usuário já cadastrado.'}
              action={
                !busca && (
                  <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                    Matricular aluno
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
        title={editando ? 'Editar aluno' : 'Novo aluno'}
        description="O aluno precisa estar vinculado a um usuário já cadastrado."
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Usuário" required className="span-2" hint={usuariosDisponiveis.length === 0 ? 'Todos os usuários já são alunos. Cadastre um novo usuário primeiro.' : undefined}>
            <Select value={form.id_usuario} onChange={set('id_usuario')} required>
              <option value="">Selecione o usuário…</option>
              {usuariosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} — {u.email}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Responsável" hint="Opcional, para alunos menores de idade.">
            <Select value={form.id_responsavel} onChange={set('id_responsavel')}>
              <option value="">Sem responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id_responsavel} value={r.id_responsavel}>
                  {r.nome} — {r.telefone || r.email}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Forma de pagamento preferida">
            <Select value={form.forma_pagamento_preferida} onChange={set('forma_pagamento_preferida')}>
              {FORMAS.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status da matrícula">
            <Select value={form.status_matricula} onChange={set('status_matricula')}>
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Data de vencimento">
            <Input type="date" value={form.data_vencimento} onChange={set('data_vencimento')} />
          </Field>

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Matricular aluno'} />
        </form>
      </Modal>
    </>
  )
}
