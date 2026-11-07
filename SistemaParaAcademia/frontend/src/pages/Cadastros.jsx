import { useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  BriefcaseBusiness,
  UserRound,
  Clock,
  Phone,
  Mail,
} from 'lucide-react'
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

const TABS = [
  { id: 'cargos', label: 'Cargos', icon: BriefcaseBusiness },
  { id: 'enderecos', label: 'Endereços', icon: MapPin },
  { id: 'responsaveis', label: 'Responsáveis', icon: UserRound },
  { id: 'academia', label: 'Academia', icon: Building2 },
]

/* -------------------------------------------------------------------------- */
/* Cargos                                                                     */
/* -------------------------------------------------------------------------- */

const CARGO_VAZIO = { nome_cargo: '', salario_base: '', status: 'Ativo' }

function CargosTab() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => api.cargos.list())
  const cargos = useMemo(() => data || [], [data])

  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(CARGO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return cargos
    return cargos.filter((c) => [c.nome_cargo, c.status].some((v) => String(v || '').toLowerCase().includes(termo)))
  }, [cargos, busca])

  const set = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(CARGO_VAZIO)
    setErroForm('')
    setAberto(true)
  }

  const abrirEdicao = (cargo) => {
    setEditando(cargo)
    setForm({ nome_cargo: cargo.nome_cargo, salario_base: String(cargo.salario_base ?? ''), status: cargo.status })
    setErroForm('')
    setAberto(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const payload = {
        nome_cargo: form.nome_cargo.trim(),
        salario_base: Number(form.salario_base),
        status: form.status,
      }
      if (editando) {
        await api.cargos.update(editando.id_cargo, payload)
        toast('Cargo atualizado.')
      } else {
        await api.cargos.create(payload)
        toast('Cargo cadastrado.')
      }
      setAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (cargo) => {
    if (!window.confirm(`Excluir o cargo "${cargo.nome_cargo}"?`)) return
    try {
      await api.cargos.remove(cargo.id_cargo)
      toast('Cargo excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'nome_cargo',
      label: 'Cargo',
      render: (c) => <PersonCell name={c.nome_cargo} detail={`Cargo #${c.id_cargo}`} color="linear-gradient(135deg,#fde68a,#f59e0b)" />,
    },
    {
      key: 'salario_base',
      label: 'Salário base',
      align: 'right',
      render: (c) => <span className="money">{formatters.moeda(c.salario_base)}</span>,
    },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (c) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(c)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(c)} />
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <Input placeholder="Buscar cargo…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={abrirNovo}>Novo cargo</Button>
      </div>
      <DataTable
        columns={columns}
        rows={filtrados}
        loading={loading}
        error={error}
        onRetry={reload}
        rowKey="id_cargo"
        empty={<EmptyState title="Nenhum cargo cadastrado" description="Cadastre cargos para vincular aos funcionários." />}
      />

      <Modal open={aberto} onClose={() => setAberto(false)} title={editando ? 'Editar cargo' : 'Novo cargo'}>
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}
          <Field label="Nome do cargo" required className="span-2">
            <Input value={form.nome_cargo} onChange={set('nome_cargo')} placeholder="Ex.: Professor de Musculação" required />
          </Field>
          <Field label="Salário base (R$)" required>
            <Input type="number" min="0" step="0.01" value={form.salario_base} onChange={set('salario_base')} required />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </Select>
          </Field>
          <FormActions onCancel={() => setAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar cargo'} />
        </form>
      </Modal>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Endereços                                                                  */
/* -------------------------------------------------------------------------- */

const ENDERECO_VAZIO = { pais: 'Brasil', estado: '', cidade: '', bairro: '', rua: '', numero: '', complemento: '' }

function EnderecosTab() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => api.enderecos.list())
  const enderecos = useMemo(() => data || [], [data])

  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(ENDERECO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return enderecos
    return enderecos.filter((e) =>
      [e.rua, e.bairro, e.cidade, e.estado, e.pais].some((v) => String(v || '').toLowerCase().includes(termo)),
    )
  }, [enderecos, busca])

  const set = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(ENDERECO_VAZIO)
    setErroForm('')
    setAberto(true)
  }

  const abrirEdicao = (endereco) => {
    setEditando(endereco)
    setForm({
      pais: endereco.pais || '',
      estado: endereco.estado || '',
      cidade: endereco.cidade || '',
      bairro: endereco.bairro || '',
      rua: endereco.rua || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
    })
    setErroForm('')
    setAberto(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const payload = { ...form, nome: undefined }
      if (editando) {
        await api.enderecos.update(editando.id, payload)
        toast('Endereço atualizado.')
      } else {
        await api.enderecos.create(payload)
        toast('Endereço cadastrado.')
      }
      setAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (endereco) => {
    if (!window.confirm(`Excluir o endereço #${endereco.id}?`)) return
    try {
      await api.enderecos.remove(endereco.id)
      toast('Endereço excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'logradouro',
      label: 'Endereço',
      render: (e) => <PersonCell name={`${e.rua}, ${e.numero}`} detail={e.complemento || `Endereço #${e.id}`} color="linear-gradient(135deg,#93c5fd,#3b82f6)" />,
    },
    { key: 'bairro', label: 'Bairro', render: (e) => e.bairro || '—' },
    { key: 'cidade', label: 'Cidade/UF', render: (e) => `${e.cidade || '—'}/${e.estado || '—'}` },
    { key: 'pais', label: 'País', render: (e) => e.pais || '—' },
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
    <Card>
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <Input placeholder="Buscar por rua, bairro ou cidade…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={abrirNovo}>Novo endereço</Button>
      </div>
      <DataTable
        columns={columns}
        rows={filtrados}
        loading={loading}
        error={error}
        onRetry={reload}
        rowKey="id"
        empty={<EmptyState title="Nenhum endereço cadastrado" description="Endereços são usados por usuários e pela academia." />}
      />

      <Modal open={aberto} onClose={() => setAberto(false)} title={editando ? 'Editar endereço' : 'Novo endereço'}>
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}
          <Field label="País" required>
            <Input value={form.pais} onChange={set('pais')} required />
          </Field>
          <Field label="Estado (UF)" required>
            <Input value={form.estado} onChange={set('estado')} placeholder="SP" required />
          </Field>
          <Field label="Cidade" required>
            <Input value={form.cidade} onChange={set('cidade')} required />
          </Field>
          <Field label="Bairro" required>
            <Input value={form.bairro} onChange={set('bairro')} required />
          </Field>
          <Field label="Rua" required>
            <Input value={form.rua} onChange={set('rua')} required />
          </Field>
          <Field label="Número" required>
            <Input value={form.numero} onChange={set('numero')} required />
          </Field>
          <Field label="Complemento" className="span-2">
            <Input value={form.complemento} onChange={set('complemento')} />
          </Field>
          <FormActions onCancel={() => setAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar endereço'} />
        </form>
      </Modal>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Responsáveis                                                               */
/* -------------------------------------------------------------------------- */

const RESPONSAVEL_VAZIO = { nome: '', cpf: '', telefone: '', email: '' }

function ResponsaveisTab() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => api.responsaveis.list())
  const responsaveis = useMemo(() => data || [], [data])

  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(RESPONSAVEL_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return responsaveis
    return responsaveis.filter((r) =>
      [r.nome, r.cpf, r.email, r.telefone].some((v) => String(v || '').toLowerCase().includes(termo)),
    )
  }, [responsaveis, busca])

  const set = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(RESPONSAVEL_VAZIO)
    setErroForm('')
    setAberto(true)
  }

  const abrirEdicao = (responsavel) => {
    setEditando(responsavel)
    setForm({
      nome: responsavel.nome || '',
      cpf: responsavel.cpf || '',
      telefone: responsavel.telefone || '',
      email: responsavel.email || '',
    })
    setErroForm('')
    setAberto(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const payload = {
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        telefone: form.telefone.trim() || null,
        email: form.email.trim(),
      }
      if (editando) {
        await api.responsaveis.update(editando.id_responsavel, payload)
        toast('Responsável atualizado.')
      } else {
        await api.responsaveis.create(payload)
        toast('Responsável cadastrado.')
      }
      setAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (responsavel) => {
    if (!window.confirm(`Excluir o responsável "${responsavel.nome}"?`)) return
    try {
      await api.responsaveis.remove(responsavel.id_responsavel)
      toast('Responsável excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'nome',
      label: 'Responsável',
      render: (r) => <PersonCell name={r.nome} detail={r.email} color="linear-gradient(135deg,#c4b5fd,#8b5cf6)" />,
    },
    { key: 'cpf', label: 'CPF', render: (r) => <span className="mono">{r.cpf || '—'}</span> },
    { key: 'telefone', label: 'Telefone', render: (r) => r.telefone || '—' },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (r) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(r)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(r)} />
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <Input placeholder="Buscar por nome, CPF ou e-mail…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Button icon={Plus} onClick={abrirNovo}>Novo responsável</Button>
      </div>
      <DataTable
        columns={columns}
        rows={filtrados}
        loading={loading}
        error={error}
        onRetry={reload}
        rowKey="id_responsavel"
        empty={<EmptyState title="Nenhum responsável cadastrado" description="Responsáveis podem ser vinculados a alunos e funcionários." />}
      />

      <Modal open={aberto} onClose={() => setAberto(false)} title={editando ? 'Editar responsável' : 'Novo responsável'}>
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}
          <Field label="Nome completo" required className="span-2">
            <Input value={form.nome} onChange={set('nome')} required />
          </Field>
          <Field label="CPF" required>
            <Input value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" required />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="E-mail" required className="span-2">
            <Input type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <FormActions onCancel={() => setAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar responsável'} />
        </form>
      </Modal>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/* Academia                                                                   */
/* -------------------------------------------------------------------------- */

const ACADEMIA_VAZIA = {
  idEndereco: '',
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  horaAbertura: '06:00',
  horaFechamento: '22:00',
}

function AcademiaTab() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.academias.list(), api.enderecos.list()]),
  )
  const [academias = [], enderecos = []] = data || []

  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(ACADEMIA_VAZIA)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const enderecoPorId = useMemo(() => Object.fromEntries(enderecos.map((e) => [e.id, e])), [enderecos])

  const set = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(ACADEMIA_VAZIA)
    setErroForm('')
    setAberto(true)
  }

  const abrirEdicao = (academia) => {
    setEditando(academia)
    setForm({
      idEndereco: String(academia.idEndereco ?? ''),
      nome: academia.nome || '',
      cnpj: academia.cnpj || '',
      email: academia.email || '',
      telefone: academia.telefone || '',
      horaAbertura: formatters.hora(academia.horaAbertura) === '—' ? '' : formatters.hora(academia.horaAbertura),
      horaFechamento: formatters.hora(academia.horaFechamento) === '—' ? '' : formatters.hora(academia.horaFechamento),
    })
    setErroForm('')
    setAberto(true)
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const payload = {
        idEndereco: Number(form.idEndereco),
        nome: form.nome.trim(),
        cnpj: form.cnpj.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        horaAbertura: form.horaAbertura,
        horaFechamento: form.horaFechamento,
      }
      if (editando) {
        await api.academias.update(editando.id, payload)
        toast('Dados da academia atualizados.')
      } else {
        await api.academias.create(payload)
        toast('Academia cadastrada.')
      }
      setAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (academia) => {
    if (!window.confirm(`Excluir a academia "${academia.nome}"?`)) return
    try {
      await api.academias.remove(academia.id)
      toast('Academia excluída.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="stack">
      <Card>
        <div className="panel-head">
          <div>
            <h2>Unidades cadastradas</h2>
            <p>Dados institucionais usados no sistema</p>
          </div>
          <Button icon={Plus} onClick={abrirNovo}>Nova academia</Button>
        </div>

        {loading ? (
          <DataTable columns={[]} rows={[]} loading />
        ) : error ? (
          <EmptyState title="Erro ao carregar" description={error} action={<Button variant="subtle" size="sm" onClick={reload}>Tentar novamente</Button>} />
        ) : academias.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma academia cadastrada"
            description="Cadastre a unidade para exibir os dados no dashboard."
            action={<Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>Cadastrar academia</Button>}
          />
        ) : (
          <div className="stack">
            {academias.map((academia) => {
              const endereco = enderecoPorId[academia.idEndereco]
              return (
                <div
                  key={academia.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 18,
                    background: 'rgba(255,255,255,.02)',
                  }}
                >
                  <div className="panel-head" style={{ marginBottom: 12 }}>
                    <div>
                      <h3>{academia.nome}</h3>
                      <p>CNPJ {academia.cnpj || '—'} · Academia #{academia.id}</p>
                    </div>
                    <div className="row-actions">
                      <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(academia)} />
                      <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(academia)} />
                    </div>
                  </div>
                  <div className="academy-lines">
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
                      <span>{formatters.hora(academia.horaAbertura)} — {formatters.hora(academia.horaFechamento)}</span>
                    </div>
                    <div className="academy-line">
                      <span><MapPin size={14} /> Endereço</span>
                      <span>
                        {endereco
                          ? `${endereco.rua}, ${endereco.numero} — ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`
                          : `#${academia.idEndereco}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={aberto} onClose={() => setAberto(false)} title={editando ? 'Editar academia' : 'Nova academia'} wide>
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <span className="form-section-label">Identificação</span>
          <Field label="Nome" required className="span-2">
            <Input value={form.nome} onChange={set('nome')} placeholder="Ex.: FATECFit — Unidade Centro" required />
          </Field>
          <Field label="CNPJ" required>
            <Input value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00" required />
          </Field>
          <Field label="Telefone" required>
            <Input value={form.telefone} onChange={set('telefone')} placeholder="(11) 3333-4444" required />
          </Field>
          <Field label="E-mail" required className="span-2">
            <Input type="email" value={form.email} onChange={set('email')} required />
          </Field>

          <span className="form-section-label">Funcionamento</span>
          <Field label="Hora de abertura" required>
            <Input type="time" value={form.horaAbertura} onChange={set('horaAbertura')} required />
          </Field>
          <Field label="Hora de fechamento" required>
            <Input type="time" value={form.horaFechamento} onChange={set('horaFechamento')} required />
          </Field>

          <span className="form-section-label">Endereço</span>
          <Field label="Endereço cadastrado" required className="span-2">
            <Select value={form.idEndereco} onChange={set('idEndereco')} required>
              <option value="">Selecione o endereço…</option>
              {enderecos.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.id} — {e.rua}, {e.numero} · {e.bairro}, {e.cidade}/{e.estado}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions onCancel={() => setAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar academia'} />
        </form>
      </Modal>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Página                                                                     */
/* -------------------------------------------------------------------------- */

export default function Cadastros() {
  const [tab, setTab] = useState('cargos')

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Cadastros"
        subtitle="Tabelas de apoio do sistema: cargos, endereços, responsáveis e dados da academia."
      />

      <div className="tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'cargos' && <CargosTab />}
      {tab === 'enderecos' && <EnderecosTab />}
      {tab === 'responsaveis' && <ResponsaveisTab />}
      {tab === 'academia' && <AcademiaTab />}
    </>
  )
}
