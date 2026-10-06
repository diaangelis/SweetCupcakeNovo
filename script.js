let produtos = [];
let carrinho = [];


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

async function carregarProdutos() {

    try {

        const resposta =
            await fetch("/api/products");

        if (!resposta.ok) {

            throw new Error(
                "Erro ao carregar produtos."
            );
        }

        produtos =
            await resposta.json();

        mostrarProdutos();

    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );

        document.getElementById("produtos").innerHTML =
            "<p>Não foi possível carregar os produtos.</p>";
    }
}


/* =========================================================
   MOSTRAR PRODUTOS
========================================================= */

function mostrarProdutos() {

    const container =
        document.getElementById("produtos");

    container.innerHTML = "";

    produtos.forEach(function (produto) {

        const artigo =
            document.createElement("article");

        artigo.innerHTML = `

            <img
                src="/images/${produto.imagem}"
                alt="${produto.nome}"
            >

            <h3>
                ${produto.nome}
            </h3>

            <p>
                ${produto.descricao}
            </p>

            <strong>
                ${Number(produto.preco)
                    .toFixed(2)
                    .replace(".", ",")} €
            </strong>

            <button
                onclick="adicionarCarrinho(${produto.id})"
            >
                + Adicionar
            </button>

        `;

        container.appendChild(artigo);

    });
}


/* =========================================================
   ADICIONAR AO CARRINHO
========================================================= */

function adicionarCarrinho(id) {

    const produto =
        produtos.find(function (item) {

            return item.id === id;

        });

    if (!produto) {

        return;
    }

    const itemExistente =
        carrinho.find(function (item) {

            return item.id === id;

        });

    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        carrinho.push({

            id: produto.id,

            nome: produto.nome,

            descricao: produto.descricao,

            preco: Number(produto.preco),

            imagem: produto.imagem,

            quantidade: 1

        });

    }

    mostrarCarrinho();
}


/* =========================================================
   AUMENTAR QUANTIDADE
========================================================= */

function aumentarQuantidade(id) {

    const item =
        carrinho.find(function (produto) {

            return produto.id === id;

        });

    if (!item) {

        return;
    }

    item.quantidade++;

    mostrarCarrinho();
}


/* =========================================================
   DIMINUIR QUANTIDADE
========================================================= */

function diminuirQuantidade(id) {

    const item =
        carrinho.find(function (produto) {

            return produto.id === id;

        });

    if (!item) {

        return;
    }

    if (item.quantidade > 1) {

        item.quantidade--;

    } else {

        removerCarrinho(id);
        return;
    }

    mostrarCarrinho();
}


/* =========================================================
   REMOVER DO CARRINHO
========================================================= */

function removerCarrinho(id) {

    carrinho =
        carrinho.filter(function (item) {

            return item.id !== id;

        });

    mostrarCarrinho();
}


/* =========================================================
   MOSTRAR CARRINHO
========================================================= */

function mostrarCarrinho() {

    const container =
        document.getElementById("carrinho");

    const totalElemento =
        document.getElementById("total");

    container.innerHTML = "";

    if (carrinho.length === 0) {

        container.innerHTML =
            "<p>O seu carrinho está vazio.</p>";

        totalElemento.textContent =
            "Total: 0,00 €";

        return;
    }

    let total = 0;

    carrinho.forEach(function (item) {

        const subtotal =
            item.preco * item.quantidade;

        total += subtotal;

        const linha =
            document.createElement("p");

        linha.innerHTML = `

            <strong>
                ${item.nome}
            </strong>

            -

            ${item.preco
                .toFixed(2)
                .replace(".", ",")} €

            <button
                onclick="diminuirQuantidade(${item.id})"
            >
                −
            </button>

            <span>
                ${item.quantidade}
            </span>

            <button
                onclick="aumentarQuantidade(${item.id})"
            >
                +
            </button>

            <span>
                =
                ${subtotal
                    .toFixed(2)
                    .replace(".", ",")} €
            </span>

            <button
                onclick="removerCarrinho(${item.id})"
            >
                Remover
            </button>

        `;

        container.appendChild(linha);

    });

    totalElemento.textContent =
        "Total: " +
        total.toFixed(2).replace(".", ",") +
        " €";
}


/* =========================================================
   FINALIZAR COMPRA
========================================================= */

async function finalizarCompra() {

    const morada =
        document
            .getElementById("morada-cliente")
            .value
            .trim();

    const nome =
        document
            .getElementById("nome-cliente")
            .value
            .trim();

    const telefone =
        document
            .getElementById("telefone-cliente")
            .value
            .trim();

    const codigoPostal =
        document
            .getElementById("codigo-postal")
            .value
            .trim();

    const cidade =
        document
            .getElementById("cidade-cliente")
            .value
            .trim();

    const mensagem =
        document.getElementById("mensagem");


    console.log(
        "FINALIZAR COMPRA FOI CHAMADO"
    );


    /* -------------------------
       VALIDAR CARRINHO
    ------------------------- */

    if (carrinho.length === 0) {

        mensagem.textContent =
            "O carrinho está vazio.";

        return;
    }


    /* -------------------------
       VALIDAR DADOS
    ------------------------- */

    if (!nome) {

        mensagem.textContent =
            "Informe o nome completo.";

        return;
    }

    if (!telefone) {

        mensagem.textContent =
            "Informe o telefone.";

        return;
    }

    if (!morada) {

        mensagem.textContent =
            "Informe a morada de entrega.";

        return;
    }

    if (!codigoPostal) {

        mensagem.textContent =
            "Informe o código postal.";

        return;
    }

    if (!cidade) {

        mensagem.textContent =
            "Informe a cidade.";

        return;
    }


    /* -------------------------
       ENVIAR PARA O FLASK
    ------------------------- */

    try {

        console.log(
            "Vou enviar o pedido para o Flask..."
        );


        const resposta =
            await fetch("/api/orders", {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    produtos: carrinho,

                    nome: nome,

                    telefone: telefone,

                    morada: morada,

                    codigo_postal:
                        codigoPostal,

                    cidade: cidade

                })

            });


        console.log(
            "Resposta do Flask:",
            resposta.status
        );


        if (!resposta.ok) {

            throw new Error(
                "Erro HTTP: " +
                resposta.status
            );

        }


        const dados =
            await resposta.json();


        console.log(
            "Dados recebidos:",
            dados
        );


        mensagem.textContent =
            dados.mensagem;


        /* -------------------------
           LIMPAR CARRINHO
        ------------------------- */

        carrinho = [];

        mostrarCarrinho();


        /* -------------------------
           ATUALIZAR PEDIDOS
        ------------------------- */

        carregarPedidosVendedor();


    } catch (erro) {

        console.error(
            "Erro ao enviar pedido:",
            erro
        );

        mensagem.textContent =
            "Erro ao enviar o pedido.";

    }

}


/* =========================================================
   ÁREA DO VENDEDOR
========================================================= */

async function carregarPedidosVendedor() {

    const container =
        document.getElementById(
            "pedidos-vendedor"
        );

    if (!container) {

        return;
    }


    try {

        const resposta =
            await fetch("/api/orders");


        if (!resposta.ok) {

            throw new Error(
                "Erro ao carregar pedidos."
            );

        }


        const pedidos =
            await resposta.json();


        container.innerHTML = "";


        if (pedidos.length === 0) {

            container.innerHTML =
                "<p>Ainda não existem pedidos.</p>";

            return;
        }


        pedidos.forEach(function (pedido) {

            const elemento =
                document.createElement("div");


            elemento.innerHTML = `

                <hr>

                <h3>
                    Pedido #${pedido.id}
                </h3>

                <p>
                    <strong>Data:</strong>
                    ${pedido.data}
                </p>

                <p>
                    <strong>Total:</strong>
                    ${Number(pedido.total)
                        .toFixed(2)
                        .replace(".", ",")} €
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${pedido.estado}
                </p>

                <p>
                    <strong>Morada:</strong>
                    ${pedido.morada}
                </p>

            `;


            container.appendChild(elemento);

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar pedidos:",
            erro
        );

        container.innerHTML =
            "<p>Erro ao carregar os pedidos.</p>";

    }

}


/* =========================================================
   INICIAR A APLICAÇÃO
========================================================= */

carregarProdutos();

mostrarCarrinho();

carregarPedidosVendedor();