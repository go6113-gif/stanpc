'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: CardEditData) => void;
  initialData?: CardEditData;
  cardName?: string;
}

export interface CardEditData {
  tags: string[];
  groupName?: string;
  memberName?: string;
  notes?: string;
}

export function CardEditModal({
  isOpen,
  onClose,
  onSave,
  initialData = { tags: [] },
  cardName = '',
}: CardEditModalProps) {
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [newTag, setNewTag] = useState('');
  const [groupName, setGroupName] = useState(initialData.groupName || '');
  const [memberName, setMemberName] = useState(initialData.memberName || '');
  const [notes, setNotes] = useState(initialData.notes || '');

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        tags,
        groupName,
        memberName,
        notes,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="border-b border-white/10 bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">카드 정보 수정</h2>
                <p className="text-sm text-white/60 mt-1">{cardName}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-white/10 transition-colors text-white/60"
              >
                <X size={20} />
              </button>
            </div>

            {/* 콘텐츠 */}
            <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 그룹명 */}
              <div>
                <label className="text-sm font-semibold text-white/80 block mb-2">
                  그룹명
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="예: SEVENTEEN"
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-pink-500 focus:bg-white/10 outline-none transition-all"
                />
              </div>

              {/* 멤버명 */}
              <div>
                <label className="text-sm font-semibold text-white/80 block mb-2">
                  멤버명
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="예: 승관"
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-pink-500 focus:bg-white/10 outline-none transition-all"
                />
              </div>

              {/* 해시태그 */}
              <div>
                <label className="text-sm font-semibold text-white/80 block mb-2">
                  해시태그
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="태그 입력 (엔터로 추가)"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-pink-500 focus:bg-white/10 outline-none transition-all text-sm"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    추가
                  </button>
                </div>

                {/* 태그 목록 */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2A55]/20 text-[#FF2A55] text-sm font-medium"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-[#FF2A55]/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* 메모 */}
              <div>
                <label className="text-sm font-semibold text-white/80 block mb-2">
                  메모
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="카드에 대한 메모를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-pink-500 focus:bg-white/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="border-t border-white/10 bg-white/5 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium transition-colors text-sm"
              >
                저장
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
