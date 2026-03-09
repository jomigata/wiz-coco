# 검사 채점 스텁: responses -> resultData (실제 검사별 로직은 추후 확장)
def compute_result_data(test_id: str, responses: dict | list) -> dict:
    """
    문항별 응답을 받아 resultData 생성.
    현재는 요약 수준만 반환하며, 검사별 채점은 프론트/별도 모듈로 확장 가능.
    """
    if isinstance(responses, list):
        count = len(responses)
    elif isinstance(responses, dict):
        count = len(responses)
    else:
        count = 0
    return {
        "testId": test_id,
        "summary": f"응답 {count}건 제출됨. 상세 해석은 상담사와 논의하세요.",
        "responseCount": count,
    }
