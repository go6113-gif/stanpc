'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface WikiPageWrapperProps {
  children: ReactNode;
}

export default function WikiPageWrapper({ children }: WikiPageWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
