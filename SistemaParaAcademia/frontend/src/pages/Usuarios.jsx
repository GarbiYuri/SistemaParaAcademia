import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, MapPin } from 'lucide-react'
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

const FORM_VAZIO = {
  nome: '',
  cpf: '',
  email: '',
  senha: '',
  dataNascimento: '',
  enderecoModo: 'novo',
  id_endereco: '',
  pais: 'Brasil',
  estado: '',
  cidade: '',
  bairro: '',
  rua: '',
  numero: '',
  complemento: '',
}

export default function Usuarios() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.usuarios.list(), api.enderecos.list()]),
  )
  const [usuarios = [], enderecos = []] = data || []

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const enderecoPorId = useMemo(() => Object.fromEntries(enderecos.map((e) => [e.id, e])), [enderecos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return usuarios
    return usuarios.filter((u) =>
      [u.nome, u.email, u.cpf].some((campo) => String(campo || '').toLowerCase().includes(termo)),
    )
  }, [usuarios, busca])

  const set = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }))

  const abrirNovo = () => {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (usuario) => {
    setEditando(usuario)
    setForm({
      ...FORM_VAZIO,
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
      senha: '',
      dataNascimento: String(usuario.dataNascimento || '').slice(0, 10),
      enderecoModo: 'existente',
      id_endereco: String(usuario.id_endereco ?? ''),
    })
    setErroForm('')
    setModalAberto(true)
  }

  const salvar = async (event) => {
    event.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      let id_endereco = Number(form.id_endereco)
      if (form.enderecoModo === 'novo') {
        const endereco = await api.enderecos.create({
          pais: form.pais,
          estado: form.estado,
          cidade: form.cidade,
          bairro: form.bairro,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
        })
        id_endereco = endereco.id
      }

      if (!id_endereco) throw new Error('Selecione ou cadastre um endereço.')

      const payload = {
        id_endereco,
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        email: form.email.trim(),
        senha: form.senha,
        dataNascimento: form.dataNascimento,
      }

      if (editando) {
        await api.usuarios.update(editando.id, payload)
        toast('Usuário atualizado com sucesso.')
      } else {
        await api.usuarios.create(payload)
        toast('Usuário cadastrado com sucesso.')
      }
      setModalAberto(false)
      reload()
    } catch (err) {
      setErroForm(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (usuario) => {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"?`)) return
    try {
      await api.usuarios.remove(usuario.id)
      toast('Usuário excluído.')
      reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'nome',
      label: 'Usuário',
      render: (u) => <PersonCell name={u.nome} detail={u.email} />,
    },
    { key: 'cpf', label: 'CPF', render: (u) => <span className="mono">{u.cpf || '—'}</span> },
    { key: 'dataNascimento', label: 'Nascimento', render: (u) => formatters.data(u.dataNascimento) },
    { key: 'dataCadastro', label: 'Cadastro', render: (u) => formatters.data(u.dataCadastro) },
    {
      key: 'endereco',
      label: 'Endereço',
      render: (u) => {
        const e = enderecoPorId[u.id_endereco]
        if (!e) return '—'
        return (
          <span className="chip">
            <MapPin size={12} /> {e.cidade} · {e.bairro}
          </span>
        )
      },
    },
    {
      key: 'acoes',
      label: 'Ações',
      align: 'right',
      render: (u) => (
        <div className="row-actions">
          <IconButton label="Editar" icon={Pencil} onClick={() => abrirEdicao(u)} />
          <IconButton label="Excluir" icon={Trash2} variant="danger" onClick={() => excluir(u)} />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Usuários"
        subtitle="Pessoas cadastradas no sistema. Alunos e funcionários partem de um usuário."
        actions={
          <Button icon={Plus} onClick={abrirNovo}>
            Novo usuário
          </Button>
        }
      />

      <Card>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <Input placeholder="Buscar por nome, e-mail ou CPF…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <span className="counter-pill">{filtrados.length} usuário(s)</span>
        </div>

        <DataTable
          columns={columns}
          rows={filtrados}
          loading={loading}
          error={error}
          onRetry={reload}
          rowKey="id"
          empty={
            <EmptyState
              title={busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              description={busca ? 'Ajuste a busca e tente novamente.' : 'Comece cadastrando o primeiro usuário.'}
              action={
                !busca && (
                  <Button icon={Plus} variant="subtle" size="sm" onClick={abrirNovo}>
                    Cadastrar usuário
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
        title={editando ? 'Editar usuário' : 'Novo usuário'}
        description={editando ? 'Atualize os dados cadastrais e o endereço.' : 'Crie a pessoa que poderá ser aluno ou funcionário.'}
        wide
      >
        <form onSubmit={salvar} className="form-grid">
          {erroForm && <div className="form-error">{erroForm}</div>}

          <span className="form-section-label">Dados pessoais</span>
          <Field label="Nome completo" required className="span-2">
            <Input value={form.nome} onChange={set('nome')} placeholder="Ex.: Maria Eduarda Silva" required />
          </Field>
          <Field label="CPF" required>
            <Input value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" required />
          </Field>
          <Field label="Data de nascimento" required>
            <Input type="date" value={form.dataNascimento} onChange={set('dataNascimento')} required />
          </Field>
          <Field label="E-mail" required>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="pessoa@email.com" required />
          </Field>
          <Field
            label={editando ? 'Nova senha' : 'Senha'}
            required
            hint={editando ? 'A senha é re-hashada a cada salvamento.' : 'Mínimo de 4 caracteres.'}
          >
            <Input
              type="password"
              value={form.senha}
              onChange={set('senha')}
              placeholder="••••••••"
              minLength={4}
              required
            />
          </Field>

          <span className="form-section-label">Endereço</span>
          <Field label="Como informar o endereço" className="span-2">
            <Select value={form.enderecoModo} onChange={set('enderecoModo')}>
              <option value="novo">Cadastrar novo endereço</option>
              <option value="existente">Usar endereço já cadastrado</option>
            </Select>
          </Field>

          {form.enderecoModo === 'existente' ? (
            <Field label="Endereço cadastrado" required className="span-2">
              <Select value={form.id_endereco} onChange={set('id_endereco')} required>
                <option value="">Selecione…</option>
                {enderecos.map((e) => (
                  <option key={e.id} value={e.id}>
                    #{e.id} — {e.rua}, {e.numero} · {e.bairro}, {e.cidade}/{e.estado}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <>
              <Field label="País" required>
                <Input value={form.pais} onChange={set('pais')} required />
              </Field>
              <Field label="Estado (UF)" required>
                <Input value={form.estado} onChange={set('estado')} placeholder="SP" required />
              </Field>
              <Field label="Cidade" required>
                <Input value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" required />
              </Field>
              <Field label="Bairro" required>
                <Input value={form.bairro} onChange={set('bairro')} placeholder="Centro" required />
              </Field>
              <Field label="Rua" required>
                <Input value={form.rua} onChange={set('rua')} placeholder="Rua das Palmeiras" required />
              </Field>
              <Field label="Número" required>
                <Input value={form.numero} onChange={set('numero')} placeholder="123" required />
              </Field>
              <Field label="Complemento" className="span-2">
                <Input value={form.complemento} onChange={set('complemento')} placeholder="Apto 42 (opcional)" />
              </Field>
            </>
          )}

          <FormActions onCancel={() => setModalAberto(false)} loading={salvando} submitLabel={editando ? 'Salvar alterações' : 'Cadastrar usuário'} />
        </form>
      </Modal>
    </>
  )
}
