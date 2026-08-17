'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface CreatableTagSelectProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  mode?: 'custom' | 'system'; // 'custom': 자유 텍스트, 'system': 자동완성
  suggestions?: string[]; // system 모드일 때 자동완성 옵션
}

export function CreatableTagSelect({
  tags,
  onChange,
  placeholder = '태그를 입력하세요 (#태그이름 형식)',
  mode = 'custom',
  suggestions = [],
}: CreatableTagSelectProps) {
  const [input, setInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);

    if (mode === 'system' && value.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [mode, suggestions]);

  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim()) return;

    const newTag = mode === 'custom' ? tag.trim() : tag;
    if (!tags.includes(newTag)) {
      onChange([...tags, newTag]);
    }
    setInput('');
    setShowSuggestions(false);
  }, [tags, onChange, mode]);

  const handleRemoveTag = useCallback((tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && mode === 'system') {
        handleAddTag(filteredSuggestions[0]);
      } else {
        handleAddTag(input);
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full">
      <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 bg-white dark:bg-neutral-800">
        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-80 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (mode === 'system' && input.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            className="w-full outline-none bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-500"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && mode === 'system' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-10">
              {filteredSuggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAddTag(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        {mode === 'custom' ? (
          <>원하는 태그를 입력하고 Enter를 누르세요. 예: #메이크스타, #갈망포카</>
        ) : (
          <>자동완성된 항목을 선택하거나 직접 입력할 수 있습니다</>
        )}
      </p>
    </div>
  );
}
