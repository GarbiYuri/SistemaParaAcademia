-- ============================================================
-- fatec academia - script de criacao do banco de dados
-- ============================================================

drop database if exists fatec_academia;
create database fatec_academia character set utf8mb4 collate utf8mb4_unicode_ci;
use fatec_academia;

create table endereco (
    id_endereco int auto_increment primary key,
    pais varchar(150),
    estado varchar(150),
    cidade varchar(150),
    bairro varchar(150),
    rua varchar(150),
    numero varchar(150),
    complemento varchar(150),
    obs varchar(255)
);

create table dados_academia (
    id int auto_increment primary key,
    id_endereco int,
    nome varchar(150) not null,
    cnpj varchar(255) unique,
    email varchar(100),
    telefone varchar(20),
    hora_abertura time,
    hora_fechamento time,
    constraint fk_academia_endereco foreign key (id_endereco)
        references endereco (id_endereco)
);

create table plano (
    id_plano int auto_increment primary key,
    nome varchar(50) unique not null,
    descricao varchar(255),
    preco decimal(10,2) not null,
    status varchar(20) not null default 'Ativo'
);

create table cargo (
    id_cargo int auto_increment primary key,
    nome_cargo varchar(50) unique not null,
    salario_base decimal(10,2) not null,
    status varchar(20) not null default 'Ativo'
);

create table responsavel (
    id_responsavel int auto_increment primary key,
    nome varchar(150) not null,
    cpf varchar(255) not null,
    cpf_hash char(64) unique not null,
    telefone varchar(20),
    email varchar(100)
);

create table usuario (
    id_usuario int auto_increment primary key,
    id_endereco int,
    nome varchar(150) not null,
    cpf varchar(255) not null,
    cpf_hash char(64) unique not null,
    email varchar(100) unique not null,
    senha varchar(255) not null,
    digital text,
    facial text,
    data_nascimento date not null,
    data_cadastro datetime not null default current_timestamp,
    constraint fk_usuario_endereco foreign key (id_endereco)
        references endereco (id_endereco)
);

create table aluno (
    id_aluno int auto_increment primary key,
    id_usuario int unique not null,
    id_responsavel int null,
    id_plano int null,
    forma_pagamento_preferida varchar(50),
    status_matricula varchar(20) not null default 'Ativo',
    data_vencimento date null,
    constraint fk_aluno_usuario foreign key (id_usuario)
        references usuario (id_usuario) on delete cascade,
    constraint fk_aluno_responsavel foreign key (id_responsavel)
        references responsavel (id_responsavel),
    constraint fk_aluno_plano foreign key (id_plano)
        references plano (id_plano)
);

create table funcionario (
    id_funcionario int auto_increment primary key,
    id_usuario int unique not null,
    id_cargo int not null,
    id_responsavel int null,
    valor_hora decimal(10,2) not null,
    constraint fk_funcionario_usuario foreign key (id_usuario)
        references usuario (id_usuario) on delete cascade,
    constraint fk_funcionario_cargo foreign key (id_cargo)
        references cargo (id_cargo),
    constraint fk_funcionario_responsavel foreign key (id_responsavel)
        references responsavel (id_responsavel)
);


create table registro_ponto (
    id_ponto int auto_increment primary key,
    id_funcionario int not null,
    data_hora datetime not null,
    tipo_batida varchar(30) not null,
    constraint fk_ponto_funcionario foreign key (id_funcionario)
        references funcionario (id_funcionario)
);

create table treino (
    id_treino int auto_increment primary key,
    id_aluno int not null,
    id_professor int not null,
    nome_treino varchar(100) not null,
    data_criacao date not null,
    data_atualizacao date,
    status varchar(20) not null default 'Ativo',
    constraint fk_treino_aluno foreign key (id_aluno)
        references aluno (id_aluno),
    constraint fk_treino_professor foreign key (id_professor)
        references funcionario (id_funcionario)
);

create table exercicio (
    id_exercicio int auto_increment primary key,
    nome_exercicio varchar(100) unique not null,
    grupo_muscular varchar(50)
);

create table exercicio_treino (
    id_exercicio_treino int auto_increment primary key,
    id_treino int not null,
    id_exercicio int not null,
    series int not null,
    repeticoes int not null,
    carga decimal(6,2),
    unidade_carga varchar(10),
    observacao varchar(255),
    constraint fk_et_treino foreign key (id_treino)
        references treino (id_treino) on delete cascade,
    constraint fk_et_exercicio foreign key (id_exercicio)
        references exercicio (id_exercicio),
    constraint uq_treino_exercicio unique (id_treino, id_exercicio)
);


create table forma_pagamento (
    id_fpag int auto_increment primary key,
    tipo varchar(30) not null,
    cpf varchar(255) null,
    email varchar(100) null,
    nome varchar(150) null,
    digitos_cartao varchar(20) null,
    bandeira varchar(30) null,
    data_validade date null
);

create table pagamento (
    id_pagamento int auto_increment primary key,
    id_forma_pagamento int not null,
    id_aluno int not null,
    valor decimal(10,2) not null,
    data_pagamento datetime not null default current_timestamp,
    token_pagamento varchar(255) null,
    status varchar(20) not null default 'Pendente',
    constraint fk_pagamento_forma foreign key (id_forma_pagamento)
        references forma_pagamento (id_fpag),
    constraint fk_pagamento_aluno foreign key (id_aluno)
        references aluno (id_aluno)
);

create table banco (
    id_banco int auto_increment primary key,
    nome_banco varchar(100) not null,
    cod_compe varchar(10),
    agencia varchar(20),
    conta_corrente varchar(30),
    d_conta varchar(10),
    chave_pix varchar(150),
    tipo_chave_pix varchar(20),
    carteira_boleto varchar(20),
    status varchar(20) not null default 'Ativo',
    obs text,
    data_created datetime not null default current_timestamp,
    data_updated datetime not null default current_timestamp on update current_timestamp
);


create table recebimento (
    id_recebimento int auto_increment primary key,
    id_pagamento int not null,
    id_banco int not null,
    nome_acad varchar(150),
    valor_recebido decimal(10,2) not null,
    data_recebimento datetime not null default current_timestamp,
    status varchar(20) not null default 'Pendente',
    observacao text,
    constraint fk_recebimento_pagamento foreign key (id_pagamento)
        references pagamento (id_pagamento),
    constraint fk_recebimento_banco foreign key (id_banco)
        references banco (id_banco)
);

create table auditoria (
    id_auditoria int auto_increment primary key,
    id_usuario int not null,
    acao varchar(100) not null,
    tabela_afetada varchar(100),
    data_hora datetime not null default current_timestamp,
    ip varchar(45),
    detalhes text,
    constraint fk_auditoria_usuario foreign key (id_usuario)
        references usuario (id_usuario)
);

-- indices auxiliares para as buscas mais comuns
create index idx_usuario_nome on usuario (nome);
create index idx_treino_aluno on treino (id_aluno);
create index idx_pagamento_aluno on pagamento (id_aluno);
create index idx_ponto_funcionario_data on registro_ponto (id_funcionario, data_hora);

DELIMITER $$
CREATE PROCEDURE sp_cadastrar_aluno(
    IN p_id_usuario INT,
    IN p_id_responsavel INT,
    IN p_id_plano INT,
    IN p_forma_pagamento_preferida VARCHAR(50),
    OUT p_id_aluno INT
)
BEGIN
    DECLARE v_idade INT;
    DECLARE v_data_nascimento DATE;
    DECLARE v_id_responsavel_final INT;

    SELECT data_nascimento INTO v_data_nascimento
    FROM usuario WHERE id_usuario = p_id_usuario;

    SET v_idade = TIMESTAMPDIFF(YEAR, v_data_nascimento, CURDATE());

    IF v_idade < 18 THEN
        IF p_id_responsavel IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Aluno menor de idade exige um responsável legal vinculado';
        END IF;
        SET v_id_responsavel_final = p_id_responsavel;
    ELSE
        SET v_id_responsavel_final = NULL;
    END IF;

    INSERT INTO aluno (id_usuario, id_responsavel, id_plano, forma_pagamento_preferida, status_matricula)
    VALUES (p_id_usuario, v_id_responsavel_final, p_id_plano, p_forma_pagamento_preferida, 'Ativo');

    SET p_id_aluno = LAST_INSERT_ID();
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_registrar_pagamento(
    IN p_id_forma_pagamento INT,
    IN p_id_aluno INT,
    IN p_valor DECIMAL(10,2),
    IN p_status VARCHAR(20),
    OUT p_id_pagamento INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO pagamento (id_forma_pagamento, id_aluno, valor, status)
    VALUES (p_id_forma_pagamento, p_id_aluno, p_valor, p_status);

    SET p_id_pagamento = LAST_INSERT_ID();

    IF p_status = 'Pago' THEN
        UPDATE aluno
        SET data_vencimento = DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        WHERE id_aluno = p_id_aluno;
    END IF;

    COMMIT;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_validar_acesso_catraca(
    IN p_id_aluno INT,
    OUT p_acesso_liberado BOOLEAN,
    OUT p_motivo VARCHAR(100)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_vencimento DATE;

    SELECT status_matricula, data_vencimento
    INTO v_status, v_vencimento
    FROM aluno
    WHERE id_aluno = p_id_aluno;

    IF v_status IS NULL THEN
        SET p_acesso_liberado = FALSE;
        SET p_motivo = 'Aluno não encontrado';
    ELSEIF v_status <> 'Ativo' THEN
        SET p_acesso_liberado = FALSE;
        SET p_motivo = CONCAT('Matrícula com status ', v_status);
    ELSEIF v_vencimento IS NULL OR v_vencimento < CURDATE() THEN
        SET p_acesso_liberado = FALSE;
        SET p_motivo = 'Pagamento vencido ou não localizado';
    ELSE
        SET p_acesso_liberado = TRUE;
        SET p_motivo = 'Acesso liberado';
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_criar_treino(
    IN p_id_aluno INT,
    IN p_id_professor INT,
    IN p_nome_treino VARCHAR(100),
    OUT p_id_treino INT
)
BEGIN
    DECLARE v_nome_cargo VARCHAR(50);

    SELECT c.nome_cargo INTO v_nome_cargo
    FROM funcionario f
    JOIN cargo c ON c.id_cargo = f.id_cargo
    WHERE f.id_funcionario = p_id_professor;

    IF v_nome_cargo IS NULL OR v_nome_cargo NOT IN ('Professor', 'Instrutor') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Somente professores ou instrutores podem criar fichas de treino';
    END IF;

    INSERT INTO treino (id_aluno, id_professor, nome_treino, data_criacao, status)
    VALUES (p_id_aluno, p_id_professor, p_nome_treino, CURDATE(), 'Ativo');

    SET p_id_treino = LAST_INSERT_ID();
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_atualizar_status_matricula(
    IN p_id_aluno INT,
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE aluno
    SET status_matricula = p_status
    WHERE id_aluno = p_id_aluno;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_excluir_exercicio(
    IN p_id_exercicio INT
)
BEGIN
    DELETE FROM exercicio
    WHERE id_exercicio = p_id_exercicio;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_listar_treino_aluno(
    IN p_id_aluno INT
)
BEGIN
    SELECT 
        t.id_treino,
        t.nome_treino,
        t.status,
        e.nome_exercicio,
        e.grupo_muscular,
        et.series,
        et.repeticoes,
        et.carga,
        et.unidade_carga,
        et.observacao
    FROM treino t
    JOIN exercicio_treino et ON et.id_treino = t.id_treino
    JOIN exercicio e ON e.id_exercicio = et.id_exercicio
    WHERE t.id_aluno = p_id_aluno
      AND t.status = 'Ativo'
    ORDER BY t.data_criacao DESC;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_filtrar_pagamentos_por_periodo(
    IN p_data_inicio DATETIME,
    IN p_data_fim DATETIME
)
BEGIN
    SELECT id_pagamento, id_aluno, valor, data_pagamento, status
    FROM pagamento
    WHERE data_pagamento BETWEEN p_data_inicio AND p_data_fim;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_registrar_ponto(
    IN p_id_funcionario INT,
    IN p_tipo_batida VARCHAR(30),
    OUT p_id_ponto INT
)
BEGIN
    DECLARE v_ultima_entrada DATETIME;

    IF p_tipo_batida = 'Saida' THEN
        SELECT MAX(data_hora) INTO v_ultima_entrada
        FROM registro_ponto
        WHERE id_funcionario = p_id_funcionario
          AND tipo_batida = 'Entrada';

        IF v_ultima_entrada IS NOT NULL AND NOW() < v_ultima_entrada THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Horário de saída não pode ser anterior ao horário de entrada';
        END IF;
    END IF;

    INSERT INTO registro_ponto (id_funcionario, data_hora, tipo_batida)
    VALUES (p_id_funcionario, NOW(), p_tipo_batida);

    SET p_id_ponto = LAST_INSERT_ID();
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_atualizar_salario_cargo(
    IN p_id_cargo INT,
    IN p_novo_salario DECIMAL(10,2)
)
BEGIN
    UPDATE cargo
    SET salario_base = p_novo_salario
    WHERE id_cargo = p_id_cargo;
END $$
DELIMITER ;
