from datetime import date
from enum import Enum
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer

# ==========================================
# 1. ENUMS DO DIAGRAMA
# ==========================================

class StatusMatricula(str, Enum):
    ATIVO = "Ativo"
    INATIVO = "Inativo"
    TRANCADO = "Trancado"
    CANCELADO = "Cancelado"

class StatusTreino(str, Enum):
    ATIVO = "Ativo"
    INATIVO = "Inativo"

class UnidadeCarga(str, Enum):
    KG = "Kg"
    LB = "Lb"


# ==========================================
# 2. SCHEMAS PYDANTIC (ENTRADA E SAÍDA)
# ==========================================

# --- Planos ---
class PlanoBase(BaseModel):
    nome: str = Field(..., example="Plano Black Anual")
    preco: float = Field(..., gt=0, example=119.90)
    duracao_dias: int = Field(..., gt=0, example=365)

class PlanoResponse(PlanoBase):
    id_plano: int
    model_config = ConfigDict(from_attributes=True)


# --- Usuários e Alunos ---
class UsuarioBase(BaseModel):
    nome: str = Field(..., example="Lucas da Silva")
    email: EmailStr = Field(..., example="lucas@email.com")
    data_nascimento: date = Field(..., example="2000-05-15")

class AlunoCreate(UsuarioBase):
    cpf: str = Field(..., min_length=11, max_length=11, example="12345678901")
    senha: str = Field(..., min_length=6, example="senhaSegura123")
    id_plano: int = Field(..., example=1)

class AlunoResponse(UsuarioBase):
    id_aluno: int
    cpf: str
    status_matricula: StatusMatricula
    plano: PlanoResponse

    # Mascaramento de CPF (LGPD) no retorno da API
    @field_serializer("cpf")
    def mascarar_cpf(self, cpf: str) -> str:
        if cpf and len(cpf) == 11:
            return f"***.{cpf[3:6]}.***-{cpf[9:]}"
        return "***.***.***-**"

    model_config = ConfigDict(from_attributes=True)


# --- Exercícios e Treinos ---
class ExercicioBase(BaseModel):
    nome_exercicio: str = Field(..., example="Supino Reto")
    grupo_muscular: str = Field(..., example="Peito")

class ExercicioResponse(ExercicioBase):
    id_exercicio: int
    model_config = ConfigDict(from_attributes=True)


class ExercicioTreinoInput(BaseModel):
    id_exercicio: int = Field(..., example=1)
    series: int = Field(..., gt=0, example=4)
    repeticoes: int = Field(..., gt=0, example=12)
    carga: float = Field(..., ge=0, example=30.0)
    unidade_carga: UnidadeCarga = UnidadeCarga.KG
    observacao: Optional[str] = Field(None, example="Descanso de 60s entre séries")

class ExercicioTreinoResponse(BaseModel):
    exercicio: ExercicioResponse
    series: int
    repeticoes: int
    carga: float
    unidade_carga: UnidadeCarga
    observacao: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class TreinoCreate(BaseModel):
    id_aluno: int = Field(..., example=1)
    nome_treino: str = Field(..., example="Treino A - Peito e Tríceps")
    exercicios: List[ExercicioTreinoInput]

class TreinoResponse(BaseModel):
    id_treino: int
    nome_treino: str
    status: StatusTreino
    data_criacao: date
    aluno: AlunoResponse
    exercicios: List[ExercicioTreinoResponse]
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. BASE DE DADOS VOLÁTIL (EM MEMÓRIA)
# ==========================================

db_planos = {
    1: {"id_plano": 1, "nome": "Plano Smart", "preco": 89.90, "duracao_dias": 30},
    2: {"id_plano": 2, "nome": "Plano Black", "preco": 129.90, "duracao_dias": 365}
}

db_exercicios = {
    1: {"id_exercicio": 1, "nome_exercicio": "Supino Reto", "grupo_muscular": "Peitoral"},
    2: {"id_exercicio": 2, "nome_exercicio": "Agachamento Livre", "grupo_muscular": "Membros Inferiores"},
    3: {"id_exercicio": 3, "nome_exercicio": "Puxada Frontal", "grupo_muscular": "Dorsal"}
}

db_alunos = {}
db_treinos = {}

counter_aluno = 1
counter_treino = 1


# ==========================================
# 4. INSTÂNCIA DO APP FASTAPI
# ==========================================

app = FastAPI(
    title="API de Gestão de Academia",
    description="Backend estruturado a partir do Diagrama de Classes do Sistema de Academia.",
    version="1.0.0"
)


# ==========================================
# 5. ROTAS DA API
# ==========================================

# --- Rotas de Planos ---
@app.get("/planos", response_model=List[PlanoResponse], tags=["Planos"])
def listar_planos():
    return list(db_planos.values())


# --- Rotas de Alunos ---
@app.post("/alunos", response_model=AlunoResponse, status_code=status.HTTP_201_CREATED, tags=["Alunos"])
def cadastrar_aluno(payload: AlunoCreate):
    global counter_aluno

    if payload.id_plano not in db_planos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Plano de ID {payload.id_plano} não encontrado."
        )

    novo_aluno = {
        "id_aluno": counter_aluno,
        "nome": payload.nome,
        "email": payload.email,
        "data_nascimento": payload.data_nascimento,
        "cpf": payload.cpf,
        "status_matricula": StatusMatricula.ATIVO,
        "plano": db_planos[payload.id_plano]
    }

    db_alunos[counter_aluno] = novo_aluno
    counter_aluno += 1
    return novo_aluno


@app.get("/alunos", response_model=List[AlunoResponse], tags=["Alunos"])
def listar_alunos():
    return list(db_alunos.values())


@app.get("/alunos/{id_aluno}", response_model=AlunoResponse, tags=["Alunos"])
def obter_aluno(id_aluno: int):
    aluno = db_alunos.get(id_aluno)
    if not aluno:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não localizado.")
    return aluno


# --- Rotas de Exercícios ---
@app.get("/exercicios", response_model=List[ExercicioResponse], tags=["Exercícios"])
def listar_exercicios():
    return list(db_exercicios.values())


# --- Rotas de Treinos ---
@app.post("/treinos", response_model=TreinoResponse, status_code=status.HTTP_201_CREATED, tags=["Treinos"])
def criar_treino(payload: TreinoCreate):
    global counter_treino

    aluno = db_alunos.get(payload.id_aluno)
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Aluno com ID {payload.id_aluno} não cadastrado."
        )

    exercicios_processados = []
    for item in payload.exercicios:
        exercicio_db = db_exercicios.get(item.id_exercicio)
        if not exercicio_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercício de ID {item.id_exercicio} não encontrado no catálogo."
            )
        
        exercicios_processados.append({
            "exercicio": exercicio_db,
            "series": item.series,
            "repeticoes": item.repeticoes,
            "carga": item.carga,
            "unidade_carga": item.unidade_carga,
            "observacao": item.observacao
        })

    novo_treino = {
        "id_treino": counter_treino,
        "nome_treino": payload.nome_treino,
        "status": StatusTreino.ATIVO,
        "data_criacao": date.today(),
        "aluno": aluno,
        "exercicios": exercicios_processados
    }

    db_treinos[counter_treino] = novo_treino
    counter_treino += 1
    return novo_treino


@app.get("/treinos", response_model=List[TreinoResponse], tags=["Treinos"])
def listar_treinos():
    return list(db_treinos.values())


# ==========================================
# 6. EXECUÇÃO LOCAL
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)