"""
API de autenticação do portal (alunos e professores).

Arquivo NOVO e independente: não altera o backend existente.
Roda em uma porta separada (8001) e reutiliza a conexão MySQL e o hash
de senha já utilizados pelo sistema (utils/security.py).

Execução:
    cd backend
    ../.venv/bin/python -m uvicorn auth_api:app --host 127.0.0.1 --port 8001
"""

import threading
import time

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional

from database import criar_conexao
from utils.security import gerar_hash_senha, verificar_senha
from utils.auth_token import criar_token

app = FastAPI(
    title="FATECFit — Autenticação do Portal",
    description="Login de alunos e professores com validação da senha já criptografada no banco.",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

ORIGENS_PERMITIDAS = [
    "https://academia.franciscovps.shop",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8088",
    "http://192.168.15.5:8088",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_PERMITIDAS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Rate limit simples em memória: 20 tentativas por IP a cada 5 minutos.
_TENTATIVAS: dict[str, list[float]] = {}
_LOCK = threading.Lock()
LIMITE_TENTATIVAS = 20
JANELA_SEGUNDOS = 300

# Hash descartável usado só para gastar o mesmo tempo de um Argon2 real
# quando o e-mail não existe.
_HASH_FICTICIO = gerar_hash_senha("usuario-inexistente-nao-use")


def _ip_cliente(request: Request) -> str:
    # Cloudflare sobrescreve CF-Connecting-IP; é a fonte mais confiável no
    # caminho público. X-Real-IP cobre o acesso direto via nginx (LAN/tailnet).
    cf = request.headers.get("cf-connecting-ip", "").strip()
    if cf:
        return cf
    real = request.headers.get("x-real-ip", "").strip()
    if real:
        return real
    encaminhado = request.headers.get("x-forwarded-for", "")
    if encaminhado:
        return encaminhado.split(",")[-1].strip()
    return request.client.host if request.client else "desconhecido"


def _permitir_tentativa(ip: str) -> bool:
    agora = time.time()
    with _LOCK:
        marcas = [t for t in _TENTATIVAS.get(ip, []) if agora - t < JANELA_SEGUNDOS]
        if len(marcas) >= LIMITE_TENTATIVAS:
            _TENTATIVAS[ip] = marcas
            return False
        marcas.append(agora)
        _TENTATIVAS[ip] = marcas
        return True

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
def login(dados: LoginRequest, request: Request):
    if not _permitir_tentativa(_ip_cliente(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        )

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
        else:
            # Equaliza o tempo de resposta: sem isso, e-mail inexistente
            # responde muito mais rápido e permite enumerar usuários.
            try:
                verificar_senha(dados.senha, _HASH_FICTICIO)
            except Exception:
                pass

        # Mensagem única para não revelar se o e-mail existe
        if not usuario or not senha_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha inválidos.",
            )

        aluno, funcionario = _buscar_vinculos(cursor, usuario["id_usuario"])

        usuario_publico = {
            "id": usuario["id_usuario"],
            "nome": usuario["nome"],
            "email": usuario["email"],
        }

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
                "token": criar_token(usuario_publico, None, perfis),
                "id_aluno": aluno["id_aluno"] if aluno else None,
                "id_funcionario": funcionario["id_funcionario"] if funcionario else None,
                "cargo": funcionario["nome_cargo"] if funcionario else None,
                "usuario": usuario_publico,
            }
        else:
            perfil = perfis[0]
            requer_escolha = False

        return {
            "requer_escolha": requer_escolha,
            "perfis": perfis,
            "perfil": perfil,
            "token": criar_token(usuario_publico, perfil, perfis),
            "id_aluno": aluno["id_aluno"] if aluno else None,
            "id_funcionario": funcionario["id_funcionario"] if funcionario else None,
            "cargo": funcionario["nome_cargo"] if funcionario else None,
            "usuario": usuario_publico,
        }
    finally:
        cursor.close()
        conexao.close()
