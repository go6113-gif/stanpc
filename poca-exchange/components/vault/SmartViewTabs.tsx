"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useVaultFilterStore, type SavedView } from "@/store/useVaultFilterStore";

export interface SmartViewTabsProps {
  onCreateView?: (name: string) => void;
  onDeleteView?: (id: string) => void;
  onSelectView?: (id: string | null) => void;
}

export function SmartViewTabs({
  onCreateView,
  onDeleteView,
  onSelectView,
}: SmartViewTabsProps) {
  const { savedViews, activeViewId, loadView, deleteView, saveCurrentView } =
    useVaultFilterStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    if (newViewName.trim()) {
      saveCurrentView(newViewName);
      onCreateView?.(newViewName);
      setNewViewName("");
      setShowCreateModal(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteView(id);
    onDeleteView?.(id);
    setShowDeleteConfirm(null);
  };

  const handleSelectView = (id: string) => {
    loadView(id);
    onSelectView?.(id);
  };

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("smart-tabs-container");
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 커스텀 뷰만 필터링 (프리셋 제외)
  const customViews = savedViews.filter(
    (v) => !["view-all", "view-wtt", "view-wts"].includes(v.id)
  );

  return (
    <div className="space-y-3 mb-6">
      {/* 타이틀 */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
          📌 스마트 뷰
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          title="새 스마트 뷰 저장"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 탭 스크롤 컨테이너 */}
      <div className="relative">
        {/* 좌측 스크롤 버튼 */}
        <button
          onClick={() => scrollContainer("left")}
          className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white hidden lg:block"
        >
          <ChevronLeft size={18} />
        </button>

        {/* 탭 목록 */}
        <div
          id="smart-tabs-container"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {/* 프리셋 탭 */}
          {savedViews
            .filter((v) => ["view-all", "view-wtt", "view-wts"].includes(v.id))
            .map((view) => (
              <motion.button
                key={view.id}
                onClick={() => handleSelectView(view.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold whitespace-nowrap ${
                  activeViewId === view.id
                    ? "border-pink-500 bg-pink-500/10 text-pink-300"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                }`}
              >
                {view.name}
              </motion.button>
            ))}

          {/* 저장된 커스텀 뷰 탭 */}
          {customViews.map((view) => (
            <div key={view.id} className="relative group">
              <motion.button
                onClick={() => handleSelectView(view.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all text-sm font-semibold whitespace-nowrap ${
                  activeViewId === view.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40"
                }`}
              >
                ⭐ {view.name}
              </motion.button>

              {/* 삭제 버튼 (호버 시 표시) */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                onClick={() => setShowDeleteConfirm(view.id)}
                className="absolute -right-2 -top-2 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors hidden group-hover:block"
                title="삭제"
              >
                <Trash2 size={12} />
              </motion.button>

              {/* 삭제 확인 팝오버 */}
              {showDeleteConfirm === view.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 rounded-lg p-2 whitespace-nowrap text-xs flex gap-2"
                >
                  <button
                    onClick={() => handleDelete(view.id)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                  >
                    취소
                  </button>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* 우측 스크롤 버튼 */}
        <button
          onClick={() => scrollContainer("right")}
          className="absolute -right-10 top-1/2 -translate-y-1/2 z-10 p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white hidden lg:block"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 스마트 뷰 생성 모달 */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-white/10 rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">스마트 뷰 저장</h3>
            <input
              type="text"
              placeholder="예: 카리나 하자/급처"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-pink-500 focus:bg-white/10 outline-none transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newViewName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 font-semibold transition-colors"
              >
                취소
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
