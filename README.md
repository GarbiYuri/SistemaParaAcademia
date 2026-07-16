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

## Requisitos Funcionais (RF);
  RF01: Cadastrar e Gerenciar Usuários

    O sistema deve permitir o cadastro, edição, visualização e exclusão (CRUD) de Alunos, Professores, Funcionários e Administradores.

RF02: Armazenar e Vincular Informações de Contas

    O sistema deve armazenar e associar de forma persistente os dados de treinos aos alunos, e salários, cargos e funções aos funcionários.

RF03: Processar Pagamentos Digitalmente

    O sistema deve disponibilizar um módulo ou integração para que os alunos realizem pagamentos online de suas mensalidades/planos.

RF04: Visualizar e Imprimir Ficha de Treino

    O sistema deve permitir que o aluno visualize seu treino atual na tela e ofereça a opção de exportar ou imprimir o treino em formato amigável.

RF05: Controle de Check-in e Acesso externo

    O sistema deve permitir que o aluno realize check-in direto no sistema ou registre validações de plataformas integradas (ex: GymPass / TotalPass).

RF06: Elaboração e Edição de Treinos pelo Professor

    O sistema deve permitir que o professor crie, atualize, personalize e exclua as rotinas de treino dos alunos com base na evolução individual de cada um.

RF07: Controle Manual de Acesso (Liberação de Catraca)

    O sistema deve fornecer uma funcionalidade na tela de Gerenciamento para que a recepção ou o gerente libere manualmente o acesso físico (simulação de catraca) do cliente.

RF08: Controle de Níveis de Permissão (Nível de Acesso)

    O sistema deve restringir o acesso às telas e ações com base no perfil do usuário conectado, exigindo obrigatoriamente autenticação de administrador (com confirmação de senha) para alteração de salários e dados financeiros.

RF09: Registro de Ponto e Consulta de Banco de Horas

    O sistema deve permitir que os funcionários registrem suas horas trabalhadas e consultem seus respectivos históricos de horários, cargo e salário (apenas visualização).

RF10: Autenticação de Usuários (Login e Logout)

    O sistema deve fornecer um mecanismo seguro de login e logout para todas as contas criadas no momento da matrícula ou contratação.

  
## Requisitos Não Funcionais (RNF).
RNF01: Rastreabilidade e Auditoria (Histórico Persistente)

    O sistema deve manter um histórico contínuo e imutável de logs sobre o tempo de treino dos alunos, salários pagos, alterações de cargo e criação de contas.

RNF02: Automação de Disparos de E-mail (Serviço de Background)

    O sistema deve possuir uma rotina automática (background job) para verificar diariamente as datas de aniversário dos alunos e enviar um e-mail de felicitação sem intervenção manual.

RNF03: Segurança e Criptografia de Dados Sensíveis

    Os dados altamente confidenciais dos usuários (como senhas de login, CPF e dados bancários) devem ser criptografados ou passar por processos de hash seguro (ex: Bcrypt) antes de serem armazenados no banco de dados MySQL.

RNF04: Desempenho e Paginação de Consultas

    Para garantir o funcionamento sem travamentos, o backend (FastAPI) deve aplicar paginação em todas as requisições que retornem múltiplos registros (listas de alunos, pagamentos, etc.).

RNF05: Interface Responsiva

    A interface construída em HTML, CSS e JavaScript deve ser totalmente responsiva, adaptando-se perfeitamente às telas de smartphones (para uso dos alunos no treino) e monitores desktop (para uso da recepção e gerência).
