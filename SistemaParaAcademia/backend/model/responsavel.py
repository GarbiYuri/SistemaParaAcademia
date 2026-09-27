from schema import BaseModel, EmailStr, Optional

class ResponsavelRequest(BaseModel):
    nome: str
    cpf: str
    telefone: Optional[str] = None
    email: EmailStr

class ResponsavelResponse(BaseModel):
    id_responsavel: int
    nome: str
    cpf: str
    telefone: Optional[str] = None
    email: EmailStr