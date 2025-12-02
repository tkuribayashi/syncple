'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePair } from '@/hooks/usePair';
import { toast } from '@/components/ui/Toast';

export default function InvitePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const { createPair, joinPair } = usePair();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && userProfile?.pairId) {
      router.push('/');
    }
  }, [authLoading, userProfile, router]);

  const handleCreatePair = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await createPair();
      setGeneratedCode(result.inviteCode);
    } catch (err: any) {
      console.error('ペア作成エラー:', err);
      if (err.code === 'permission-denied') {
        setError('権限がありません。Firestoreルールをデプロイしてください。');
      } else {
        setError(`ペアの作成に失敗しました: ${err.message || err.code || '不明なエラー'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await joinPair(inviteCode.toUpperCase());
      router.push('/');
    } catch (err: any) {
      if (err.message.includes('Invalid')) {
        setError('無効な招待コードです');
      } else if (err.message.includes('expired')) {
        setError('招待コードの有効期限が切れています');
      } else if (err.message.includes('complete')) {
        setError('このペアは既に完成しています');
      } else {
        setError('ペアへの参加に失敗しました');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('招待コードをコピーしました');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ペア設定</h1>
            <p className="text-gray-600">パートナーとペアを作成しましょう</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ペアを作成
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'join'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ペアに参加
            </button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-6">
              {!generatedCode ? (
                <div>
                  <p className="text-gray-700 mb-4">
                    招待コードを生成して、パートナーに共有してください。
                  </p>
                  <button
                    onClick={handleCreatePair}
                    disabled={loading}
                    className="w-full btn btn-primary py-3 text-lg disabled:opacity-50"
                  >
                    {loading ? '作成中...' : '招待コードを生成'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                    <p className="text-sm text-gray-700 mb-2">招待コード</p>
                    <div className="text-4xl font-bold text-blue-600 text-center tracking-wider">
                      {generatedCode}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="w-full btn btn-secondary py-3 mb-2"
                  >
                    コードをコピー
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    このコードをパートナーに共有してください。
                    <br />
                    有効期限: 7日間
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full btn btn-primary py-3 mt-4"
                  >
                    ホームへ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleJoinPair} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                  招待コード
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="input text-center text-2xl tracking-wider font-mono"
                  placeholder="XXXXXX"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="w-full btn btn-primary py-3 text-lg disabled:opacity-50"
              >
                {loading ? '参加中...' : 'ペアに参加'}
              </button>
            </form>
          )}

          {error && mode === 'create' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
