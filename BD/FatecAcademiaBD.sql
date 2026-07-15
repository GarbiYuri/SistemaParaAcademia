CREATE TABLE Exercicio (
    id_exercicio INT AUTO_INCREMENT,
    nome_exercicio VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_exercicio)
);

CREATE TABLE Registro_Ponto (
    id_ponto INT AUTO_INCREMENT,
    id_funcionario INT NOT NULL,
    data_registro DATE NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_saida TIME NOT NULL,
    PRIMARY KEY (id_ponto),
    CONSTRAINT fk_ponto_funcionario 
        FOREIGN KEY (id_funcionario) REFERENCES Funcionario(id_funcionario) ON DELETE CASCADE
);

CREATE TABLE Pagamento (
    id_pagamento INT AUTO_INCREMENT,
    id_aluno INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATETIME NOT NULL,
    tipo_pagamento VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_pagamento),
    CONSTRAINT fk_pagamento_aluno 
        FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno) ON DELETE CASCADE
);

CREATE TABLE Treino (
    id_treino INT AUTO_INCREMENT,
    id_aluno INT NOT NULL,
    id_professor INT NOT NULL,
    nome_treino VARCHAR(100) NOT NULL,
    data_criacao DATE NOT NULL,
    PRIMARY KEY (id_treino),
    CONSTRAINT fk_treino_aluno 
        FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno) ON DELETE CASCADE,
    CONSTRAINT fk_treino_professor 
        FOREIGN KEY (id_professor) REFERENCES Funcionario(id_funcionario)
);

CREATE TABLE Exercicio_Treino (
    id_exercicio_treino INT AUTO_INCREMENT,
    id_treino INT NOT NULL,
    id_exercicio INT NOT NULL,
    series INT NOT NULL,
    repeticoes INT NOT NULL,
    carga VARCHAR(50),
    PRIMARY KEY (id_exercicio_treino),
    CONSTRAINT fk_ex_treino_treino 
        FOREIGN KEY (id_treino) REFERENCES Treino(id_treino) ON DELETE CASCADE,
    CONSTRAINT fk_ex_treino_exercicio 
        FOREIGN KEY (id_exercicio) REFERENCES Exercicio(id_exercicio)
);