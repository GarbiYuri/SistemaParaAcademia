from main import criar_conexao
from schema import converter_time

def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            id_endereco,
            nome,
            cnpj,
            email,
            telefone,
            hora_abertura,
            hora_fechamento
        FROM dados_academia
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    academias = []

    for registro in registros:
        academia = {
            "id": registro[0],
            "idEndereco": registro[1],
            "nome": registro[2],
            "cnpj": registro[3],
            "email": registro[4],
            "telefone": registro[5],
            "horaAbertura": converter_time(registro[6]),
            "horaFechamento": converter_time(registro[7])
        }

        academias.append(academia)

    return academias


def getById(id_academia):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id,
            id_endereco,
            nome,
            cnpj,
            email,
            telefone,
            hora_abertura,
            hora_fechamento
        FROM dados_academia
        WHERE id = %s
    """, (id_academia,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    academia = {
        "id": registro[0],
        "idEndereco": registro[1],
        "nome": registro[2],
        "cnpj": registro[3],
        "email": registro[4],
        "telefone": registro[5],
        "horaAbertura": converter_time(registro[6]),
        "horaFechamento": converter_time(registro[7])
    }

    return academia


def create(academia):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    sql = """
        INSERT INTO dados_academia
        (
            id_endereco,
            nome,
            cnpj,
            email,
            telefone,
            hora_abertura,
            hora_fechamento
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    valores = (
        academia.idEndereco,
        academia.nome,
        academia.cnpj,
        academia.email,
        academia.telefone,
        academia.horaAbertura,
        academia.horaFechamento
    )

    cursor.execute(sql, valores)
    conexao.commit()

    id_academia = cursor.lastrowid

    cursor.close()
    conexao.close()

    return getById(id_academia)


def update(id_academia, academia):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    sql = """
        UPDATE dados_academia
        SET
            id_endereco = %s,
            nome = %s,
            cnpj = %s,
            email = %s,
            telefone = %s,
            hora_abertura = %s,
            hora_fechamento = %s
        WHERE id = %s
    """

    valores = (
        academia.idEndereco,
        academia.nome,
        academia.cnpj,
        academia.email,
        academia.telefone,
        academia.horaAbertura,
        academia.horaFechamento,
        id_academia
    )

    cursor.execute(sql, valores)
    conexao.commit()

    linhas_alteradas = cursor.rowcount

    cursor.close()
    conexao.close()

    if linhas_alteradas == 0:
        return None

    return getById(id_academia)


def deletee(id_academia):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        DELETE FROM dados_academia
        WHERE id = %s
    """, (id_academia,))

    conexao.commit()

    linhas_deletadas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_deletadas > 0