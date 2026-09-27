from main import criar_conexao
from utils.security import criptografar_cpf, descriptografar_cpf


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_responsavel,
            nome,
            cpf,
            telefone,
            email
        FROM responsavel
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    responsaveis = []
    for registro in registros:
        responsavel = {
            "id_responsavel": registro[0],
            "nome": registro[1],
            "cpf": descriptografar_cpf(registro[2]),
            "telefone": registro[3],
            "email": registro[4]
        }
        responsaveis.append(responsavel)

    return responsaveis


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_responsavel,
            nome,
            cpf,
            telefone,
            email
        FROM responsavel
        WHERE id_responsavel = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id_responsavel": registro[0],
        "nome": registro[1],
        "cpf": descriptografar_cpf(registro[2]),  
        "telefone": registro[3],
        "email": registro[4]
    }


def create(responsavel):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cpf_criptografado = criptografar_cpf(responsavel.cpf)

    cursor.execute("""
        INSERT INTO responsavel (
            nome,
            cpf,
            telefone,
            email
        )
        VALUES (%s, %s, %s, %s)
    """, (
        responsavel.nome,
        cpf_criptografado,
        responsavel.telefone,
        responsavel.email
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado

def update(id: int, responsavel):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cpf_criptografado = criptografar_cpf(responsavel.cpf)

    cursor.execute("""
        UPDATE responsavel
        SET
            nome = %s,
            cpf = %s,
            telefone = %s,
            email = %s
        WHERE id_responsavel = %s
    """, (
        responsavel.nome,
        cpf_criptografado,
        responsavel.telefone,
        responsavel.email,
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
        DELETE FROM responsavel
        WHERE id_responsavel = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas