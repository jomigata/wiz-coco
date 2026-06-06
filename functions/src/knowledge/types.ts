export interface CounselFaqRow {
  sheetRow: number
  category: string
  keywords: string[]
  answerTemplate: string
}

export interface CounselFaqDoc {
  category: string
  keywords: string[]
  answerTemplate: string
  sheetRow: number
  active: boolean
}
