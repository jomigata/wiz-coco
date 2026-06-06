import {
  counselFaqSheetGid,
  counselFaqSheetId,
  isCounselFaqSheetConfigured,
} from '../config/params'
import type { CounselFaqRow } from './types'

const HEADER_ALIASES: Record<string, 'category' | 'keywords' | 'answerTemplate'> = {
  category: 'category',
  카테고리: 'category',
  keywords: 'keywords',
  키워드: 'keywords',
  keyword: 'keywords',
  answer_template: 'answerTemplate',
  answertemplate: 'answerTemplate',
  answer: 'answerTemplate',
  답변: 'answerTemplate',
  답변템플릿: 'answerTemplate',
  content: 'answerTemplate',
  내용: 'answerTemplate',
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell.trim())
      if (row.some((c) => c.length > 0)) rows.push(row)
      row = []
      cell = ''
      if (ch === '\r') i++
    } else if (ch !== '\r') {
      cell += ch
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    if (row.some((c) => c.length > 0)) rows.push(row)
  }

  return rows
}

function normalizeHeader(h: string): 'category' | 'keywords' | 'answerTemplate' | null {
  const key = h.trim().toLowerCase().replace(/\s+/g, '_')
  return HEADER_ALIASES[key] ?? HEADER_ALIASES[h.trim()] ?? null
}

export function rowsToFaqEntries(grid: string[][]): CounselFaqRow[] {
  if (grid.length < 2) return []

  const headers = grid[0].map(normalizeHeader)
  const colIndex: Partial<Record<'category' | 'keywords' | 'answerTemplate', number>> = {}
  headers.forEach((h, i) => {
    if (h) colIndex[h] = i
  })

  if (colIndex.category === undefined || colIndex.answerTemplate === undefined) {
    throw new Error(
      '시트 첫 행에 category(카테고리), answer(답변) 열이 필요합니다. keywords(키워드)는 선택입니다.'
    )
  }

  const entries: CounselFaqRow[] = []

  for (let r = 1; r < grid.length; r++) {
    const line = grid[r]
    const category = line[colIndex.category!]?.trim() ?? ''
    const answerTemplate = line[colIndex.answerTemplate!]?.trim() ?? ''
    const keywordsRaw =
      colIndex.keywords !== undefined ? line[colIndex.keywords]?.trim() ?? '' : ''

    if (!category && !answerTemplate) continue

    const keywords = keywordsRaw
      .split(/[,，、|/]/)
      .map((k) => k.trim())
      .filter(Boolean)

    entries.push({
      sheetRow: r + 1,
      category: category || '일반',
      keywords,
      answerTemplate,
    })
  }

  return entries
}

export function getSheetCsvUrl(): string {
  const id = counselFaqSheetId.value().trim()
  if (!isCounselFaqSheetConfigured(id)) {
    throw new Error('COUNSEL_FAQ_SHEET_ID가 설정되지 않았습니다.')
  }
  const gid = counselFaqSheetGid.value().trim() || '0'
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

export async function fetchFaqRowsFromSheet(): Promise<CounselFaqRow[]> {
  const url = getSheetCsvUrl()
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(
      `Google 시트 CSV 다운로드 실패 (${res.status}). 시트를 "링크가 있는 모든 사용자"에게 공개했는지 확인하세요.`
    )
  }
  const text = await res.text()
  if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
    throw new Error('시트 CSV를 가져오지 못했습니다. 공개 설정 또는 SHEET_ID/GID를 확인하세요.')
  }
  return rowsToFaqEntries(parseCsv(text))
}
