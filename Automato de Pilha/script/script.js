const parsingTable = {

    S: {
        a: ["a", "A", "c"],
        b: ["b", "B", "d"],
        c: ["c", "C", "a"]
    },

    A: {
        a: ["a", "D"],
        d: ["d", "S"]
    },

    B: {
        a: ["ε"],
        b: ["b", "D"],
        c: ["ε"],
        d: ["ε"],
        $: ["ε"]
    },

    C: {
        c: ["c", "D"],
        d: ["d", "A"]
    },

    D: {
        a: ["a", "B"],
        d: ["d", "B"]
    }
};

let passos = [];
let indicePasso = 0;
let lastEntrada = "";

function analisar(input) {
    const pilha = ["$", "S"];
    const entrada = input.split("");
    entrada.push("$");

    const resultado = [];

    while (pilha.length > 0) {

        const topo = pilha[pilha.length - 1];
        const atual = entrada[0];

        if (topo === atual) {
            resultado.push({
                pilha: pilha.join(" "),
                entrada: entrada.join(""),
                acao: `Ler '${atual}'`
            });
            pilha.pop();
            entrada.shift();
        }

        else if (/^[A-Z]$/.test(topo)) {

            const producao = parsingTable[topo]?.[atual];

            if (!producao) {
                resultado.push({
                    pilha: pilha.join(" "),
                    entrada: entrada.join(""),
                    acao: `Erro: nenhuma produção para ${topo} com '${atual}'`
                });
                break;
            }

            resultado.push({
                pilha: pilha.join(" "),
                entrada: entrada.join(""),
                acao: `${topo} → ${producao.join("")}`
            });

            pilha.pop();

            if (producao[0] !== "ε") {
                for (let i = producao.length - 1; i >= 0; i--) {
                    pilha.push(producao[i]);
                }
            }
        }

        else {
            resultado.push({
                pilha: pilha.join(" "),
                entrada: entrada.join(""),
                acao: `Erro: símbolo inesperado '${atual}'`
            });
            break;
        }
    }
    return resultado;
}

function executarAnalise() {
    const entrada = document.getElementById("entrada").value.trim();
    if (!entrada) return alert("Digite a sentença ou use a geração intuitiva para analise");

    passos = analisar(entrada);
    indicePasso = passos.length;
    lastEntrada = entrada;

    renderTabela(passos, true);
}


function passoAPasso() {
    const entrada = document.getElementById("entrada").value.trim();
    if (!entrada) return alert("Digite a sentença ou use a geração intuitiva para analise!");

    if (passos.length === 0 || entrada !== lastEntrada) {
        passos = analisar(entrada);
        indicePasso = 0;
        lastEntrada = entrada;

        document.querySelector("#tabelaPassos tbody").innerHTML = "";
    }

    const tbody = document.querySelector("#tabelaPassos tbody");

    if (indicePasso < passos.length) {

        addLinha(passos[indicePasso]);
        indicePasso++;
        if (indicePasso === passos.length) {
            appendResumo(passos);
            renderResultado();
        }
    }
}

function appendResumo(lista) {
    const tbody = document.querySelector("#tabelaPassos tbody");
    const lastRow = tbody.lastElementChild;
    if (lastRow && lastRow.querySelector && lastRow.querySelector("td")?.getAttribute("colspan") === "3") {
        return;
    }

    const ultima = lista[lista.length - 1];
    const erro = ultima.acao.includes("Erro");

    const resumo = document.createElement("tr");
    resumo.style.fontWeight = "bold";

    const msg = erro ?
        `REJEITADO em ${lista.length} passos` :
        `ACEITO em ${lista.length} passos`;

    resumo.innerHTML = `
        <td colspan="3" style="background:#ffe9a8; color:#02407e; border:2px solid #02407e;">
            ${msg}
        </td>
    `;
    tbody.appendChild(resumo);
}


function renderResultado() {
    if (passos.length === 0) {
        document.getElementById("resultado").textContent = "";
        return;
    }
    const ultima = passos[passos.length - 1];
    const erro = ultima.acao.includes("Erro");
}


function renderTabela(lista, incluirResumo = false) {
    const tbody = document.querySelector("#tabelaPassos tbody");
    tbody.innerHTML = "";

    lista.forEach(addLinha);

    if (incluirResumo) {
        appendResumo(lista);
    }

    renderResultado();
}


function addLinha(item) {
    const tbody = document.querySelector("#tabelaPassos tbody");

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${item.pilha}</td>
        <td>${item.entrada}</td>
        <td>${item.acao}</td>
    `;
    tbody.appendChild(tr);
}

let derivacao = [];

function atualizarSentenca() {
    const visual = derivacao.map(sym => {
        if (/^[A-Z]$/.test(sym)) return `[${sym}]`;
        return sym;
    }).join("");

    document.getElementById("sentencaIntuitiva").value = visual;
}

function proximoNaoTerminal() {
    return derivacao.find(s => /^[A-Z]$/.test(s)) || null;
}

function aplicarProducao(nt, producao) {

    if (derivacao.length === 0 && nt !== "S") {
        alert("A derivação está vazia. Você deve começar com uma produção de S.");
        return;
    }

    const idx = derivacao.findIndex(s => s === nt);
    if (derivacao.length === 0) {
        derivacao.push("S");
        atualizarDestaques();
        return;
    }

    derivacao.splice(idx, 1);

    if (producao !== "ε") {
        const simbolos = producao.split("");
        derivacao.splice(idx, 0, ...simbolos);
    }

    atualizarSentenca();
    atualizarDestaques();
}

function atualizarDestaques() {
    const nt = proximoNaoTerminal();

    document.querySelectorAll(".prod").forEach(p => {
        const prodNT = p.getAttribute("data-nt");

        const ok =
            (derivacao.length === 0 && prodNT === "S") ||
            prodNT === nt;

        p.classList.toggle("habilitado", ok);
        p.classList.toggle("desabilitado", !ok);
    });
}

function resetDerivacao() {
    derivacao = [];
    atualizarSentenca();
    atualizarDestaques();
}

function enviarParaAnalise() {
    const somenteTerminais = derivacao.filter(s => !/^[A-Z]$/.test(s)).join("").trim();
    const existeNT = derivacao.some(s => /^[A-Z]$/.test(s));

    if (somenteTerminais === "") {
        alert("A sentença está vazia. Produza uma sentença antes de enviar.");
        return;
    }

    if (existeNT) {
        alert("A derivação ainda contém não-terminais. Finalize todas as produções antes de enviar.");
        return;
    }

    document.getElementById("entrada").value = somenteTerminais;
    alert("Sentença enviada para análise: " + somenteTerminais);
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarSentenca();
    atualizarDestaques();

    document.querySelectorAll(".prod").forEach(p => {
        p.addEventListener("click", () => {
            if (!p.classList.contains("habilitado")) return;

            const nt = p.getAttribute("data-nt");
            const prod = p.getAttribute("data-prod");

            aplicarProducao(nt, prod);
        });
    });
});
