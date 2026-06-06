"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COUNSEL_MODEL = void 0;
exports.classifyGeminiFailure = classifyGeminiFailure;
exports.generateCounselReply = generateCounselReply;
exports.generateSessionSummary = generateSessionSummary;
const generative_ai_1 = require("@google/generative-ai");
const prompts_1 = require("./prompts");
exports.DEFAULT_COUNSEL_MODEL = 'gemini-2.5-flash-lite';
const MODEL_CANDIDATES = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
];
function getApiKey() {
    var _a;
    const apiKey = (_a = process.env.GEMINI_API_KEY) === null || _a === void 0 ? void 0 : _a.trim();
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return apiKey;
}
function getGeminiModel(modelId) {
    const genAI = new generative_ai_1.GoogleGenerativeAI(getApiKey());
    return genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: prompts_1.SYSTEM_PROMPT,
    });
}
function toGeminiError(err) {
    if (err instanceof Error)
        return err;
    return new Error(String(err));
}
function classifyGeminiFailure(err) {
    const message = toGeminiError(err).message;
    const lower = message.toLowerCase();
    if (/429|quota|rate limit|resource exhausted|depleted|billing|prepay/i.test(message)) {
        return { kind: 'quota', message };
    }
    if (/api key|apikey|401|403|permission|invalid key/i.test(lower)) {
        return { kind: 'auth', message };
    }
    if (/history|alternate|must be/i.test(lower)) {
        return { kind: 'history', message };
    }
    if (/404|not found|model/i.test(lower)) {
        return { kind: 'model', message };
    }
    return { kind: 'unknown', message };
}
async function generateCounselReply(history, userMessage, options) {
    let lastError = null;
    const prompt = (options === null || options === void 0 ? void 0 : options.knowledgeContext)
        ? `${options.knowledgeContext}\n\n---\n\n[사용자 메시지]\n${userMessage}`
        : userMessage;
    for (const modelId of MODEL_CANDIDATES) {
        try {
            const model = getGeminiModel(modelId);
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(prompt);
            return { text: result.response.text(), modelId };
        }
        catch (err) {
            lastError = toGeminiError(err);
            const msg = lastError.message.toLowerCase();
            if (msg.includes('api key') || msg.includes('permission') || msg.includes('403')) {
                throw lastError;
            }
        }
    }
    throw lastError !== null && lastError !== void 0 ? lastError : new Error('Gemini model call failed');
}
async function generateSessionSummary(transcript) {
    let lastError = null;
    for (const modelId of MODEL_CANDIDATES) {
        try {
            const model = getGeminiModel(modelId);
            const result = await model.generateContent(`다음 상담 대화를 3~5문장으로 요약하세요. 진단·처방은 하지 마세요.\n\n${transcript}`);
            return result.response.text();
        }
        catch (err) {
            lastError = toGeminiError(err);
        }
    }
    throw lastError !== null && lastError !== void 0 ? lastError : new Error('Gemini summary call failed');
}
//# sourceMappingURL=client.js.map