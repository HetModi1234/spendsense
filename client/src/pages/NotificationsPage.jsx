import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Users2,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch (e) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'budget_threshold':
      case 'budget_exceeded':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'duplicate_detected':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'group_invite':
      case 'group_expense':
        return <Users2 className="w-5 h-5 text-purple-400" />;
      case 'settlement':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Notifications & Alerts</h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Budget thresholds, duplicate warnings, roommate invites and payment updates
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141E30] hover:bg-slate-800 text-purple-300 text-xs font-semibold border border-purple-500/30 transition self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="card-glass rounded-2xl overflow-hidden divide-y divide-[#1E293B]">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition ${
                !notif.isRead ? 'bg-purple-950/20' : 'hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#090D18] border border-slate-800 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-white truncate">{notif.title}</h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="p-1.5 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-slate-800 transition"
                    title="Mark read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif._id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs">
            <Bell className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            <span>No notifications yet. You're all caught up!</span>
          </div>
        )}
      </div>
    </div>
  );
}
