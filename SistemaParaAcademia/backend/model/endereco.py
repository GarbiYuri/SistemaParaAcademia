from schema import BaseModel


class EnderecoRequest(BaseModel):
    pais: str
    estado: str
    cidade: str
    bairro: str
    rua: str
    numero: str
    complemento: str


class EnderecoResponse(BaseModel):
    id: int
    pais: str
    estado: str
    cidade: str
    bairro: str
    rua: str
    numero: str
    complemento: str