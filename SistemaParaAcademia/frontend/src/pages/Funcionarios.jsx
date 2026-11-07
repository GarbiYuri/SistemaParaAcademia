import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
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
  EmptyState,
  FormActions,
} from '../components/ui.jsx'

const FORM_VAZIO = { id_usuario: '', id_cargo: '', id_responsavel: '', valor_hora: '' }

export default function Funcionarios() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.funcionarios.list(), api.usuarios.list(), api.cargos.list(), api.responsaveis.list()]),
  )
  const [funcionarios = [], usuarios = [], cargos = [], responsaveis = []] = data || []

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const cargoPorId = useMemo(() => Object.fromEntries(cargos.map((c) => [c.id_cargo, c])), [cargos])
  const responsavelPorId = useMemo(
    () => Object.fromEntries(responsaveis.map((r) => [r.id_responsavel, r])),
    [responsaveis],
  )

  const usuariosDisponiveis = useMemo(
    () => usuarios.filter((u) => editando ? true : !funcionarios.some((f) => f.id_usuario === u.id)),
    [usuarios, funcionarios, editando],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return funcionarios
    return funcionarios.filter((f) => {
      const usuario = usuarioPorId[f.id_usuario]
      const cargo = cargoPorId[f.id_cargo]
      return [usuario?.nome, usuario?.email, cargo?.nome_cargo]
        .some((campo) => String(campo || '').toLowerCase().includes(termo))
    })
  }, [funcionarios, usuarioPorId, cargoPorId, busca])

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (funcionario) => {
    setEditando(funcionario)
    setForm({
      id_usuario: String(funcionario.id_usuario ?? ''),
      id_cargo: String(funcionario.id_cargo ?? ''),
      id_responsavel: String(funcionario.id_responsavel ?? ''),
      valor_hora: funcionario.valor_hora > 0 ? String(funcionario.valor_hora) : '',
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
        id_cargo: Number(form.id_cargo),
        id_responsavel: form.id_responsavel ? Number(form.id_responsavel) : null,
        valor_hora: form.valor_hora === '' ? null : Number(form.valor_hora),
      }
      if (editando) {
        await api.funcionarios.update(editando.id_funcionario, payload)
        toast('Funcionário atualizado com sucesso.')
      } else {
        await api.funcionarios.create(payload)
        toast('Funcionário cadastrado com sucesso.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (funcionario) => {
    const usuario = usuarioPorId[funcionario.id_usuario]
    if (!window.confirm(`Excluir o funcionário "${usuario?.nome || `#${funcionario.id_funcionario}`}"?`)) return
    try {
      await api.funcionarios.remove(funcionario.id_funcionario)
      toast('Funcionário excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'funcionario',
      label: 'Funcionário',
      render: (f) => {
        const usuario = usuarioPorId[f.id_usuario]
        return <PersonCell name={usuario?.nome || `Funcionário #${f.id_funcionario}`} detail={usuario?.email || 'Usuário vinculado'} />
      },
    },
    {
      key: 'cargo',
      label: 'Cargo',
      render: (f) => {
        const cargo = cargoPorId[f.id_cargo]
        if (!cargo) return '—'
        return (
          <span className="chip">
            {cargo.nome_cargo} · {formatters.moeda(cargo.salario_base)}
          </span>
        )
      },
    },
    {
      key: 'responsavel',
      label: 'Responsável',
      render: (f) => responsavelPorId[f.id_responsavel]?.nome || <span className="muted">—</span>,
    },
    {
      key: 'valor_hora',
      label: 'Valor/hora',
      align: 'right',
      render: (f) => (f.valor_hora > 0 ? <span className="money">{formatters.moeda(f.valor_hora)}</span> : <span className="muted">—</span>),
    },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (f) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(f)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(f)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Funcionários"
        subtitle="Equipe da academia, cargos e valores de hora trabalhada."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo funcionário
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar por nome, e-mail ou cargo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="counter-pill">{filtrados.length} funcionário(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id_funcionario"
          empty={
            <EmptyState
              title={busca ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
              description={busca ? 'Ajuste a busca e tente novamente.' : 'Vincule um usuário a um cargo para montar a equipe.'}
              action={
                !busca && (
                  <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                    Cadastrar funcionário
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
        title={editando ? 'Editar funcionário' : 'Novo funcionário'}
        description="O funcionário precisa estar vinculado a um usuário e a um cargo."
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Usuário" required className="span-2">
            <Select value={form.id_usuario} onChange={set('id_usuario')} required>
              <option value="">Selecione o usuário…</option>
              {usuariosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} — {u.email}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Cargo" required>
            <Select value={form.id_cargo} onChange={set('id_cargo')} required>
              <option value="">Selecione o cargo…</option>
              {cargos.map((c) => (
                <option key={c.id_cargo} value={c.id_cargo}>
                  {c.nome_cargo} — {formatters.moeda(c.salario_base)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Responsável" hint="Opcional.">
            <Select value={form.id_responsavel} onChange={set('id_responsavel')}>
              <option value="">Sem responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id_responsavel} value={r.id_responsavel}>
                  {r.nome}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Valor da hora (R$)" hint="Deixe em branco se não se aplica. Deve ser maior que zero.">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.valor_hora}
              onChange={set('valor_hora')}
              placeholder="Ex.: 35,00"
            />
          </Field>

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar funcionário'} />
        </form>
      </Modal>
    </>
  )
}
