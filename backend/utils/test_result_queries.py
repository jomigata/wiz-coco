"""testResults Firestore 조회 헬퍼."""
from config import TEST_RESULTS_COLLECTION


def query_results_shared_to_assessment(db, assessment_id: str) -> list:
    """sharedToAssessmentIds 에 assessment_id 가 포함된 결과. 인덱스·필드 오류 시 빈 목록."""
    aid = (assessment_id or "").strip()
    if not aid:
        return []
    try:
        return list(
            db.collection(TEST_RESULTS_COLLECTION)
            .where("sharedToAssessmentIds", "array-contains", aid)
            .stream()
        )
    except Exception:
        return []
