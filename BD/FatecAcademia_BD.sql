DROP DATABASE IF EXISTS fatec_academia;

CREATE DATABASE fatec_academia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fatec_academia;


-- =========================================================
-- TABELA: endereco
-- =========================================================

CREATE TABLE endereco (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    pais VARCHAR(100),
    estado VARCHAR(100),
    cidade VARCHAR(100),
    bairro VARCHAR(100),
    rua VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100)
);


-- =========================================================
-- TABELA: dados_academia
-- =========================================================

CREATE TABLE dados_academia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(20),
    hora_abertura TIME,
    hora_fechamento TIME,

    CONSTRAINT fk_academia_endereco
        FOREIGN KEY (id_endereco)
        REFERENCES endereco(id_endereco)
);


-- =========================================================
-- TABELA: cargo
-- =========================================================

CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(50) UNIQUE NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);


-- =========================================================
-- TABELA: responsavel
-- =========================================================

CREATE TABLE responsavel (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    cpf_hash CHAR(64) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100)
);


-- =========================================================
-- TABELA: usuario
-- =========================================================

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    cpf_hash CHAR(64) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_endereco
        FOREIGN KEY (id_endereco)
        REFERENCES endereco(id_endereco)
);


-- =========================================================
-- TABELA: aluno
-- =========================================================

CREATE TABLE aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    id_responsavel INT NULL,
    forma_pagamento_preferida VARCHAR(50),
    status_matricula VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    data_vencimento DATE NULL,

    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_aluno_responsavel
        FOREIGN KEY (id_responsavel)
        REFERENCES responsavel(id_responsavel)
);


-- =========================================================
-- TABELA: funcionario
-- =========================================================

CREATE TABLE funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    id_cargo INT NOT NULL,
    id_responsavel INT NULL,
    valor_hora DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_funcionario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_funcionario_cargo
        FOREIGN KEY (id_cargo)
        REFERENCES cargo(id_cargo),

    CONSTRAINT fk_funcionario_responsavel
        FOREIGN KEY (id_responsavel)
        REFERENCES responsavel(id_responsavel)
);


-- =========================================================
-- TABELA: treino
-- =========================================================

CREATE TABLE treino (
    id_treino INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_professor INT NOT NULL,
    nome_treino VARCHAR(100) NOT NULL,
    data_criacao DATE NOT NULL DEFAULT (CURRENT_DATE),
    data_atualizacao DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',

    CONSTRAINT fk_treino_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES aluno(id_aluno),

    CONSTRAINT fk_treino_professor
        FOREIGN KEY (id_professor)
        REFERENCES funcionario(id_funcionario)
);


-- =========================================================
-- TABELA: pagamento
-- =========================================================

CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente',

    CONSTRAINT fk_pagamento_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES aluno(id_aluno)
);


-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_aluno_status
    ON aluno(status_matricula);

CREATE INDEX idx_pagamento_aluno_data
    ON pagamento(id_aluno, data_pagamento);

CREATE INDEX idx_pagamento_status
    ON pagamento(status);

CREATE INDEX idx_treino_aluno
    ON treino(id_aluno);

CREATE INDEX idx_treino_professor
    ON treino(id_professor);

CREATE INDEX idx_funcionario_cargo
    ON funcionario(id_cargo);

CREATE INDEX idx_usuario_nome
    ON usuario(nome);


-- =========================================================
-- TRIGGERS
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_treino_atualizacao
BEFORE UPDATE ON treino
FOR EACH ROW
BEGIN
    SET NEW.data_atualizacao = CURRENT_DATE;
END$$


CREATE TRIGGER trg_pagamento_valor
BEFORE INSERT ON pagamento
FOR EACH ROW
BEGIN
    IF NEW.valor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'O valor do pagamento deve ser maior que zero.';
    END IF;
END$$


CREATE TRIGGER trg_funcionario_valor_hora
BEFORE INSERT ON funcionario
FOR EACH ROW
BEGIN
    IF NEW.valor_hora <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'O valor da hora do funcionario deve ser maior que zero.';
    END IF;
END$$

DELIMITER ;


-- =========================================================
-- PROCEDURES
-- =========================================================

DELIMITER $$

CREATE PROCEDURE sp_registrar_pagamento (
    IN p_id_aluno INT,
    IN p_forma_pagamento VARCHAR(50),
    IN p_valor DECIMAL(10,2)
)
BEGIN
    INSERT INTO pagamento (
        id_aluno,
        forma_pagamento,
        valor,
        status
    )
    VALUES (
        p_id_aluno,
        p_forma_pagamento,
        p_valor,
        'Pago'
    );
END$$


CREATE PROCEDURE sp_consultar_pagamentos_aluno (
    IN p_id_aluno INT
)
BEGIN
    SELECT
        p.id_pagamento,
        p.forma_pagamento,
        p.valor,
        p.data_pagamento,
        p.status
    FROM pagamento p
    WHERE p.id_aluno = p_id_aluno
    ORDER BY p.data_pagamento DESC;
END$$


CREATE PROCEDURE sp_consultar_treinos_aluno (
    IN p_id_aluno INT
)
BEGIN
    SELECT
        t.id_treino,
        t.nome_treino,
        t.data_criacao,
        t.data_atualizacao,
        t.status,
        u.nome AS professor
    FROM treino t
    INNER JOIN funcionario f
        ON f.id_funcionario = t.id_professor
    INNER JOIN usuario u
        ON u.id_usuario = f.id_usuario
    WHERE t.id_aluno = p_id_aluno
      AND t.status = 'Ativo'
    ORDER BY t.data_criacao DESC;
END$$

DELIMITER ;


-- =========================================================
-- VIEWS
-- =========================================================


-- =========================================================
-- VIEW_FUNC_01
-- Funcionários públicos
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_funcionarios_publico AS
SELECT
    f.id_funcionario,
    u.nome,
    u.email,
    c.nome_cargo,
    c.status AS status_cargo
FROM funcionario f
INNER JOIN usuario u
    ON u.id_usuario = f.id_usuario
INNER JOIN cargo c
    ON c.id_cargo = f.id_cargo;


-- =========================================================
-- VIEW_FUNC_02
-- Funcionários e cargos
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_funcionarios_cargos AS
SELECT
    f.id_funcionario,
    u.nome,
    u.email,
    c.nome_cargo,
    c.salario_base,
    f.valor_hora,
    c.status
FROM funcionario f
INNER JOIN usuario u
    ON u.id_usuario = f.id_usuario
INNER JOIN cargo c
    ON c.id_cargo = f.id_cargo;


-- =========================================================
-- VIEW_FUNC_03
-- Funcionários e responsáveis
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_funcionarios_responsaveis AS
SELECT
    f.id_funcionario,
    u.nome AS nome_funcionario,
    r.nome AS nome_responsavel,
    r.telefone AS telefone_responsavel,
    r.email AS email_responsavel
FROM funcionario f
INNER JOIN usuario u
    ON u.id_usuario = f.id_usuario
INNER JOIN responsavel r
    ON r.id_responsavel = f.id_responsavel;


-- =========================================================
-- VIEW_ALUNO_01
-- Histórico financeiro dos alunos
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_aluno_financeiro AS
SELECT
    a.id_aluno,
    u.nome AS nome_aluno,
    p.id_pagamento,
    p.forma_pagamento,
    p.valor,
    p.data_pagamento,
    p.status
FROM pagamento p
INNER JOIN aluno a
    ON a.id_aluno = p.id_aluno
INNER JOIN usuario u
    ON u.id_usuario = a.id_usuario;


-- =========================================================
-- VIEW_ALUNO_02
-- Fichas de treino dos alunos
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_aluno_fichas_treino AS
SELECT
    t.id_treino,
    t.id_aluno,
    u_aluno.nome AS nome_aluno,
    t.nome_treino,
    t.data_criacao,
    t.data_atualizacao,
    t.status,
    t.id_professor,
    u_professor.nome AS nome_professor
FROM treino t
INNER JOIN aluno a
    ON a.id_aluno = t.id_aluno
INNER JOIN usuario u_aluno
    ON u_aluno.id_usuario = a.id_usuario
INNER JOIN funcionario f
    ON f.id_funcionario = t.id_professor
INNER JOIN usuario u_professor
    ON u_professor.id_usuario = f.id_usuario;


-- =========================================================
-- VIEW_ALUNO_03
-- Alunos e responsáveis
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_alunos_responsaveis AS
SELECT
    a.id_aluno,
    u.nome AS nome_aluno,
    u.data_nascimento,
    a.status_matricula,
    r.nome AS nome_responsavel,
    r.telefone AS telefone_responsavel,
    r.email AS email_responsavel
FROM aluno a
INNER JOIN usuario u
    ON u.id_usuario = a.id_usuario
INNER JOIN responsavel r
    ON r.id_responsavel = a.id_responsavel;


-- =========================================================
-- VIEW_ACAD_01
-- Dashboard financeiro
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_dashboard_financeiro AS
SELECT
    p.id_pagamento,
    p.id_aluno,
    u.nome AS nome_aluno,
    p.valor,
    p.forma_pagamento,
    p.data_pagamento,
    p.status
FROM pagamento p
INNER JOIN aluno a
    ON a.id_aluno = p.id_aluno
INNER JOIN usuario u
    ON u.id_usuario = a.id_usuario;


-- =========================================================
-- VIEW_ACAD_02
-- Busca de usuários
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_busca_usuarios AS
SELECT
    u.id_usuario,
    u.nome,
    u.email,

    CASE
        WHEN a.id_aluno IS NOT NULL THEN 1
        ELSE 0
    END AS tipo_aluno,

    CASE
        WHEN f.id_funcionario IS NOT NULL THEN 1
        ELSE 0
    END AS tipo_funcionario,

    a.status_matricula

FROM usuario u

LEFT JOIN aluno a
    ON a.id_usuario = u.id_usuario

LEFT JOIN funcionario f
    ON f.id_usuario = u.id_usuario;


-- =========================================================
-- VIEW_ACAD_03
-- Treinos e professores
-- =========================================================

CREATE OR REPLACE
SQL SECURITY INVOKER
VIEW vw_treinos_professores AS
SELECT
    t.id_treino,
    t.nome_treino,
    u_aluno.nome AS nome_aluno,
    u_professor.nome AS nome_professor,
    t.data_criacao,
    t.data_atualizacao,
    t.status
FROM treino t
INNER JOIN aluno a
    ON a.id_aluno = t.id_aluno
INNER JOIN usuario u_aluno
    ON u_aluno.id_usuario = a.id_usuario
INNER JOIN funcionario f
    ON f.id_funcionario = t.id_professor
INNER JOIN usuario u_professor
    ON u_professor.id_usuario = f.id_usuario;


-- =========================================================
-- VERIFICAÇÃO DAS VIEWS
-- =========================================================

SHOW FULL TABLES
WHERE TABLE_TYPE = 'VIEW';