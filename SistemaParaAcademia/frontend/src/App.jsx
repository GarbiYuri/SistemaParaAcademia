import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Alunos from './pages/Alunos.jsx'
import Funcionarios from './pages/Funcionarios.jsx'
import Treinos from './pages/Treinos.jsx'
import Exercicios from './pages/Exercicios.jsx'
import Pagamentos from './pages/Pagamentos.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Cadastros from './pages/Cadastros.jsx'
import Login from './pages/Login.jsx'
import PortalAluno from './pages/PortalAluno.jsx'
import PortalProfessor from './pages/PortalProfessor.jsx'
import { PortalRedirect, RequirePerfil } from './components/PortalGuard.jsx'
import RequireAdmin from './components/AdminGuard.jsx'
import { EmptyState } from './components/ui.jsx'
import { Compass } from 'lucide-react'

function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Página não encontrada"
      description="O endereço acessado não existe neste sistema."
    />
  )
}

export default function App() {
  return (
    <Routes>
      {/* Portal do aluno e do professor (fora do layout administrativo) */}
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<PortalRedirect />} />
      <Route
        path="/portal/aluno"
        element={
          <RequirePerfil perfil="aluno">
            <PortalAluno />
          </RequirePerfil>
        }
      />
      <Route
        path="/portal/professor"
        element={
          <RequirePerfil perfil="professor">
            <PortalProfessor />
          </RequirePerfil>
        }
      />

      {/* Sistema administrativo (somente administrador/recepcionista) */}
      <Route
        element={
          <RequireAdmin>
            <Layout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="alunos" element={<Alunos />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="treinos" element={<Treinos />} />
        <Route path="exercicios" element={<Exercicios />} />
        <Route path="pagamentos" element={<Pagamentos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="cadastros" element={<Cadastros />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
