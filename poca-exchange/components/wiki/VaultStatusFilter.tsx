'use client';

import { useState } from 'react';

export type VaultStatus = 'all' | 'owned' | 'iso' | 'trade' | 'wishlist';

interface VaultStatusFilterProps {
  value?: VaultStatus;
  onChange?: (status: VaultStatus) => void;
}

const STATUSES = [
  { id: 'all', label: '전체', term: '' },
  { id: 'owned', label: '내 보유 카드', term: 'In Vault' },
  { id: 'iso', label: '구하는 카드', term: 'ISO' },
  { id: 'trade', label: '교환 가능', term: 'For Trade' },
  { id: 'wishlist', label: '위시리스트', term: 'Wishlist' },
] as const;

export default function VaultStatusFilter({ value = 'all', onChange }: VaultStatusFilterProps) {
  const [selected, setSelected] = useState<VaultStatus>(value);

  const handleSelect = (id: VaultStatus) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <div className="filter-group">
      <label className="filter-group-label">보관 상태</label>
      <div className="filter-group-items">
        {STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => handleSelect(status.id as VaultStatus)}
            className={`filter-pill ${selected === status.id ? 'active' : ''}`}
          >
            <span className="filter-label-ko">{status.label}</span>
            {status.term && (
              <>
                <span className="mx-1">·</span>
                <span className="filter-term-en">{status.term}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
