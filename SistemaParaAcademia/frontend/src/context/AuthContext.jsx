import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { login } from '../services/auth.js'

const CHAVE_SESSAO = 'fatecfit.portal.sessao'
const AuthContext = createContext(null)

function lerSessaoSalva() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_SESSAO)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

function salvarSessao(sessao) {
  if (sessao) window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
  else window.localStorage.removeItem(CHAVE_SESSAO)
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(lerSessaoSalva)

  /**
   * Faz login. Se o usuário for aluno e professor, sem `perfil`, a API
   * devolve `requer_escolha: true` e a sessão NÃO é criada ainda.
   */
  const entrar = useCallback(async (email, senha, perfil) => {
    const dados = await login(email, senha, perfil)
    if (!dados.requer_escolha) {
      salvarSessao(dados)
      // Aplica a sessão antes de o formulário navegar, para que os guards
      // (admin/portal) já enxerguem o novo perfil no primeiro render.
      flushSync(() => setSessao(dados))
    }
    return dados
  }, [])

  /** Alterna entre as áreas de aluno e professor sem novo login. */
  const trocarPerfil = useCallback((perfil) => {
    setSessao((atual) => {
      if (!atual || !Array.isArray(atual.perfis) || !atual.perfis.includes(perfil)) {
        return atual
      }
      const proxima = { ...atual, perfil }
      salvarSessao(proxima)
      return proxima
    })
  }, [])

  const sair = useCallback(() => {
    salvarSessao(null)
    setSessao(null)
  }, [])

  const valor = useMemo(
    () => ({ sessao, entrar, sair, trocarPerfil }),
    [sessao, entrar, sair, trocarPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return contexto
}
