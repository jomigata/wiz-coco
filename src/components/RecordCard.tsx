import React from 'react';

interface RecordCardProps {
  title: string;
  date: string;
  status: string;
  onClick?: () => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ title, date, status, onClick }) => {
  const statusColor = {
    '완료': 'text-green-600',
    '진행중': 'text-blue-600',
    '대기중': 'text-yellow-600',
    '실패': 'text-red-600',
  }[status] || 'text-gray-600';

  return (
    <div 
      className="bg-white shadow-md rounded-lg p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-500 text-sm">{date}</p>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusColor} bg-opacity-10 text-sm font-medium`}>
          {status}
        </div>
      </div>
    </div>
  );
};

export default RecordCard; 