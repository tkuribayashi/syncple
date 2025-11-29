'use client';

import { useDinnerStatus } from '@/hooks/useDinnerStatus';
import { useDinnerStatusOptions } from '@/hooks/useDinnerStatusOptions';
import { DinnerStatusType } from '@/types';
import { usePair } from '@/hooks/usePair';

interface DinnerStatusCardProps {
  pairId: string | null;
}

export default function DinnerStatusCard({ pairId }: DinnerStatusCardProps) {
  const { myStatus, partnerStatus, loading, updateStatus } = useDinnerStatus(pairId);
  const { statuses, loading: loadingStatuses } = useDinnerStatusOptions(pairId);
  const { partner } = usePair();

  if (loading || loadingStatuses) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold mb-4">今日の晩ご飯</h2>
        <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">今日の晩ご飯</h2>

      {/* 自分のステータス */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">あなた</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(statuses) as DinnerStatusType[]).map((status) => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                myStatus?.status === status
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {statuses[status]}
              {myStatus?.status === status && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* パートナーのステータス */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          {partner?.displayName || 'パートナー'}
        </p>
        {partnerStatus ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <span className="text-lg font-semibold text-purple-900">
              {statuses[partnerStatus.status]}
            </span>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <span className="text-sm text-gray-500">まだ選択していません</span>
          </div>
        )}
      </div>
    </div>
  );
}
