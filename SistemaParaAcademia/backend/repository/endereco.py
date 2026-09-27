from main import criar_conexao


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_endereco,
            pais,
            estado,
            cidade,
            bairro,
            rua,
            numero,
            complemento
        FROM endereco
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    enderecos = []

    for registro in registros:
        endereco = {
            "id": registro[0],
            "pais": registro[1],
            "estado": registro[2],
            "cidade": registro[3],
            "bairro": registro[4],
            "rua": registro[5],
            "numero": registro[6],
            "complemento": registro[7]
        }

        enderecos.append(endereco)

    return enderecos


def readById(id):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_endereco,
            pais,
            estado,
            cidade,
            bairro,
            rua,
            numero,
            complemento
        FROM endereco
        WHERE id_endereco = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id": registro[0],
        "pais": registro[1],
        "estado": registro[2],
        "cidade": registro[3],
        "bairro": registro[4],
        "rua": registro[5],
        "numero": registro[6],
        "complemento": registro[7]
    }


def create(endereco):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO endereco (
            pais,
            estado,
            cidade,
            bairro,
            rua,
            numero,
            complemento
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        endereco.pais,
        endereco.estado,
        endereco.cidade,
        endereco.bairro,
        endereco.rua,
        endereco.numero,
        endereco.complemento
    ))

    conexao.commit()

    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id, endereco):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE endereco
        SET
            pais = %s,
            estado = %s,
            cidade = %s,
            bairro = %s,
            rua = %s,
            numero = %s,
            complemento = %s
        WHERE id_endereco = %s
    """, (
        endereco.pais,
        endereco.estado,
        endereco.cidade,
        endereco.bairro,
        endereco.rua,
        endereco.numero,
        endereco.complemento,
        id
    ))

    conexao.commit()

    linhas_alteradas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_alteradas


def delete(id):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        DELETE FROM endereco
        WHERE id_endereco = %s
    """, (id,))

    conexao.commit()

    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas