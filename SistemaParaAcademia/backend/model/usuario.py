from schema import date, BaseModel, EmailStr

class UsuarioRequest(BaseModel):
    id_endereco: int
    nome: str
    cpf: str
    email: EmailStr
    senha: str
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