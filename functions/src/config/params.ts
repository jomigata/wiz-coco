import { defineString } from 'firebase-functions/params'

export const FAQ_SHEET_UNSET = 'unset'

export const counselFaqSheetId = defineString('COUNSEL_FAQ_SHEET_ID', {
  default: FAQ_SHEET_UNSET,
  description: 'Google Sheets document ID for counsel FAQ sync',
})

export const counselFaqSheetGid = defineString('COUNSEL_FAQ_SHEET_GID', {
  default: '0',
  description: 'Google Sheets tab gid for counsel FAQ CSV export',
})

export function isCounselFaqSheetConfigured(sheetId?: string): boolean {
  const id = (sheetId ?? counselFaqSheetId.value()).trim()
  return id.length > 0 && id !== FAQ_SHEET_UNSET
}
