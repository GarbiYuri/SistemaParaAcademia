# Fatec Acadêmicos
  SistemaParaAcademia
## Integrantes:
  - Francisco Yuri Garbi
  - Miguel Souza Silva

## Objetivo do sistema:
  Este sistema tem como objetivo tornar possivel e viável o gerenciamento de alunos, pagamentos, também gerenciar professores e funcionarios com salários, cargos, funções e horas trabalhadas. Nele será armazenado os treinos das rotinas de cada aluno conforme a evolução percebida pelo professor
## Tecnologias que serão utilizadas:
  - FastApi (Python)
  - HTML
  - CSS
  - Javascript
  - Banco de Dados (Mysql)

## Breve descrição do funcionamento do sistema:
O Sistema terá 4 telas principais que ditam seu funcionamento:
  
  * Tela Aluno:
      - Nesta Tela o aluno acessa seu treino e pode imprimir para usá-lo, além de gerenciar seus pagamentos e/ou check-in (caso de GymPass/TotalPass). Os alunos terão seus logins criados no momento de inscrição. E alterar informações como foto de perfil, nome, forma de pagamento, etc.
    
  * Tela Professor:
      - Aqui é exclusivamente para o professor gerenciar os treinos dos alunos, podendo assim excluir, editar, criar novos.
      
  * Tela Gerenciamento:
      - Essa tela será acessada pela recepção ou gerentes, que podem assim, alterar informações de todos os logins, tanto funcionários quanto de alunos, além disso, poderá acessar históricos de pagamentos, alterar formas de pagamentos de um cliente especifico, liberar a catraca para alguém, criar novos alunos, editar e excluir. Ele pode também gerenciar funcionários, alterar funções, cargos, salário (com senha de administrador)
      
  * Tela Funcionário:
      - Cada funcionário terá um login, nessa tela ele pode gerenciar seu banco de horas, ver seus horários, seus dados para receber salário, seu cargo, suas funções, não podendo alterar ou excluir nada, mas acessar seus históricos.

## 📋 Requisitos Funcionais (RF)
* **RF01 (Cadastro):** O sistema deve permitir o cadastro de usuários, diferenciando-os em Alunos, Funcionários e Administradores/Gerentes.
* **RF02 (Gestão de Treinos):** O sistema deve permitir que professores criem fichas de treinos personalizadas associando exercícios a alunos.
* **RF03 (Financeiro):** O sistema deve oferecer um módulo digital para o processamento de pagamentos de mensalidades.
* **RF04 (Registro de Ponto):** O sistema deve permitir que funcionários registrem suas horas de trabalho diárias.
* **RF05 (Histórico):** O banco de dados deve manter registros históricos de treinos passados, salários pagos, alterações de cargo e auditoria de criação de contas.
* **RF06 (Automatização):** O sistema deve enviar e-mails automatizados de felicitações no dia do aniversário dos alunos cadastrados.
* **RF07 (ACESSO EXTERNO):** O sistema deve permitir que o aluno realize check-in direto no sistema ou registre validações de plataformas integradas (ex: GymPass / TotalPass).
* **RF08 (Níveis de Permissão):** O sistema deve restringir o acesso às telas e ações com base no perfil do usuário conectado, exigindo obrigatoriamente autenticação de administrador (com confirmação de senha) para alteração de salários e dados financeiros.
* **RF09 (Armazenar e Vincular Informações de Contas):** O sistema deve armazenar e associar de forma persistente os dados de treinos aos alunos, e salários, cargos e funções aos funcionários.
* **RF10 (Busca Global Otimizada):** O sistema deve disponibilizar um mecanismo de busca unificado na recepção (lookup por nome ou e-mail), agrupando alunos e funcionários em ordem alfabética para agilizar o atendimento.
* **RF11 (Painel Gerencial e Indicadores):** O sistema deve fornecer um dashboard consolidado para a gerência, cruzando dados de fluxo de caixa operacional com os dados bancários institucionais cadastrados.
* **RF12 (Auditoria de Fichas Pedagógicas):** O sistema deve permitir que coordenadores ou gerentes rastreiem quais professores prescreveram determinados treinos e exercícios.

## 🛡️ Requisitos Não Funcionais (RNF)

* **RNF01 (Desempenho):** A API desenvolvida em FastAPI deve ser otimizada para que o tempo de resposta (latência) das requisições de consulta de treinos e validação de acessos seja inferior a 500 milissegundos sob condições normais de rede.
* **RNF02 (Responsividade):** A interface construída em HTML, CSS e JavaScript deve ser totalmente responsiva, adaptando-se perfeitamente às telas de smartphones (para uso dos alunos no treino) e monitores desktop (para uso da recepção e gerência).
* **RNF03 (Segurança & LGPD):** Dados sensíveis como senhas (devem utilizar Hash), CPFs e datas de nascimento devem ser criptografados ou protegidos na base de dados.
* **RNF04 (Performance):** As consultas de listagens de alunos e pagamentos devem utilizar paginação de dados para garantir que o sistema não trave com múltiplos acessos simultâneos.
* **RNF05 (Arquitetura e POO):** O código do backend (FastAPI) deve ser estruturado sob o paradigma da Programação Orientada a Objetos, garantindo encapsulamento de dados sensíveis (LGPD) e utilizando polimorfismo para a gestão de perfis de usuário (Alunos e Funcionários).
* **RNF06 (Otimização do SGBD com Views):** O banco de dados deve utilizar Visões Relacionais (Views) para abstrair junções complexas (JOINs) de múltiplas tabelas, mascarar dados críticos diretamente na origem e aliviar a carga de processamento da API.
