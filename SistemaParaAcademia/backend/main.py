from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
import uvicorn
from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import mysql.connector
from pydantic import BaseModel, EmailStr
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
    
from database import get_db
from schema import (
    AuditoriaCreate, AuditoriaResponse,
    BancoCreate, BancoResponse,
    CargoCreate, CargoResponse,
    DadosAcademiaCreate, DadosAcademiaResponse,
    EnderecoCreate, EnderecoResponse,
    ExercicioCreate, ExercicioResponse,
    ExercicioTreinoCreate, ExercicioTreinoResponse,
    FormaPagamentoCreate, FormaPagamentoResponse,
    FuncionarioCreate, FuncionarioResponse,
    PagamentoCreate, PagamentoResponse,
    PlanoCreate, PlanoResponse,
    RecebimentoCreate, RecebimentoResponse,
    RegistroPontoCreate, RegistroPontoResponse,
    ResponsavelCreate, ResponsavelResponse,
    TreinoCreate, TreinoResponse,
    UsuarioCreate, UsuarioResponse,

    # DTOs Compostos
    AlunoCompletoCreate,
    FuncionarioCompletoCreate,

    # DTOs para Procedures
    SPCadastrarAlunoInput,
    SPCatracaResponse,
    SPRegistrarPagamentoInput,
    SPTreinoAlunoItem
)

class LoginInput(BaseModel):
    email: EmailStr
    senha: str

app = FastAPI(
    title="FATEC Academia - API REST Profissional",
    description="Backend completo com integração direta MySQL, Stored Procedures e gerenciamento de permissões",
    version="2.0.0"
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount(
    "/frontend",
    StaticFiles(directory=FRONTEND_DIR),
    name="frontend"
)

@app.get("/", include_in_schema=False)
def pagina_inicial():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/dashboard/admin", include_in_schema=False)
def dashboard_admin():
    return FileResponse(FRONTEND_DIR / "dashboard-admin.html")

@app.get("/dashboard/professor", include_in_schema=False)
def dashboard_professor():
    return FileResponse(FRONTEND_DIR / "dashboard-professor.html")

@app.get("/dashboard/recepcao", include_in_schema=False)
def dashboard_recepcao():
    return FileResponse(FRONTEND_DIR / "dashboard-recepcao.html")

@app.get("/dashboard/aluno", include_in_schema=False)
def dashboard_aluno():
    return FileResponse(FRONTEND_DIR / "dashboard-aluno.html")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Permite requisições de qualquer origem
    allow_credentials=True,
    allow_methods=["*"],        # Libera OPTIONS, GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],        # Libera todos os cabeçalhos (Content-Type, Authorization, etc.)
)

# ==========================================
# 0. AUTENTICAÇÃO
# ==========================================
@app.post("/login/", tags=["0. Autenticação"])
def login(dados: LoginInput, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT u.id_usuario, u.nome, u.email, u.senha, f.id_funcionario, c.nome_cargo
        FROM usuario u
        LEFT JOIN funcionario f ON f.id_usuario = u.id_usuario
        LEFT JOIN cargo c ON c.id_cargo = f.id_cargo
        WHERE u.email = %s
    """
    cursor.execute(query, (dados.email,))
    usuario = cursor.fetchone()
    cursor.close()

    if not usuario or usuario["senha"] != dados.senha:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos"
        )

    return {
        "message": "Login realizado com sucesso",
        "usuario": {
            "id_usuario": usuario["id_usuario"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "cargo": usuario["nome_cargo"] or "Aluno/Outro"
        }
    }


# ==========================================
# 1. ENDEREÇO CRUD
# ==========================================
@app.post("/enderecos/", response_model=EnderecoResponse, status_code=status.HTTP_201_CREATED, tags=["1. Endereços"])
def criar_endereco(endereco: EnderecoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = """
        INSERT INTO endereco (pais, estado, cidade, bairro, rua, numero, complemento, obs)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (endereco.pais, endereco.estado, endereco.cidade, endereco.bairro, 
                          endereco.rua, endereco.numero, endereco.complemento, endereco.obs))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return EnderecoResponse(id_endereco=id_criado, **endereco.model_dump())

@app.get("/enderecos/", response_model=List[EnderecoResponse], tags=["1. Endereços"])
def listar_enderecos(skip: int = 0, limit: int = 100, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM endereco LIMIT %s OFFSET %s", (limit, skip))
    res = cursor.fetchall()
    cursor.close()
    return res

@app.get("/enderecos/{id_endereco}", response_model=EnderecoResponse, tags=["1. Endereços"])
def obter_endereco(id_endereco: int, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM endereco WHERE id_endereco = %s", (id_endereco,))
    res = cursor.fetchone()
    cursor.close()
    if not res:
        raise HTTPException(status_code=404, detail="Endereço não encontrado")
    return res

@app.delete("/enderecos/{id_endereco}", tags=["1. Endereços"])
def deletar_endereco(id_endereco: int, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM endereco WHERE id_endereco = %s", (id_endereco,))
    conn.commit()
    rows = cursor.rowcount
    cursor.close()
    if rows == 0:
        raise HTTPException(status_code=404, detail="Endereço não encontrado")
    return {"message": "Endereço excluído com sucesso"}


# ==========================================
# 2. DADOS ACADEMIA CRUD
# ==========================================
@app.post("/dados-academia/", response_model=DadosAcademiaResponse, status_code=status.HTTP_201_CREATED, tags=["2. Academia"])
def criar_dados_academia(dados: DadosAcademiaCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = """
        INSERT INTO dados_academia (id_endereco, nome, cnpj, email, telefone, hora_abertura, hora_fechamento)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (dados.id_endereco, dados.nome, dados.cnpj, dados.email, 
                          dados.telefone, dados.hora_abertura, dados.hora_fechamento))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return DadosAcademiaResponse(id=id_criado, **dados.model_dump())

@app.get("/dados-academia/", response_model=List[DadosAcademiaResponse], tags=["2. Academia"])
def listar_dados_academia(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM dados_academia")
    res = cursor.fetchall()
    cursor.close()
    return res


# ==========================================
# 3. PLANO CRUD
# ==========================================
@app.post("/planos/", response_model=PlanoResponse, status_code=status.HTTP_201_CREATED, tags=["3. Planos"])
def criar_plano(plano: PlanoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = "INSERT INTO plano (nome, descricao, preco, status) VALUES (%s, %s, %s, %s)"
    try:
        cursor.execute(query, (plano.nome, plano.descricao, plano.preco, plano.status.value))
        conn.commit()
        id_criado = cursor.lastrowid
        cursor.close()
        return PlanoResponse(id_plano=id_criado, **plano.model_dump())
    except mysql.connector.Error as err:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(err))

@app.get("/planos/", response_model=List[PlanoResponse], tags=["3. Planos"])
def listar_planos(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM plano")
    res = cursor.fetchall()
    cursor.close()
    return res


# ==========================================
# 4. CARGO CRUD
# ==========================================
@app.post("/cargos/", response_model=CargoResponse, status_code=status.HTTP_201_CREATED, tags=["4. Cargos"])
def criar_cargo(cargo: CargoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = "INSERT INTO cargo (nome_cargo, salario_base, status) VALUES (%s, %s, %s)"
    cursor.execute(query, (cargo.nome_cargo, cargo.salario_base, cargo.status.value))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return CargoResponse(id_cargo=id_criado, **cargo.model_dump())

@app.get("/cargos/", response_model=List[CargoResponse], tags=["4. Cargos"])
def listar_cargos(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cargo")
    res = cursor.fetchall()
    cursor.close()
    return res

@app.put("/cargos/{id_cargo}/salario", tags=["4. Cargos"])
def atualizar_salario_cargo(id_cargo: int, novo_salario: Decimal, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.callproc("sp_atualizar_salario_cargo", (id_cargo, novo_salario))
    conn.commit()
    cursor.close()
    return {"message": "Salário atualizado com sucesso via Procedure"}


# ==========================================
# 5. RESPONSÁVEL CRUD
# ==========================================
@app.post("/responsaveis/", response_model=ResponsavelResponse, status_code=status.HTTP_201_CREATED, tags=["5. Responsáveis"])
def criar_responsavel(responsavel: ResponsavelCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = "INSERT INTO responsavel (nome, cpf, cpf_hash, telefone, email) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(query, (responsavel.nome, responsavel.cpf, responsavel.cpf_hash, responsavel.telefone, responsavel.email))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return ResponsavelResponse(id_responsavel=id_criado, **responsavel.model_dump())

@app.get("/responsaveis/", response_model=List[ResponsavelResponse], tags=["5. Responsáveis"])
def listar_responsaveis(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM responsavel")
    res = cursor.fetchall()
    cursor.close()
    return res


# ==========================================
# 6. USUÁRIO CRUD
# ==========================================
@app.post("/usuarios/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, tags=["6. Usuários"])
def criar_usuario(usuario: UsuarioCreate, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    query = """
        INSERT INTO usuario (id_endereco, nome, cpf, cpf_hash, email, senha, digital, facial, data_nascimento)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        usuario.id_endereco, usuario.nome, usuario.cpf, usuario.cpf_hash,
        usuario.email, usuario.senha, usuario.digital, usuario.facial, usuario.data_nascimento
    ))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.execute("SELECT * FROM usuario WHERE id_usuario = %s", (id_criado,))
    res = cursor.fetchone()
    cursor.close()
    return res

@app.get("/usuarios/", response_model=List[UsuarioResponse], tags=["6. Usuários"])
def listar_usuarios(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuario")
    res = cursor.fetchall()
    cursor.close()
    return res


# ==========================================
# 7. ALUNO CRUD
# ==========================================
@app.post("/alunos/", status_code=status.HTTP_201_CREATED, tags=["7. Alunos"])
def criar_aluno_procedure(dados: SPCadastrarAlunoInput, conn=Depends(get_db)):
    """Cadastra aluno executando a Procedure sp_cadastrar_aluno."""
    cursor = conn.cursor()
    try:
        args = (dados.id_usuario, dados.id_responsavel, dados.id_plano, dados.forma_pagamento_preferida, 0)
        result = cursor.callproc("sp_cadastrar_aluno", args)
        conn.commit()
        id_aluno_criado = result[4]
        cursor.close()
        return {"id_aluno": id_aluno_criado, "message": "Aluno cadastrado com sucesso via Procedure"}
    except mysql.connector.Error as err:
        cursor.close()
        raise HTTPException(status_code=400, detail=err.msg)

@app.post("/alunos/completo/", status_code=status.HTTP_201_CREATED, tags=["7. Alunos"])
def criar_aluno_completo(dados: AlunoCompletoCreate, conn=Depends(get_db)):
    """Cria Usuário e Aluno em uma transação atômica invocando a Procedure sp_cadastrar_aluno."""
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        u = dados.usuario
        query_user = """
            INSERT INTO usuario (id_endereco, nome, cpf, cpf_hash, email, senha, digital, facial, data_nascimento)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query_user, (
            u.id_endereco, u.nome, u.cpf, u.cpf_hash,
            u.email, u.senha, u.digital, u.facial, u.data_nascimento
        ))
        id_usuario_criado = cursor.lastrowid

        args = (id_usuario_criado, dados.id_responsavel, dados.id_plano, dados.forma_pagamento_preferida, 0)
        res = cursor.callproc("sp_cadastrar_aluno", args)
        id_aluno_criado = res[4]

        conn.commit()
        cursor.close()
        return {
            "id_usuario": id_usuario_criado,
            "id_aluno": id_aluno_criado,
            "message": "Aluno e Usuário cadastrados com sucesso"
        }
    except mysql.connector.Error as err:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {err.msg}")

@app.get("/alunos/", tags=["7. Alunos"])
def listar_alunos(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM aluno")
    res = cursor.fetchall()
    cursor.close()
    return res

@app.get("/alunos/{id_aluno}/validar-catraca", response_model=SPCatracaResponse, tags=["7. Alunos"])
def validar_catraca(id_aluno: int, conn=Depends(get_db)):
    cursor = conn.cursor()
    result = cursor.callproc("sp_validar_acesso_catraca", (id_aluno, False, ""))
    cursor.close()
    return SPCatracaResponse(acesso_liberado=bool(result[1]), motivo=result[2])

@app.put("/alunos/{id_aluno}/status", tags=["7. Alunos"])
def atualizar_status_matricula(id_aluno: int, novo_status: str, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.callproc("sp_atualizar_status_matricula", (id_aluno, novo_status))
    conn.commit()
    cursor.close()
    return {"message": "Status atualizado com sucesso"}


# ==========================================
# 8. FUNCIONÁRIO CRUD
# ==========================================
@app.post("/funcionarios/", response_model=FuncionarioResponse, status_code=status.HTTP_201_CREATED, tags=["8. Funcionários"])
def criar_funcionario(funcionario: FuncionarioCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = "INSERT INTO funcionario (id_usuario, id_cargo, id_responsavel, valor_hora) VALUES (%s, %s, %s, %s)"
    cursor.execute(query, (funcionario.id_usuario, funcionario.id_cargo, funcionario.id_responsavel, funcionario.valor_hora))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return FuncionarioResponse(id_funcionario=id_criado, **funcionario.model_dump())

@app.post("/funcionarios/completo/", status_code=status.HTTP_201_CREATED, tags=["8. Funcionários"])
def criar_funcionario_completo(dados: FuncionarioCompletoCreate, conn=Depends(get_db)):
    """Cria Usuário e Funcionário vinculados sob a mesma transação."""
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        u = dados.usuario
        query_user = """
            INSERT INTO usuario (id_endereco, nome, cpf, cpf_hash, email, senha, digital, facial, data_nascimento)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query_user, (
            u.id_endereco, u.nome, u.cpf, u.cpf_hash,
            u.email, u.senha, u.digital, u.facial, u.data_nascimento
        ))
        id_usuario_criado = cursor.lastrowid

        query_func = """
            INSERT INTO funcionario (id_usuario, id_cargo, id_responsavel, valor_hora)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query_func, (id_usuario_criado, dados.id_cargo, dados.id_responsavel, dados.valor_hora))
        id_func_criado = cursor.lastrowid

        conn.commit()
        cursor.close()
        return {
            "id_usuario": id_usuario_criado,
            "id_funcionario": id_func_criado,
            "message": "Funcionário e Usuário cadastrados com sucesso"
        }
    except mysql.connector.Error as err:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {err.msg}")

@app.get("/funcionarios/", response_model=List[FuncionarioResponse], tags=["8. Funcionários"])
def listar_funcionarios(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM funcionario")
    res = cursor.fetchall()
    cursor.close()
    return res


# ==========================================
# 9. REGISTRO DE PONTO
# ==========================================
@app.post("/ponto/", tags=["9. Registro de Ponto"])
def registrar_ponto_procedure(ponto: RegistroPontoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        args = (ponto.id_funcionario, ponto.tipo_batida.value, 0)
        res = cursor.callproc("sp_registrar_ponto", args)
        conn.commit()
        cursor.close()
        return {"id_ponto": res[2], "message": "Ponto registrado com sucesso via Procedure"}
    except mysql.connector.Error as err:
        cursor.close()
        raise HTTPException(status_code=400, detail=err.msg)


# ==========================================
# 10. TREINOS & EXERCÍCIOS
# ==========================================
@app.post("/exercicios/", response_model=ExercicioResponse, status_code=status.HTTP_201_CREATED, tags=["10. Treinos e Exercícios"])
def criar_exercicio(exercicio: ExercicioCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = "INSERT INTO exercicio (nome_exercicio, grupo_muscular) VALUES (%s, %s)"
    cursor.execute(query, (exercicio.nome_exercicio, exercicio.grupo_muscular))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return ExercicioResponse(id_exercicio=id_criado, **exercicio.model_dump())

@app.delete("/exercicios/{id_exercicio}", tags=["10. Treinos e Exercícios"])
def deletar_exercicio_procedure(id_exercicio: int, conn=Depends(get_db)):
    cursor = conn.cursor()
    cursor.callproc("sp_excluir_exercicio", (id_exercicio,))
    conn.commit()
    cursor.close()
    return {"message": "Exercício removido com sucesso via Procedure"}

@app.post("/treinos/", tags=["10. Treinos e Exercícios"])
def criar_treino_procedure(treino: TreinoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        args = (treino.id_aluno, treino.id_professor, treino.nome_treino, 0)
        res = cursor.callproc("sp_criar_treino", args)
        conn.commit()
        cursor.close()
        return {"id_treino": res[3], "message": "Treino criado com validação de cargo do professor"}
    except mysql.connector.Error as err:
        cursor.close()
        raise HTTPException(status_code=400, detail=err.msg)

@app.get("/alunos/{id_aluno}/treinos", response_model=List[SPTreinoAlunoItem], tags=["10. Treinos e Exercícios"])
def listar_treino_aluno_procedure(id_aluno: int, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.callproc("sp_listar_treino_aluno", (id_aluno,))
    
    resultados = []
    for result in cursor.stored_results():
        resultados.extend(result.fetchall())
        
    cursor.close()
    return resultados

@app.post("/exercicio-treino/", response_model=ExercicioTreinoResponse, status_code=status.HTTP_201_CREATED, tags=["10. Treinos e Exercícios"])
def vincular_exercicio_treino(item: ExercicioTreinoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = """
        INSERT INTO exercicio_treino (id_treino, id_exercicio, series, repeticoes, carga, unidade_carga, observacao)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    unidade = item.unidade_carga.value if item.unidade_carga else None
    cursor.execute(query, (item.id_treino, item.id_exercicio, item.series, item.repeticoes, item.carga, unidade, item.observacao))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return ExercicioTreinoResponse(id_exercicio_treino=id_criado, **item.model_dump())


# ==========================================
# 11. FINANCEIRO (Forma, Pagamento, Banco, Recebimento)
# ==========================================
@app.post("/formas-pagamento/", response_model=FormaPagamentoResponse, status_code=status.HTTP_201_CREATED, tags=["11. Financeiro"])
def criar_forma_pagamento(forma: FormaPagamentoCreate, conn=Depends(get_db)):
    cursor = conn.cursor()
    query = """
        INSERT INTO forma_pagamento (tipo, cpf, email, nome, digitos_cartao, bandeira, data_validade)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (forma.tipo, forma.cpf, forma.email, forma.nome, forma.digitos_cartao, forma.bandeira, forma.data_validade))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.close()
    return FormaPagamentoResponse(id_fpag=id_criado, **forma.model_dump())

@app.post("/pagamentos/", tags=["11. Financeiro"])
def registrar_pagamento_procedure(pag: SPRegistrarPagamentoInput, conn=Depends(get_db)):
    cursor = conn.cursor()
    try:
        args = (pag.id_forma_pagamento, pag.id_aluno, pag.valor, pag.status.value, 0)
        res = cursor.callproc("sp_registrar_pagamento", args)
        conn.commit()
        cursor.close()
        return {"id_pagamento": res[4], "message": "Pagamento registrado. Se 'Pago', a renovação foi processada."}
    except mysql.connector.Error as err:
        cursor.close()
        raise HTTPException(status_code=400, detail=err.msg)

@app.get("/pagamentos/filtro", tags=["11. Financeiro"])
def filtrar_pagamentos_periodo(data_inicio: datetime, data_fim: datetime, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.callproc("sp_filtrar_pagamentos_por_periodo", (data_inicio, data_fim))
    
    resultados = []
    for result in cursor.stored_results():
        resultados.extend(result.fetchall())
        
    cursor.close()
    return resultados

@app.post("/bancos/", response_model=BancoResponse, status_code=status.HTTP_201_CREATED, tags=["11. Financeiro"])
def criar_banco(banco: BancoCreate, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    query = """
        INSERT INTO banco (nome_banco, cod_compe, agencia, conta_corrente, d_conta, chave_pix, tipo_chave_pix, carteira_boleto, status, obs)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    tipo_pix = banco.tipo_chave_pix.value if banco.tipo_chave_pix else None
    cursor.execute(query, (banco.nome_banco, banco.cod_compe, banco.agencia, banco.conta_corrente,
                          banco.d_conta, banco.chave_pix, tipo_pix, banco.carteira_boleto, banco.status.value, banco.obs))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.execute("SELECT * FROM banco WHERE id_banco = %s", (id_criado,))
    res = cursor.fetchone()
    cursor.close()
    return res

@app.post("/recebimentos/", response_model=RecebimentoResponse, status_code=status.HTTP_201_CREATED, tags=["11. Financeiro"])
def criar_recebimento(rec: RecebimentoCreate, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    query = """
        INSERT INTO recebimento (id_pagamento, id_banco, nome_acad, valor_recebido, status, observacao)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (rec.id_pagamento, rec.id_banco, rec.nome_acad, rec.valor_recebido, rec.status.value, rec.observacao))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.execute("SELECT * FROM recebimento WHERE id_recebimento = %s", (id_criado,))
    res = cursor.fetchone()
    cursor.close()
    return res


# ==========================================
# 12. AUDITORIA CRUD
# ==========================================
@app.post("/auditorias/", response_model=AuditoriaResponse, status_code=status.HTTP_201_CREATED, tags=["12. Auditoria"])
def criar_auditoria(audit: AuditoriaCreate, conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    query = """
        INSERT INTO auditoria (id_usuario, acao, tabela_afetada, ip, detalhes)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(query, (audit.id_usuario, audit.acao, audit.tabela_afetada, audit.ip, audit.detalhes))
    conn.commit()
    id_criado = cursor.lastrowid
    cursor.execute("SELECT * FROM auditoria WHERE id_auditoria = %s", (id_criado,))
    res = cursor.fetchone()
    cursor.close()
    return res

@app.get("/auditorias/", response_model=List[AuditoriaResponse], tags=["12. Auditoria"])
def listar_auditorias(conn=Depends(get_db)):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM auditoria")
    res = cursor.fetchall()
    cursor.close()
    return res


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)