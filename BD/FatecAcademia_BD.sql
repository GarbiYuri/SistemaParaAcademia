-- ============================================================
-- fatec academia - script de criacao do banco de dados
-- ============================================================

drop database if exists fatec_academia;
create database fatec_academia character set utf8mb4 collate utf8mb4_unicode_ci;
use fatec_academia;

-- ------------------------------------------------------------
-- endereco
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- dados_academia
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- plano
-- ------------------------------------------------------------
create table plano (
    id_plano int auto_increment primary key,
    nome varchar(50) unique not null,
    descricao varchar(255),
    preco decimal(10,2) not null,
    status varchar(20) not null default 'Ativo'
);

-- ------------------------------------------------------------
-- cargo
-- ------------------------------------------------------------
create table cargo (
    id_cargo int auto_increment primary key,
    nome_cargo varchar(50) unique not null,
    salario_base decimal(10,2) not null,
    status varchar(20) not null default 'Ativo'
);

-- ------------------------------------------------------------
-- responsavel
-- ------------------------------------------------------------
create table responsavel (
    id_responsavel int auto_increment primary key,
    nome varchar(150) not null,
    cpf varchar(255) not null,
    cpf_hash char(64) unique not null,
    telefone varchar(20),
    email varchar(100)
);

-- ------------------------------------------------------------
-- usuario (tabela base - heranca)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- aluno (especializacao de usuario)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- funcionario (especializacao de usuario)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- registro_ponto
-- ------------------------------------------------------------
create table registro_ponto (
    id_ponto int auto_increment primary key,
    id_funcionario int not null,
    data_hora datetime not null,
    tipo_batida varchar(30) not null,
    constraint fk_ponto_funcionario foreign key (id_funcionario)
        references funcionario (id_funcionario)
);

-- ------------------------------------------------------------
-- treino
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- exercicio
-- ------------------------------------------------------------
create table exercicio (
    id_exercicio int auto_increment primary key,
    nome_exercicio varchar(100) unique not null,
    grupo_muscular varchar(50)
);

-- ------------------------------------------------------------
-- exercicio_treino (tabela associativa n:n)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- forma_pagamento
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- pagamento
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- banco
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- recebimento
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- auditoria
-- ------------------------------------------------------------
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


-- ============================================================
-- stored procedures
-- ============================================================

delimiter $$

create procedure sp_cadastrar_endereco(
    in p_pais varchar(150),
    in p_estado varchar(150),
    in p_cidade varchar(150),
    in p_bairro varchar(150),
    in p_rua varchar(150),
    in p_numero varchar(150),
    in p_complemento varchar(150),
    in p_obs varchar(255),
    out p_id_endereco int
)
begin
    insert into endereco (pais, estado, cidade, bairro, rua, numero, complemento, obs)
    values (p_pais, p_estado, p_cidade, p_bairro, p_rua, p_numero, p_complemento, p_obs);

    set p_id_endereco = last_insert_id();
end $$

create procedure sp_cadastrar_usuario(
    in p_id_endereco int,
    in p_nome varchar(150),
    in p_cpf varchar(255),
    in p_cpf_hash char(64),
    in p_email varchar(100),
    in p_senha varchar(255),
    in p_data_nascimento date,
    out p_id_usuario int
)
begin
    insert into usuario (id_endereco, nome, cpf, cpf_hash, email, senha, data_nascimento)
    values (p_id_endereco, p_nome, p_cpf, p_cpf_hash, p_email, p_senha, p_data_nascimento);

    set p_id_usuario = last_insert_id();
end $$

create procedure sp_cadastrar_responsavel(
    in p_nome varchar(150),
    in p_cpf varchar(255),
    in p_cpf_hash char(64),
    in p_telefone varchar(20),
    in p_email varchar(100),
    out p_id_responsavel int
)
begin
    insert into responsavel (nome, cpf, cpf_hash, telefone, email)
    values (p_nome, p_cpf, p_cpf_hash, p_telefone, p_email);

    set p_id_responsavel = last_insert_id();
end $$

create procedure sp_cadastrar_aluno(
    in p_id_usuario int,
    in p_id_responsavel int,
    in p_id_plano int,
    in p_forma_pagamento_preferida varchar(50),
    out p_id_aluno int
)
begin
    declare v_idade int;
    declare v_data_nascimento date;
    declare v_id_responsavel_final int;

    select data_nascimento into v_data_nascimento
    from usuario where id_usuario = p_id_usuario;

    set v_idade = timestampdiff(year, v_data_nascimento, curdate());

    if v_idade < 18 then
        if p_id_responsavel is null then
            signal sqlstate '45000'
                set message_text = 'aluno menor de idade exige um responsavel legal vinculado';
        end if;
        set v_id_responsavel_final = p_id_responsavel;
    else
        set v_id_responsavel_final = null;
    end if;

    insert into aluno (id_usuario, id_responsavel, id_plano, forma_pagamento_preferida, status_matricula)
    values (p_id_usuario, v_id_responsavel_final, p_id_plano, p_forma_pagamento_preferida, 'Ativo');

    set p_id_aluno = last_insert_id();
end $$

create procedure sp_cadastrar_funcionario(
    in p_id_usuario int,
    in p_id_cargo int,
    in p_id_responsavel int,
    in p_valor_hora decimal(10,2),
    out p_id_funcionario int
)
begin
    declare v_idade int;
    declare v_data_nascimento date;
    declare v_id_responsavel_final int;

    select data_nascimento into v_data_nascimento
    from usuario where id_usuario = p_id_usuario;

    set v_idade = timestampdiff(year, v_data_nascimento, curdate());

    if v_idade < 18 then
        if p_id_responsavel is null then
            signal sqlstate '45000'
                set message_text = 'funcionario menor de idade exige um responsavel legal vinculado';
        end if;
        set v_id_responsavel_final = p_id_responsavel;
    else
        set v_id_responsavel_final = null;
    end if;

    insert into funcionario (id_usuario, id_cargo, id_responsavel, valor_hora)
    values (p_id_usuario, p_id_cargo, v_id_responsavel_final, p_valor_hora);

    set p_id_funcionario = last_insert_id();
end $$

create procedure sp_atualizar_status_matricula(
    in p_id_aluno int,
    in p_status varchar(20)
)
begin
    update aluno
    set status_matricula = p_status
    where id_aluno = p_id_aluno;
end $$

create procedure sp_registrar_ponto(
    in p_id_funcionario int,
    in p_tipo_batida varchar(30),
    out p_id_ponto int
)
begin
    declare v_ultima_entrada datetime;

    if p_tipo_batida = 'Saida' then
        select max(data_hora) into v_ultima_entrada
        from registro_ponto
        where id_funcionario = p_id_funcionario
          and tipo_batida = 'Entrada';

        if v_ultima_entrada is not null and now() < v_ultima_entrada then
            signal sqlstate '45000'
                set message_text = 'horario de saida nao pode ser anterior ao horario de entrada';
        end if;
    end if;

    insert into registro_ponto (id_funcionario, data_hora, tipo_batida)
    values (p_id_funcionario, now(), p_tipo_batida);

    set p_id_ponto = last_insert_id();
end $$

create procedure sp_criar_treino(
    in p_id_aluno int,
    in p_id_professor int,
    in p_nome_treino varchar(100),
    out p_id_treino int
)
begin
    declare v_nome_cargo varchar(50);

    select c.nome_cargo into v_nome_cargo
    from funcionario f
    join cargo c on c.id_cargo = f.id_cargo
    where f.id_funcionario = p_id_professor;

    if v_nome_cargo is null or v_nome_cargo not in ('Professor', 'Instrutor') then
        signal sqlstate '45000'
            set message_text = 'somente professores ou instrutores podem criar fichas de treino';
    end if;

    insert into treino (id_aluno, id_professor, nome_treino, data_criacao, status)
    values (p_id_aluno, p_id_professor, p_nome_treino, curdate(), 'Ativo');

    set p_id_treino = last_insert_id();
end $$

create procedure sp_adicionar_exercicio_treino(
    in p_id_treino int,
    in p_id_exercicio int,
    in p_series int,
    in p_repeticoes int,
    in p_carga decimal(6,2),
    in p_unidade_carga varchar(10),
    in p_observacao varchar(255)
)
begin
    insert into exercicio_treino
        (id_treino, id_exercicio, series, repeticoes, carga, unidade_carga, observacao)
    values
        (p_id_treino, p_id_exercicio, p_series, p_repeticoes, p_carga, p_unidade_carga, p_observacao);

    update treino
    set data_atualizacao = curdate()
    where id_treino = p_id_treino;
end $$

create procedure sp_registrar_pagamento(
    in p_id_forma_pagamento int,
    in p_id_aluno int,
    in p_valor decimal(10,2),
    in p_status varchar(20),
    out p_id_pagamento int
)
begin
    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    start transaction;

    insert into pagamento (id_forma_pagamento, id_aluno, valor, status)
    values (p_id_forma_pagamento, p_id_aluno, p_valor, p_status);

    set p_id_pagamento = last_insert_id();

    if p_status = 'Pago' then
        update aluno
        set data_vencimento = date_add(curdate(), interval 30 day)
        where id_aluno = p_id_aluno;
    end if;

    commit;
end $$

create procedure sp_registrar_recebimento(
    in p_id_pagamento int,
    in p_id_banco int,
    in p_nome_acad varchar(150),
    in p_valor_recebido decimal(10,2),
    in p_status varchar(20),
    out p_id_recebimento int
)
begin
    insert into recebimento
        (id_pagamento, id_banco, nome_acad, valor_recebido, status)
    values
        (p_id_pagamento, p_id_banco, p_nome_acad, p_valor_recebido, p_status);

    set p_id_recebimento = last_insert_id();
end $$

create procedure sp_validar_acesso_catraca(
    in p_id_aluno int,
    out p_acesso_liberado boolean,
    out p_motivo varchar(100)
)
begin
    declare v_status varchar(20);
    declare v_vencimento date;

    select status_matricula, data_vencimento
    into v_status, v_vencimento
    from aluno
    where id_aluno = p_id_aluno;

    if v_status is null then
        set p_acesso_liberado = false;
        set p_motivo = 'aluno nao encontrado';
    elseif v_status <> 'Ativo' then
        set p_acesso_liberado = false;
        set p_motivo = concat('matricula com status ', v_status);
    elseif v_vencimento is null or v_vencimento < curdate() then
        set p_acesso_liberado = false;
        set p_motivo = 'pagamento vencido ou nao localizado';
    else
        set p_acesso_liberado = true;
        set p_motivo = 'acesso liberado';
    end if;
end $$

create procedure sp_registrar_auditoria(
    in p_id_usuario int,
    in p_acao varchar(100),
    in p_tabela_afetada varchar(100),
    in p_ip varchar(45),
    in p_detalhes text
)
begin
    insert into auditoria (id_usuario, acao, tabela_afetada, ip, detalhes)
    values (p_id_usuario, p_acao, p_tabela_afetada, p_ip, p_detalhes);
end $$

create procedure sp_listar_treino_aluno(
    in p_id_aluno int
)
begin
    select
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
    from treino t
    join exercicio_treino et on et.id_treino = t.id_treino
    join exercicio e on e.id_exercicio = et.id_exercicio
    where t.id_aluno = p_id_aluno
      and t.status = 'Ativo'
    order by t.data_criacao desc;
end $$

delimiter ;
