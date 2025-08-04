import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Server {
  id: string;
  name: string;
  hostname: string;
  status: string;
  lastUpdate: string;
}

interface ServerStatusProps {
  onServerSelect?: (server: Server) => void;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ onServerSelect }) => {
  const router = useRouter();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        // 로컬 스토리지에 저장된 서버 설정 확인
        const storedServers = localStorage.getItem('servers');
        
        if (storedServers) {
          setServers(JSON.parse(storedServers));
          setLoading(false);
          return;
        }
        
        // API 호출 (실제로는 서버에서 가져옴)
        // const response = await fetch('http://localhost:3001/servers');
        // if (!response.ok) {
        //   throw new Error('서버 정보를 가져오는데 실패했습니다.');
        // }
        // const data = await response.json();
        
        // API 연결 실패 시 기본 서버 정보 사용
        const defaultServers: Server[] = [
          {
            id: "main",
            name: "메인 서버",
            hostname: "localhost",
            status: "online",
            lastUpdate: new Date().toISOString()
          },
          {
            id: "backup",
            name: "백업 서버",
            hostname: window.location.hostname || "localhost",
            status: "online",
            lastUpdate: new Date().toISOString()
          },
          {
            id: "records",
            name: "검사 기록 서버",
            hostname: window.location.hostname || "localhost",
            status: "online",
            lastUpdate: new Date().toISOString()
          }
        ];
        
        setServers(defaultServers);
        // 로컬 스토리지에 저장
        localStorage.setItem('servers', JSON.stringify(defaultServers));
      } catch (err) {
        console.error('서버 정보 로드 오류:', err);
        setError('서버 정보를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
    
    // 30초마다 서버 상태 갱신
    const intervalId = setInterval(fetchServers, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleServerClick = (server: Server) => {
    if (onServerSelect) {
      onServerSelect(server);
    }
    
    // 서버 ID에 따라 다른 작업 수행
    if (server.id === 'records') {
      router.push('/mypage/test-records');
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-3">서버 상태</h3>
      <div className="space-y-3">
        {servers.map(server => (
          <div 
            key={server.id}
            className="bg-gray-700 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => handleServerClick(server)}
          >
            <div>
              <p className="text-white font-medium">{server.name}</p>
              <p className="text-sm text-gray-400">{server.hostname}</p>
            </div>
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${server.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`text-sm ${server.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {server.status === 'online' ? '온라인' : '오프라인'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerStatus; 