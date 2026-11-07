import { useCallback, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Wallet, TrendingUp, Clock3, Receipt } from 'lucide-react'
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

const FORMAS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'GymPass', 'TotalPass']
const STATUS = ['Pago', 'Pendente', 'Atrasado', 'Cancelado']

const hojeISO = () => {
  const agora = new Date()
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const FORM_VAZIO = { id_aluno: '', forma_pagamento: 'Pix', valor: '', data_pagamento: hojeISO(), status: 'Pago' }

export default function Pagamentos() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.pagamentos.list(), api.alunos.list(), api.usuarios.list()]),
  )
  const [pagamentos = [], alunos = [], usuarios = []] = data || []

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const usuarioPorId = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u])), [usuarios])
  const alunoPorId = useMemo(() => Object.fromEntries(alunos.map((a) => [a.id_aluno, a])), [alunos])

  const nomeAluno = useCallback(
    (id) => {
      const aluno = alunoPorId[id]
      return aluno ? usuarioPorId[aluno.id_usuario]?.nome : null
    },
    [alunoPorId, usuarioPorId],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return pagamentos
      .filter((p) => !statusFiltro || p.status === statusFiltro)
      .filter((p) => {
        if (!termo) return true
        return [nomeAluno(p.id_aluno), p.forma_pagamento, p.status, p.valor]
          .some((campo) => String(campo || '').toLowerCase().includes(termo))
      })
      .sort((a, b) => String(b.data_pagamento).localeCompare(String(a.data_pagamento)))
  }, [pagamentos, statusFiltro, busca, nomeAluno])

  const recebido = pagamentos.filter((p) => p.status === 'Pago').reduce((s, p) => s + Number(p.valor || 0), 0)
  const pendente = pagamentos.filter((p) => p.status === 'Pendente').reduce((s, p) => s + Number(p.valor || 0), 0)
  const atrasado = pagamentos.filter((p) => p.status === 'Atrasado').reduce((s, p) => s + Number(p.valor || 0), 0)

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm({ ...FORM_VAZIO, data_pagamento: hojeISO() })
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (pagamento) => {
    setEditando(pagamento)
    setForm({
      id_aluno: String(pagamento.id_aluno ?? ''),
      forma_pagamento: pagamento.forma_pagamento || 'Pix',
      valor: String(pagamento.valor ?? ''),
      data_pagamento: String(pagamento.data_pagamento || '').slice(0, 10),
      status: pagamento.status || 'Pago',
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
        forma_pagamento: form.forma_pagamento,
        valor: Number(form.valor),
        data_pagamento: form.data_pagamento || hojeISO(),
        status: form.status,
      }
      if (editando) {
        await api.pagamentos.update(editando.id_pagamento, payload)
        toast('Pagamento atualizado com sucesso.')
      } else {
        await api.pagamentos.create(payload)
        toast('Pagamento registrado com sucesso.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (pagamento) => {
    if (!window.confirm(`Excluir o pagamento de ${formatters.moeda(pagamento.valor)}?`)) return
    try {
      await api.pagamentos.remove(pagamento.id_pagamento)
      toast('Pagamento excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'aluno',
      label: 'Aluno',
      render: (p) => <PersonCell name={nomeAluno(p.id_aluno) || `Aluno #${p.id_aluno}`} detail={`Pagamento #${p.id_pagamento}`} />,
    },
    { key: 'forma_pagamento', label: 'Forma', render: (p) => <span className="chip">{p.forma_pagamento}</span> },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right',
      render: (p) => <span className="money">{formatters.moeda(p.valor)}</span>,
    },
    { key: 'data_pagamento', label: 'Data', render: (p) => formatters.data(p.data_pagamento) },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (p) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(p)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(p)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Pagamentos"
        subtitle="Mensalidades, formas de pagamento e situação do caixa da academia."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo pagamento
          </Button>
        }
      />

      <div className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon green"><TrendingUp size={19} /></span>
          </div>
          <div className="stat-value">{formatters.moeda(recebido)}</div>
          <div className="stat-label">Recebido</div>
          <div className="stat-hint">Pagamentos confirmados</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon amber"><Clock3 size={19} /></span>
          </div>
          <div className="stat-value">{formatters.moeda(pendente)}</div>
          <div className="stat-label">Pendente</div>
          <div className="stat-hint">Aguardando pagamento</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon red"><Receipt size={19} /></span>
          </div>
          <div className="stat-value">{formatters.moeda(atrasado)}</div>
          <div className="stat-label">Em atraso</div>
          <div className="stat-hint">Cobranças vencidas</div>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon blue"><Wallet size={19} /></span>
          </div>
          <div className="stat-value">{pagamentos.length}</div>
          <div className="stat-label">Lançamentos</div>
          <div className="stat-hint">Total de registros</div>
        </article>
      </div>

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar por aluno, forma ou valor…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select className="input select filter-select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <span className="counter-pill">{filtrados.length} lançamento(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id_pagamento"
          empty={
            <EmptyState
              icon={Wallet}
              title={busca || statusFiltro ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento registrado'}
              description={busca || statusFiltro ? 'Ajuste os filtros e tente novamente.' : 'Registre a primeira mensalidade da academia.'}
              action={
                <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                  Registrar pagamento
                </Button>
              }
            />
          }
        />
      </Card>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar pagamento' : 'Novo pagamento'}
        description="Valores devem ser maiores que zero."
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <Field label="Aluno" required className="span-2">
            <Select value={form.id_aluno} onChange={set('id_aluno')} required>
              <option value="">Selecione o aluno…</option>
              {alunos.map((a) => (
                <option key={a.id_aluno} value={a.id_aluno}>
                  {nomeAluno(a.id_aluno) || `Aluno #${a.id_aluno}`}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Forma de pagamento" required>
            <Select value={form.forma_pagamento} onChange={set('forma_pagamento')} required>
              {FORMAS.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Valor (R$)" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.valor}
              onChange={set('valor')}
              placeholder="0,00"
              required
            />
          </Field>

          <Field label="Data do pagamento" required hint="Sempre enviada como data para manter a listagem do backend consistente.">
            <Input type="date" value={form.data_pagamento} onChange={set('data_pagamento')} required />
          </Field>

          <Field label="Status" required>
            <Select value={form.status} onChange={set('status')} required>
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Registrar pagamento'} />
        </form>
      </Modal>
    </>
  )
}
