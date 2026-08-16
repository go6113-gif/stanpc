"use client";

import { X, Upload, AlertCircle, Loader } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface SubmitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReleaseType = "ALBUM" | "POB" | "LUCKY_DRAW" | "BROADCAST" | "SEASON_GREETING" | "OTHER";

const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: "ALBUM", label: "앨범 동봉" },
  { value: "POB", label: "음반점 특전" },
  { value: "LUCKY_DRAW", label: "럭키드로우" },
  { value: "BROADCAST", label: "방송 출연 특전" },
  { value: "SEASON_GREETING", label: "시즈너 그리팅" },
  { value: "OTHER", label: "기타" },
];

const STORES = [
  "사운드웨이브",
  "메이크스타",
  "위버스",
  "인터파크",
  "교보문고",
  "예스24",
  "기타",
];

const GROUPS = [
  "뉴진스", "세븐틴", "스트레이 키즈", "에스파", "방탄소년단",
  "블랙핑크", "트와이스", "아이즈원", "레드벨벳", "싱글진",
];

export function SubmitCardModal({ isOpen, onClose }: SubmitCardModalProps) {
  const [step, setStep] = useState<"image" | "form">("image");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("ALBUM");
  const [sourceStore, setSourceStore] = useState("");
  const [versionOrRound, setVersionOrRound] = useState("");
  const [contributorHandle, setContributorHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploading(true);
    try {
      // Get presigned URL from existing API
      const presignedRes = await fetch("/api/proof/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: "contribution-temp",
          fileName: imageFile.name,
          contentType: imageFile.type,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error("Presigned URL 발급 실패");
      }

      const { presignedUrl, objectKey } = await presignedRes.json();

      // Upload directly to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!uploadRes.ok) {
        throw new Error("R2 업로드 실패");
      }

      // Construct R2 URL
      const r2Url = presignedUrl.split("?")[0];
      setUploadedImageUrl(r2Url);
      setStep("form");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupName || !memberName || !sourceStore || !versionOrRound) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistGroup: groupName,
          artistMember: memberName,
          releaseType,
          sourceStore,
          versionOrRound,
          imageUrl: uploadedImageUrl,
          contributorHandle,
          userId: null, // Guest submission
        }),
      });

      if (!res.ok) {
        throw new Error("제보 제출 실패");
      }

      const data = await res.json();
      alert(data.message || "감사합니다! 제보가 접수되었습니다.");
      onClose();
      // Reset form
      setStep("image");
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);
      setGroupName("");
      setMemberName("");
      setContributorHandle("");
    } catch (error) {
      console.error("Submit failed:", error);
      alert("제보 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-4">
      {/* Modal Container */}
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1A1A1E] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#1A1A1E]/95 backdrop-blur">
          <h2 className="text-lg font-bold text-white">
            {step === "image" ? "포카 사진 업로드" : "카드 정보 입력"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {step === "image" && (
            <>
              {/* Image Upload Zone */}
              <div className="rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-8 text-center hover:border-[#FF2A55]/40 hover:bg-[#FF2A55]/5 transition-all">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                    <label className="text-xs text-white/60 cursor-pointer hover:text-white transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      다른 사진 선택
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="space-y-2">
                      <Upload className="mx-auto text-white/60" size={28} />
                      <p className="text-sm font-medium text-white">
                        사진을 드래그하거나 클릭
                      </p>
                      <p className="text-xs text-white/50">
                        포카 전체가 보이도록 촬영해주세요
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Tips */}
              <div className="space-y-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs font-semibold text-blue-400 mb-2">
                  💡 팁
                </p>
                <ul className="space-y-1 text-xs text-blue-300/80">
                  <li>• 포카 전체가 선명하게 보이도록</li>
                  <li>• 밝은 환경에서 촬영</li>
                  <li>• JPG, PNG 파일 지원 (최대 10MB)</li>
                </ul>
              </div>
            </>
          )}

          {step === "form" && (
            <>
              {/* Uploaded Image Preview */}
              {imagePreview && (
                <div className="flex gap-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="h-24 w-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-white/60 mb-1">업로드됨</p>
                    <p className="text-sm text-white/80 line-clamp-2">
                      {imageFile?.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Group & Member */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">
                  그룹명
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="예: 뉴진스"
                  list="groups-list"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                />
                <datalist id="groups-list">
                  {GROUPS.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">
                  멤버명
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="예: 해린"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                />
              </div>

              {/* Release Type & Store */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80">
                    발매 구분
                  </label>
                  <select
                    value={releaseType}
                    onChange={(e) =>
                      setReleaseType(e.target.value as ReleaseType)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FF2A55] focus:outline-none"
                  >
                    {RELEASE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80">
                    판매처/특전사
                  </label>
                  <select
                    value={sourceStore}
                    onChange={(e) => setSourceStore(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FF2A55] focus:outline-none"
                  >
                    <option value="">선택해주세요</option>
                    {STORES.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Version/Round */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">
                  차수/버전
                </label>
                <input
                  type="text"
                  value={versionOrRound}
                  onChange={(e) => setVersionOrRound(e.target.value)}
                  placeholder="예: 1차, 럭키드로우 Ver.A"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                />
              </div>

              {/* Contributor Handle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/80">
                  제보자 닉네임/계정 (선택)
                </label>
                <input
                  type="text"
                  value={contributorHandle}
                  onChange={(e) => setContributorHandle(e.target.value)}
                  placeholder="예: @kpop_stan 또는 닉네임"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#FF2A55] focus:outline-none"
                />
                <p className="text-xs text-white/50">
                  채택 시 "Verified by @닉네임"으로 표시됩니다
                </p>
              </div>

              {/* Info Box */}
              <div className="flex gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <AlertCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-300/80">
                  감사합니다! 검증 후 도감에 정식 등재됩니다.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-2 border-t border-white/10 px-5 py-4 bg-[#1A1A1E]/95 backdrop-blur">
          {step === "form" && (
            <button
              onClick={() => setStep("image")}
              className="flex-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors py-2.5 text-sm font-semibold text-white"
            >
              이전
            </button>
          )}

          <button
            onClick={step === "image" ? handleImageUpload : handleSubmit}
            disabled={
              (step === "image" && (!imageFile || uploading)) ||
              (step === "form" && submitting)
            }
            className="flex-1 rounded-lg bg-[#FF2A55] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
          >
            {uploading || submitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                {step === "image" ? "업로드 중..." : "제출 중..."}
              </>
            ) : step === "image" ? (
              "다음"
            ) : (
              "제보하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
