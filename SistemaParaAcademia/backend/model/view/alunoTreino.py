from schema import date, BaseModel

class AlunoTreino(BaseModel):
    idAluno: int
    idTreino: int
    nomeAluno: str
    nomeTreino: str
    dataCriacao: date
    dataAtualizacao: date
    status: str
    idProfessor: int
    nomeProfessor: str
