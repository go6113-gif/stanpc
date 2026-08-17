'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface CreatableTagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  availableTags?: string[];
  maxTags?: number;
  disabled?: boolean;
}

/**
 * Creatable Tag Input — Multi-select with autocomplete & free-text tag creation
 *
 * Users can:
 * - Type to filter existing tags (#메이크스타, #갈망포카)
 * - Press Enter/Tab/Comma to create new tags
 * - Click or keyboard to remove tags
 * - See suggestions from DB or create new ones on the fly
 */
export function CreatableTagInput({
  tags,
  onTagsChange,
  placeholder = "태그 입력 또는 생성... (예: #메이크스타, #갈망포카)",
  availableTags = [],
  maxTags = 20,
  disabled = false,
}: CreatableTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions(availableTags.filter((tag) => !tags.includes(tag)));
      return;
    }

    const query = inputValue.toLowerCase();
    const filtered = availableTags
      .filter(
        (tag) =>
          tag.toLowerCase().includes(query) && !tags.includes(tag)
      )
      .slice(0, 8);

    // If input doesn't match any existing tag, offer to create new one
    if (
      !availableTags.some((tag) => tag.toLowerCase() === query) &&
      inputValue.length > 0
    ) {
      filtered.unshift(`${inputValue.startsWith('#') ? inputValue : `#${inputValue}`}`);
    }

    setSuggestions(filtered);
    setSelectedSuggestionIndex(0);
  }, [inputValue, availableTags, tags]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    if (!tags.includes(normalized) && tags.length < maxTags) {
      onTagsChange([...tags, normalized]);
      setInputValue('');
      setSuggestions(availableTags.filter((t) => !tags.includes(t) && t !== normalized));
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case 'Tab':
      case ',':
        e.preventDefault();
        if (suggestions.length > 0 && selectedSuggestionIndex >= 0) {
          handleAddTag(suggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          handleAddTag(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((i) =>
          i < suggestions.length - 1 ? i + 1 : 0
        );
        setIsOpen(true);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((i) =>
          i > 0 ? i - 1 : suggestions.length - 1
        );
        break;

      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          handleRemoveTag(tags[tags.length - 1]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Tag Display & Input Container */}
      <div
        className={`
          w-full flex flex-wrap items-center gap-2 px-3 py-2
          border border-neutral-300 dark:border-neutral-600
          rounded-lg bg-white dark:bg-neutral-900
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Rendered Tags */}
        {tags.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              disabled={disabled}
              className="hover:text-blue-600 dark:hover:text-blue-200 transition"
              aria-label={`Remove ${tag}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 min-w-[120px] outline-none bg-transparent
            text-neutral-900 dark:text-white
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />

        {/* Dropdown Icon */}
        {suggestions.length > 0 && (
          <ChevronDown
            size={18}
            className={`
              text-neutral-400 transition-transform
              ${isOpen ? 'rotate-180' : ''}
            `}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg">
          {suggestions.map((suggestion, idx) => (
            <button
              key={`${suggestion}-${idx}`}
              onClick={() => handleAddTag(suggestion)}
              className={`
                w-full text-left px-3 py-2 transition-colors
                ${
                  idx === selectedSuggestionIndex
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white'
                }
                ${idx < suggestions.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}
              `}
            >
              <span className="text-sm font-medium">{suggestion}</span>
              {!availableTags.includes(suggestion) && (
                <span className="text-xs ml-2 opacity-70">(신규)</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Character & Tag Count */}
      {tags.length > 0 && (
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {tags.length} / {maxTags} 태그
        </div>
      )}
    </div>
  );
}
