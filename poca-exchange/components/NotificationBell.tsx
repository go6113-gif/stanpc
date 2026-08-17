'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(
            data.notifications?.filter(
              (n: Notification) => !n.isRead
            ).length || 0
          );
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION_APPROVED':
        return '📸';
      case 'PRICE_MATCH_ALERT':
        return '💰';
      case 'TRADE_OFFER':
        return '🤝';
      case 'HOF_EXPOSURE':
        return '🏆';
      default:
        return '🔔';
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        title="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-bold text-neutral-900 dark:text-white">알림</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                로드 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                새로운 알림이 없습니다
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                      notif.isRead ? '' : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={notif.linkUrl || '#'}
                        className="flex-1 min-w-0"
                        onClick={() => {
                          if (!notif.isRead) {
                            markAsRead(notif.id);
                          }
                        }}
                      >
                        <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white mb-1">
                          <span>{getNotificationIcon(notif.type)}</span>
                          <span>{notif.title}</span>
                        </p>
                        {notif.body && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </Link>

                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
              <Link
                href="/notifications"
                className="text-center block text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                모든 알림 보기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
