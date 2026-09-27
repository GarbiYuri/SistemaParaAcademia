from database import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_pagamento,
            id_aluno,
            forma_pagamento,
            valor,
            data_pagamento,
            status
        FROM pagamento
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    pagamentos = []
    for registro in registros:
        pagamento = {
            "id_pagamento": registro[0],
            "id_aluno": registro[1],
            "forma_pagamento": registro[2],
            "valor": float(registro[3]) if registro[3] is not None else 0.0,
            "data_pagamento": registro[4],
            "status": registro[5]
        }
        pagamentos.append(pagamento)

    return pagamentos


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_pagamento,
            id_aluno,
            forma_pagamento,
            valor,
            data_pagamento,
            status
        FROM pagamento
        WHERE id_pagamento = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_pagamento": registro[0],
        "id_aluno": registro[1],
        "forma_pagamento": registro[2],
        "valor": float(registro[3]) if registro[3] is not None else 0.0,
        "data_pagamento": registro[4],
        "status": registro[5]
    }


def create(pagamento):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Se a data_pagamento for informada, grava no banco; caso contrário, deixa o MySQL usar CURRENT_TIMESTAMP
    if pagamento.data_pagamento:
        cursor.execute("""
            INSERT INTO pagamento (
                id_aluno,
                forma_pagamento,
                valor,
                data_pagamento,
                status
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            pagamento.id_aluno,
            pagamento.forma_pagamento,
            pagamento.valor,
            pagamento.data_pagamento,
            pagamento.status
        ))
    else:
        cursor.execute("""
            INSERT INTO pagamento (
                id_aluno,
                forma_pagamento,
                valor,
                data_pagamento,
                status
            )
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s)
        """, (
            pagamento.id_aluno,
            pagamento.forma_pagamento,
            pagamento.valor,
            pagamento.status
        ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, pagamento):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Se data_pagamento não for fornecida no update, mantém o valor atual no banco
    if pagamento.data_pagamento:
        cursor.execute("""
            UPDATE pagamento
            SET
                id_aluno = %s,
                forma_pagamento = %s,
                valor = %s,
                data_pagamento = %s,
                status = %s
            WHERE id_pagamento = %s
        """, (
            pagamento.id_aluno,
            pagamento.forma_pagamento,
            pagamento.valor,
            pagamento.data_pagamento,
            pagamento.status,
            id
        ))
    else:
        cursor.execute("""
            UPDATE pagamento
            SET
                id_aluno = %s,
                forma_pagamento = %s,
                valor = %s,
                status = %s
            WHERE id_pagamento = %s
        """, (
            pagamento.id_aluno,
            pagamento.forma_pagamento,
            pagamento.valor,
            pagamento.status,
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
        DELETE FROM pagamento
        WHERE id_pagamento = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas