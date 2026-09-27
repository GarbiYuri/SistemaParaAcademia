from schema import date, BaseModel, Optional

class TreinoRequest(BaseModel):
    id_aluno: int
    id_professor: int
    nome_treino: str
    data_criacao: Optional[date] = None
    data_atualizacao: Optional[date] = None
    status: Optional[str] = "Ativo"

class TreinoResponse(BaseModel):
    id_treino: int
    id_aluno: int
    id_professor: int
    nome_treino: str
    data_criacao: date
    data_atualizacao: Optional[date] = None
    status: str