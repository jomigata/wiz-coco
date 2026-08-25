# 검사 채점: responses -> resultData
from data.mini_check import score_mini_check


def _score_generic_mini_check(responses: dict | list) -> dict:
    if not isinstance(responses, dict):
        return score_mini_check({})
    scored = score_mini_check(responses)
    band = scored.get("band") or "low"
    if band == "high":
        hook = "최근 스트레스·피로 신호가 많이 보입니다."
    elif band == "moderate":
        hook = "주의가 필요한 부분이 조금 보입니다."
    else:
        hook = "전반적으로 안정적인 편으로 보입니다."
    return {
        "testId": "generic",
        "kind": "mini_check",
        "band": band,
        "score": scored.get("score"),
        "maxScore": scored.get("maxScore"),
        "hookMessage": hook,
        "summary": hook,
        "counselorNote": "검사 매니저가 곧 확인해 드립니다.",
        "responseCount": len(responses),
    }


def compute_result_data(test_id: str, responses: dict | list) -> dict:
    """
    문항별 응답을 받아 resultData 생성.
    generic(3분 마음 체크)는 mini_check 채점을 사용한다.
    """
    tid = (test_id or "").strip()
    if tid == "generic":
        return _score_generic_mini_check(responses if isinstance(responses, (dict, list)) else {})

    if isinstance(responses, list):
        count = len(responses)
    elif isinstance(responses, dict):
        count = len(responses)
    else:
        count = 0
    return {
        "testId": tid,
        "summary": f"응답 {count}건 제출됨. 상세 해석은 검사 매니저와 논의하세요.",
        "responseCount": count,
    }
