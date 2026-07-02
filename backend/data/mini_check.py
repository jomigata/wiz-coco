# Freemium 미니 검사 문항 (서버·클라이언트 동기화)
MINI_CHECK_QUESTIONS = [
    {
        "id": "m1",
        "text": "최근 2주간 평소보다 피로감을 많이 느꼈다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
    {
        "id": "m2",
        "text": "일상에서 집중하기 어려웠다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
    {
        "id": "m3",
        "text": "걱정이나 불안이 부담스러웠다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
    {
        "id": "m4",
        "text": "수면의 질이 좋지 않았다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
    {
        "id": "m5",
        "text": "대인관계에서 에너지가 소진되었다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
    {
        "id": "m6",
        "text": "스스로를 통제하기 어려웠다.",
        "choices": [
            {"value": 0, "label": "전혀 아니다"},
            {"value": 1, "label": "가끔"},
            {"value": 2, "label": "자주"},
            {"value": 3, "label": "거의 항상"},
        ],
    },
]

MAX_SCORE = len(MINI_CHECK_QUESTIONS) * 3


def score_mini_check(answers: dict) -> dict:
    """answers: { questionId: 0-3 } — PII 없음."""
    total = 0
    for q in MINI_CHECK_QUESTIONS:
        qid = q["id"]
        try:
            val = int(answers.get(qid, 0))
        except (TypeError, ValueError):
            val = 0
        val = max(0, min(3, val))
        total += val

    ratio = total / MAX_SCORE if MAX_SCORE else 0
    if ratio >= 0.72:
        band = "high"
        hook = "스트레스·정서 부담이 상위 20% 수준으로 보입니다."
        summary = "전문 심층 리포트에서 원인·대처 전략을 확인해 보세요."
    elif ratio >= 0.45:
        band = "moderate"
        hook = "주의가 필요한 신호가 일부 보입니다."
        summary = "Premium 리포트로 패턴과 맞춤 제안을 받을 수 있습니다."
    else:
        band = "low"
        hook = "전반적으로 안정적인 편입니다."
        summary = "Basic 리포트로 현재 상태를 더 구체적으로 정리해 보세요."

    return {
        "score": total,
        "maxScore": MAX_SCORE,
        "band": band,
        "hookMessage": hook,
        "summary": summary,
        "disclaimer": "본 미니 검사는 참고용이며 진단이 아닙니다.",
        "recommendedTier": "premium" if band == "high" else "basic" if band == "moderate" else "basic",
    }
