from main import criar_conexao

def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_aluno,
            id_usuario,
            id_responsavel,
            forma_pagamento_preferida,
            status_matricula,
            data_vencimento
        FROM aluno
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    alunos = []
    for registro in registros:
        aluno = {
            "id_aluno": registro[0],
            "id_usuario": registro[1],
            "id_responsavel": registro[2],
            "forma_pagamento_preferida": registro[3],
            "status_matricula": registro[4],
            "data_vencimento": registro[5]
        }
        alunos.append(aluno)

    return alunos


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_aluno,
            id_usuario,
            id_responsavel,
            forma_pagamento_preferida,
            status_matricula,
            data_vencimento
        FROM aluno
        WHERE id_aluno = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_aluno": registro[0],
        "id_usuario": registro[1],
        "id_responsavel": registro[2],
        "forma_pagamento_preferida": registro[3],
        "status_matricula": registro[4],
        "data_vencimento": registro[5]
    }


def create(aluno):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO aluno (
            id_usuario,
            id_responsavel,
            forma_pagamento_preferida,
            status_matricula,
            data_vencimento
        )
        VALUES (%s, %s, %s, %s, %s)
    """, (
        aluno.id_usuario,
        aluno.id_responsavel,
        aluno.forma_pagamento_preferida,
        aluno.status_matricula,
        aluno.data_vencimento
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, aluno):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE aluno
        SET
            id_usuario = %s,
            id_responsavel = %s,
            forma_pagamento_preferida = %s,
            status_matricula = %s,
            data_vencimento = %s
        WHERE id_aluno = %s
    """, (
        aluno.id_usuario,
        aluno.id_responsavel,
        aluno.forma_pagamento_preferida,
        aluno.status_matricula,
        aluno.data_vencimento,
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
        DELETE FROM aluno
        WHERE id_aluno = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas