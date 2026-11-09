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

## 🚀 Como rodar o sistema (Docker — recomendado)

### Pré-requisitos
- Docker Engine 24+ com Docker Compose v2
- Git (para clonar o repositório)

### Subir a stack completa (frontend + backend + MySQL)
```bash
git clone git@github.com:GarbiYuri/SistemaParaAcademia.git
cd SistemaParaAcademia/SistemaParaAcademia   # pasta onde está o docker-compose.yml
docker compose up -d --build
```

Serviços disponíveis após subir:
| Serviço | URL |
|---|---|
| Frontend (React + nginx) | http://localhost:8088 |
| API principal (FastAPI/Swagger) | http://localhost:8000/docs |
| API de autenticação (Swagger) | http://localhost:8001/docs |
| MySQL 8.4 | interno na rede Docker (sem porta exposta no host) |

Na primeira inicialização o MySQL executa `database/init.sql` (schema + dados base) e o backend aplica as migrations automaticamente. Para acompanhar:
```bash
docker compose logs -f backend
```

### Contas de demonstração
Criadas automaticamente pela migration `001_contas_demo` (senha `senha123`):

| Perfil | E-mail |
|---|---|
| Aluno | `ana.souza@email.com` |
| Professor | `marcos.almeida@fatecfit.com` |
| Administrador | `roberto.nunes@fatecfit.com` |
| Recepcionista | `juliana.nunes@fatecfit.com` |

> Para desativar a criação dessas contas (recomendado em produção), defina `SEED_DEMO_USERS=false` no `.env`.

### Rede Docker
Por padrão a stack cria/usa a rede `academia_net`. Para conectar a uma rede **já existente** (por exemplo a sua rede pública), crie o `.env` e ajuste:
```bash
cp .env.example .env
```
```env
NETWORK_NAME=cloudflare_net
NETWORK_EXTERNAL=true
```
Se a rede ainda não existir, crie antes: `docker network create cloudflare_net`.
Com `NETWORK_EXTERNAL=false` (padrão) e a rede inexistente, o próprio Compose a cria.

### Variáveis de ambiente
Copie `.env.example` para `.env` e ajuste. O `.env` não é versionado.

| Variável | Padrão | Descrição |
|---|---|---|
| `NETWORK_NAME` | `academia_net` | Nome da rede Docker usada pela stack |
| `NETWORK_EXTERNAL` | `false` | `true` para anexar a uma rede já criada |
| `MYSQL_DATABASE` | `escola` | Banco criado no MySQL |
| `MYSQL_USER` | `academia` | Usuário da aplicação |
| `MYSQL_PASSWORD` | `academia_dev_password` | Senha do usuário da aplicação |
| `MYSQL_ROOT_PASSWORD` | `root_dev_password` | Senha do root do MySQL |
| `FERNET_KEY` | chave de dev | Chave para criptografar CPF (32 bytes base64) |
| `SEED_DEMO_USERS` | `true` | Cria as contas de demonstração |

Gere uma `FERNET_KEY` nova com:
```bash
python3 -c "import base64,os;print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

### Comandos úteis
```bash
docker compose ps                  # status dos containers
docker compose logs -f backend     # logs da API
docker compose restart backend     # reinicia só o backend
docker compose down                # para a stack (mantém os dados)
docker compose down -v             # para e apaga o banco (recria no próximo start)
docker compose exec backend python -m migrations.runner   # roda migrations manualmente
```

## 💻 Rodar localmente (sem Docker)

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# crie o backend/.env com DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME e FERNET_KEY
python -m migrations.runner
uvicorn main:app --host 0.0.0.0 --port 8000
# em outro terminal, para o login:
uvicorn auth_api:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 (proxy /api e /auth-api para as portas 8000/8001)
```

> O script `executar.sh` na raiz do repositório também ajuda a subir tudo localmente (MariaDB + APIs + Vite) em ambiente de desenvolvimento.

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

## 🔁 Migrations

As migrations ficam em `backend/migrations/` e são aplicadas automaticamente na inicialização do backend (`backend/entrypoint.sh` → `python -m migrations.runner`).

- Cada arquivo `NNN_nome.py` expõe `def up(cursor): ...`.
- Opcionalmente expõe `def habilitada() -> bool` para ser pulado sem ser marcado como aplicado (ex.: `SEED_DEMO_USERS=false`).
- As migrations aplicadas são registradas na tabela `schema_migrations` e não rodam novamente.
- Para adicionar uma nova, crie por exemplo `backend/migrations/002_minha_mudanca.py`:

```python
def up(cursor):
    cursor.execute("ALTER TABLE aluno ADD COLUMN observacao VARCHAR(255) NULL")
```

Executar manualmente:
```bash
cd backend && python -m migrations.runner
# ou dentro do container:
docker compose exec backend python -m migrations.runner
```

## 🗂️ Estrutura do projeto

```
SistemaParaAcademia/
├── backend/                 # API FastAPI (main.py, auth_api.py)
│   ├── model/               # Schemas Pydantic por entidade
│   ├── repository/          # Acesso ao MySQL
│   ├── migrations/          # Migrations aplicadas no start
│   ├── utils/security.py    # Hash Argon2 e criptografia de CPF
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite (build servido por nginx)
│   ├── src/
│   ├── nginx.conf           # Proxy /api e /auth-api
│   └── Dockerfile
├── database/init.sql        # Schema inicial + dados base
├── docker-compose.yml       # MySQL + backend + frontend
├── .env.example             # Modelo de variáveis de ambiente
└── executar.sh              # Helper de desenvolvimento local
```
