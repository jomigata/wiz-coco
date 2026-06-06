"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRisk = detectRisk;
const CRISIS_KEYWORDS_HIGH = [
    '자살',
    '죽고 싶',
    '끝내고 싶',
    '자해',
    '목을 매',
    '약을 먹고',
    '살고 싶지 않',
];
function detectRisk(text) {
    const lower = text.toLowerCase();
    const keywords = CRISIS_KEYWORDS_HIGH.filter((k) => lower.includes(k));
    if (keywords.length > 0) {
        return { riskLevel: 'high', keywords };
    }
    return { riskLevel: 'none', keywords: [] };
}
//# sourceMappingURL=crisis.js.map