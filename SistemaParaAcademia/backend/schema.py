from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# ENUMS
# ============================================================

class StatusPadrao(str, Enum):
    ATIVO = "Ativo"
    INATIVO = "Inativo"

class StatusMatricula(str, Enum):
    ATIVO = "Ativo"
    INATIVO = "Inativo"
    TRANCADO = "Trancado"
    CANCELADO = "Cancelado"

class StatusTransacao(str, Enum):
    PENDENTE = "Pendente"
    PAGO = "Pago"
    CANCELADO = "Cancelado"
    RECUSADO = "Recusado"

class TipoBatidaPonto(str, Enum):
    ENTRADA = "Entrada"
    SAIDA = "Saida"
    PAUSA = "Pausa"
    RETORNO = "Retorno"

class UnidadeCarga(str, Enum):
    KG = "Kg"
    LB = "Lb"

class TipoChavePix(str, Enum):
    CPF = "CPF"
    CNPJ = "CNPJ"
    EMAIL = "Email"
    TELEFONE = "Telefone"
    ALEATORIA = "Aleatoria"


# ============================================================
# SCHEMAS DAS TABELAS
# ============================================================

# 1. Endereço
class EnderecoBase(BaseModel):
    pais: Optional[str] = Field(default=None, max_length=150)
    estado: Optional[str] = Field(default=None, max_length=150)
    cidade: Optional[str] = Field(default=None, max_length=150)
    bairro: Optional[str] = Field(default=None, max_length=150)
    rua: Optional[str] = Field(default=None, max_length=150)
    numero: Optional[str] = Field(default=None, max_length=150)
    complemento: Optional[str] = Field(default=None, max_length=150)
    obs: Optional[str] = Field(default=None, max_length=255)

class EnderecoCreate(EnderecoBase):
    pass

class EnderecoResponse(EnderecoBase):
    model_config = ConfigDict(from_attributes=True)
    id_endereco: int


# 2. Dados Academia
class DadosAcademiaBase(BaseModel):
    id_endereco: Optional[int] = None
    nome: str = Field(max_length=150)
    cnpj: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=100)
    telefone: Optional[str] = Field(default=None, max_length=20)
    hora_abertura: Optional[str] = Field(default=None, description="Formato HH:MM:SS")
    hora_fechamento: Optional[str] = Field(default=None, description="Formato HH:MM:SS")

class DadosAcademiaCreate(DadosAcademiaBase):
    pass

class DadosAcademiaResponse(DadosAcademiaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# 3. Plano
class PlanoBase(BaseModel):
    nome: str = Field(max_length=50)
    descricao: Optional[str] = Field(default=None, max_length=255)
    preco: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    status: StatusPadrao = StatusPadrao.ATIVO

class PlanoCreate(PlanoBase):
    pass

class PlanoResponse(PlanoBase):
    model_config = ConfigDict(from_attributes=True)
    id_plano: int


# 4. Cargo
class CargoBase(BaseModel):
    nome_cargo: str = Field(max_length=50)
    salario_base: Decimal = Field(max_digits=10, decimal_places=2, ge=0)
    status: StatusPadrao = StatusPadrao.ATIVO

class CargoCreate(CargoBase):
    pass

class CargoResponse(CargoBase):
    model_config = ConfigDict(from_attributes=True)
    id_cargo: int


# 5. Responsável
class ResponsavelBase(BaseModel):
    nome: str = Field(max_length=150)
    cpf: str = Field(max_length=255)
    cpf_hash: str = Field(max_length=64)
    telefone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = Field(default=None, max_length=100)

class ResponsavelCreate(ResponsavelBase):
    pass

class ResponsavelResponse(ResponsavelBase):
    model_config = ConfigDict(from_attributes=True)
    id_responsavel: int


# 6. Usuário
class UsuarioBase(BaseModel):
    id_endereco: Optional[int] = None
    nome: str = Field(max_length=150)
    cpf: str = Field(max_length=255)
    cpf_hash: str = Field(max_length=64)
    email: EmailStr = Field(max_length=100)
    digital: Optional[str] = None
    facial: Optional[str] = None
    data_nascimento: date

class UsuarioCreate(UsuarioBase):
    senha: str = Field(max_length=255)

class UsuarioResponse(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)
    id_usuario: int
    data_cadastro: datetime


# 7. Aluno
class AlunoBase(BaseModel):
    id_usuario: int
    id_responsavel: Optional[int] = None
    id_plano: Optional[int] = None
    forma_pagamento_preferida: Optional[str] = Field(default=None, max_length=50)
    status_matricula: StatusMatricula = StatusMatricula.ATIVO
    data_vencimento: Optional[date] = None

class AlunoCreate(AlunoBase):
    pass

class AlunoResponse(AlunoBase):
    model_config = ConfigDict(from_attributes=True)
    id_aluno: int


# 8. Funcionário
class FuncionarioBase(BaseModel):
    id_usuario: int
    id_cargo: int
    id_responsavel: Optional[int] = None
    valor_hora: Decimal = Field(max_digits=10, decimal_places=2, ge=0)

class FuncionarioCreate(FuncionarioBase):
    pass

class FuncionarioResponse(FuncionarioBase):
    model_config = ConfigDict(from_attributes=True)
    id_funcionario: int


# 9. Registro de Ponto
class RegistroPontoBase(BaseModel):
    id_funcionario: int
    data_hora: datetime
    tipo_batida: TipoBatidaPonto

class RegistroPontoCreate(RegistroPontoBase):
    pass

class RegistroPontoResponse(RegistroPontoBase):
    model_config = ConfigDict(from_attributes=True)
    id_ponto: int


# 10. Treino
class TreinoBase(BaseModel):
    id_aluno: int
    id_professor: int
    nome_treino: str = Field(max_length=100)
    status: StatusPadrao = StatusPadrao.ATIVO

class TreinoCreate(TreinoBase):
    pass

class TreinoResponse(TreinoBase):
    model_config = ConfigDict(from_attributes=True)
    id_treino: int
    data_criacao: date
    data_atualizacao: Optional[date] = None


# 11. Exercício
class ExercicioBase(BaseModel):
    nome_exercicio: str = Field(max_length=100)
    grupo_muscular: Optional[str] = Field(default=None, max_length=50)

class ExercicioCreate(ExercicioBase):
    pass

class ExercicioResponse(ExercicioBase):
    model_config = ConfigDict(from_attributes=True)
    id_exercicio: int


# 12. Exercício do Treino (Tabela Intermediária N:M)
class ExercicioTreinoBase(BaseModel):
    id_treino: int
    id_exercicio: int
    series: int = Field(gt=0)
    repeticoes: int = Field(gt=0)
    carga: Optional[Decimal] = Field(default=None, max_digits=6, decimal_places=2, ge=0)
    unidade_carga: Optional[UnidadeCarga] = None
    observacao: Optional[str] = Field(default=None, max_length=255)

class ExercicioTreinoCreate(ExercicioTreinoBase):
    pass

class ExercicioTreinoResponse(ExercicioTreinoBase):
    model_config = ConfigDict(from_attributes=True)
    id_exercicio_treino: int


# 13. Forma de Pagamento
class FormaPagamentoBase(BaseModel):
    tipo: str = Field(max_length=30)
    cpf: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=100)
    nome: Optional[str] = Field(default=None, max_length=150)
    digitos_cartao: Optional[str] = Field(default=None, max_length=20)
    bandeira: Optional[str] = Field(default=None, max_length=30)
    data_validade: Optional[date] = None

class FormaPagamentoCreate(FormaPagamentoBase):
    pass

class FormaPagamentoResponse(FormaPagamentoBase):
    model_config = ConfigDict(from_attributes=True)
    id_fpag: int


# 14. Pagamento
class PagamentoBase(BaseModel):
    id_forma_pagamento: int
    id_aluno: int
    valor: Decimal = Field(max_digits=10, decimal_places=2, gt=0)
    token_pagamento: Optional[str] = Field(default=None, max_length=255)
    status: StatusTransacao = StatusTransacao.PENDENTE

class PagamentoCreate(PagamentoBase):
    pass

class PagamentoResponse(PagamentoBase):
    model_config = ConfigDict(from_attributes=True)
    id_pagamento: int
    data_pagamento: datetime


# 15. Banco
class BancoBase(BaseModel):
    nome_banco: str = Field(max_length=100)
    cod_compe: Optional[str] = Field(default=None, max_length=10)
    agencia: Optional[str] = Field(default=None, max_length=20)
    conta_corrente: Optional[str] = Field(default=None, max_length=30)
    d_conta: Optional[str] = Field(default=None, max_length=10)
    chave_pix: Optional[str] = Field(default=None, max_length=150)
    tipo_chave_pix: Optional[TipoChavePix] = None
    carteira_boleto: Optional[str] = Field(default=None, max_length=20)
    status: StatusPadrao = StatusPadrao.ATIVO
    obs: Optional[str] = None

class BancoCreate(BancoBase):
    pass

class BancoResponse(BancoBase):
    model_config = ConfigDict(from_attributes=True)
    id_banco: int
    data_created: datetime
    data_updated: datetime


# 16. Recebimento
class RecebimentoBase(BaseModel):
    id_pagamento: int
    id_banco: int
    nome_acad: Optional[str] = Field(default=None, max_length=150)
    valor_recebido: Decimal = Field(max_digits=10, decimal_places=2, gt=0)
    status: StatusTransacao = StatusTransacao.PENDENTE
    observacao: Optional[str] = None

class RecebimentoCreate(RecebimentoBase):
    pass

class RecebimentoResponse(RecebimentoBase):
    model_config = ConfigDict(from_attributes=True)
    id_recebimento: int
    data_recebimento: datetime


# 17. Auditoria
class AuditoriaBase(BaseModel):
    id_usuario: int
    acao: str = Field(max_length=100)
    tabela_afetada: Optional[str] = Field(default=None, max_length=100)
    ip: Optional[str] = Field(default=None, max_length=45)
    detalhes: Optional[str] = None

class AuditoriaCreate(AuditoriaBase):
    pass

class AuditoriaResponse(AuditoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id_auditoria: int
    data_hora: datetime


# ============================================================
# DTOs PARA CADASTROS COMPOSTOS (USUÁRIO + PERFIL)
# ============================================================

class AlunoCompletoCreate(BaseModel):
    usuario: UsuarioCreate
    id_responsavel: Optional[int] = None
    id_plano: Optional[int] = None
    forma_pagamento_preferida: Optional[str] = Field(default=None, max_length=50)

class FuncionarioCompletoCreate(BaseModel):
    usuario: UsuarioCreate
    id_cargo: int
    id_responsavel: Optional[int] = None
    valor_hora: Decimal = Field(max_digits=10, decimal_places=2, ge=0)


# ============================================================
# SCHEMAS DE ENTRADA/SAÍDA PARA PROCEDURES SQL
# ============================================================

class SPCadastrarAlunoInput(BaseModel):
    id_usuario: int
    id_responsavel: Optional[int] = None
    id_plano: Optional[int] = None
    forma_pagamento_preferida: Optional[str] = Field(default=None, max_length=50)

class SPRegistrarPagamentoInput(BaseModel):
    id_forma_pagamento: int
    id_aluno: int
    valor: Decimal = Field(max_digits=10, decimal_places=2, gt=0)
    status: StatusTransacao

class SPCatracaResponse(BaseModel):
    acesso_liberado: bool
    motivo: str

class SPTreinoAlunoItem(BaseModel):
    id_treino: int
    nome_treino: str
    status: str
    nome_exercicio: str
    grupo_muscular: Optional[str] = None
    series: int
    repeticoes: int
    carga: Optional[Decimal] = None
    unidade_carga: Optional[str] = None
    observacao: Optional[str] = None