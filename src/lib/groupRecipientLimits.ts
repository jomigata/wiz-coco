/** 그룹코드 일괄 발급 시 내담자 수 상한 (프론트·백엔드 동일) */
export const GROUP_RECIPIENT_MAX = 2000;

/** 이 인원 초과 시 서버가 비동기 job + 폴링으로 처리 */
export const GROUP_BULK_ASYNC_THRESHOLD = 50;

/** 이 인원 이상이면 예약 발송·CSV 우선 안내 */
export const GROUP_NOTIFY_WARN_THRESHOLD = 500;

export const GROUP_RECIPIENT_SAMPLE_CSV = '/samples/wizcoco-group-recipients-sample.csv';
export const GROUP_RECIPIENT_SAMPLE_TXT = '/samples/wizcoco-group-recipients-sample.txt';
