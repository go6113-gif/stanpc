'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useBinderStore } from '@/store/useBinderStore';

interface VaultSyncState {
  showModal: boolean;
  wttWtsCards: any[];
  lastSharedAt: Date | null;
  hoursElapsed: number;
}

const VAULT_SYNC_STORAGE_KEY = 'vault-sync-last-checked';
const VAULT_SYNC_HOURS_THRESHOLD = 24;
const VAULT_SYNC_DISMISS_HOURS = 24;

/**
 * 바인더 동기화 체크 훅
 *
 * 다음 조건에서 모달 표시:
 * 1. 사용자가 로그인한 상태
 * 2. 공유 후 24시간 이상 경과 OR 확인되지 않은 거래용 카드 존재
 * 3. 오늘 이미 확인했으면 표시하지 않음
 */
export function useVaultSyncCheck(): VaultSyncState {
  const { data: session } = useSession();
  const wttCards = useBinderStore((state) => state.wttCards);
  const wtsCards = useBinderStore((state) => state.wtsCards);

  const [showModal, setShowModal] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState<Date | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(0);

  useEffect(() => {
    // 로그인하지 않았으면 체크하지 않음
    if (!session?.user?.id) {
      setShowModal(false);
      return;
    }

    // 오늘 이미 확인했는지 체크
    const lastChecked = localStorage.getItem(VAULT_SYNC_STORAGE_KEY);
    if (lastChecked) {
      const lastCheckedTime = new Date(lastChecked);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastCheckedTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < VAULT_SYNC_DISMISS_HOURS) {
        // 24시간 이내에 확인했으면 다시 표시하지 않음
        setShowModal(false);
        return;
      }
    }

    // 거래용 카드(WTT/WTS) 존재 확인
    const hasTradeCards = wttCards.length > 0 || wtsCards.length > 0;

    // 마지막 공유 시간 체크 (로컬 스토리지에서 읽기)
    const sharedTimeStr = localStorage.getItem('last-shared-at');
    const shared = sharedTimeStr ? new Date(sharedTimeStr) : null;

    if (shared) {
      const now = new Date();
      const hours = (now.getTime() - shared.getTime()) / (1000 * 60 * 60);
      setHoursElapsed(Math.floor(hours));

      // 24시간 이상 지났거나 거래 카드가 있으면 모달 표시
      if (hours >= VAULT_SYNC_HOURS_THRESHOLD || hasTradeCards) {
        setShowModal(true);
        setLastSharedAt(shared);
      } else {
        setShowModal(false);
      }
    } else if (hasTradeCards) {
      // 공유 기록은 없지만 거래 카드가 있으면 체크 권장
      setShowModal(true);
      setLastSharedAt(null);
    } else {
      setShowModal(false);
    }
  }, [session?.user?.id, wttCards.length, wtsCards.length]);

  return {
    showModal,
    wttWtsCards: [...wttCards, ...wtsCards],
    lastSharedAt,
    hoursElapsed,
  };
}

/**
 * 바인더 동기화 확인 완료 처리
 */
export function markVaultSyncChecked(): void {
  const now = new Date().toISOString();
  localStorage.setItem(VAULT_SYNC_STORAGE_KEY, now);
}
