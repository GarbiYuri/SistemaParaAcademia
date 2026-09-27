from schema import date, BaseModel

class AlunoResponsavel(BaseModel):
    idAluno: int
    nomeAluno: str
    dataNascimento: date
    statusMatricula : str
    nomeResponsavel: str
    telefoneResponsavel: str
    emailResponsavel: str
