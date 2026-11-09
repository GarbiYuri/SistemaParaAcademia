"""Cria as contas de demonstração exibidas na tela de login.

Idempotente: pode rodar a cada inicialização do backend. Para desativar,
defina a variável de ambiente SEED_DEMO_USERS=false.
"""

import os

from database import criar_conexao
from utils.security import criptografar_cpf, gerar_hash_senha

SENHA_DEMO = "senha123"

CONTAS_DEMO = [
    {
        "tipo": "aluno",
        "nome": "Ana Beatriz Souza",
        "email": "ana.souza@email.com",
        "cpf": "390.533.447-05",
        "data_nascimento": "2002-03-14",
    },
    {
        "tipo": "funcionario",
        "cargo": "Professor",
        "valor_hora": 55.00,
        "nome": "Marcos Vinícius Almeida",
        "email": "marcos.almeida@fatecfit.com",
        "cpf": "287.654.320-11",
        "data_nascimento": "1987-11-02",
    },
    {
        "tipo": "funcionario",
        "cargo": "Gerente",
        "valor_hora": 70.00,
        "nome": "Roberto Nunes Filho",
        "email": "roberto.nunes@fatecfit.com",
        "cpf": "714.032.198-04",
        "data_nascimento": "1979-06-25",
    },
    {
        "tipo": "funcionario",
        "cargo": "Recepcionista",
        "valor_hora": 28.00,
        "nome": "Juliana Prado Nunes",
        "email": "juliana.nunes@fatecfit.com",
        "cpf": "605.912.478-30",
        "data_nascimento": "1994-09-18",
    },
]


def _garantir_endereco(cursor) -> int:
    cursor.execute("SELECT id_endereco FROM endereco ORDER BY id_endereco LIMIT 1")
    registro = cursor.fetchone()
    if registro:
        return registro[0]

    cursor.execute(
        """
        INSERT INTO endereco (pais, estado, cidade, bairro, rua, numero, complemento)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        ("Brasil", "São Paulo", "São Paulo", "Centro", "Rua da Academia", "100", ""),
    )
    return cursor.lastrowid


def _garantir_cargo(cursor, nome_cargo: str) -> int:
    cursor.execute("SELECT id_cargo FROM cargo WHERE nome_cargo = %s LIMIT 1", (nome_cargo,))
    registro = cursor.fetchone()
    if registro:
        return registro[0]

    cursor.execute(
        "INSERT INTO cargo (nome_cargo, salario_base, status) VALUES (%s, %s, %s)",
        (nome_cargo, 0.00, "Ativo"),
    )
    return cursor.lastrowid


def _garantir_usuario(cursor, conta, id_endereco: int) -> int:
    cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (conta["email"],))
    registro = cursor.fetchone()
    if registro:
        return registro[0]

    cursor.execute(
        """
        INSERT INTO usuario (id_endereco, nome, cpf, email, senha, data_nascimento)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            id_endereco,
            conta["nome"],
            criptografar_cpf(conta["cpf"]),
            conta["email"],
            gerar_hash_senha(SENHA_DEMO),
            conta["data_nascimento"],
        ),
    )
    return cursor.lastrowid


def _garantir_vinculo(cursor, conta, id_usuario: int) -> None:
    if conta["tipo"] == "aluno":
        cursor.execute("SELECT id_aluno FROM aluno WHERE id_usuario = %s", (id_usuario,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO aluno (id_usuario, status_matricula) VALUES (%s, %s)",
                (id_usuario, "Ativo"),
            )
        return

    cursor.execute("SELECT id_funcionario FROM funcionario WHERE id_usuario = %s", (id_usuario,))
    if not cursor.fetchone():
        id_cargo = _garantir_cargo(cursor, conta["cargo"])
        cursor.execute(
            "INSERT INTO funcionario (id_usuario, id_cargo, valor_hora) VALUES (%s, %s, %s)",
            (id_usuario, id_cargo, conta["valor_hora"]),
        )


def main() -> None:
    if os.getenv("SEED_DEMO_USERS", "true").lower() == "false":
        print("SEED_DEMO_USERS=false: contas de demonstração não serão criadas.")
        return

    conexao = criar_conexao()
    cursor = conexao.cursor()

    criadas = 0
    try:
        id_endereco = _garantir_endereco(cursor)

        for conta in CONTAS_DEMO:
            cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (conta["email"],))
            existe = cursor.fetchone()
            id_usuario = _garantir_usuario(cursor, conta, id_endereco)
            _garantir_vinculo(cursor, conta, id_usuario)
            if not existe:
                criadas += 1

        conexao.commit()
    finally:
        cursor.close()
        conexao.close()

    if criadas:
        print(f"Contas de demonstração criadas: {criadas}")
    else:
        print("Contas de demonstração já existem.")


if __name__ == "__main__":
    main()
