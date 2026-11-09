"""Runner de migrations simples, executado na inicialização do backend.

Cada arquivo ``NNN_nome.py`` nesta pasta deve expor uma função ``up(cursor)``.
Opcionalmente pode expor ``habilitada() -> bool`` para ser pulado sem ser
marcado como aplicado. As migrations aplicadas ficam registradas na tabela
``schema_migrations`` e não rodam novamente.
"""

import importlib.util
from pathlib import Path

from database import criar_conexao

MIGRATIONS_DIR = Path(__file__).resolve().parent
IGNORADOS = {"__init__.py", "runner.py"}


def _arquivos():
    arquivos = [
        caminho
        for caminho in MIGRATIONS_DIR.glob("*.py")
        if caminho.name not in IGNORADOS
    ]
    return sorted(arquivos, key=lambda caminho: caminho.name)


def _garantir_tabela(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            nome VARCHAR(255) PRIMARY KEY,
            aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    )


def _ja_aplicada(cursor, nome: str) -> bool:
    cursor.execute("SELECT 1 FROM schema_migrations WHERE nome = %s", (nome,))
    return cursor.fetchone() is not None


def _carregar(caminho: Path):
    nome_modulo = f"migrations.{caminho.stem}"
    spec = importlib.util.spec_from_file_location(nome_modulo, caminho)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def run() -> None:
    conexao = criar_conexao()
    cursor = conexao.cursor()
    aplicadas = 0

    try:
        _garantir_tabela(cursor)
        conexao.commit()

        for caminho in _arquivos():
            nome = caminho.stem
            if _ja_aplicada(cursor, nome):
                continue

            modulo = _carregar(caminho)
            habilitada = getattr(modulo, "habilitada", None)
            if callable(habilitada) and not habilitada():
                print(f"Migration {nome} desabilitada; pulando.")
                continue

            print(f"Aplicando migration {nome}...")
            try:
                modulo.up(cursor)
                cursor.execute(
                    "INSERT INTO schema_migrations (nome) VALUES (%s)", (nome,)
                )
                conexao.commit()
                aplicadas += 1
            except Exception:
                conexao.rollback()
                raise
    finally:
        cursor.close()
        conexao.close()

    if aplicadas:
        print(f"Migrations aplicadas: {aplicadas}")
    else:
        print("Nenhuma migration pendente.")


if __name__ == "__main__":
    run()
