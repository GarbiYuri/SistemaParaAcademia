const API_URL = "/cargos";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Tela de Criação
    const formCriar = document.getElementById("formCriarCargo");
    if (formCriar) {
        formCriar.addEventListener("submit", criarCargo);
    }

    // 2. Tela de Edição
    const formEditar = document.getElementById("formEditarCargo");
    if (formEditar) {
        carregarDadosParaEdicao();
        formEditar.addEventListener("submit", atualizarCargo);
    }

    // 3. Tela de Listagem (Visualizar / Excluir)
    const tabelaCargos = document.getElementById("tabelaCargos");
    if (tabelaCargos) {
        listarCargos();
    }
});

// =========================================================
// OPERAÇÃO: CRIAR (POST)
// =========================================================
async function criarCargo(evt) {
    evt.preventDefault();
    const mensagem = document.getElementById("mensagem");
    mensagem.textContent = "";

    const payload = {
        nome_cargo: document.getElementById("nome").value,
        salario_base: parseFloat(document.getElementById("salario").value),
        status: document.getElementById("status").value
    };

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mensagem.style.color = "green";
            mensagem.textContent = "Cargo cadastrado com sucesso!";
            document.getElementById("formCriarCargo").reset();
        } else {
            mensagem.style.color = "red";
            mensagem.textContent = "Erro: " + obterMensagemErro(resultado);
        }
    } catch (erro) {
        mensagem.style.color = "red";
        mensagem.textContent = "Não foi possível conectar ao servidor.";
    }
}

// =========================================================
// OPERAÇÃO: LISTAR (GET)
// =========================================================
async function listarCargos() {
    const tabela = document.getElementById("tabelaCargos");
    if (!tabela) return;

    try {
        const resposta = await fetch(API_URL);
        const cargos = await resposta.json();

        if (resposta.ok) {
            tabela.innerHTML = "";
            cargos.forEach(cargo => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${cargo.id_cargo}</td>
                    <td>${cargo.nome_cargo}</td>
                    <td>R$ ${cargo.salario_base.toFixed(2)}</td>
                    <td>${cargo.status}</td>
                    <td>
                        <a href="edit.html?id=${cargo.id_cargo}">Editar</a>
                        <button onclick="excluirCargo(${cargo.id_cargo})">Excluir</button>
                    </td>
                `;
                tabela.appendChild(tr);
            });
        }
    } catch (erro) {
        console.error("Erro ao listar cargos:", erro);
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
        const resposta = await fetch(`${API_URL}/${id}`);
        const cargo = await resposta.json();

        if (resposta.ok) {
            document.getElementById("id_cargo").value = cargo.id_cargo;
            document.getElementById("nome").value = cargo.nome_cargo;
            document.getElementById("salario").value = cargo.salario_base;
            document.getElementById("status").value = cargo.status;
        }
    } catch (erro) {
        console.error("Erro ao carregar cargo:", erro);
    }
}

// =========================================================
// OPERAÇÃO: ATUALIZAR (PUT)
// =========================================================
async function atualizarCargo(evt) {
    evt.preventDefault();
    const mensagem = document.getElementById("mensagem");
    mensagem.textContent = "";

    const id = document.getElementById("id_cargo").value;
    const payload = {
        nome_cargo: document.getElementById("nome").value,
        salario_base: parseFloat(document.getElementById("salario").value),
        status: document.getElementById("status").value
    };

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            mensagem.style.color = "green";
            mensagem.textContent = "Cargo atualizado com sucesso!";
        } else {
            mensagem.style.color = "red";
            mensagem.textContent = "Erro: " + obterMensagemErro(resultado);
        }
    } catch (erro) {
        mensagem.style.color = "red";
        mensagem.textContent = "Falha ao conectar com o servidor.";
    }
}

// =========================================================
// OPERAÇÃO: EXCLUIR (DELETE)
// =========================================================
async function excluirCargo(id) {
    if (!confirm(`Deseja realmente excluir o cargo ID ${id}?`)) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (resposta.ok) {
            listarCargos();
        } else {
            const resultado = await resposta.json();
            alert("Erro ao excluir: " + obterMensagemErro(resultado));
        }
    } catch (erro) {
        alert("Erro de conexão ao tentar excluir.");
    }
}

function obterMensagemErro(resultado) {
    if (!resultado.detail) return "Erro desconhecido.";
    if (Array.isArray(resultado.detail)) {
        return resultado.detail.map(e => e.msg).join(" ");
    }
    return resultado.detail;
}