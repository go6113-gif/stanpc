"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  LogOut,
  BookMarked,
  Zap,
  Globe,
  Settings,
  MessageCircle,
  Crown
} from "lucide-react";
import { FakeDoorModal } from "@/components/fake-door-modal";

export function ProfileDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [fakeDoorOpen, setFakeDoorOpen] = useState(false);
  const [language, setLanguage] = useState<"ko" | "en" | "ja">("ko");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!session?.user) return null;

  const username = session.user.name ?? session.user.email ?? "user";
  const userImage = session.user.image;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          aria-label="프로필 메뉴"
        >
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={username}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-[#FF2A55] to-[#FF6B68]" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            {/* User Header */}
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userImage}
                    alt={username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF2A55] to-[#FF6B68]" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {username}
                  </p>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    실물 인증 배지 준비 중
                  </span>
                </div>
              </div>
            </div>

            {/* Pro 혜택 배너 */}
            <button
              type="button"
              onClick={() => {
                setFakeDoorOpen(true);
                setIsOpen(false);
              }}
              className="w-full border-b border-neutral-200 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-[#FF2A55]" />
                <span className="text-sm font-medium text-[#FF2A55]">
                  Pro 사전예약 혜택
                </span>
              </div>
            </button>

            {/* Main Menu Items */}
            <div className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-700">
              {/* My Vault */}
              <Link
                href={`/vault/${encodeURIComponent(username)}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <BookMarked size={16} className="text-neutral-600 dark:text-neutral-400" />
                <span className="text-neutral-900 dark:text-white">내 바인더 (My Vault)</span>
              </Link>

              {/* SNS 자랑 짤 만들기 */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Trigger image export modal
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Zap size={16} className="text-neutral-600 dark:text-neutral-400" />
                <span className="text-neutral-900 dark:text-white">SNS 자랑 짤 만들기</span>
              </button>
            </div>

            {/* Settings */}
            <div className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-700">
              {/* Language */}
              <div className="group relative">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Globe size={16} className="text-neutral-600 dark:text-neutral-400" />
                  <span className="flex-1 text-left text-neutral-900 dark:text-white">
                    언어 설정
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {language === "ko" ? "한국어" : language === "en" ? "English" : "日本語"}
                  </span>
                </button>
                <div className="absolute left-full top-0 ml-1 hidden min-w-max rounded-lg border border-neutral-200 bg-white shadow-lg group-hover:block dark:border-neutral-700 dark:bg-neutral-900">
                  {[
                    { code: "ko", label: "한국어" },
                    { code: "en", label: "English" },
                    { code: "ja", label: "日本語" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code as "ko" | "en" | "ja");
                        setIsOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  // TODO: Open settings dialog
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Settings size={16} className="text-neutral-600 dark:text-neutral-400" />
                <span className="text-neutral-900 dark:text-white">계정 설정</span>
              </button>
            </div>

            {/* Help & Feedback */}
            <div className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  // TODO: Open feedback modal
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <MessageCircle size={16} className="text-neutral-600 dark:text-neutral-400" />
                <span className="text-neutral-900 dark:text-white">피드백 보내기</span>
              </button>
            </div>

            {/* Logout */}
            <div className="px-2 py-2">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <FakeDoorModal
        open={fakeDoorOpen}
        source="profile_dropdown_pro"
        onClose={() => setFakeDoorOpen(false)}
      />
    </>
  );
}
