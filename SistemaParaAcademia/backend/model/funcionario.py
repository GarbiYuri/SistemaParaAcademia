from schema import BaseModel, Optional

class FuncionarioRequest(BaseModel):
    id_usuario: int
    id_cargo: int
    id_responsavel: Optional[int] = None
    valor_hora: Optional[float] = None

class FuncionarioResponse(BaseModel):
    id_funcionario: int
    id_usuario: int
    id_cargo: int
    id_responsavel: Optional[int] = None
    valor_hora: Optional[float] = None