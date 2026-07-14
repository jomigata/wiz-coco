'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { createDeveloperApiKey, listDeveloperApiKeys } from '@/lib/b2cApi';

export default function AdminDeveloperPage() {
  const [name, setName] = useState('whitelabel-partner');
  const [createdKey, setCreatedKey] = useState('');
  const [keys, setKeys] = useState<{ id: string; name?: string; keyPrefix?: string; status?: string }[]>(
    [],
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = () => {
    listDeveloperApiKeys()
      .then(setKeys)
      .catch((err) => setError(err instanceof Error ? err.message : '목록 실패'));
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCreatedKey('');
    try {
      const result = await createDeveloperApiKey(name.trim() || 'integration');
      setCreatedKey(result.apiKey);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <main className="container py-10 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Developer · API 키</h1>
        <p className="text-slate-400 text-sm mb-8">
          화이트라벨 연동용 공개 API 키.{' '}
          <code className="text-violet-300">GET /api/v1/public/catalog</code> — 헤더{' '}
          <code className="text-violet-300">X-Api-Key</code>
        </p>

        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 p-6 mb-8 bg-slate-900/50">
          <label className="block text-sm text-slate-300 mb-2">키 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-slate-200 text-white mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            API 키 생성
          </button>
        </form>

        {createdKey && (
          <div className="mb-6 p-4 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-100 text-sm break-all">
            <strong>한 번만 표시됩니다:</strong>
            <br />
            {createdKey}
          </div>
        )}
        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

        <ul className="space-y-2">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex justify-between items-center px-4 py-3 rounded-lg border border-slate-200 text-sm text-slate-300"
            >
              <span>{k.name || k.id}</span>
              <span className="font-mono text-xs">{k.keyPrefix}…</span>
            </li>
          ))}
        </ul>
      </main>
    </RoleGuard>
  );
}
