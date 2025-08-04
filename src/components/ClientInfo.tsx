import { useState } from 'react';

export interface ClientInfoData {
  name?: string;
  birthYear?: string | number;
  gender?: string;
  testDate?: string;
}

export default function ClientInfo({
  client,
  onSave,
  isNew = false,
  showTestDate = true,
  readOnly = false
}: {
  client: ClientInfoData;
  onSave: (data: ClientInfoData) => void;
  isNew?: boolean;
  showTestDate?: boolean;
  readOnly?: boolean;
}) {
  const [name, setName] = useState(client.name || '');
  const [birthYear, setBirthYear] = useState(client.birthYear?.toString() || '');
  const [gender, setGender] = useState(client.gender || '');
  const [testDate, setTestDate] = useState(client.testDate || new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    onSave({
      name,
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      gender,
      testDate
    });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={readOnly}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          placeholder="이름 입력"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">생년</label>
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          disabled={readOnly}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          placeholder="출생 연도 (예: 1990)"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">성별</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          disabled={readOnly}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="">선택하세요</option>
          <option value="남성">남성</option>
          <option value="여성">여성</option>
        </select>
      </div>
      
      {showTestDate && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">검사일</label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            disabled={readOnly}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          />
        </div>
      )}
      
      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
          >
            {isNew ? '추가' : '저장'}
          </button>
        </div>
      )}
    </div>
  );
} 