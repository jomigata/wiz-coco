/**
 * 날짜 문자열을 사용자 친화적인 형식으로 변환
 * @param dateString ISO 형식의 날짜 문자열 (예: 2023-10-15T09:30:22.000Z)
 * @returns 사용자 친화적인 형식의 날짜 문자열 (예: 2023년 10월 15일 18:30)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }
  
  // 한국 시간대로 변환 (UTC+9)
  const koreanDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  
  const year = koreanDate.getUTCFullYear();
  const month = String(koreanDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreanDate.getUTCDate()).padStart(2, '0');
  const hours = String(koreanDate.getUTCHours()).padStart(2, '0');
  const minutes = String(koreanDate.getUTCMinutes()).padStart(2, '0');
  
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

/**
 * 날짜를 상대적인 시간으로 변환 (예: "3일 전", "방금 전")
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 상대적인 시간 문자열
 */
export function getRelativeTime(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // 1분 미만
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  // 1시간 미만
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  // 1일 미만
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  // 30일 미만
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  // 12개월 미만
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  // 12개월 이상
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 * @param dateString ISO 형식의 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatDateYYYYMMDD(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
} 