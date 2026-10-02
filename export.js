const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')
const { Parser } = require('json2csv')

const serviceAccount = require('./serviceAccount.json')

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

const EXPORT_DIR = path.join(__dirname, 'export')
const JSON_DIR = path.join(EXPORT_DIR, 'json')
const CSV_DIR = path.join(EXPORT_DIR, 'csv')

fs.mkdirSync(JSON_DIR, { recursive: true })
fs.mkdirSync(CSV_DIR, { recursive: true })

function normalizarValor(valor) {
  if (valor === null || valor === undefined) {
    return valor
  }

  // Firestore Timestamp
  if (
    typeof valor === 'object' &&
    typeof valor.toDate === 'function'
  ) {
    return valor.toDate().toISOString()
  }

  // DocumentReference
  if (
    typeof valor === 'object' &&
    typeof valor.path === 'string' &&
    valor.firestore
  ) {
    return valor.path
  }

  // GeoPoint
  if (
    typeof valor === 'object' &&
    typeof valor.latitude === 'number' &&
    typeof valor.longitude === 'number'
  ) {
    return {
      latitude: valor.latitude,
      longitude: valor.longitude,
    }
  }

  if (Array.isArray(valor)) {
    return valor.map(normalizarValor)
  }

  if (typeof valor === 'object') {
    const resultado = {}

    for (const [chave, conteudo] of Object.entries(valor)) {
      resultado[chave] = normalizarValor(conteudo)
    }

    return resultado
  }

  return valor
}

async function exportarFirestore() {
  console.log('\n🔥 Iniciando exportação do Firestore...\n')

  const collections = await db.listCollections()

  console.log(`📦 ${collections.length} coleções encontradas.\n`)

  const bancoCompleto = {}

  for (const collection of collections) {
    console.log(`➡️ Exportando: ${collection.id}`)

    const snapshot = await collection.get()

    const documentos = snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...normalizarValor(doc.data()),
    }))

    bancoCompleto[collection.id] = documentos

    // JSON da coleção
    const jsonPath = path.join(
      JSON_DIR,
      `${collection.id}.json`
    )

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(documentos, null, 2),
      'utf8'
    )

    // CSV da coleção
    if (documentos.length > 0) {
      try {
        const parser = new Parser({
          flatten: true,
          flattenSeparator: '.',
        })

        const csv = parser.parse(documentos)

        const csvPath = path.join(
          CSV_DIR,
          `${collection.id}.csv`
        )

        fs.writeFileSync(csvPath, csv, 'utf8')
      } catch (error) {
        console.error(
          `   ⚠️ Não foi possível gerar CSV: ${error.message}`
        )
      }
    }

    console.log(`✅✅✅ ${documentos.length} documentos`)
  }

  // JSON contendo o banco inteiro
  const completoPath = path.join(
    EXPORT_DIR,
    'firestore-completo.json'
  )

  fs.writeFileSync(
    completoPath,
    JSON.stringify(bancoCompleto, null, 2),
    'utf8'
  )

  console.log('\n🎉🎉🎉 EXPORTAÇÃO FINALIZADA!')
  console.log(`📁 Arquivos salvos em: ${EXPORT_DIR}\n`)
}

exportarFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌❌❌ Erro durante a exportação:')
    console.error(error)
    process.exit(1)
  })