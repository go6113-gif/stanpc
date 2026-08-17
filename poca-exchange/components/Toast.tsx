'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  show: boolean;
  duration?: number;
  type?: 'default' | 'success' | 'error' | 'info';
}

export function Toast({ message, show, duration = 3000, type = 'default' }: ToastProps) {
  const bgColors = {
    default: 'bg-neutral-900 dark:bg-neutral-100',
    success: 'bg-green-600 dark:bg-green-500',
    error: 'bg-red-600 dark:bg-red-500',
    info: 'bg-blue-600 dark:bg-blue-500',
  };

  const textColors = {
    default: 'text-white dark:text-neutral-900',
    success: 'text-white',
    error: 'text-white',
    info: 'text-white',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg font-medium text-sm z-40 ${bgColors[type]} ${textColors[type]} shadow-lg`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
