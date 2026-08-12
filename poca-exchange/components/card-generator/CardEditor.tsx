'use client';

import { useState } from 'react';

export interface CardData {
  memberName: string;
  title: string;
  stats: Record<string, string | number>;
  hashtags: string[];
}

interface CardEditorProps {
  cardData: CardData;
  onCardDataChange: (data: CardData) => void;
}

export default function CardEditor({ cardData, onCardDataChange }: CardEditorProps) {
  const [localStats, setLocalStats] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(cardData.stats).map(([k, v]) => [k, String(v)]))
  );
  const [statKey, setStatKey] = useState('');
  const [statValue, setStatValue] = useState('');

  const handleMemberNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCardDataChange({
      ...cardData,
      memberName: e.target.value,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCardDataChange({
      ...cardData,
      title: e.target.value,
    });
  };

  const handleStatChange = (key: string, value: string) => {
    const updatedStats = { ...localStats, [key]: value };
    setLocalStats(updatedStats);
    onCardDataChange({
      ...cardData,
      stats: Object.fromEntries(
        Object.entries(updatedStats).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
      ),
    });
  };

  const handleAddStat = () => {
    if (!statKey.trim() || !statValue.trim()) return;

    const updatedStats = { ...localStats, [statKey]: statValue };
    setLocalStats(updatedStats);
    onCardDataChange({
      ...cardData,
      stats: Object.fromEntries(
        Object.entries(updatedStats).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
      ),
    });
    setStatKey('');
    setStatValue('');
  };

  const handleRemoveStat = (key: string) => {
    const updatedStats = { ...localStats };
    delete updatedStats[key];
    setLocalStats(updatedStats);
    onCardDataChange({
      ...cardData,
      stats: Object.fromEntries(
        Object.entries(updatedStats).map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
      ),
    });
  };

  const handleHashtagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hashtags = e.target.value.split(/[\s,]+/).filter((tag) => tag.length > 0);
    onCardDataChange({
      ...cardData,
      hashtags,
    });
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-neutral-200 p-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">멤버명</label>
        <input
          type="text"
          value={cardData.memberName}
          onChange={handleMemberNameChange}
          placeholder="예: 르세라핌"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">타이틀</label>
        <input
          type="text"
          value={cardData.title}
          onChange={handleTitleChange}
          placeholder="예: 100% 컬렉션 완성!"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">통계 정보</label>

        {Object.entries(localStats).length > 0 && (
          <div className="grid gap-2 mb-4">
            {Object.entries(localStats).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 bg-neutral-50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-neutral-600">{key}</p>
                  <p className="font-medium">{value}</p>
                </div>
                <button
                  onClick={() => handleRemoveStat(key)}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  제거
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={statKey}
            onChange={(e) => setStatKey(e.target.value)}
            placeholder="이름 (예: 보유)"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <input
            type="text"
            value={statValue}
            onChange={(e) => setStatValue(e.target.value)}
            placeholder="값 (예: 50장)"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            onClick={handleAddStat}
            className="px-3 py-2 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
          >
            추가
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">해시태그</label>
        <input
          type="text"
          value={cardData.hashtags.join(' ')}
          onChange={handleHashtagsChange}
          placeholder="예: 포토카드 수집 K-pop (공백 또는 쉼표로 구분)"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <p className="text-xs text-neutral-500 mt-1">
          다운로드 시 자동으로 클립보드에 복사됩니다 ({cardData.hashtags.length}개)
        </p>
      </div>
    </div>
  );
}
