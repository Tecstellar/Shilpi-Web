import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Plus,
  Star,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';
import { StudioReminder } from './RemindersView';
import { SidebarSectionId } from './StudioSidebar';

export interface StudioNotificationItem {
  id: string;
  glyph: 'star' | 'up' | 'alert' | 'plus' | 'bell';
  title: string;
  body: string;
  time: string;
  to: SidebarSectionId;
}

interface NotificationsViewProps {
  bookings: StudioBooking[];
  reminders: StudioReminder[];
  looksCount: number;
  businessName: string;
  onNavigate: (section: SidebarSectionId) => void;
}

function fmtINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function renderGlyph(glyph: StudioNotificationItem['glyph'], isRead: boolean) {
  const cls = `w-4 h-4 ${isRead ? 'text-[#52525b]' : 'text-white'}`;
  if (glyph === 'star') return <Star className={cls} />;
  if (glyph === 'up') return <ArrowUpRight className={cls} />;
  if (glyph === 'alert') return <AlertCircle className={cls} />;
  if (glyph === 'plus') return <Plus className={cls} />;
  return <Bell className={cls} />;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  bookings,
  reminders,
  looksCount,
  businessName,
  onNavigate,
}) => {
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shilpi_web_notif_read');
      if (saved) setReadMap(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const persistReadMap = (next: Record<string, boolean>) => {
    setReadMap(next);
    try {
      localStorage.setItem('shilpi_web_notif_read', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const notifications = useMemo<StudioNotificationItem[]>(() => {
    const items: StudioNotificationItem[] = [];
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    // 1. Today's bookings
    const todayBookings = bookings.filter((b) => b.bookingDate === todayIso);
    if (todayBookings.length > 0) {
      items.push({
        id: `today-bookings-${todayIso}`,
        glyph: 'plus',
        title: `${todayBookings.length} ${todayBookings.length === 1 ? 'Booking' : 'Bookings'} Scheduled Today`,
        body: todayBookings.map((b) => `${b.client} (${b.time} ${b.meridiem})`).join(' · '),
        time: 'Today',
        to: 'dashboard',
      });
    }

    // 2. Pending balance dues
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pendingDues = bookings.filter((b) => {
      if ((b.balanceDue || 0) <= 0) return false;
      if (b.status === 'Completed' || b.status === 'Closed') return true;
      if (b.bookingDate && /^\d{4}-\d{2}-\d{2}$/.test(b.bookingDate)) {
        const [y, m, d] = b.bookingDate.split('-').map(Number);
        return new Date(y, m - 1, d) <= todayStart;
      }
      return false;
    });

    if (pendingDues.length > 0) {
      const totalDue = pendingDues.reduce((s, b) => s + (b.balanceDue || 0), 0);
      items.push({
        id: `pending-dues-${pendingDues.length}-${totalDue}`,
        glyph: 'alert',
        title: `${fmtINR(totalDue)} Pending Balance to Collect`,
        body: `${pendingDues.length} ${
          pendingDues.length === 1 ? 'client has' : 'clients have'
        } pending dues. Tap to send WhatsApp payment reminders.`,
        time: 'Action needed',
        to: 'payments',
      });
    }

    // 3. Active reminders due today or earlier
    const activeReminders = reminders.filter((r) => !r.isCompleted);
    const dueReminders = activeReminders.filter((r) => {
      const dt = new Date(r.remindAt);
      if (Number.isNaN(dt.getTime())) return false;
      const rDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      return rDay <= todayStart;
    });

    if (dueReminders.length > 0) {
      items.push({
        id: `due-reminders-${dueReminders.length}`,
        glyph: 'bell',
        title: `${dueReminders.length} Studio ${
          dueReminders.length === 1 ? 'Reminder' : 'Reminders'
        } Due`,
        body: dueReminders
          .slice(0, 2)
          .map((r) => `[${r.kind}] ${r.text}`)
          .join(' · '),
        time: 'Today',
        to: 'reminders',
      });
    }

    // 4. Total collected revenue update
    const totalCollected = bookings.reduce((s, b) => s + (b.advance || 0), 0);
    if (totalCollected > 0) {
      items.push({
        id: `revenue-summary-${totalCollected}`,
        glyph: 'up',
        title: `${fmtINR(totalCollected)} Collected Across Studio`,
        body: `Review monthly received, pending, and upcoming collections for ${businessName}.`,
        time: 'Ledger synced',
        to: 'payments',
      });
    }

    // 5. Portfolio / Gallery milestone
    items.push({
      id: `gallery-status-${looksCount}`,
      glyph: 'star',
      title:
        looksCount > 0
          ? `${looksCount} Portfolio ${looksCount === 1 ? 'Look' : 'Looks'} Saved`
          : 'Showcase Your Finished Bridal Looks',
      body:
        looksCount > 0
          ? 'Combine 3–5 look photos into a branded Shilpi Instagram post.'
          : 'Upload finished client looks in My Gallery to build your Shilpi Streak.',
      time: 'Portfolio',
      to: 'gallery',
    });

    return items;
  }, [bookings, reminders, looksCount, businessName]);

  const unreadCount = notifications.filter((n) => !readMap[n.id]).length;

  const markAllRead = () => {
    const next: Record<string, boolean> = { ...readMap };
    for (const n of notifications) next[n.id] = true;
    persistReadMap(next);
  };

  const handleOpen = (item: StudioNotificationItem) => {
    persistReadMap({ ...readMap, [item.id]: true });
    onNavigate(item.to);
  };

  return (
    <div className="space-y-4">
      {/* 1. Unread Count & Mark All Read */}
      <section className="bg-white rounded-2xl border border-black/[0.08] px-5 py-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#121214] tabular-nums">
          {unreadCount} Unread Notification{unreadCount === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-[#e8276b] hover:text-[#121214] disabled:opacity-40 transition-colors"
        >
          Mark All Read
        </button>
      </section>

      {/* 2. Notifications List */}
      <section className="space-y-2.5">
        {notifications.map((n) => {
          const isRead = Boolean(readMap[n.id]);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleOpen(n)}
              className={`w-full text-left rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 transition-all ${
                isRead
                  ? 'bg-white border-black/[0.07] hover:border-black/[0.15]'
                  : 'bg-[#ffeef4]/55 border-[#e8276b]/30 hover:border-[#e8276b]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isRead ? 'bg-[#faf8f9] border border-black/[0.07]' : 'bg-[#e8276b]'
                }`}
              >
                {renderGlyph(n.glyph, isRead)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-bold text-[#121214] truncate">
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-medium text-[#52525b]">{n.time}</span>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-[#e8276b]" />}
                  </div>
                </div>
                <p className="text-xs text-[#52525b] mt-1 leading-relaxed">{n.body}</p>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
};
