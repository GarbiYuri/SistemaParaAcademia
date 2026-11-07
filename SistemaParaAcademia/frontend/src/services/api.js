const BASE = '/api'

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) {
        message =
          typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
              : JSON.stringify(data.detail)
      }
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const crud = (base) => ({
  list: () => request(base),
  get: (id) => request(`${base}/${id}`),
  create: (data) => request(base, { method: 'POST', body: data }),
  update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
})

export const api = {
  academias: crud('/academias'),
  enderecos: crud('/enderecos'),
  usuarios: crud('/usuarios'),
  responsaveis: crud('/responsaveis'),
  alunos: crud('/alunos'),
  funcionarios: crud('/funcionarios'),
  cargos: crud('/cargos'),
  pagamentos: crud('/pagamentos'),
  treinos: crud('/treinos'),
  exercicios: {
    ...crud('/exercicios'),
    porTreino: (idTreino) => request(`/treinos/${idTreino}/exercicios`),
  },
}

export const formatters = {
  moeda: (valor) =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  data: (valor) => {
    if (!valor) return '—'
    const [ano, mes, dia] = String(valor).slice(0, 10).split('-')
    return `${dia}/${mes}/${ano}`
  },
  hora: (valor) => (valor ? String(valor).slice(0, 5) : '—'),
  iniciais: (nome = '') =>
    nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join(''),
}
