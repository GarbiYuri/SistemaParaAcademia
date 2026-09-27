from schema import time, BaseModel, EmailStr

class DadosAcademiaCreate(BaseModel):
    idEndereco: int
    nome: str
    cnpj: str
    email: EmailStr
    telefone: str
    horaAbertura: time
    horaFechamento: time


class DadosAcademiaResponse(BaseModel):
    id: int
    idEndereco: int
    nome: str
    cnpj: str
    email: EmailStr
    telefone: str
    horaAbertura: time
    horaFechamento: time