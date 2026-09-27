from schema import BaseModel, Optional

class ExercicioRequest(BaseModel):
    id_treino: int
    nome_exercicio: str
    series: Optional[int] = 3
    repeticoes: str
    carga: Optional[str] = None
    observacao: Optional[str] = None

class ExercicioResponse(BaseModel):
    id_exercicio: int
    id_treino: int
    nome_exercicio: str
    series: int
    repeticoes: str
    carga: Optional[str] = None
    observacao: Optional[str] = None