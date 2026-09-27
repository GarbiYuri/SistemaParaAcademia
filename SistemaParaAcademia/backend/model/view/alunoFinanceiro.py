from schema import date, BaseModel

class AlunoFinanceiro(BaseModel):
    idAluno: int
    nomeAluno: str
    idAagamento: str
    formaAagamento : str
    valor: float
    dataPagamento: date
    status: str
