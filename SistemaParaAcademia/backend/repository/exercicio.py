from database import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_exercicio,
            id_treino,
            nome_exercicio,
            series,
            repeticoes,
            carga,
            observacao
        FROM exercicio
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    exercicios = []
    for registro in registros:
        exercicio = {
            "id_exercicio": registro[0],
            "id_treino": registro[1],
            "nome_exercicio": registro[2],
            "series": registro[3],
            "repeticoes": registro[4],
            "carga": registro[5],
            "observacao": registro[6]
        }
        exercicios.append(exercicio)

    return exercicios


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_exercicio,
            id_treino,
            nome_exercicio,
            series,
            repeticoes,
            carga,
            observacao
        FROM exercicio
        WHERE id_exercicio = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_exercicio": registro[0],
        "id_treino": registro[1],
        "nome_exercicio": registro[2],
        "series": registro[3],
        "repeticoes": registro[4],
        "carga": registro[5],
        "observacao": registro[6]
    }


def readByTreinoId(id_treino: int):
    """Busca todos os exercícios pertencentes a um treino específico."""
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_exercicio,
            id_treino,
            nome_exercicio,
            series,
            repeticoes,
            carga,
            observacao
        FROM exercicio
        WHERE id_treino = %s
    """, (id_treino,))

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    exercicios = []
    for registro in registros:
        exercicio = {
            "id_exercicio": registro[0],
            "id_treino": registro[1],
            "nome_exercicio": registro[2],
            "series": registro[3],
            "repeticoes": registro[4],
            "carga": registro[5],
            "observacao": registro[6]
        }
        exercicios.append(exercicio)

    return exercicios


def create(exercicio):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO exercicio (
            id_treino,
            nome_exercicio,
            series,
            repeticoes,
            carga,
            observacao
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        exercicio.id_treino,
        exercicio.nome_exercicio,
        exercicio.series,
        exercicio.repeticoes,
        exercicio.carga,
        exercicio.observacao
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, exercicio):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE exercicio
        SET
            id_treino = %s,
            nome_exercicio = %s,
            series = %s,
            repeticoes = %s,
            carga = %s,
            observacao = %s
        WHERE id_exercicio = %s
    """, (
        exercicio.id_treino,
        exercicio.nome_exercicio,
        exercicio.series,
        exercicio.repeticoes,
        exercicio.carga,
        exercicio.observacao,
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
        DELETE FROM exercicio
        WHERE id_exercicio = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas