"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COST_SAVER_GEMINI_MESSAGE = void 0;
exports.isCostSaverMode = isCostSaverMode;
exports.costSaverGeminiStub = costSaverGeminiStub;
const TRUTHY = new Set(['1', 'true', 'yes', 'on']);
/** Cloud Run·Functions 공통 — Gemini API 호출 차단 (제작 단계 비용 절감) */
function isCostSaverMode() {
    var _a;
    const raw = ((_a = process.env.COST_SAVER_MODE) !== null && _a !== void 0 ? _a : 'true').trim().toLowerCase();
    return TRUTHY.has(raw);
}
exports.COST_SAVER_GEMINI_MESSAGE = '비용 절감 모드(COST_SAVER_MODE)가 켜져 있어 AI 응답이 일시 중지되어 있습니다. 정식 오픈 후 다시 이용해 주세요.';
function costSaverGeminiStub(modelId = 'cost-saver-stub') {
    return {
        text: exports.COST_SAVER_GEMINI_MESSAGE,
        modelId,
        usage: undefined,
    };
}
//# sourceMappingURL=costSaver.js.map