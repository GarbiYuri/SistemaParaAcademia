from schema import BaseModel, Optional

class CargoRequest(BaseModel):
    nome_cargo: str
    salario_base: float
    status: Optional[str] = "Ativo"

class CargoResponse(BaseModel):
    id_cargo: int
    nome_cargo: str
    salario_base: float
    status: str