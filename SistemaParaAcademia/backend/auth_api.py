"""
API de autenticação do portal (alunos e professores).

Arquivo NOVO e independente: não altera o backend existente.
Roda em uma porta separada (8001) e reutiliza a conexão MySQL e o hash
de senha já utilizados pelo sistema (utils/security.py).

Execução:
    cd backend
    ../.venv/bin/python -m uvicorn auth_api:app --host 127.0.0.1 --port 8001
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import criar_conexao
from utils.security import verificar_senha

app = FastAPI(
    title="FATECFit — Autenticação do Portal",
    description="Login de alunos e professores com validação da senha já criptografada no banco.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargos considerados de professor/instrutor
CARGOS_PROFESSOR = ("professor", "instrutora", "instrutor", "personal", "treinador", "treinadora")
# Cargos com acesso ao sistema administrativo
CARGOS_ADMIN = ("gerente", "administrador", "administradora", "admin", "diretor", "diretora")
CARGOS_RECEPCAO = ("recepcionista", "recepcao", "recepção")

# Perfis aceitos no login
PERFIS_VALIDOS = ("aluno", "professor", "administrador", "recepcionista")


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
    # Opcional: usado quando o usuário é aluno E professor e já escolheu o perfil
    perfil: Optional[str] = None


def _buscar_vinculos(cursor, id_usuario: int):
    cursor.execute("SELECT id_aluno FROM aluno WHERE id_usuario = %s", (id_usuario,))
    aluno = cursor.fetchone()

    cursor.execute(
        """
        SELECT f.id_funcionario, c.nome_cargo
        FROM funcionario f
        INNER JOIN cargo c ON c.id_cargo = f.id_cargo
        WHERE f.id_usuario = %s
        """,
        (id_usuario,),
    )
    funcionario = cursor.fetchone()

    return aluno, funcionario


def _cargo_e_professor(nome_cargo: str | None) -> bool:
    if not nome_cargo:
        return False
    nome = nome_cargo.lower()
    return any(termo in nome for termo in CARGOS_PROFESSOR)


def _cargo_e_admin(nome_cargo: str | None) -> bool:
    if not nome_cargo:
        return False
    nome = nome_cargo.lower()
    return any(termo in nome for termo in CARGOS_ADMIN)


def _cargo_e_recepcao(nome_cargo: str | None) -> bool:
    if not nome_cargo:
        return False
    nome = nome_cargo.lower()
    return any(termo in nome for termo in CARGOS_RECEPCAO)


@app.get("/auth/health", tags=["Autenticação"])
def health():
    return {"status": "ok", "servico": "auth"}


@app.post("/auth/login", tags=["Autenticação"])
def login(dados: LoginRequest):
    conexao = criar_conexao()
    cursor = conexao.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id_usuario, nome, email, senha FROM usuario WHERE email = %s",
            (dados.email,),
        )
        usuario = cursor.fetchone()

        senha_ok = False
        if usuario:
            try:
                senha_ok = verificar_senha(dados.senha, usuario["senha"])
            except Exception:
                senha_ok = False

        # Mensagem única para não revelar se o e-mail existe
        if not usuario or not senha_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha inválidos.",
            )

        aluno, funcionario = _buscar_vinculos(cursor, usuario["id_usuario"])

        perfis = []
        if aluno:
            perfis.append("aluno")
        if funcionario and _cargo_e_professor(funcionario["nome_cargo"]):
            perfis.append("professor")
        if funcionario and _cargo_e_admin(funcionario["nome_cargo"]):
            perfis.append("administrador")
        if funcionario and _cargo_e_recepcao(funcionario["nome_cargo"]):
            perfis.append("recepcionista")

        if not perfis:
            if funcionario:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Acesso exclusivo para alunos, professores, administradores "
                        f"e recepcionistas. Seu cargo atual é: {funcionario['nome_cargo']}."
                    ),
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este usuário não possui vínculo de aluno, professor ou administrativo.",
            )

        # Usuário pode informar explicitamente o perfil desejado
        if dados.perfil:
            if dados.perfil not in PERFIS_VALIDOS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Perfil inválido. Escolha 'aluno', 'professor', "
                        "'administrador' ou 'recepcionista'."
                    ),
                )
            if dados.perfil not in perfis:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Sua conta não possui acesso como {dados.perfil}.",
                )
            perfil = dados.perfil
            requer_escolha = False
        elif len(perfis) > 1:
            # Aluno e professor: o frontend exibe a escolha antes de entrar
            return {
                "requer_escolha": True,
                "perfis": perfis,
                "perfil": None,
                "id_aluno": aluno["id_aluno"] if aluno else None,
                "id_funcionario": funcionario["id_funcionario"] if funcionario else None,
                "cargo": funcionario["nome_cargo"] if funcionario else None,
                "usuario": {
                    "id": usuario["id_usuario"],
                    "nome": usuario["nome"],
                    "email": usuario["email"],
                },
            }
        else:
            perfil = perfis[0]
            requer_escolha = False

        return {
            "requer_escolha": requer_escolha,
            "perfis": perfis,
            "perfil": perfil,
            "id_aluno": aluno["id_aluno"] if aluno else None,
            "id_funcionario": funcionario["id_funcionario"] if funcionario else None,
            "cargo": funcionario["nome_cargo"] if funcionario else None,
            "usuario": {
                "id": usuario["id_usuario"],
                "nome": usuario["nome"],
                "email": usuario["email"],
            },
        }
    finally:
        cursor.close()
        conexao.close()
