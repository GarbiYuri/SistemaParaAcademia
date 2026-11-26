from typing import Optional

from schema import date, BaseModel, EmailStr

class UsuarioRequest(BaseModel):
    id_endereco: int
    nome: str
    cpf: str
    email: EmailStr
    # Opcional ao atualizar (senha mantida quando vazia/omitida);
    # obrigatória ao cadastrar.
    senha: Optional[str] = None
    dataNascimento: date

# Dados retornados pelas rotas da API
class UsuarioResponse(BaseModel):
    id: int
    id_endereco: int
    nome: str
    cpf: str
    email: EmailStr
    dataNascimento: date
    dataCadastro: date