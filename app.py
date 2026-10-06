from flask import Flask, jsonify, send_from_directory, request
import sqlite3

app = Flask(__name__)

DATABASE = "sweetcupcake.db"


@app.route("/")
def inicio():
    return send_from_directory(".", "index.html")


@app.route("/script.js")
def script():
    return send_from_directory(".", "script.js")


@app.route("/style.css")
def estilo():
    return send_from_directory(".", "style.css")


@app.route("/images/<path:nome>")
def imagens(nome):
    return send_from_directory("image", nome)


@app.route("/api/products")
def produtos():

    conexao = sqlite3.connect(DATABASE)
    conexao.row_factory = sqlite3.Row

    produtos = conexao.execute(
        """
        SELECT id, nome, descricao, preco, imagem
        FROM produtos
        """
    ).fetchall()

    conexao.close()

    return jsonify([
        dict(produto)
        for produto in produtos
    ])


@app.route("/api/orders", methods=["POST"])
def criar_pedido():

    dados = request.get_json()

    print("Pedido recebido:", dados)

    produtos_pedido = dados.get("produtos", [])

    morada = dados.get(
        "morada",
        ""
    ).strip()

    if not produtos_pedido:

        return jsonify({
            "mensagem": "O carrinho está vazio."
        }), 400

    if not morada:

        return jsonify({
            "mensagem": "A morada é obrigatória."
        }), 400

    conexao = sqlite3.connect(DATABASE)

    try:

        # Calcular o total do pedido

        total = 0

        for produto in produtos_pedido:

            preco = float(
                produto["preco"]
            )

            quantidade = int(
                produto["quantidade"]
            )

            total += preco * quantidade

        # Criar o pedido

        conexao.execute(
            """
           INSERT INTO pedidos
(nome, data, total, estado, morada)
VALUES
(?, datetime('now'), ?, ?, ?)
            """,
            (
    dados.get("nome", ""),
    total,
    "Recebido",
    morada
)
        )

        pedido_id = conexao.execute(
            "SELECT last_insert_rowid()"
        ).fetchone()[0]

        # Guardar os produtos do pedido

        for produto in produtos_pedido:

            preco = float(
                produto["preco"]
            )

            quantidade = int(
                produto["quantidade"]
            )

            subtotal = preco * quantidade

            conexao.execute(
                """
                INSERT INTO itens_pedido
                (
                    pedido_id,
                    produto_id,
                    quantidade,
                    preco_unitario,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    pedido_id,
                    produto["id"],
                    quantidade,
                    preco,
                    subtotal
                )
            )

        conexao.commit()

        print(
            "Pedido guardado na base de dados:",
            pedido_id
        )

        return jsonify({
            "mensagem":
                "Pedido realizado com sucesso!"
        })

    except Exception as erro:

        conexao.rollback()

        print(
            "Erro ao guardar pedido:",
            erro
        )

        return jsonify({
            "mensagem":
                "Erro ao guardar o pedido."
        }), 500

    finally:

        conexao.close()


@app.route("/api/orders", methods=["GET"])
def consultar_pedidos():

    conexao = sqlite3.connect(DATABASE)

    conexao.row_factory = sqlite3.Row

    pedidos = conexao.execute(
        """
        SELECT
    id,
    nome,
    data,
    total,
    estado,
    morada
FROM pedidos
        """
    ).fetchall()

    conexao.close()

    return jsonify([
        dict(pedido)
        for pedido in pedidos
    ])


if __name__ == "__main__":

    app.run(debug=True)
