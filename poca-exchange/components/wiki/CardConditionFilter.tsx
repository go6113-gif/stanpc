'use client';

import { useState } from 'react';

export type CardCondition = 'all' | 'sealed' | 'nm' | 'lp' | 'mp-hp';

interface CardConditionFilterProps {
  value?: CardCondition;
  onChange?: (condition: CardCondition) => void;
}

const CONDITIONS = [
  { id: 'all', label: '전체', term: '' },
  { id: 'sealed', label: '미개봉', term: 'Sealed' },
  { id: 'nm', label: '근민트', term: 'NM / 하자 없음' },
  { id: 'lp', label: '경미한 하자', term: 'LP / 공장 하자' },
  { id: 'mp-hp', label: '중/심각한 하자', term: 'MP/HP' },
] as const;

export default function CardConditionFilter({ value = 'all', onChange }: CardConditionFilterProps) {
  const [selected, setSelected] = useState<CardCondition>(value);

  const handleSelect = (id: CardCondition) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <div className="filter-group">
      <label className="filter-group-label">카드 등급</label>
      <div className="filter-group-items">
        {CONDITIONS.map((condition) => (
          <button
            key={condition.id}
            onClick={() => handleSelect(condition.id as CardCondition)}
            className={`filter-pill ${selected === condition.id ? 'active' : ''}`}
          >
            <span className="filter-label-ko">{condition.label}</span>
            {condition.term && (
              <>
                <span className="mx-1">·</span>
                <span className="filter-term-en">{condition.term}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
