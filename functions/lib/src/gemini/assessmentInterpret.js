"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAssessmentInterpretation = generateAssessmentInterpretation;
const client_1 = require("./client");
const MAX_RESULT_JSON_CHARS = 12000;
function truncateJson(value) {
    try {
        const raw = JSON.stringify(value, null, 2);
        if (raw.length <= MAX_RESULT_JSON_CHARS)
            return raw;
        return `${raw.slice(0, MAX_RESULT_JSON_CHARS)}\n…(truncated)`;
    }
    catch (_a) {
        return String(value).slice(0, MAX_RESULT_JSON_CHARS);
    }
}
async function generateAssessmentInterpretation(input) {
    const testLabel = input.testType || input.testId || '심리검사';
    const clientLabel = input.clientLabel || '내담자';
    const resultBlock = truncateJson({
        status: input.status || 'completed',
        resultData: input.resultData,
        responses: input.responses,
    });
    const prompt = `[검사 결과 AI 해석 요청]

역할: 한국어로 상담사를 돕는 심리검사 해석 보조 AI입니다.
- 의학적·정신의학적 **진단명을 단정하지 마세요**.
- 결과를 상담사가 내담자에게 설명할 때 참고할 **비진단적 해석**으로 작성하세요.
- 고위험 징후가 보이면 「전문가 대면 평가 권고」를 명시하세요.

검사: ${testLabel}
내담자 식별: ${clientLabel}

원시 결과(JSON):
${resultBlock}

다음 섹션으로 한국어 마크다운 형식 답변:
## 핵심 요약
## 주요 소견 (3~5개 bullet)
## 상담 시 참고 포인트
## 추가 검사·개입 제안 (권고 수준)
## 주의·위험 신호 (해당 시)`;
    const result = await (0, client_1.generateCounselReply)([], prompt);
    return result;
}
//# sourceMappingURL=assessmentInterpret.js.map