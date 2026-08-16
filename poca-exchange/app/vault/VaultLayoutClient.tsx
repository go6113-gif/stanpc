'use client';

import { ReactNode, useState } from 'react';
import { useVaultSyncCheck, markVaultSyncChecked } from '@/hooks/useVaultSyncCheck';
import { VaultSyncReminderModal } from '@/components/vault/VaultSyncReminderModal';

interface VaultLayoutClientProps {
  children: ReactNode;
}

export function VaultLayoutClient({ children }: VaultLayoutClientProps) {
  const { showModal, wttWtsCards, lastSharedAt, hoursElapsed } = useVaultSyncCheck();
  const [isModalOpen, setIsModalOpen] = useState(showModal);

  const handleCloseModal = () => {
    markVaultSyncChecked();
    setIsModalOpen(false);
  };

  return (
    <>
      {children}
      <VaultSyncReminderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        wttWtsCards={wttWtsCards}
        lastSharedAt={lastSharedAt}
        hoursElapsed={hoursElapsed}
      />
    </>
  );
}
