from database import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_treino,
            id_aluno,
            id_professor,
            nome_treino,
            data_criacao,
            data_atualizacao,
            status
        FROM treino
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    treinos = []
    for registro in registros:
        treino = {
            "id_treino": registro[0],
            "id_aluno": registro[1],
            "id_professor": registro[2],
            "nome_treino": registro[3],
            "data_criacao": registro[4],
            "data_atualizacao": registro[5],
            "status": registro[6]
        }
        treinos.append(treino)

    return treinos


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_treino,
            id_aluno,
            id_professor,
            nome_treino,
            data_criacao,
            data_atualizacao,
            status
        FROM treino
        WHERE id_treino = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_treino": registro[0],
        "id_aluno": registro[1],
        "id_professor": registro[2],
        "nome_treino": registro[3],
        "data_criacao": registro[4],
        "data_atualizacao": registro[5],
        "status": registro[6]
    }


def create(treino):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Se data_criacao for enviada, usa no INSERT; caso contrário deixa o MySQL utilizar DEFAULT (CURRENT_DATE)
    if treino.data_criacao:
        cursor.execute("""
            INSERT INTO treino (
                id_aluno,
                id_professor,
                nome_treino,
                data_criacao,
                data_atualizacao,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            treino.id_aluno,
            treino.id_professor,
            treino.nome_treino,
            treino.data_criacao,
            treino.data_atualizacao,
            treino.status
        ))
    else:
        cursor.execute("""
            INSERT INTO treino (
                id_aluno,
                id_professor,
                nome_treino,
                data_criacao,
                data_atualizacao,
                status
            )
            VALUES (%s, %s, %s, CURRENT_DATE, %s, %s)
        """, (
            treino.id_aluno,
            treino.id_professor,
            treino.nome_treino,
            treino.data_atualizacao,
            treino.status
        ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, treino):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Se data_atualizacao não for informada no payload, atualiza automaticamente com CURRENT_DATE
    if treino.data_atualizacao:
        cursor.execute("""
            UPDATE treino
            SET
                id_aluno = %s,
                id_professor = %s,
                nome_treino = %s,
                data_atualizacao = %s,
                status = %s
            WHERE id_treino = %s
        """, (
            treino.id_aluno,
            treino.id_professor,
            treino.nome_treino,
            treino.data_atualizacao,
            treino.status,
            id
        ))
    else:
        cursor.execute("""
            UPDATE treino
            SET
                id_aluno = %s,
                id_professor = %s,
                nome_treino = %s,
                data_atualizacao = CURRENT_DATE,
                status = %s
            WHERE id_treino = %s
        """, (
            treino.id_aluno,
            treino.id_professor,
            treino.nome_treino,
            treino.status,
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
        DELETE FROM treino
        WHERE id_treino = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas