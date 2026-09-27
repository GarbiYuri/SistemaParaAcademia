from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import IntegrityError, Error as MySQLError

from database import criar_conexao
import schema
import repository.dadosAcademia
import repository.endereco
import repository.usuario
import repository.responsavel
import repository.aluno
import repository.funcionario
import repository.cargo
import repository.pagamento
import repository.treino
import repository.exercicio

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="FATEC Academia - API REST Profissional",
    description="Backend completo com integração direta MySQL e arquitetura modular por Repositories",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/frontend",
    StaticFiles(directory=FRONTEND_DIR),
    name="frontend"
)

# ==========================================
# ROTAS PÁGINAS ESTÁTICAS
# ==========================================

@app.get("/", include_in_schema=False)
def pagina_inicial():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/dashboard", include_in_schema=False)
def obter_dashboard():
    return FileResponse(FRONTEND_DIR / "dashboard.html")


# ==========================================
# ROTAS CRUD - DADOS ACADEMIA
# ==========================================

@app.get(
    "/academias",
    response_model=List[schema.model.dadosAcademia.DadosAcademiaResponse],
    tags=["Dados Academia"]
)
def listar():
    return repository.dadosAcademia.readAll()


@app.get(
    "/academias/{id_academia}",
    response_model=schema.model.dadosAcademia.DadosAcademiaResponse,
    tags=["Dados Academia"]
)
def buscar_por_id(id_academia: int):
    academia = repository.dadosAcademia.getById(id_academia)
    if not academia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academia com ID {id_academia} não encontrada."
        )
    return academia


@app.post(
    "/academias",
    response_model=schema.model.dadosAcademia.DadosAcademiaResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Dados Academia"]
)
def criar(dados: schema.model.dadosAcademia.DadosAcademiaCreate):
    try:
        return repository.dadosAcademia.create(dados)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade no banco de dados (chave estrangeira ou duplicidade): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/academias/{id_academia}",
    response_model=schema.model.dadosAcademia.DadosAcademiaResponse,
    tags=["Dados Academia"]
)
def atualizar(id_academia: int, dados: schema.model.dadosAcademia.DadosAcademiaCreate):
    try:
        academia_atualizada = repository.dadosAcademia.update(id_academia, dados)
        if not academia_atualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Academia com ID {id_academia} não encontrada para atualização."
            )
        return academia_atualizada
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar: {err.msg}"
        )


@app.delete(
    "/academias/{id_academia}",
    status_code=status.HTTP_200_OK,
    tags=["Dados Academia"]
)
def deletar(id_academia: int):
    try:
        deletado = repository.dadosAcademia.deletee(id_academia)
        if not deletado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Academia com ID {id_academia} não encontrada para exclusão."
            )
        return {"message": "Academia removida com sucesso", "id": id_academia}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover esta academia pois ela possui vínculos ativos com outras tabelas."
        )
# ==========================================
# ROTAS CRUD - ENDEREÇO
# ==========================================
@app.get(
    "/enderecos",
    response_model=list[schema.model.endereco.EnderecoResponse],
    tags=["Endereços"]
)
def listar_enderecos():
    return repository.endereco.readAll()


@app.get(
    "/enderecos/{id}",
    response_model=schema.model.endereco.EnderecoResponse,
    tags=["Endereços"]
)
def buscar_endereco(id: int):
    endereco = repository.endereco.readById(id)

    if endereco is None:
        raise HTTPException(
            status_code=404,
            detail="Endereço não encontrado"
        )

    return endereco


@app.post(
    "/enderecos",
    response_model=schema.model.endereco.EnderecoResponse,
    tags=["Endereços"]
)
def criar_endereco(endereco: schema.model.endereco.EnderecoRequest):
    id_criado = repository.endereco.create(endereco)

    return repository.endereco.readById(id_criado)


@app.put(
    "/enderecos/{id}",
    response_model=schema.model.endereco.EnderecoResponse,
    tags=["Endereços"]
)
def atualizar_endereco(
    id: int,
    endereco: schema.model.endereco.EnderecoRequest
):
    linhas_alteradas = repository.endereco.update(id, endereco)

    if linhas_alteradas == 0:
        raise HTTPException(
            status_code=404,
            detail="Endereço não encontrado"
        )

    return repository.endereco.readById(id)


@app.delete("/enderecos/{id}", tags=["Endereços"])
def excluir_endereco(id: int):
    linhas_excluidas = repository.endereco.delete(id)

    if linhas_excluidas == 0:
        raise HTTPException(
            status_code=404,
            detail="Endereço não encontrado"
        )

    return {
        "mensagem": "Endereço excluído com sucesso"
    }

# ==========================================
# ROTAS CRUD - USUÀRIO
# ==========================================

@app.get(
    "/usuarios",
    response_model=List[schema.model.usuario.UsuarioResponse],
    tags=["Usuários"]
)
def listar_usuarios():
    return repository.usuario.readAll()


@app.get(
    "/usuarios/{id}",
    response_model=schema.model.usuario.UsuarioResponse,
    tags=["Usuários"]
)
def buscar_usuario(id: int):
    usuario = repository.usuario.readById(id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {id} não encontrado."
        )
    return usuario


@app.post(
    "/usuarios",
    response_model=schema.model.usuario.UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Usuários"]
)
def criar_usuario(usuario: schema.model.usuario.UsuarioRequest):
    try:
        id_criado = repository.usuario.create(usuario)
        return repository.usuario.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (CPF/E-mail duplicado ou ID de endereço inexistente): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/usuarios/{id}",
    response_model=schema.model.usuario.UsuarioResponse,
    tags=["Usuários"]
)
def atualizar_usuario(id: int, usuario: schema.model.usuario.UsuarioRequest):
    try:
        linhas_alteradas = repository.usuario.update(id, usuario)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuário com ID {id} não encontrado para atualização."
            )
        return repository.usuario.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar usuário: {err.msg}"
        )


@app.delete(
    "/usuarios/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Usuários"]
)
def excluir_usuario(id: int):
    try:
        linhas_excluidas = repository.usuario.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuário com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Usuário excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este usuário pois ele possui vínculos ativos no sistema."
        )
# ==========================================
# ROTAS CRUD - RESPONSÁVEL
# ==========================================

@app.get(
    "/responsaveis",
    response_model=List[schema.model.responsavel.ResponsavelResponse],
    tags=["Responsáveis"]
)
def listar_responsaveis():
    return repository.responsavel.readAll()


@app.get(
    "/responsaveis/{id}",
    response_model=schema.model.responsavel.ResponsavelResponse,
    tags=["Responsáveis"]
)
def buscar_responsavel(id: int):
    responsavel = repository.responsavel.readById(id)
    if responsavel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Responsável com ID {id} não encontrado."
        )
    return responsavel


@app.post(
    "/responsaveis",
    response_model=schema.model.responsavel.ResponsavelResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Responsáveis"]
)
def criar_responsavel(responsavel: schema.model.responsavel.ResponsavelRequest):
    try:
        id_criado = repository.responsavel.create(responsavel)
        return repository.responsavel.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (CPF ou E-mail duplicado): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/responsaveis/{id}",
    response_model=schema.model.responsavel.ResponsavelResponse,
    tags=["Responsáveis"]
)
def atualizar_responsavel(id: int, responsavel: schema.model.responsavel.ResponsavelRequest):
    try:
        linhas_alteradas = repository.responsavel.update(id, responsavel)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Responsável com ID {id} não encontrado para atualização."
            )
        return repository.responsavel.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar responsável: {err.msg}"
        )


@app.delete(
    "/responsaveis/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Responsáveis"]
)
def excluir_responsavel(id: int):
    try:
        linhas_excluidas = repository.responsavel.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Responsável com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Responsável excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este responsável pois ele possui vínculos ativos com outras tabelas."
        )
    
# ==========================================
# ROTAS CRUD - ALUNO
# ==========================================

@app.get(
    "/alunos",
    response_model=List[schema.model.aluno.AlunoResponse],
    tags=["Alunos"]
)
def listar_alunos():
    return repository.aluno.readAll()


@app.get(
    "/alunos/{id}",
    response_model=schema.model.aluno.AlunoResponse,
    tags=["Alunos"]
)
def buscar_aluno(id: int):
    aluno = repository.aluno.readById(id)
    if aluno is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {id} não encontrado."
        )
    return aluno


@app.post(
    "/alunos",
    response_model=schema.model.aluno.AlunoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Alunos"]
)
def criar_aluno(aluno: schema.model.aluno.AlunoRequest):
    try:
        id_criado = repository.aluno.create(aluno)
        return repository.aluno.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (ID de Usuário já cadastrado como Aluno ou FK inexistente): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/alunos/{id}",
    response_model=schema.model.aluno.AlunoResponse,
    tags=["Alunos"]
)
def atualizar_aluno(id: int, aluno: schema.model.aluno.AlunoRequest):
    try:
        linhas_alteradas = repository.aluno.update(id, aluno)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aluno com ID {id} não encontrado para atualização."
            )
        return repository.aluno.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar aluno: {err.msg}"
        )


@app.delete(
    "/alunos/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Alunos"]
)
def excluir_aluno(id: int):
    try:
        linhas_excluidas = repository.aluno.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aluno com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Aluno excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este aluno pois ele possui vínculos ativos em outras tabelas."
        )

# ==========================================
# ROTAS CRUD - FUNCIONÁRIO
# ==========================================

@app.get(
    "/funcionarios",
    response_model=List[schema.model.funcionario.FuncionarioResponse],
    tags=["Funcionários"]
)
def listar_funcionarios():
    return repository.funcionario.readAll()


@app.get(
    "/funcionarios/{id}",
    response_model=schema.model.funcionario.FuncionarioResponse,
    tags=["Funcionários"]
)
def buscar_funcionario(id: int):
    funcionario = repository.funcionario.readById(id)
    if funcionario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Funcionário com ID {id} não encontrado."
        )
    return funcionario


@app.post(
    "/funcionarios",
    response_model=schema.model.funcionario.FuncionarioResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Funcionários"]
)
def criar_funcionario(funcionario: schema.model.funcionario.FuncionarioRequest):
    try:
        id_criado = repository.funcionario.create(funcionario)
        return repository.funcionario.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (ID de Usuário já cadastrado como Funcionário ou FK inexistente): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/funcionarios/{id}",
    response_model=schema.model.funcionario.FuncionarioResponse,
    tags=["Funcionários"]
)
def atualizar_funcionario(id: int, funcionario: schema.model.funcionario.FuncionarioRequest):
    try:
        linhas_alteradas = repository.funcionario.update(id, funcionario)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Funcionário com ID {id} não encontrado para atualização."
            )
        return repository.funcionario.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar funcionário: {err.msg}"
        )


@app.delete(
    "/funcionarios/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Funcionários"]
)
def excluir_funcionario(id: int):
    try:
        linhas_excluidas = repository.funcionario.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Funcionário com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Funcionário excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este funcionário pois ele possui vínculos ativos em outras tabelas."
        )

# ==========================================
# ROTAS CRUD - CARGO
# ==========================================

@app.get(
    "/cargos",
    response_model=List[schema.model.cargo.CargoResponse],
    tags=["Cargos"]
)
def listar_cargos():
    return repository.cargo.readAll()


@app.get(
    "/cargos/{id}",
    response_model=schema.model.cargo.CargoResponse,
    tags=["Cargos"]
)
def buscar_cargo(id: int):
    cargo = repository.cargo.readById(id)
    if cargo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cargo com ID {id} não encontrado."
        )
    return cargo


@app.post(
    "/cargos",
    response_model=schema.model.cargo.CargoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cargos"]
)
def criar_cargo(cargo: schema.model.cargo.CargoRequest):
    try:
        id_criado = repository.cargo.create(cargo)
        return repository.cargo.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (Nome do cargo já cadastrado): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/cargos/{id}",
    response_model=schema.model.cargo.CargoResponse,
    tags=["Cargos"]
)
def atualizar_cargo(id: int, cargo: schema.model.cargo.CargoRequest):
    try:
        linhas_alteradas = repository.cargo.update(id, cargo)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo com ID {id} não encontrado para atualização."
            )
        return repository.cargo.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar cargo (nome duplicado): {err.msg}"
        )


@app.delete(
    "/cargos/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Cargos"]
)
def excluir_cargo(id: int):
    try:
        linhas_excluidas = repository.cargo.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Cargo excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este cargo pois existem funcionários vinculados a ele."
        )

# ==========================================
# ROTAS CRUD - PAGAMENTO
# ==========================================

@app.get(
    "/pagamentos",
    response_model=List[schema.model.pagamento.PagamentoResponse],
    tags=["Pagamentos"]
)
def listar_pagamentos():
    return repository.pagamento.readAll()


@app.get(
    "/pagamentos/{id}",
    response_model=schema.model.pagamento.PagamentoResponse,
    tags=["Pagamentos"]
)
def buscar_pagamento(id: int):
    pagamento = repository.pagamento.readById(id)
    if pagamento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pagamento com ID {id} não encontrado."
        )
    return pagamento


@app.post(
    "/pagamentos",
    response_model=schema.model.pagamento.PagamentoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Pagamentos"]
)
def criar_pagamento(pagamento: schema.model.pagamento.PagamentoRequest):
    try:
        id_criado = repository.pagamento.create(pagamento)
        return repository.pagamento.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (ID de aluno inexistente no banco): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/pagamentos/{id}",
    response_model=schema.model.pagamento.PagamentoResponse,
    tags=["Pagamentos"]
)
def atualizar_pagamento(id: int, pagamento: schema.model.pagamento.PagamentoRequest):
    try:
        linhas_alteradas = repository.pagamento.update(id, pagamento)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pagamento com ID {id} não encontrado para atualização."
            )
        return repository.pagamento.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar pagamento: {err.msg}"
        )


@app.delete(
    "/pagamentos/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Pagamentos"]
)
def excluir_pagamento(id: int):
    try:
        linhas_excluidas = repository.pagamento.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pagamento com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Pagamento excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este pagamento pois ele possui vínculos ativos no sistema."
        )

# ==========================================
# ROTAS CRUD - TREINO
# ==========================================

@app.get(
    "/treinos",
    response_model=List[schema.model.treino.TreinoResponse],
    tags=["Treinos"]
)
def listar_treinos():
    return repository.treino.readAll()


@app.get(
    "/treinos/{id}",
    response_model=schema.model.treino.TreinoResponse,
    tags=["Treinos"]
)
def buscar_treino(id: int):
    treino = repository.treino.readById(id)
    if treino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treino com ID {id} não encontrado."
        )
    return treino


@app.post(
    "/treinos",
    response_model=schema.model.treino.TreinoResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Treinos"]
)
def criar_treino(treino: schema.model.treino.TreinoRequest):
    try:
        id_criado = repository.treino.create(treino)
        return repository.treino.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (ID de Aluno ou Professor/Funcionário inexistente): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/treinos/{id}",
    response_model=schema.model.treino.TreinoResponse,
    tags=["Treinos"]
)
def atualizar_treino(id: int, treino: schema.model.treino.TreinoRequest):
    try:
        linhas_alteradas = repository.treino.update(id, treino)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Treino com ID {id} não encontrado para atualização."
            )
        return repository.treino.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar treino: {err.msg}"
        )


@app.delete(
    "/treinos/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Treinos"]
)
def excluir_treino(id: int):
    try:
        linhas_excluidas = repository.treino.delete(id)
        if linhas_excluidas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Treino com ID {id} não encontrado para exclusão."
            )
        return {"mensagem": "Treino excluído com sucesso", "id": id}
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover este treino pois ele possui exercícios vinculados a ele."
        )

# ==========================================
# ROTAS CRUD - EXERCÍCIO
# ==========================================

@app.get(
    "/exercicios",
    response_model=List[schema.model.exercicio.ExercicioResponse],
    tags=["Exercícios"]
)
def listar_exercicios():
    return repository.exercicio.readAll()


@app.get(
    "/exercicios/{id}",
    response_model=schema.model.exercicio.ExercicioResponse,
    tags=["Exercícios"]
)
def buscar_exercicio(id: int):
    exercicio = repository.exercicio.readById(id)
    if exercicio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercício com ID {id} não encontrado."
        )
    return exercicio


@app.get(
    "/treinos/{id_treino}/exercicios",
    response_model=List[schema.model.exercicio.ExercicioResponse],
    tags=["Exercícios"]
)
def listar_exercicios_do_treino(id_treino: int):
    return repository.exercicio.readByTreinoId(id_treino)


@app.post(
    "/exercicios",
    response_model=schema.model.exercicio.ExercicioResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Exercícios"]
)
def criar_exercicio(exercicio: schema.model.exercicio.ExercicioRequest):
    try:
        id_criado = repository.exercicio.create(exercicio)
        return repository.exercicio.readById(id_criado)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade (ID de Treino inexistente): {err.msg}"
        )
    except MySQLError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {err.msg}"
        )


@app.put(
    "/exercicios/{id}",
    response_model=schema.model.exercicio.ExercicioResponse,
    tags=["Exercícios"]
)
def atualizar_exercicio(id: int, exercicio: schema.model.exercicio.ExercicioRequest):
    try:
        linhas_alteradas = repository.exercicio.update(id, exercicio)
        if linhas_alteradas == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercício com ID {id} não encontrado para atualização."
            )
        return repository.exercicio.readById(id)
    except IntegrityError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao atualizar exercício: {err.msg}"
        )


@app.delete(
    "/exercicios/{id}",
    status_code=status.HTTP_200_OK,
    tags=["Exercícios"]
)
def excluir_exercicio(id: int):
    linhas_excluidas = repository.exercicio.delete(id)
    if linhas_excluidas == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercício com ID {id} não encontrado para exclusão."
        )
    return {"mensagem": "Exercício excluído com sucesso", "id": id}