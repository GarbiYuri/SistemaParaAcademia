from datetime import date
from enum import Enum
from typing import List, Optional

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

class Cargo:
    def __init__(self, nome_cargo: str, salario_base: float):
        self.nome_cargo = nome_cargo
        self.salario_base = salario_base

class Plano:
    def __init__(self, nome: str, preco: float, duracao_dias: int):
        self.nome = nome
        self.preco = preco
        self.duracao_dias = duracao_dias

class Exercicio:
    def __init__(self, nome_exercicio: str, grupo_muscular: str):
        self.nome_exercicio = nome_exercicio
        self.grupo_muscular = grupo_muscular

class ExercicioTreino:
    def __init__(self, exercicio: Exercicio, series: int, repeticoes: int, carga: float, unidade_carga: UnidadeCarga, observacao: str = ""):
        self.exercicio = exercicio
        self.series = series
        self.repeticoes = repeticoes
        self.carga = carga
        self.unidade_carga = unidade_carga
        self.observacao = observacao


class Usuario:
    def __init__(self, nome: str, cpf: str, email: str, senha: str, data_nascimento: date):
        self.nome = nome
        self.__cpf = cpf
        self.__senha = senha
        self.email = email
        self.data_nascimento = data_nascimento

    @property
    def cpf(self) -> str:
        if self.__cpf and len(self.__cpf) == 11:
            return f"***.{self.__cpf[3:6]}.***-{self.__cpf[9:]}"
        return "***.***.***-**"

    def autenticar(self, senha_plana: str) -> bool:
        return self.__senha == senha_plana


class Aluno(Usuario):
    def __init__(self, nome: str, cpf: str, email: str, senha: str, data_nascimento: date, 
                 plano: Plano, status_matricula: StatusMatricula = StatusMatricula.ATIVO):
        super().__init__(nome, cpf, email, senha, data_nascimento)
        self.plano = plano
        self.status_matricula = status_matricula


class Funcionario(Usuario):
    def __init__(self, nome: str, cpf: str, email: str, senha: str, data_nascimento: date, 
                 cargo: Cargo, valor_hora: float):
        super().__init__(nome, cpf, email, senha, data_nascimento)
        self.cargo = cargo
        self.valor_hora = valor_hora


class Treino:
    def __init__(self, aluno: Aluno, nome_treino: str, data_criacao: date, status: StatusTreino = StatusTreino.ATIVO):
        self.aluno = aluno
        self.nome_treino = nome_treino
        self.data_criacao = data_criacao
        self.status = status
        self.__exercicios: List[ExercicioTreino] = []

    def adicionar_exercicio(self, item: ExercicioTreino) -> None:
        self.__exercicios.append(item)

    def obter_exercicios(self) -> List[ExercicioTreino]:
        return self.__exercicios