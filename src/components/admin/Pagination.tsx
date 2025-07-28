import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // 전체 페이지가 5개 이하면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변의 페이지만 표시
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      // 시작 페이지 조정
      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // 처음과 마지막 페이지 표시를 위한 처리
      if (startPage > 1) {
        pages.unshift(1);
        if (startPage > 2) {
          pages.splice(1, 0, -1); // -1은 줄임표 표시용
        }
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(-2); // -2는 줄임표 표시용
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  // 페이지가 1개 이하면 페이지네이션 표시하지 않음
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center mt-6">
      <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-l-md text-sm font-medium ${
            currentPage === 1
              ? 'bg-white/5 text-gray-400 cursor-not-allowed'
              : 'bg-white/10 text-blue-200 hover:bg-blue-600/30 focus:z-10 focus:outline-none'
          }`}
        >
          <span className="sr-only">이전</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* 페이지 버튼 */}
        {pageNumbers.map((page, index) => {
          // 줄임표 표시
          if (page === -1 || page === -2) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 bg-white/5 text-gray-400"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-4 py-2 text-sm font-medium ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-blue-200 hover:bg-blue-600/30 focus:z-10 focus:outline-none'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-r-md text-sm font-medium ${
            currentPage === totalPages
              ? 'bg-white/5 text-gray-400 cursor-not-allowed'
              : 'bg-white/10 text-blue-200 hover:bg-blue-600/30 focus:z-10 focus:outline-none'
          }`}
        >
          <span className="sr-only">다음</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Pagination; 