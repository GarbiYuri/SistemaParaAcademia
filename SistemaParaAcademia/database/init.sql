CREATE DATABASE IF NOT EXISTS escola
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE escola;

CREATE TABLE IF NOT EXISTS endereco (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    pais VARCHAR(80) NOT NULL,
    estado VARCHAR(80) NOT NULL,
    cidade VARCHAR(120) NOT NULL,
    bairro VARCHAR(120) NOT NULL,
    rua VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(150) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    data_cadastro DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT fk_usuario_endereco FOREIGN KEY (id_endereco)
        REFERENCES endereco (id_endereco)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS responsavel (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NULL,
    email VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL,
    salario_base DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dados_academia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    hora_abertura TIME NOT NULL,
    hora_fechamento TIME NOT NULL,
    CONSTRAINT uq_academia_cnpj UNIQUE (cnpj),
    CONSTRAINT fk_academia_endereco FOREIGN KEY (id_endereco)
        REFERENCES endereco (id_endereco)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_responsavel INT NULL,
    forma_pagamento_preferida VARCHAR(50) NULL,
    status_matricula VARCHAR(30) NOT NULL DEFAULT 'Ativo',
    data_vencimento DATE NULL,
    CONSTRAINT uq_aluno_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_aluno_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aluno_responsavel FOREIGN KEY (id_responsavel)
        REFERENCES responsavel (id_responsavel)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_cargo INT NOT NULL,
    id_responsavel INT NULL,
    valor_hora DECIMAL(10, 2) NULL,
    CONSTRAINT uq_funcionario_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_funcionario_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_funcionario_cargo FOREIGN KEY (id_cargo)
        REFERENCES cargo (id_cargo)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_funcionario_responsavel FOREIGN KEY (id_responsavel)
        REFERENCES responsavel (id_responsavel)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_pagamento DATE NOT NULL DEFAULT (CURRENT_DATE),
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    CONSTRAINT fk_pagamento_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS treino (
    id_treino INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_professor INT NOT NULL,
    nome_treino VARCHAR(150) NOT NULL,
    data_criacao DATE NOT NULL DEFAULT (CURRENT_DATE),
    data_atualizacao DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Ativo',
    CONSTRAINT fk_treino_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_treino_professor FOREIGN KEY (id_professor)
        REFERENCES funcionario (id_funcionario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exercicio (
    id_exercicio INT AUTO_INCREMENT PRIMARY KEY,
    id_treino INT NOT NULL,
    nome_exercicio VARCHAR(150) NOT NULL,
    series INT NOT NULL DEFAULT 3,
    repeticoes VARCHAR(50) NOT NULL,
    carga VARCHAR(50) NULL,
    observacao VARCHAR(255) NULL,
    CONSTRAINT fk_exercicio_treino FOREIGN KEY (id_treino)
        REFERENCES treino (id_treino)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO endereco (pais, estado, cidade, bairro, rua, numero, complemento)
VALUES ('Brasil', 'São Paulo', 'São Paulo', 'Centro', 'Rua da Academia', '100', '');
SET @id_endereco_academia = LAST_INSERT_ID();

INSERT INTO cargo (nome_cargo, salario_base, status) VALUES
    ('Professor', 4500.00, 'Ativo'),
    ('Recepcionista', 2200.00, 'Ativo'),
    ('Gerente', 6000.00, 'Ativo');

INSERT INTO dados_academia
    (id_endereco, nome, cnpj, email, telefone, hora_abertura, hora_fechamento)
VALUES
    (@id_endereco_academia, 'FATECFit', '12.345.678/0001-90',
     'contato@fatecfit.com', '(11) 99999-0000', '06:00:00', '22:00:00');
