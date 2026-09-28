const API_CARGOS = "/cargos";
const API_USUARIOS = "/usuarios";
const API_FUNCIONARIOS = "/funcionarios";
const API_ENDERECOS = "/enderecos";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tela de Criação
    const formCriar = document.getElementById("formCriarFuncionario");
    if (formCriar) {
        carregarCargosSelect("cargo_id");
        configurarBuscaCep(); // Evento do CEP
        formCriar.addEventListener("submit", criarFuncionario);
    }

    // 2. Tela de Edição
    const formEditar = document.getElementById("formEditarFuncionario");
    if (formEditar) {
        carregarCargosSelect("cargo_id");
        carregarDadosParaEdicao();
        configurarBuscaCep(); // Evento do CEP
        formEditar.addEventListener("submit", atualizarFuncionario);
    }

    // 3. Tela de Listagem (Visualizar / Excluir)
    const tabelaFuncionarios = document.getElementById("tabelaFuncionarios");
    if (tabelaFuncionarios) {
        listarFuncionarios();
    }
});

// =========================================================
// BUSCA AUTOMÁTICA DE CEP (VIACEP API)
// =========================================================
function configurarBuscaCep() {
    const inputCep = document.getElementById("cep");
    if (!inputCep) return;

    inputCep.addEventListener("blur", buscarCep);
    inputCep.addEventListener("input", (e) => {
        const cepLimpo = e.target.value.replace(/\D/g, "");
        if (cepLimpo.length === 8) {
            buscarCep();
        }
    });
}

async function buscarCep() {
    const inputCep = document.getElementById("cep");
    if (!inputCep) return;

    const cep = inputCep.value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            alert("CEP não encontrado!");
            return;
        }

        // Mapeia o retorno do ViaCEP para os IDs do HTML
        if (document.getElementById("logradouro")) document.getElementById("logradouro").value = dados.logradouro || "";
        if (document.getElementById("bairro")) document.getElementById("bairro").value = dados.bairro || "";
        if (document.getElementById("cidade")) document.getElementById("cidade").value = dados.localidade || "";
        if (document.getElementById("uf")) document.getElementById("uf").value = dados.uf || "";

        const inputNumero = document.getElementById("numero");
        if (inputNumero) inputNumero.focus();

    } catch (erro) {
        console.error("Erro ao buscar o CEP:", erro);
    }
}

// =========================================================
// MONTA O PAYLOAD SEGUINDO A ESTRUTURA DA API DE ENDEREÇO
// =========================================================
function obterPayloadEndereco() {
    const elRua = document.getElementById("logradouro") || document.getElementById("rua");
    const elEstado = document.getElementById("uf") || document.getElementById("estado");
    const elPais = document.getElementById("pais");

    return {
        pais: elPais ? elPais.value : "Brasil",
        estado: elEstado ? elEstado.value : "",
        cidade: document.getElementById("cidade") ? document.getElementById("cidade").value : "",
        bairro: document.getElementById("bairro") ? document.getElementById("bairro").value : "",
        rua: elRua ? elRua.value : "",
        numero: document.getElementById("numero") ? document.getElementById("numero").value : "",
        complemento: document.getElementById("complemento") && document.getElementById("complemento").value 
            ? document.getElementById("complemento").value 
            : null
    };
}

// =========================================================
// CARREGAR DROPDOWNS (SELECTS)
// =========================================================
async function carregarCargosSelect(elementId) {
    const select = document.getElementById(elementId);
    if (!select) return;

    try {
        const resposta = await fetch(API_CARGOS);
        const cargos = await resposta.json();

        if (resposta.ok) {
            select.innerHTML = '<option value="">Selecione um Cargo</option>';
            cargos.forEach(cargo => {
                if (cargo.status === "Ativo") {
                    const opt = document.createElement("option");
                    opt.value = cargo.id_cargo;
                    opt.textContent = `${cargo.nome_cargo} (R$ ${cargo.salario_base.toFixed(2)})`;
                    select.appendChild(opt);
                }
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar cargos:", erro);
    }
}

// =========================================================
// OPERAÇÃO: CRIAR (POST ENDEREÇO -> POST USUÁRIO -> POST FUNCIONÁRIO)
// =========================================================
async function criarFuncionario(evt) {
    evt.preventDefault();
    const mensagem = document.getElementById("mensagem");
    mensagem.textContent = "";

    const payloadEndereco = obterPayloadEndereco();

    try {
        // PASSO A: Cadastrar Endereço
        const respEndereco = await fetch(API_ENDERECOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadEndereco)
        });

        const resEnderecoData = await respEndereco.json();

        if (!respEndereco.ok) {
            mensagem.style.color = "red";
            mensagem.textContent = "Erro ao cadastrar Endereço: " + obterMensagemErro(resEnderecoData);
            return;
        }

        const idEnderecoCriado = resEnderecoData.id !== undefined ? resEnderecoData.id : resEnderecoData.id_endereco;

        // PASSO B: Cadastrar Usuário com a estrutura exata exigida pela API
        const payloadUsuario = {
            id_endereco: parseInt(idEnderecoCriado),
            nome: document.getElementById("nome").value,
            cpf: document.getElementById("cpf").value,
            email: document.getElementById("email").value,
            senha: document.getElementById("senha").value,
            dataNascimento: document.getElementById("dataNascimento").value
        };

        const respUsuario = await fetch(API_USUARIOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadUsuario)
        });

        const resUsuarioData = await respUsuario.json();

        if (!respUsuario.ok) {
            mensagem.style.color = "red";
            mensagem.textContent = "Endereço criado, mas ocorreu erro no cadastro de Usuário: " + obterMensagemErro(resUsuarioData);
            return;
        }

        const idUsuarioCriado = resUsuarioData.id_usuario !== undefined ? resUsuarioData.id_usuario : resUsuarioData.id;

        // PASSO C: Cadastrar Funcionário
        const payloadFuncionario = {
            id_usuario: parseInt(idUsuarioCriado),
            id_cargo: parseInt(document.getElementById("cargo_id").value),
            data_admissao: document.getElementById("data_admissao").value,
            status: document.getElementById("status").value
        };

        const respFuncionario = await fetch(API_FUNCIONARIOS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadFuncionario)
        });

        const resFuncData = await respFuncionario.json();

        if (respFuncionario.ok) {
            mensagem.style.color = "green";
            mensagem.textContent = "Funcionário e endereço cadastrados com sucesso!";
            document.getElementById("formCriarFuncionario").reset();
        } else {
            mensagem.style.color = "red";
            mensagem.textContent = "Usuário criado, mas ocorreu erro ao vincular Funcionário: " + obterMensagemErro(resFuncData);
        }

    } catch (erro) {
        mensagem.style.color = "red";
        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }
}

// =========================================================
// OPERAÇÃO: LISTAR (GET)
// =========================================================
async function listarFuncionarios() {
    const tabela = document.getElementById("tabelaFuncionarios");
    if (!tabela) return;

    try {
        const resposta = await fetch(API_FUNCIONARIOS);
        const funcionarios = await resposta.json();

        if (resposta.ok) {
            tabela.innerHTML = "";
            funcionarios.forEach(func => {
                const tr = document.createElement("tr");
                const idEndereco = func.usuario && func.usuario.id_endereco ? func.usuario.id_endereco : null;
                
                tr.innerHTML = `
                    <td>${func.id_funcionario}</td>
                    <td>${func.usuario ? func.usuario.nome : 'N/D'}</td>
                    <td>${func.usuario ? func.usuario.email : 'N/D'}</td>
                    <td>${func.cargo ? func.cargo.nome_cargo : func.id_cargo}</td>
                    <td>${func.status}</td>
                    <td>
                        <a href="edit.html?id=${func.id_funcionario}">Editar</a> |
                        <button onclick="excluirFuncionario(${func.id_funcionario})">Excluir Func.</button>
                        ${idEndereco ? `| <button onclick="excluirEndereco(${idEndereco})">Excluir Endereço</button>` : ''}
                    </td>
                `;
                tabela.appendChild(tr);
            });
        }
    } catch (erro) {
        console.error("Erro ao listar funcionários:", erro);
    }
}

// =========================================================
// OPERAÇÃO: CARREGAR DADOS NA TELA DE EDIÇÃO
// =========================================================
async function carregarDadosParaEdicao() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS}/${id}`);
        const funcionario = await resposta.json();

        if (resposta.ok) {
            document.getElementById("id_funcionario").value = funcionario.id_funcionario;
            document.getElementById("cargo_id").value = funcionario.id_cargo;
            document.getElementById("data_admissao").value = funcionario.data_admissao;
            document.getElementById("status").value = funcionario.status;

            if (funcionario.usuario) {
                document.getElementById("id_usuario").value = funcionario.usuario.id_usuario;
                document.getElementById("nome").value = funcionario.usuario.nome;
                document.getElementById("cpf").value = funcionario.usuario.cpf;
                document.getElementById("email").value = funcionario.usuario.email;
                if (document.getElementById("senha")) document.getElementById("senha").value = funcionario.usuario.senha || "";
                if (document.getElementById("dataNascimento")) {
                    document.getElementById("dataNascimento").value = funcionario.usuario.dataNascimento || funcionario.usuario.data_nascimento || "";
                }

                if (funcionario.usuario.id_endereco) {
                    const respEnd = await fetch(`${API_ENDERECOS}/${funcionario.usuario.id_endereco}`);
                    if (respEnd.ok) {
                        const endereco = await respEnd.json();
                        
                        document.getElementById("id_endereco").value = endereco.id !== undefined ? endereco.id : endereco.id_endereco;
                        
                        if (document.getElementById("logradouro")) document.getElementById("logradouro").value = endereco.rua || "";
                        if (document.getElementById("numero")) document.getElementById("numero").value = endereco.numero || "";
                        if (document.getElementById("complemento")) document.getElementById("complemento").value = endereco.complemento || "";
                        if (document.getElementById("bairro")) document.getElementById("bairro").value = endereco.bairro || "";
                        if (document.getElementById("cidade")) document.getElementById("cidade").value = endereco.cidade || "";
                        if (document.getElementById("uf")) document.getElementById("uf").value = endereco.estado || "";
                        if (document.getElementById("pais")) document.getElementById("pais").value = endereco.pais || "Brasil";
                    }
                }
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar dados do funcionário:", erro);
    }
}

// =========================================================
// OPERAÇÃO: ATUALIZAR (PUT ENDEREÇO + PUT USUÁRIO + PUT FUNCIONÁRIO)
// =========================================================
async function atualizarFuncionario(evt) {
    evt.preventDefault();
    const mensagem = document.getElementById("mensagem");
    mensagem.textContent = "";

    const idFuncionario = document.getElementById("id_funcionario").value;
    const idUsuario = document.getElementById("id_usuario").value;
    const idEndereco = document.getElementById("id_endereco").value;

    const payloadEndereco = obterPayloadEndereco();

    const payloadUsuario = {
        id_endereco: parseInt(idEndereco),
        nome: document.getElementById("nome").value,
        cpf: document.getElementById("cpf").value,
        email: document.getElementById("email").value,
        senha: document.getElementById("senha").value,
        dataNascimento: document.getElementById("dataNascimento").value
    };

    const payloadFuncionario = {
        id_usuario: parseInt(idUsuario),
        id_cargo: parseInt(document.getElementById("cargo_id").value),
        data_admissao: document.getElementById("data_admissao").value,
        status: document.getElementById("status").value
    };

    try {
        if (idEndereco) {
            await fetch(`${API_ENDERECOS}/${idEndereco}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadEndereco)
            });
        }

        await fetch(`${API_USUARIOS}/${idUsuario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadUsuario)
        });

        const respFunc = await fetch(`${API_FUNCIONARIOS}/${idFuncionario}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadFuncionario)
        });

        const resFuncData = await respFunc.json();

        if (respFunc.ok) {
            mensagem.style.color = "green";
            mensagem.textContent = "Dados do Funcionário atualizados com sucesso!";
        } else {
            mensagem.style.color = "red";
            mensagem.textContent = "Erro ao atualizar: " + obterMensagemErro(resFuncData);
        }

    } catch (erro) {
        mensagem.style.color = "red";
        mensagem.textContent = "Falha de conexão com o servidor.";
    }
}

// =========================================================
// OPERAÇÃO: EXCLUIR
// =========================================================
async function excluirFuncionario(id) {
    if (!confirm(`Deseja realmente excluir o funcionário ID ${id}?`)) return;

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS}/${id}`, { method: "DELETE" });

        if (resposta.ok) {
            listarFuncionarios();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir funcionário: " + obterMensagemErro(resultado));
        }
    } catch (erro) {
        alert("Erro de conexão ao tentar excluir o funcionário.");
    }
}

async function excluirEndereco(id) {
    if (!confirm(`Deseja realmente excluir o endereço ID ${id}?`)) return;

    try {
        const resposta = await fetch(`${API_ENDERECOS}/${id}`, { method: "DELETE" });

        if (resposta.ok) {
            alert("Endereço excluído com sucesso.");
            listarFuncionarios();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir endereço: " + obterMensagemErro(resultado));
        }
    } catch (erro) {
        alert("Erro de conexão ao tentar excluir o endereço.");
    }
}

function obterMensagemErro(resultado) {
    if (!resultado.detail) return "Erro desconhecido.";
    if (Array.isArray(resultado.detail)) {
        return resultado.detail.map(e => e.msg).join(" ");
    }
    return resultado.detail;
}