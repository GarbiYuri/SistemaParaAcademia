import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carrega dados assíncronos com estados de loading/erro e função de recarga.
 * Executa uma vez ao montar; use `reload` após mutações.
 */
export function useAsync(loader) {
  const loaderRef = useRef(loader)
  // eslint-disable-next-line react-hooks/refs
  loaderRef.current = loader

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loaderRef.current())
    } catch (err) {
      setError(err.message || 'Falha ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run()
  }, [run])

  return { data, loading, error, reload: run }
}
