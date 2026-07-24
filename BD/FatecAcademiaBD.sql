CREATE TABLE Endereco (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    pais VARCHAR(150),
    estado VARCHAR(150),
    cidade VARCHAR(150),
    bairro VARCHAR(150),
    rua VARCHAR(150),
    numero VARCHAR(150),
    complemento VARCHAR(150),
    obs VARCHAR(255)
);

CREATE TABLE Plano (
    id_plano INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL,
    descricao VARCHAR(255),
    preco DECIMAL(10,2)
);

CREATE TABLE Responsavel (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    cpf_hash CHAR(64) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE Cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome_cargo VARCHAR(50) UNIQUE NOT NULL,
    salario_base DECIMAL(10,2)
);

CREATE TABLE Exercicio (
    id_exercicio INT AUTO_INCREMENT PRIMARY KEY,
    nome_exercicio VARCHAR(100) UNIQUE NOT NULL,
    grupo_muscular VARCHAR(50)
);

CREATE TABLE Forma_Pagamento (
    id_fpag INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,
    cpf VARCHAR(255),
    email VARCHAR(100),
    nome VARCHAR(150),
    digitos_cartao VARCHAR(20),
    bandeira VARCHAR(30),
    data_validade DATE
);

CREATE TABLE Banco (
    id_banco INT AUTO_INCREMENT PRIMARY KEY,
    nome_banco VARCHAR(100) NOT NULL,
    cod_compe VARCHAR(10),
    agencia VARCHAR(20),
    conta_corrente VARCHAR(30),
    d_conta VARCHAR(10),
    chave_pix VARCHAR(150),
    tipo_chave_pix VARCHAR(20),
    carteira_boleto VARCHAR(20),
    status VARCHAR(20),
    obs TEXT,
    data_created DATETIME,
    data_updated DATETIME
);

CREATE TABLE Dados_Academia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT,
    nome VARCHAR(150) NOT NULL,
    cpnj VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    hora_a TIMESTAMP,
    hora_f TIMESTAMP,
    FOREIGN KEY (id_endereco) REFERENCES Endereco(id_endereco)
);

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_endereco INT,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    cpf_hash CHAR(64) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    digital TEXT,
    facial TEXT,
    data_nascimento DATE,
    data_cadastro DATETIME,
    FOREIGN KEY (id_endereco) REFERENCES Endereco(id_endereco)
);

CREATE TABLE Aluno (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    id_responsavel INT,
    forma_pagamento_preferida VARCHAR(50),
    status_matricula VARCHAR(20),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_responsavel) REFERENCES Responsavel(id_responsavel)
);

CREATE TABLE Funcionario (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    id_cargo INT NOT NULL,
    id_responsavel INT,
    valor_hora DECIMAL(10,2),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_cargo) REFERENCES Cargo(id_cargo),
    FOREIGN KEY (id_responsavel) REFERENCES Responsavel(id_responsavel)
);

CREATE TABLE Auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    data_hora DATETIME NOT NULL,
    ip VARCHAR(45),
    detalhes TEXT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

CREATE TABLE Registro_Ponto (
    id_ponto INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    data_hora DATETIME NOT NULL,
    tipo_batida VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_funcionario) REFERENCES Funcionario(id_funcionario)
);

CREATE TABLE Treino (
    id_treino INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_professor INT NOT NULL,
    nome_treino VARCHAR(100) NOT NULL,
    data_criacao DATE,
    data_atualizacao DATE,
    status VARCHAR(20),
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno),
    FOREIGN KEY (id_professor) REFERENCES Funcionario(id_funcionario)
);

CREATE TABLE Pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_forma_pagamento INT,
    id_aluno INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME,
    token_pagamento VARCHAR(255),
    status VARCHAR(20),
    FOREIGN KEY (id_forma_pagamento) REFERENCES Forma_Pagamento(id_fpag),
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno)
);

CREATE TABLE Exercicio_Treino (
    id_exercicio_treino INT AUTO_INCREMENT PRIMARY KEY,
    id_treino INT NOT NULL,
    id_exercicio INT NOT NULL,
    series INT,
    repeticoes INT,
    carga DECIMAL(6,2),
    unidade_carga VARCHAR(10),
    observacao VARCHAR(255),
    FOREIGN KEY (id_treino) REFERENCES Treino(id_treino),
    FOREIGN KEY (id_exercicio) REFERENCES Exercicio(id_exercicio),
    UNIQUE (id_treino, id_exercicio)
);

CREATE TABLE Recebimento (
    id_recebimento INT AUTO_INCREMENT PRIMARY KEY,
    id_pagamento INT NOT NULL,
    id_banco INT NOT NULL,
    nome_acad VARCHAR(150),
    valor_recebido DECIMAL(10,2) NOT NULL,
    data_recebimento DATETIME,
    status VARCHAR(20),
    observacao TEXT,
    FOREIGN KEY (id_pagamento) REFERENCES Pagamento(id_pagamento),
    FOREIGN KEY (id_banco) REFERENCES Banco(id_banco)
);
