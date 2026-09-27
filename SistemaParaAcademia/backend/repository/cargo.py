from main import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_cargo,
            nome_cargo,
            salario_base,
            status
        FROM cargo
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    cargos = []
    for registro in registros:
        cargo = {
            "id_cargo": registro[0],
            "nome_cargo": registro[1],
            "salario_base": float(registro[2]) if registro[2] is not None else 0.0,
            "status": registro[3]
        }
        cargos.append(cargo)

    return cargos


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_cargo,
            nome_cargo,
            salario_base,
            status
        FROM cargo
        WHERE id_cargo = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_cargo": registro[0],
        "nome_cargo": registro[1],
        "salario_base": float(registro[2]) if registro[2] is not None else 0.0,
        "status": registro[3]
    }


def create(cargo):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO cargo (
            nome_cargo,
            salario_base,
            status
        )
        VALUES (%s, %s, %s)
    """, (
        cargo.nome_cargo,
        cargo.salario_base,
        cargo.status
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, cargo):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE cargo
        SET
            nome_cargo = %s,
            salario_base = %s,
            status = %s
        WHERE id_cargo = %s
    """, (
        cargo.nome_cargo,
        cargo.salario_base,
        cargo.status,
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
        DELETE FROM cargo
        WHERE id_cargo = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas