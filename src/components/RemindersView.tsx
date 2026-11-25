import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MoreVertical,
  SquarePen,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';

export interface StudioReminder {
  id: string;
  text: string;
  kind: string;
  remindAt: string;
  isCompleted: boolean;
  bookingId?: string | null;
  createdAt?: string;
}

export interface StudioReminderPayload {
  text: string;
  kind: string;
  remindAt: string;
  bookingId?: string | null;
}

interface RemindersViewProps {
  reminders: StudioReminder[];
  bookings: StudioBooking[];
  syncing?: boolean;
  onAddReminder: (
    payload: StudioReminderPayload
  ) => Promise<{ success: boolean; error?: string }>;
  onToggleReminder: (reminderId: string, nextCompleted: boolean) => Promise<void>;
  onUpdateReminder: (
    reminderId: string,
    payload: StudioReminderPayload
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteReminder: (reminderId: string) => Promise<{ success: boolean; error?: string }>;
}

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const REMINDER_KINDS = [
  'Payment',
  'Product purchase',
  'Travel',
  'Instagram',
  'Client follow-up',
  'Booking preparation',
  'Advance payment',
  'General',
];

const QUICK_TEMPLATES: Array<{ label: string; text: string; kind: string }> = [
  { label: 'Balance follow-up', text: 'Collect pending balance from ', kind: 'Payment' },
  { label: 'Buy products', text: 'Buy studio products — ', kind: 'Product purchase' },
  { label: 'Leave for venue', text: 'Leave for venue — ', kind: 'Travel' },
  { label: 'Post bridal reel', text: 'Post bridal look reel on Instagram', kind: 'Instagram' },
  { label: 'Prep bridal kit', text: 'Prep kit and brushes for ', kind: 'Booking preparation' },
];

const TIME_PRESETS = [
  { label: '9:00 AM', value: '09:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '2:30 PM', value: '14:30' },
  { label: '6:00 PM', value: '18:00' },
];

function toLocalDateStr(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function addDaysLocal(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function formatTime12h(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';
  let hrs = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const period = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12 || 12;
  return `${hrs}:${mins} ${period}`;
}

function formatShortDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';
  return `${SHORT_DAYS[d.getDay()]}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

interface ReminderGroupBucket {
  key: string;
  label: string;
  isToday?: boolean;
  showDatePrefix?: boolean;
  items: StudioReminder[];
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  bookings,
  syncing = false,
  onAddReminder,
  onToggleReminder,
  onUpdateReminder,
  onDeleteReminder,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudioReminder | null>(null);
  const [text, setText] = useState('');
  const [kind, setKind] = useState('Payment');
  const [dateStr, setDateStr] = useState(() => toLocalDateStr(new Date()));
  const [timeStr, setTimeStr] = useState('10:00');
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const todayStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now.getFullYear(), now.getMonth(), now.getDate()]
  );
  const tomorrowStart = useMemo(() => addDaysLocal(todayStart, 1), [todayStart]);
  const plus3Date = useMemo(() => addDaysLocal(todayStart, 3), [todayStart]);
  const todayKey = toLocalDateStr(todayStart);
  const tomorrowKey = toLocalDateStr(tomorrowStart);
  const plus3Key = toLocalDateStr(plus3Date);

  const quickDateChoices = useMemo(
    () => [
      { label: 'Today', iso: todayKey },
      { label: 'Tomorrow', iso: tomorrowKey },
      { label: '+3 days', iso: plus3Key },
    ],
    [todayKey, tomorrowKey, plus3Key]
  );

  const { pendingCount, doneCount, completedItems, groups } = useMemo(() => {
    const active = reminders.filter((r) => !r.isCompleted);
    const done = reminders.filter((r) => r.isCompleted);

    active.sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
    done.sort((a, b) => new Date(b.remindAt).getTime() - new Date(a.remindAt).getTime());

    const overdue: StudioReminder[] = [];
    const todayItems: StudioReminder[] = [];
    const tomorrowItems: StudioReminder[] = [];
    const weekItems: StudioReminder[] = [];
    const upcomingItems: StudioReminder[] = [];

    const weekEnd = addDaysLocal(todayStart, 7);

    for (const r of active) {
      const dt = new Date(r.remindAt);
      if (Number.isNaN(dt.getTime())) {
        upcomingItems.push(r);
        continue;
      }
      const itemDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const itemKey = toLocalDateStr(itemDay);

      if (itemDay < todayStart) {
        overdue.push(r);
      } else if (itemKey === todayKey) {
        todayItems.push(r);
      } else if (itemKey === tomorrowKey) {
        tomorrowItems.push(r);
      } else if (itemDay <= weekEnd) {
        weekItems.push(r);
      } else {
        upcomingItems.push(r);
      }
    }

    const buckets: ReminderGroupBucket[] = [];
    if (overdue.length > 0) {
      buckets.push({ key: 'overdue', label: 'Earlier', showDatePrefix: true, items: overdue });
    }
    if (todayItems.length > 0) {
      buckets.push({
        key: 'today',
        label: `Today · ${todayStart.getDate()} ${SHORT_MONTHS[todayStart.getMonth()]}`,
        isToday: true,
        items: todayItems,
      });
    }
    if (tomorrowItems.length > 0) {
      buckets.push({
        key: 'tomorrow',
        label: `Tomorrow · ${tomorrowStart.getDate()} ${SHORT_MONTHS[tomorrowStart.getMonth()]}`,
        items: tomorrowItems,
      });
    }
    if (weekItems.length > 0) {
      buckets.push({ key: 'week', label: 'This week', showDatePrefix: true, items: weekItems });
    }
    if (upcomingItems.length > 0) {
      buckets.push({
        key: 'upcoming',
        label: 'Upcoming',
        showDatePrefix: true,
        items: upcomingItems,
      });
    }

    return {
      pendingCount: active.length,
      doneCount: done.length,
      completedItems: done,
      groups: buckets,
    };
  }, [reminders, todayStart, tomorrowStart, todayKey, tomorrowKey]);

  const bookingMap = useMemo(() => {
    const map = new Map<string, StudioBooking>();
    for (const b of bookings) map.set(b.id, b);
    return map;
  }, [bookings]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setModalOpen(false);
        setEditingItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, submitting]);

  const openCreateModal = () => {
    setEditingItem(null);
    setText('');
    setKind('Payment');
    setDateStr(todayKey);
    setTimeStr('10:00');
    setSelectedBookingId('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item: StudioReminder) => {
    setOpenMenuId(null);
    setEditingItem(item);
    setText(item.text);
    setKind(item.kind || 'General');
    const dt = new Date(item.remindAt);
    if (!Number.isNaN(dt.getTime())) {
      setDateStr(toLocalDateStr(dt));
      setTimeStr(
        `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
      );
    } else {
      setDateStr(todayKey);
      setTimeStr('10:00');
    }
    setSelectedBookingId(item.bookingId || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setFormError('Please enter what you want to be reminded about.');
      return;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = (timeStr || '10:00').split(':').map(Number);
    const localDt = new Date(y, (m || 1) - 1, d || 1, hh || 10, mm || 0, 0, 0);
    if (Number.isNaN(localDt.getTime())) {
      setFormError('Please pick a valid date and time.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload: StudioReminderPayload = {
        text: cleanText,
        kind,
        remindAt: localDt.toISOString(),
        bookingId: selectedBookingId || null,
      };
      const res = editingItem
        ? await onUpdateReminder(editingItem.id, payload)
        : await onAddReminder(payload);

      if (!res.success) {
        setFormError(res.error || 'Could not save reminder.');
        return;
      }
      setModalOpen(false);
      setEditingItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderReminderRow = (item: StudioReminder, showDatePrefix?: boolean) => {
    const dt = new Date(item.remindAt);
    const linkedBooking = item.bookingId ? bookingMap.get(item.bookingId) : undefined;
    const isMenuOpen = openMenuId === item.id;

    return (
      <div
        key={item.id}
        className={`p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
          item.isCompleted
            ? 'bg-[#faf8f9]/60 border-black/[0.05] opacity-70'
            : 'bg-white border-black/[0.08] hover:border-[#e8276b]/35'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            aria-label={item.isCompleted ? 'Mark reminder pending' : 'Mark reminder complete'}
            onClick={() => onToggleReminder(item.id, !item.isCompleted)}
            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              item.isCompleted
                ? 'bg-[#e8276b] border-[#e8276b] text-white'
                : 'bg-white border-black/25 hover:border-[#e8276b]'
            }`}
          >
            {item.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold leading-snug ${
                item.isCompleted ? 'line-through text-[#52525b]' : 'text-[#121214]'
              }`}
            >
              {item.text}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-[#ffeef4] text-[#a50f45] font-bold">
                {item.kind || 'General'}
              </span>
              <span className="inline-flex items-center gap-1 text-[#52525b] font-medium tabular-nums">
                <Clock className="w-3 h-3 text-[#e8276b]" />
                {showDatePrefix ? `${formatShortDate(dt)} · ` : ''}
                {formatTime12h(dt)}
              </span>
              {linkedBooking && (
                <span className="px-2 py-0.5 rounded-full bg-[#faf8f9] border border-black/[0.07] text-[#121214] font-medium">
                  {linkedBooking.client} ({linkedBooking.ref})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dot vertical menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={`Reminder actions for ${item.text}`}
            onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
            className="w-8 h-8 rounded-lg hover:bg-black/[0.05] flex items-center justify-center text-[#52525b] hover:text-[#121214]"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
              <div className="absolute right-0 top-9 z-30 w-36 rounded-xl bg-white border border-black/[0.08] shadow-xl py-1.5">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#121214] hover:bg-[#faf8f9] flex items-center gap-2"
                >
                  <SquarePen className="w-3.5 h-3.5 text-[#52525b]" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setOpenMenuId(null);
                    await onDeleteReminder(item.id);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-[#e8276b] hover:bg-[#ffeef4] flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Control Bar */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffeef4] text-[#e8276b] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#121214]">
              Studio Reminders &amp; Follow-ups
            </h2>
            <p className="text-xs text-[#52525b] tabular-nums">
              {pendingCount} active · {doneCount} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="h-10 px-4 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Reminder
          </button>
        </div>
      </section>

      {/* 2. Grouped Reminders List (Earlier / Today / Tomorrow / This week / Upcoming) */}
      {groups.length === 0 ? (
        <section className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ffeef4] text-[#e8276b] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-bold text-[#121214]">
            No pending reminders
          </h3>
          <p className="text-xs text-[#52525b] mt-1 max-w-[44ch] mx-auto">
            Add reminders for balance follow-ups, product restocks, bridal kit prep, or venue departures.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 h-10 px-4 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Reminder
          </button>
        </section>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section
              key={group.key}
              className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`font-display text-xs font-extrabold uppercase tracking-wider ${
                    group.isToday
                      ? 'text-[#e8276b]'
                      : group.key === 'overdue'
                      ? 'text-[#a50f45]'
                      : 'text-[#52525b]'
                  }`}
                >
                  {group.label}
                </h3>
                <span className="text-[11px] font-bold text-[#52525b] tabular-nums">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => renderReminderRow(item, group.showDatePrefix))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 3. Completed Section */}
      {completedItems.length > 0 && (
        <section className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#52525b] hover:text-[#121214]"
          >
            <span>Completed ({completedItems.length})</span>
            {showCompleted ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showCompleted && (
            <div className="space-y-2.5 pt-1">
              {completedItems.map((item) => renderReminderRow(item, true))}
            </div>
          )}
        </section>
      )}

      {/* 4. Create / Edit Reminder Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-form-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-black/10 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="reminder-form-title" className="font-display text-lg font-bold text-[#121214]">
                  {editingItem ? 'Edit Reminder' : 'New Reminder'}
                </h3>
                <p className="text-xs text-[#52525b]">
                  Syncs across your Shilpi web &amp; mobile studio
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalOpen(false)}
                aria-label="Close reminder modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4 mt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                  {formError}
                </div>
              )}

              {/* Quick Templates */}
              {!editingItem && (
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-[#52525b] mb-1.5">
                    Quick Templates
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => {
                          setText(tpl.text);
                          setKind(tpl.kind);
                        }}
                        className="h-7 px-2.5 rounded-lg bg-[#faf8f9] hover:bg-[#ffeef4] border border-black/[0.07] text-[11px] font-semibold text-[#121214] transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="rem-text" className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Reminder Note <span className="text-[#e8276b]">*</span>
                </label>
                <input
                  id="rem-text"
                  type="text"
                  maxLength={130}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g., Collect pending balance from Ananya"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Category
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REMINDER_KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        kind === k
                          ? 'bg-[#ffeef4] border-[#e8276b] text-[#a50f45]'
                          : 'bg-[#faf8f9] border-black/[0.07] text-[#52525b] hover:text-[#121214]'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="rem-date" className="block text-xs font-semibold text-[#121214] mb-1.5">
                    Date
                  </label>
                  <div className="flex gap-1.5 mb-2">
                    {quickDateChoices.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => setDateStr(choice.iso)}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          dateStr === choice.iso
                            ? 'bg-[#121214] text-white'
                            : 'bg-[#faf8f9] text-[#52525b] border border-black/[0.07]'
                        }`}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="rem-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b]"
                  />
                </div>

                <div>
                  <label htmlFor="rem-time" className="block text-xs font-semibold text-[#121214] mb-1.5">
                    Time
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setTimeStr(preset.value)}
                        className={`h-7 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
                          timeStr === preset.value
                            ? 'bg-[#121214] text-white'
                            : 'bg-[#faf8f9] text-[#52525b] border border-black/[0.07]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    id="rem-time"
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b]"
                  />
                </div>
              </div>

              {bookings.length > 0 && (
                <div>
                  <label htmlFor="rem-booking" className="block text-xs font-semibold text-[#121214] mb-1.5">
                    Link to Booking (Optional)
                  </label>
                  <select
                    id="rem-booking"
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs text-[#121214] focus:outline-none focus:border-[#e8276b]"
                  >
                    <option value="">No booking linked</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.client} · {b.day} {b.month} ({b.ref})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
