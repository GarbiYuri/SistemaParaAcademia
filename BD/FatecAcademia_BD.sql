DROP DATABASE IF EXISTS fatec_academia;

CREATE DATABASE fatec_academia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fatec_academia;


-- =========================================================
-- TABELA: ENDERECO
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
-- TABELA: DADOS_ACADEMIA
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
-- TABELA: CARGO
-- =========================================================

CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(50) UNIQUE NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);


-- =========================================================
-- TABELA: RESPONSAVEL
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
-- TABELA: USUARIO
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
-- TABELA: ALUNO
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
-- TABELA: FUNCIONARIO
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
-- TABELA: TREINO
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
-- TABELA: PAGAMENTO
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

-- Facilita pesquisas de alunos por situação
CREATE INDEX idx_aluno_status
    ON aluno(status_matricula);

-- Facilita consultas de pagamentos de um aluno por data
CREATE INDEX idx_pagamento_aluno_data
    ON pagamento(id_aluno, data_pagamento);

-- Facilita consultas de pagamentos por status
CREATE INDEX idx_pagamento_status
    ON pagamento(status);

-- Facilita encontrar treinos de um aluno
CREATE INDEX idx_treino_aluno
    ON treino(id_aluno);

-- Facilita encontrar treinos de um professor
CREATE INDEX idx_treino_professor
    ON treino(id_professor);

-- Facilita pesquisas de funcionários por cargo
CREATE INDEX idx_funcionario_cargo
    ON funcionario(id_cargo);

-- Facilita pesquisas de usuários por nome
CREATE INDEX idx_usuario_nome
    ON usuario(nome);


-- =========================================================
-- TRIGGERS
-- =========================================================

DELIMITER $$


-- ---------------------------------------------------------
-- TRIGGER 1
-- Atualiza automaticamente a data de alteração do treino
-- ---------------------------------------------------------

CREATE TRIGGER trg_treino_atualizacao
BEFORE UPDATE ON treino
FOR EACH ROW
BEGIN
    SET NEW.data_atualizacao = CURRENT_DATE;
END$$


-- ---------------------------------------------------------
-- TRIGGER 2
-- Impede pagamento com valor inválido
-- ---------------------------------------------------------

CREATE TRIGGER trg_pagamento_valor
BEFORE INSERT ON pagamento
FOR EACH ROW
BEGIN
    IF NEW.valor <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'O valor do pagamento deve ser maior que zero.';
    END IF;
END$$


-- ---------------------------------------------------------
-- TRIGGER 3
-- Impede salário/valor hora negativo
-- ---------------------------------------------------------

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


-- ---------------------------------------------------------
-- PROCEDURE 1
-- Cadastra um pagamento
-- ---------------------------------------------------------

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


-- ---------------------------------------------------------
-- PROCEDURE 2
-- Consulta os pagamentos de um aluno
-- ---------------------------------------------------------

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


-- ---------------------------------------------------------
-- PROCEDURE 3
-- Consulta os treinos ativos de um aluno
-- ---------------------------------------------------------

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