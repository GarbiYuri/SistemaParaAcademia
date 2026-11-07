const BASE = '/auth-api'

export async function login(email, senha, perfil) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha, ...(perfil ? { perfil } : {}) }),
  })

  if (!res.ok) {
    let mensagem = 'Não foi possível entrar. Tente novamente.'
    try {
      const dados = await res.json()
      if (dados?.detail) {
        mensagem =
          typeof dados.detail === 'string'
            ? dados.detail
            : Array.isArray(dados.detail)
              ? dados.detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
              : mensagem
      }
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(mensagem)
  }

  return res.json()
}
