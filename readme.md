# Firestore Export

Script simples em **Node.js** para exportar dados do Cloud Firestore para arquivos **JSON e CSV**.

## O que ele faz

- Busca automaticamente as coleções do Firestore.
- Exporta cada coleção para **JSON** e **CSV**.
- Mantém o ID dos documentos no campo `_id`.
- Converte tipos específicos do Firestore, como `Timestamp`, `DocumentReference` e `GeoPoint`.
- Gera também um JSON contendo todos os dados exportados.

## Como usar

Instale as dependências:

```bash
npm install
```

add o arquivo `serviceAccount.json` na raiz do projeto com as credenciais do Firebase.

Depois execute:

```bash
node export.js
```

Os arquivos serão gerados dentro da pasta `export/`.
