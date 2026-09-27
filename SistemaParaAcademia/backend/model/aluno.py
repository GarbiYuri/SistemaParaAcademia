from schema import date, BaseModel, Optional

class AlunoRequest(BaseModel):
    id_usuario: int
    id_responsavel: Optional[int] = None
    forma_pagamento_preferida: Optional[str] = None
    status_matricula: Optional[str] = "Ativo"
    data_vencimento: Optional[date] = None

class AlunoResponse(BaseModel):
    id_aluno: int
    id_usuario: int
    id_responsavel: Optional[int] = None
    forma_pagamento_preferida: Optional[str] = None
    status_matricula: str
    data_vencimento: Optional[date] = None