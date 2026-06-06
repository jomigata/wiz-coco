import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { fetchFaqRowsFromSheet } from './sheetCsv'
import type { CounselFaqDoc } from './types'

const FAQ_COLLECTION = 'counselFaqs'
const META_DOC = 'counselFaqMeta/sync'

const db = () => getFirestore()

export async function syncCounselFaqFromSheetInternal(): Promise<{
  synced: number
  deleted: number
}> {
  const rows = await fetchFaqRowsFromSheet()
  const firestore = db()
  const batch = firestore.batch()
  const activeIds = new Set<string>()

  for (const row of rows) {
    const id = `row_${row.sheetRow}`
    activeIds.add(id)
    const doc: CounselFaqDoc & { updatedAt: ReturnType<typeof FieldValue.serverTimestamp> } = {
      category: row.category,
      keywords: row.keywords,
      answerTemplate: row.answerTemplate,
      sheetRow: row.sheetRow,
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    }
    batch.set(firestore.collection(FAQ_COLLECTION).doc(id), doc, { merge: true })
  }

  const existing = await firestore.collection(FAQ_COLLECTION).get()
  let deleted = 0
  for (const snap of existing.docs) {
    if (!activeIds.has(snap.id)) {
      batch.delete(snap.ref)
      deleted++
    }
  }

  batch.set(
    firestore.doc(META_DOC),
    {
      lastSyncedAt: FieldValue.serverTimestamp(),
      rowCount: rows.length,
      source: 'google_sheets_csv',
    },
    { merge: true }
  )

  await batch.commit()
  return { synced: rows.length, deleted }
}
