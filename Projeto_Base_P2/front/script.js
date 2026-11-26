const API_URL = "http://localhost:5224/api/Atividades";

const areaConteudo = document.querySelector("#areaConteudo");
const formulario = document.querySelector("#formAtividade");
const tipo = document.querySelector("#tipo");
const campos = document.querySelector("#camposEspecificos");
const mensagem = document.querySelector("#mensagem");
const carregando = document.querySelector("#carregando");
const btnSalvar = document.querySelector("#btnSalvar");

let idEdicao = null;

function mostrarMensagem(texto, classe) {
    mensagem.textContent = texto;
    mensagem.className = `alert alert-${classe}`;
}

function requisitar(url, opcoes) {
    return fetch(url, opcoes)
        .then(resposta => {
            if (!resposta.ok) {
                throw new Error("Erro na requisição: " + resposta.status);
            }

            if (resposta.status === 204) {
                return null;
            }

            return resposta.json();
        });
}

function mostrarCampos() {
    if (tipo.value === "curso") {
        campos.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">Professor</label>
                <input id="professor" class="form-control" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Carga horária</label>
                <input id="cargaHoraria" type="number"
                    min="1" class="form-control" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Vagas</label>
                <input id="vagas" type="number"
                    min="1" class="form-control" required>
            </div>
        `;
    } else {
        campos.innerHTML = `
            <div class="col-md-4">
                <label class="form-label">Instrutor</label>
                <input id="instrutor" class="form-control" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Local</label>
                <input id="local" class="form-control" required>
            </div>

            <div class="col-md-4">
                <label class="form-label">Duração em horas</label>
                <input id="duracaoHoras" type="number"
                    min="1" class="form-control" required>
            </div>
        `;
    }
}

tipo.addEventListener("change", mostrarCampos);

function carregarAtividades() {
    carregando.classList.remove("d-none");

    return requisitar(API_URL)
        .then(atividades => {
            return Promise.all(
                atividades.map(atividade =>
                    requisitar(`${API_URL}/${atividade.id}`)
                )
            );
        })
        .then(atividades => {
            mostrarAtividades(atividades);
        })
        .catch(erro => {
            mostrarMensagem(erro.message, "danger");
        })
        .finally(() => {
            carregando.classList.add("d-none");
        });
}

function mostrarAtividades(atividades) {
    areaConteudo.innerHTML = "";

    if (atividades.length === 0) {
        areaConteudo.textContent = "Nenhuma atividade cadastrada.";
        return;
    }

    atividades.forEach(atividade => {
        const coluna = document.createElement("div");
        coluna.className = "col";

        const curso = atividade.professor !== undefined;

        coluna.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <span class="badge bg-primary"></span>

                    <h5 class="card-title mt-3"></h5>

                    <p class="card-text"></p>
                    <p class="ano"></p>

                    <button class="btn btn-info btn-sm detalhes">
                        Detalhes
                    </button>

                    <button class="btn btn-warning btn-sm editar">
                        Editar
                    </button>

                    <button class="btn btn-danger btn-sm excluir">
                        Excluir
                    </button>
                </div>
            </div>
        `;

        coluna.querySelector(".badge").textContent =
            curso ? "Curso" : "Workshop";

        coluna.querySelector(".card-title").textContent =
            atividade.titulo;

        coluna.querySelector(".card-text").textContent =
            curso
                ? `Professor: ${atividade.professor}`
                : `Instrutor: ${atividade.instrutor}`;

        coluna.querySelector(".ano").textContent =
            `Ano: ${atividade.ano}`;

        coluna.querySelector(".detalhes")
            .addEventListener("click", () => {
                mostrarDetalhes(atividade.id);
            });

        coluna.querySelector(".editar")
            .addEventListener("click", () => {
                editarAtividade(atividade);
            });

        coluna.querySelector(".excluir")
            .addEventListener("click", () => {
                excluirAtividade(atividade.id);
            });

        areaConteudo.appendChild(coluna);
    });
}

function mostrarDetalhes(id) {
    requisitar(`${API_URL}/${id}/descricao`)
        .then(dados => {
            alert(`${dados.descricao}\nDuração: ${dados.duracao} horas`);
        })
        .catch(erro => {
            mostrarMensagem(erro.message, "danger");
        });
}

formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const dados = {
        titulo: document.querySelector("#titulo").value.trim(),
        ano: Number(document.querySelector("#ano").value)
    };

    if (tipo.value === "curso") {
        dados.professor =
            document.querySelector("#professor").value.trim();

        dados.cargaHoraria =
            Number(document.querySelector("#cargaHoraria").value);

        dados.vagas =
            Number(document.querySelector("#vagas").value);

        if (!dados.professor || dados.cargaHoraria <= 0 || dados.vagas <= 0) {
            mostrarMensagem("Preencha corretamente os dados do curso.", "danger");
            return;
        }

    } else {
        dados.instrutor =
            document.querySelector("#instrutor").value.trim();

        dados.local =
            document.querySelector("#local").value.trim();

        dados.duracaoHoras =
            Number(document.querySelector("#duracaoHoras").value);

        if (!dados.instrutor || !dados.local || dados.duracaoHoras <= 0) {
            mostrarMensagem("Preencha corretamente os dados do workshop.", "danger");
            return;
        }
    }

    if (!dados.titulo || dados.ano < 0) {
        mostrarMensagem("Preencha corretamente o título e o ano.", "danger");
        return;
    }

    let url = `${API_URL}/${tipo.value}`;
    let metodo = "POST";

    if (idEdicao !== null) {
        url = `${url}/${idEdicao}`;
        metodo = "PUT";
    }

    btnSalvar.disabled = true;

    requisitar(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    })
        .then(() => {
            mostrarMensagem(
                metodo === "POST"
                    ? "Atividade cadastrada com sucesso!"
                    : "Atividade atualizada com sucesso!",
                "success"
            );

            limparFormulario();
            return carregarAtividades();
        })
        .catch(erro => {
            mostrarMensagem(erro.message, "danger");
        })
        .finally(() => {
            btnSalvar.disabled = false;
        });
});

function editarAtividade(atividade) {
    idEdicao = atividade.id;

    tipo.value =
        atividade.professor !== undefined ? "curso" : "workshop";

    mostrarCampos();

    tipo.disabled = true;

    document.querySelector("#titulo").value = atividade.titulo;
    document.querySelector("#ano").value = atividade.ano;

    if (tipo.value === "curso") {
        document.querySelector("#professor").value = atividade.professor;
        document.querySelector("#cargaHoraria").value = atividade.cargaHoraria;
        document.querySelector("#vagas").value = atividade.vagas;
    } else {
        document.querySelector("#instrutor").value = atividade.instrutor;
        document.querySelector("#local").value = atividade.local;
        document.querySelector("#duracaoHoras").value = atividade.duracaoHoras;
    }

    btnSalvar.textContent = "Atualizar atividade";

    formulario.scrollIntoView({
        behavior: "smooth"
    });
}

function excluirAtividade(id) {
    if (!confirm("Deseja realmente excluir esta atividade?")) {
        return;
    }

    requisitar(`${API_URL}/${id}`, {
        method: "DELETE"
    })
        .then(() => {
            mostrarMensagem("Atividade excluída com sucesso!", "success");

            if (idEdicao === id) {
                limparFormulario();
            }

            return carregarAtividades();
        })
        .catch(erro => {
            mostrarMensagem(erro.message, "danger");
        });
}

function limparFormulario() {
    formulario.reset();
    idEdicao = null;
    tipo.disabled = false;
    btnSalvar.textContent = "Salvar atividade";
    mostrarCampos();
}

document.querySelector("#btnCancelar")
    .addEventListener("click", limparFormulario);

mostrarCampos();
carregarAtividades();