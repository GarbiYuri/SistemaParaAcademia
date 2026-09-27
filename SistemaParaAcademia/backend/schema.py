from datetime import date, time, timedelta
from pydantic import BaseModel, EmailStr
from typing import Optional

import model.endereco
import model.dadosAcademia
import model.responsavel
import model.usuario
import model.aluno
import model.funcionario
import model.cargo
import model.pagamento
import model.treino
import model.exercicio

def converter_time(valor):
    if isinstance(valor, timedelta):
        return time(
            hour=valor.seconds // 3600,
            minute=(valor.seconds % 3600) // 60,
            second=valor.seconds % 60
        )

    return valor