from schema import BaseModel, Optional, date

class PagamentoRequest(BaseModel):
    id_aluno: int
    forma_pagamento: str
    valor: float
    data_pagamento: Optional[date] = None
    status: Optional[str] = "Pendente"

class PagamentoResponse(BaseModel):
    id_pagamento: int
    id_aluno: int
    forma_pagamento: str
    valor: float
    data_pagamento: date
    status: str