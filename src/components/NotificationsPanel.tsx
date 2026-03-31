import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Package, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { Notification } from '../types';
import { cn } from '../lib/utils';
import { Button } from './Button';

interface NotificationsPanelProps {
  onNotificationClick?: (bookingId: string) => void;
}

export function NotificationsPanel({ onNotificationClick }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const newNotification = {
          id: payload.new.id,
          type: payload.new.type,
          message: payload.new.message,
          read: payload.new.read,
          created_at: new Date(payload.new.created_at)
        } as Notification;
        
        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await supabaseService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabaseService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabaseService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[24px] shadow-xl border border-zinc-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="font-black text-zinc-900 uppercase tracking-widest text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-500" />
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 uppercase tracking-widest"
                  >
                    Marcar todas leídas
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {notifications.map(notification => {
                      const parts = notification.message.split('|');
                      const displayMessage = parts[0];
                      const bookingId = parts.length > 1 ? parts[1] : null;

                      return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 transition-colors hover:bg-zinc-50 flex gap-3",
                          !notification.read ? "bg-sky-50/30" : "",
                          bookingId && onNotificationClick ? "cursor-pointer" : ""
                        )}
                        onClick={() => {
                          if (bookingId && onNotificationClick) {
                            onNotificationClick(bookingId);
                            setIsOpen(false);
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }
                        }}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          notification.type === 'booking' ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {notification.type === 'booking' ? <Calendar className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.read ? "font-bold text-zinc-900" : "font-medium text-zinc-600"
                          )}>
                            {displayMessage}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                            {formatDistanceToNow(notification.created_at, { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-6 h-6 rounded-full hover:bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
