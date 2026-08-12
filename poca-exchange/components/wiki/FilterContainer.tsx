'use client';

import { useState } from 'react';
import CardConditionFilter, { type CardCondition } from './CardConditionFilter';
import VaultStatusFilter, { type VaultStatus } from './VaultStatusFilter';

interface FilterContainerProps {
  onFiltersChange?: (filters: FilterState) => void;
  compact?: boolean;
}

export interface FilterState {
  condition: CardCondition;
  vaultStatus: VaultStatus;
}

export default function FilterContainer({ onFiltersChange, compact = false }: FilterContainerProps) {
  const [filters, setFilters] = useState<FilterState>({
    condition: 'all',
    vaultStatus: 'all',
  });

  const handleConditionChange = (condition: CardCondition) => {
    const newFilters = { ...filters, condition };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleVaultStatusChange = (vaultStatus: VaultStatus) => {
    const newFilters = { ...filters, vaultStatus };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className={`space-y-4 ${compact ? 'space-y-2' : ''}`}>
      <CardConditionFilter value={filters.condition} onChange={handleConditionChange} />
      <VaultStatusFilter value={filters.vaultStatus} onChange={handleVaultStatusChange} />

      {/* 필터 상태 표시 (선택사항) */}
      {(filters.condition !== 'all' || filters.vaultStatus !== 'all') && (
        <div className="text-xs text-neutral-500 px-4 py-2">
          {filters.condition !== 'all' && <span>등급 필터: 활성화 </span>}
          {filters.vaultStatus !== 'all' && <span>보관 상태 필터: 활성화</span>}
        </div>
      )}
    </div>
  );
}
