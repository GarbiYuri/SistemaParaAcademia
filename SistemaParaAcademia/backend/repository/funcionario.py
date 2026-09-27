from main import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_funcionario,
            id_usuario,
            id_cargo,
            id_responsavel,
            valor_hora
        FROM funcionario
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    funcionarios = []
    for registro in registros:
        funcionario = {
            "id_funcionario": registro[0],
            "id_usuario": registro[1],
            "id_cargo": registro[2],
            "id_responsavel": registro[3],
            "valor_hora": float(registro[4]) if registro[4] is not None else 0.0
        }
        funcionarios.append(funcionario)

    return funcionarios


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_funcionario,
            id_usuario,
            id_cargo,
            id_responsavel,
            valor_hora
        FROM funcionario
        WHERE id_funcionario = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_funcionario": registro[0],
        "id_usuario": registro[1],
        "id_cargo": registro[2],
        "id_responsavel": registro[3],
        "valor_hora": float(registro[4]) if registro[4] is not None else 0.0
    }


def create(funcionario):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO funcionario (
            id_usuario,
            id_cargo,
            id_responsavel,
            valor_hora
        )
        VALUES (%s, %s, %s, %s)
    """, (
        funcionario.id_usuario,
        funcionario.id_cargo,
        funcionario.id_responsavel,
        funcionario.valor_hora
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, funcionario):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE funcionario
        SET
            id_usuario = %s,
            id_cargo = %s,
            id_responsavel = %s,
            valor_hora = %s
        WHERE id_funcionario = %s
    """, (
        funcionario.id_usuario,
        funcionario.id_cargo,
        funcionario.id_responsavel,
        funcionario.valor_hora,
        id
    ))

    conexao.commit()
    linhas_alteradas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_alteradas


def delete(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        DELETE FROM funcionario
        WHERE id_funcionario = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas