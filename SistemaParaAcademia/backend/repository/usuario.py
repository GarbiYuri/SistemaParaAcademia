from main import criar_conexao
from utils.security import gerar_hash_senha, criptografar_cpf, descriptografar_cpf


def readAll():
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_usuario,
            id_endereco,
            nome,
            cpf,
            email,
            data_nascimento,
            data_cadastro
        FROM usuario
    """)

    registros = cursor.fetchall()

    cursor.close()
    conexao.close()

    usuarios = []
    for registro in registros:
        usuario = {
            "id": registro[0],
            "id_endereco": registro[1],
            "nome": registro[2],
            "cpf": descriptografar_cpf(registro[3]),  # Descriptografa o CPF ao ler
            "email": registro[4],
            "dataNascimento": registro[5],
            "dataCadastro": registro[6]
        }
        usuarios.append(usuario)

    return usuarios


def readById(id: int):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT
            id_usuario,
            id_endereco,
            nome,
            cpf,
            email,
            data_nascimento,
            data_cadastro
        FROM usuario
        WHERE id_usuario = %s
    """, (id,))

    registro = cursor.fetchone()

    cursor.close()
    conexao.close()

    if registro is None:
        return None

    return {
        "id": registro[0],
        "id_endereco": registro[1],
        "nome": registro[2],
        "cpf": descriptografar_cpf(registro[3]),  # Descriptografa o CPF ao ler
        "email": registro[4],
        "dataNascimento": registro[5],
        "dataCadastro": registro[6]
    }


def create(usuario):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Aplica hash na senha e encripta o CPF
    senha_hash = gerar_hash_senha(usuario.senha)
    cpf_criptografado = criptografar_cpf(usuario.cpf)

    cursor.execute("""
        INSERT INTO usuario (
            id_endereco,
            nome,
            cpf,
            email,
            senha,
            data_nascimento,
            data_cadastro
        )
        VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE())
    """, (
        usuario.id_endereco,
        usuario.nome,
        cpf_criptografado,
        usuario.email,
        senha_hash,
        usuario.dataNascimento
    ))

    conexao.commit()
    id_criado = cursor.lastrowid

    cursor.close()
    conexao.close()

    return id_criado


def update(id: int, usuario):
    conexao = criar_conexao()
    cursor = conexao.cursor()

    # Aplica hash na senha e encripta o CPF
    senha_hash = gerar_hash_senha(usuario.senha)
    cpf_criptografado = criptografar_cpf(usuario.cpf)

    cursor.execute("""
        UPDATE usuario
        SET
            id_endereco = %s,
            nome = %s,
            cpf = %s,
            email = %s,
            senha = %s,
            data_nascimento = %s
        WHERE id_usuario = %s
    """, (
        usuario.id_endereco,
        usuario.nome,
        cpf_criptografado,
        usuario.email,
        senha_hash,
        usuario.dataNascimento,
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
        DELETE FROM usuario
        WHERE id_usuario = %s
    """, (id,))

    conexao.commit()
    linhas_excluidas = cursor.rowcount

    cursor.close()
    conexao.close()

    return linhas_excluidas