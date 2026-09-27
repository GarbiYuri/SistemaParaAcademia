import os
from dotenv import load_dotenv
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from cryptography.fernet import Fernet

load_dotenv()

password_hash = PasswordHash((Argon2Hasher(),))

FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    raise ValueError("A variável FERNET_KEY não foi configurada no arquivo .env!")

fernet = Fernet(FERNET_KEY.encode())

# ==========================================
# FUNÇÕES DE SENHA
# ==========================================

def gerar_hash_senha(senha_texto_puro: str) -> str:
    return password_hash.hash(senha_texto_puro)

def verificar_senha(senha_texto_puro: str, hash_salvo: str) -> bool:
    return password_hash.verify(senha_texto_puro, hash_salvo)

# ==========================================
# FUNÇÕES DE CPF
# ==========================================

def criptografar_cpf(cpf: str) -> str:
    cpf_limpo = "".join(filter(str.isdigit, cpf))
    return fernet.encrypt(cpf_limpo.encode()).decode()

def descriptografar_cpf(cpf_criptografado: str) -> str:
    try:
        return fernet.decrypt(cpf_criptografado.encode()).decode()
    except Exception:
        return "CPF Inválido"