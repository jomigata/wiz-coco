"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsv = parseCsv;
exports.rowsToFaqEntries = rowsToFaqEntries;
exports.getSheetCsvUrl = getSheetCsvUrl;
exports.fetchFaqRowsFromSheet = fetchFaqRowsFromSheet;
const params_1 = require("../config/params");
const HEADER_ALIASES = {
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
};
function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        if (inQuotes) {
            if (ch === '"' && next === '"') {
                cell += '"';
                i++;
            }
            else if (ch === '"') {
                inQuotes = false;
            }
            else {
                cell += ch;
            }
            continue;
        }
        if (ch === '"') {
            inQuotes = true;
        }
        else if (ch === ',') {
            row.push(cell.trim());
            cell = '';
        }
        else if (ch === '\n' || (ch === '\r' && next === '\n')) {
            row.push(cell.trim());
            if (row.some((c) => c.length > 0))
                rows.push(row);
            row = [];
            cell = '';
            if (ch === '\r')
                i++;
        }
        else if (ch !== '\r') {
            cell += ch;
        }
    }
    if (cell.length > 0 || row.length > 0) {
        row.push(cell.trim());
        if (row.some((c) => c.length > 0))
            rows.push(row);
    }
    return rows;
}
function normalizeHeader(h) {
    var _a, _b;
    const key = h.trim().toLowerCase().replace(/\s+/g, '_');
    return (_b = (_a = HEADER_ALIASES[key]) !== null && _a !== void 0 ? _a : HEADER_ALIASES[h.trim()]) !== null && _b !== void 0 ? _b : null;
}
function rowsToFaqEntries(grid) {
    var _a, _b, _c, _d, _e, _f;
    if (grid.length < 2)
        return [];
    const headers = grid[0].map(normalizeHeader);
    const colIndex = {};
    headers.forEach((h, i) => {
        if (h)
            colIndex[h] = i;
    });
    if (colIndex.category === undefined || colIndex.answerTemplate === undefined) {
        throw new Error('시트 첫 행에 category(카테고리), answer(답변) 열이 필요합니다. keywords(키워드)는 선택입니다.');
    }
    const entries = [];
    for (let r = 1; r < grid.length; r++) {
        const line = grid[r];
        const category = (_b = (_a = line[colIndex.category]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        const answerTemplate = (_d = (_c = line[colIndex.answerTemplate]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
        const keywordsRaw = colIndex.keywords !== undefined ? (_f = (_e = line[colIndex.keywords]) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : '' : '';
        if (!category && !answerTemplate)
            continue;
        const keywords = keywordsRaw
            .split(/[,，、|/]/)
            .map((k) => k.trim())
            .filter(Boolean);
        entries.push({
            sheetRow: r + 1,
            category: category || '일반',
            keywords,
            answerTemplate,
        });
    }
    return entries;
}
function getSheetCsvUrl() {
    const id = params_1.counselFaqSheetId.value().trim();
    if (!(0, params_1.isCounselFaqSheetConfigured)(id)) {
        throw new Error('COUNSEL_FAQ_SHEET_ID가 설정되지 않았습니다.');
    }
    const gid = params_1.counselFaqSheetGid.value().trim() || '0';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}
async function fetchFaqRowsFromSheet() {
    const url = getSheetCsvUrl();
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
        throw new Error(`Google 시트 CSV 다운로드 실패 (${res.status}). 시트를 "링크가 있는 모든 사용자"에게 공개했는지 확인하세요.`);
    }
    const text = await res.text();
    if (text.includes('<!DOCTYPE html') || text.includes('<html')) {
        throw new Error('시트 CSV를 가져오지 못했습니다. 공개 설정 또는 SHEET_ID/GID를 확인하세요.');
    }
    return rowsToFaqEntries(parseCsv(text));
}
//# sourceMappingURL=sheetCsv.js.map