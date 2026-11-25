import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  ArrowDownLeft,
  BellRing,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  IndianRupee,
  MessageCircle,
  Search,
  Send,
  X,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';

export type CollectionStatus = 'Received' | 'Pending' | 'Upcoming';
type ScopeMode = 'Monthly' | 'All';
type StatusFilter = 'All' | CollectionStatus;

interface PaymentsViewProps {
  bookings: StudioBooking[];
  businessName: string;
  registeredAt?: string | null;
  syncing?: boolean;
  onRecordPayment?: (
    bookingId: string,
    payload: { amountRupees: number; paymentMode: 'upi' | 'cash' | 'card' | 'bank_transfer'; markFullyPaid: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  onSchedulePaymentReminder?: (payload: {
    title: string;
    notes: string;
    remindDate: string;
    clientName: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMonthSerial(year: number, monthIdx: number): number {
  return year * 12 + monthIdx;
}

function fromMonthSerial(serial: number): { year: number; monthIdx: number } {
  const year = Math.floor(serial / 12);
  const monthIdx = ((serial % 12) + 12) % 12;
  return { year, monthIdx };
}

function parseBookingDateLocal(b: StudioBooking, fallbackYear: number): Date {
  if (b.bookingDate && /^\d{4}-\d{2}-\d{2}$/.test(b.bookingDate)) {
    const [y, m, d] = b.bookingDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const mIdx = Math.max(0, MONTH_SHORT.indexOf(b.month));
  return new Date(b.year || fallbackYear, mIdx, b.day || 1);
}

function fmtINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function normalizeWhatsAppPhone(phone?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

interface CollectionRow {
  booking: StudioBooking;
  dateObj: Date;
  dateLabel: string;
  packagesLabel: string;
  bookingTotal: number;
  received: number;
  balanceDue: number;
  status: CollectionStatus;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  bookings,
  businessName,
  registeredAt,
  syncing = false,
  onRecordPayment,
  onSchedulePaymentReminder,
}) => {
  const [scope, setScope] = useState<ScopeMode>('Monthly');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentSerial = toMonthSerial(currentYear, currentMonthIdx);
  const todayStart = useMemo(
    () => new Date(currentYear, currentMonthIdx, now.getDate()),
    [currentYear, currentMonthIdx, now]
  );

  // Clamp backward month navigation strictly to the studio's registration month
  const regDate = useMemo(() => {
    if (registeredAt) {
      const parsed = new Date(registeredAt);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    // Fallback to earliest booking month or current month if registration date not available
    let earliest = new Date(currentYear, currentMonthIdx, 1);
    for (const b of bookings) {
      const dt = parseBookingDateLocal(b, currentYear);
      const dtMonth = new Date(dt.getFullYear(), dt.getMonth(), 1);
      if (dtMonth < earliest) earliest = dtMonth;
    }
    return earliest;
  }, [registeredAt, bookings, currentYear, currentMonthIdx]);

  const minSerial = toMonthSerial(regDate.getFullYear(), regDate.getMonth());

  const furthestBookingSerial = useMemo(() => {
    let maxS = currentSerial;
    for (const b of bookings) {
      const dt = parseBookingDateLocal(b, currentYear);
      const s = toMonthSerial(dt.getFullYear(), dt.getMonth());
      if (s > maxS) maxS = s;
    }
    return maxS;
  }, [bookings, currentSerial, currentYear]);

  const maxSerial = Math.max(currentSerial + 12, furthestBookingSerial + 1);

  const [selectedSerial, setSelectedSerial] = useState<number>(() =>
    Math.max(minSerial, currentSerial)
  );
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const monthLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSerial((prev) => Math.max(minSerial, prev));
  }, [minSerial]);

  const stepMonth = (delta: number) => {
    setSelectedSerial((prev) => {
      const next = Math.max(minSerial, Math.min(maxSerial, prev + delta));
      if (next === prev) return prev;
      setSlideDirection(delta > 0 ? 1 : -1);
      return next;
    });
  };

  useEffect(() => {
    if (scope !== 'Monthly' || !monthLabelRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.fromTo(
      monthLabelRef.current,
      { opacity: 0, x: reduced ? 0 : slideDirection * 22 },
      { opacity: 1, x: 0, duration: reduced ? 0.12 : 0.28, ease: 'power3.out', clearProps: 'transform' }
    );
  }, [selectedSerial, scope, slideDirection]);

  const { year: selectedYear, monthIdx: selectedMonthIdx } = fromMonthSerial(selectedSerial);
  const canGoPrev = selectedSerial > minSerial;
  const canGoNext = selectedSerial < maxSerial;
  const prevMonthInfo = canGoPrev ? fromMonthSerial(selectedSerial - 1) : null;
  const nextMonthInfo = canGoNext ? fromMonthSerial(selectedSerial + 1) : null;

  const regBadgeText = `${MONTH_SHORT[regDate.getMonth()]} ${regDate.getFullYear()}`;

  // Reminder Modal State
  const [reminderRow, setReminderRow] = useState<CollectionRow | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderNotice, setReminderNotice] = useState('');

  // Batch Remind All Modal State
  const [batchRemindOpen, setBatchRemindOpen] = useState(false);

  // Record Payment Modal State
  const [paymentRow, setPaymentRow] = useState<CollectionRow | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'upi' | 'cash' | 'card' | 'bank_transfer'>('upi');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  const scopedBookings = useMemo(() => {
    if (scope === 'All') return bookings;
    return bookings.filter((b) => {
      const dt = parseBookingDateLocal(b, selectedYear);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });
  }, [bookings, scope, selectedYear, selectedMonthIdx]);

  const metrics = useMemo(() => {
    let receivedSum = 0;
    let pendingNowSum = 0;
    let upcomingDueSum = 0;
    let totalSum = 0;
    let pendingCount = 0;
    let upcomingCount = 0;
    let receivedCount = 0;

    const rows: CollectionRow[] = scopedBookings.map((b) => {
      const dateObj = parseBookingDateLocal(b, selectedYear);
      const itemsTotal = b.items.reduce((s, item) => s + (item.price || 0), 0) + (b.travel || 0);
      const bookingTotal = Math.max(b.total || 0, itemsTotal);
      const received = Math.min(bookingTotal, Math.max(0, b.advance || 0));
      const balanceDue = Math.max(0, bookingTotal - received);

      receivedSum += received;
      totalSum += bookingTotal;

      let status: CollectionStatus = 'Received';
      if (balanceDue > 0) {
        if (b.status === 'Completed' || b.status === 'Closed' || dateObj <= todayStart) {
          status = 'Pending';
          pendingNowSum += balanceDue;
          pendingCount += 1;
        } else {
          status = 'Upcoming';
          upcomingDueSum += balanceDue;
          upcomingCount += 1;
        }
      } else {
        receivedCount += 1;
      }

      const packagesLabel =
        b.items.map((i) => i.name).filter(Boolean).join(' + ') || 'Studio Booking';
      const dateLabel = `${dateObj.getDate()} ${MONTH_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

      return {
        booking: b,
        dateObj,
        dateLabel,
        packagesLabel,
        bookingTotal,
        received,
        balanceDue,
        status,
      };
    });

    const priority: Record<CollectionStatus, number> = {
      Pending: 0,
      Upcoming: 1,
      Received: 2,
    };
    rows.sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return b.dateObj.getTime() - a.dateObj.getTime();
    });

    const receivedPct = totalSum > 0 ? Math.round((receivedSum / totalSum) * 100) : 0;
    const pendingPct = totalSum > 0 ? Math.round((pendingNowSum / totalSum) * 100) : 0;
    const upcomingPct = totalSum > 0 ? Math.max(0, 100 - receivedPct - pendingPct) : 0;

    return {
      rows,
      receivedSum,
      pendingNowSum,
      upcomingDueSum,
      totalSum,
      receivedPct,
      pendingPct,
      upcomingPct,
      pendingCount,
      upcomingCount,
      receivedCount,
    };
  }, [scopedBookings, selectedYear, todayStart]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return metrics.rows.filter((row) => {
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.booking.client.toLowerCase().includes(q) ||
        (row.booking.clientPhone || '').toLowerCase().includes(q) ||
        row.packagesLabel.toLowerCase().includes(q) ||
        row.booking.ref.toLowerCase().includes(q)
      );
    });
  }, [metrics.rows, statusFilter, search]);

  const pendingRows = useMemo(
    () => metrics.rows.filter((r) => r.status === 'Pending' && r.balanceDue > 0),
    [metrics.rows]
  );

  const buildReminderText = (row: CollectionRow) =>
    `Hi ${row.booking.client}, warm greetings from ${businessName}! This is a gentle reminder for your ${row.packagesLabel} booking on ${row.dateLabel}. Total: ${fmtINR(
      row.bookingTotal
    )}, Paid: ${fmtINR(row.received)}, Balance Due: ${fmtINR(row.balanceDue)}. Thank you!`;

  const openReminderModal = (row: CollectionRow) => {
    setReminderRow(row);
    setReminderMessage(buildReminderText(row));
    setReminderNotice('');
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleOpenWhatsApp = (phone: string | undefined, text: string) => {
    const waPhone = normalizeWhatsAppPhone(phone);
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveReminderToStudio = async () => {
    if (!reminderRow || !onSchedulePaymentReminder) return;
    setSavingReminder(true);
    setReminderNotice('');
    try {
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const res = await onSchedulePaymentReminder({
        title: `Collect ${fmtINR(reminderRow.balanceDue)} from ${reminderRow.booking.client}`,
        notes: reminderMessage,
        remindDate: todayIso,
        clientName: reminderRow.booking.client,
      });
      if (res.success) {
        setReminderNotice('Saved to Studio Reminders and synced.');
      } else {
        setReminderNotice(res.error || 'Could not save reminder.');
      }
    } finally {
      setSavingReminder(false);
    }
  };

  const openPaymentModal = (row: CollectionRow) => {
    setPaymentRow(row);
    setPayAmount(String(row.balanceDue));
    setPayMode('upi');
    setPayError('');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRow || !onRecordPayment) return;
    const amt = Math.round(Number(payAmount));
    if (!Number.isFinite(amt) || amt <= 0) {
      setPayError('Enter a valid payment amount greater than zero.');
      return;
    }
    setPaySubmitting(true);
    setPayError('');
    try {
      const res = await onRecordPayment(paymentRow.booking.id, {
        amountRupees: amt,
        paymentMode: payMode,
        markFullyPaid: amt >= paymentRow.balanceDue,
      });
      if (!res.success) {
        setPayError(res.error || 'Could not record payment.');
        return;
      }
      setPaymentRow(null);
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Scope Toggle (Monthly / All Time) & Centered Month Slider */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Monthly vs All Time Pill Switch */}
          <div
            role="tablist"
            aria-label="Earnings period scope"
            className="inline-flex items-center p-1 rounded-xl bg-[#faf8f9] border border-black/[0.07] self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'Monthly'}
              onClick={() => setScope('Monthly')}
              className={`h-9 px-4 rounded-lg text-xs font-semibold transition-all ${
                scope === 'Monthly'
                  ? 'bg-[#e8276b] text-white shadow-sm'
                  : 'text-[#52525b] hover:text-[#121214]'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'All'}
              onClick={() => setScope('All')}
              className={`h-9 px-4 rounded-lg text-xs font-semibold transition-all ${
                scope === 'All'
                  ? 'bg-[#121214] text-white shadow-sm'
                  : 'text-[#52525b] hover:text-[#121214]'
              }`}
            >
              All Time
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[#52525b]">
            <span className="px-2.5 py-1 rounded-lg bg-[#faf8f9] border border-black/[0.06] font-medium">
              Active since {regBadgeText}
            </span>
          </div>
        </div>

        {/* Centered Month Slider (only when Monthly is selected) */}
        {scope === 'Monthly' ? (
          <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Side: Previous Month Slider Control */}
            <div className="flex items-center gap-1.5 min-w-[110px] sm:min-w-[150px]">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => stepMonth(-1)}
                aria-label="Previous month"
                className="w-9 h-9 rounded-xl border border-black/[0.08] bg-[#faf8f9] hover:border-[#e8276b]/50 hover:bg-[#ffeef4] text-[#121214] flex items-center justify-center transition-colors disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {prevMonthInfo ? (
                <button
                  type="button"
                  onClick={() => stepMonth(-1)}
                  className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-semibold text-[#52525b] hover:text-[#121214] hover:bg-[#faf8f9] transition-colors"
                >
                  {MONTH_SHORT[prevMonthInfo.monthIdx]} {prevMonthInfo.year}
                </button>
              ) : (
                <span className="hidden sm:inline-block text-[11px] font-medium text-[#52525b]/70 pl-1">
                  Start month
                </span>
              )}
            </div>

            {/* Center: Active Sliding Month Display */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden py-1">
              <div
                ref={monthLabelRef}
                className="font-display text-lg sm:text-xl font-bold text-[#121214] tracking-[-0.02em] text-center"
              >
                {MONTH_LONG[selectedMonthIdx]} {selectedYear}
              </div>
              <span className="text-[11px] text-[#52525b] font-medium mt-0.5">
                {scopedBookings.length} {scopedBookings.length === 1 ? 'booking' : 'bookings'} ·{' '}
                Total {fmtINR(metrics.totalSum)}
              </span>
            </div>

            {/* Right Side: Next Month Slider Control */}
            <div className="flex items-center justify-end gap-1.5 min-w-[110px] sm:min-w-[150px]">
              {nextMonthInfo ? (
                <button
                  type="button"
                  onClick={() => stepMonth(1)}
                  className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-semibold text-[#52525b] hover:text-[#121214] hover:bg-[#faf8f9] transition-colors"
                >
                  {MONTH_SHORT[nextMonthInfo.monthIdx]} {nextMonthInfo.year}
                </button>
              ) : null}
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => stepMonth(1)}
                aria-label="Next month"
                className="w-9 h-9 rounded-xl border border-black/[0.08] bg-[#faf8f9] hover:border-[#e8276b]/50 hover:bg-[#ffeef4] text-[#121214] flex items-center justify-center transition-colors disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-[#52525b]">
            <span className="font-semibold text-[#121214]">
              All Time Lifetime Collections ({bookings.length}{' '}
              {bookings.length === 1 ? 'booking' : 'bookings'})
            </span>
            <span className="tabular-nums font-semibold text-[#121214]">
              Total Booked Value: {fmtINR(metrics.totalSum)}
            </span>
          </div>
        )}
      </section>

      {/* 2. Collection Roadmap Rail (Received -> Pending -> Upcoming) */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 space-y-4">
        {/* Compact Header + Proportional Collection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-sm font-bold text-[#121214]">
              Collection Roadmap
            </h3>
            <span className="text-[11px] font-medium text-[#52525b]">
              Click a stage to filter
            </span>
          </div>
          <div className="text-xs text-[#52525b] tabular-nums">
            Total Booked:{' '}
            <span className="font-bold text-[#121214]">{fmtINR(metrics.totalSum)}</span>
          </div>
        </div>

        {/* 3-Stage Proportional Pipeline Bar */}
        <div
          className="h-2 w-full rounded-full bg-[#faf8f9] border border-black/[0.06] overflow-hidden flex"
          aria-label="Collection distribution bar"
        >
          {metrics.receivedPct > 0 && (
            <div
              style={{ width: `${metrics.receivedPct}%` }}
              className="h-full bg-emerald-600 transition-all duration-300"
              title={`Received: ${metrics.receivedPct}%`}
            />
          )}
          {metrics.pendingPct > 0 && (
            <div
              style={{ width: `${metrics.pendingPct}%` }}
              className="h-full bg-[#e8276b] transition-all duration-300"
              title={`Pending: ${metrics.pendingPct}%`}
            />
          )}
          {metrics.upcomingPct > 0 && (
            <div
              style={{ width: `${metrics.upcomingPct}%` }}
              className="h-full bg-[#121214]/25 transition-all duration-300"
              title={`Upcoming: ${metrics.upcomingPct}%`}
            />
          )}
        </div>

        {/* Connected 3-Milestone Roadmap Track */}
        <div className="relative pt-1">
          {/* Desktop horizontal connector track */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-[22px] left-[16%] right-[16%] h-px bg-black/[0.1]"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
            {/* Milestone 1: Received */}
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'Received' ? 'All' : 'Received'))
              }
              className={`group w-full text-left rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                statusFilter === 'Received'
                  ? 'bg-emerald-50/75 border-emerald-600/45 shadow-sm'
                  : 'bg-[#faf8f9]/70 border-black/[0.07] hover:border-emerald-600/35 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-emerald-800 block leading-tight">
                      1. Received
                    </span>
                    <span className="text-[11px] text-[#52525b] tabular-nums">
                      {metrics.receivedPct}% collected
                    </span>
                  </div>
                </div>
                <span className="font-display text-lg font-extrabold text-[#121214] tabular-nums shrink-0">
                  {fmtINR(metrics.receivedSum)}
                </span>
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 w-full text-[11px] text-[#52525b]">
                <span className="inline-flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {metrics.receivedCount} fully settled
                </span>
                <span className="font-semibold text-emerald-700 tabular-nums">
                  {statusFilter === 'Received' ? 'Filtered ✓' : 'Filter →'}
                </span>
              </div>
            </button>

            {/* Milestone 2: Pending */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setStatusFilter((prev) => (prev === 'Pending' ? 'All' : 'Pending'))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStatusFilter((prev) => (prev === 'Pending' ? 'All' : 'Pending'));
                }
              }}
              className={`group w-full cursor-pointer text-left rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                statusFilter === 'Pending'
                  ? 'bg-[#ffeef4] border-[#e8276b]/55 shadow-sm'
                  : 'bg-[#faf8f9]/70 border-black/[0.07] hover:border-[#e8276b]/45 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#e8276b] text-white flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                    <BellRing className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#a50f45] block leading-tight">
                      2. Pending
                    </span>
                    <span className="text-[11px] text-[#52525b] tabular-nums">
                      {metrics.pendingPct}% of total
                    </span>
                  </div>
                </div>
                <span className="font-display text-lg font-extrabold text-[#e8276b] tabular-nums shrink-0">
                  {fmtINR(metrics.pendingNowSum)}
                </span>
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 w-full text-[11px]">
                <span className="inline-flex items-center gap-1 font-medium text-[#52525b]">
                  <Clock className="w-3.5 h-3.5 text-[#e8276b]" />
                  {metrics.pendingCount} {metrics.pendingCount === 1 ? 'due' : 'dues'} ready
                </span>
                {pendingRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBatchRemindOpen(true);
                    }}
                    className="h-6 px-2.5 rounded-md bg-[#e8276b] hover:bg-[#121214] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Send className="w-2.5 h-2.5" />
                    Remind All
                  </button>
                ) : (
                  <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All clear
                  </span>
                )}
              </div>
            </div>

            {/* Milestone 3: Upcoming */}
            <button
              type="button"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'Upcoming' ? 'All' : 'Upcoming'))
              }
              className={`group w-full text-left rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                statusFilter === 'Upcoming'
                  ? 'bg-[#121214]/[0.05] border-[#121214]/45 shadow-sm'
                  : 'bg-[#faf8f9]/70 border-black/[0.07] hover:border-[#121214]/30 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#121214] text-white flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                    <CalendarClock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#121214] block leading-tight">
                      3. Upcoming
                    </span>
                    <span className="text-[11px] text-[#52525b] tabular-nums">
                      {metrics.upcomingPct}% scheduled
                    </span>
                  </div>
                </div>
                <span className="font-display text-lg font-extrabold text-[#121214] tabular-nums shrink-0">
                  {fmtINR(metrics.upcomingDueSum)}
                </span>
              </div>

              <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2 w-full text-[11px] text-[#52525b]">
                <span className="inline-flex items-center gap-1 font-medium">
                  <IndianRupee className="w-3.5 h-3.5 text-[#121214]/60" />
                  {metrics.upcomingCount} {metrics.upcomingCount === 1 ? 'booking' : 'bookings'} due later
                </span>
                <span className="font-semibold text-[#121214] tabular-nums">
                  {statusFilter === 'Upcoming' ? 'Filtered ✓' : 'Filter →'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Collection Breakdown & Payment Reminder Actions */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#121214]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, package, or booking ref..."
              aria-label="Search payments"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#faf8f9] border border-black/[0.08] text-sm text-[#121214] placeholder:text-[#52525b] focus:outline-none focus:border-[#e8276b]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'All', label: `All (${metrics.rows.length})` },
                { id: 'Pending', label: `Pending (${metrics.pendingCount})` },
                { id: 'Upcoming', label: `Upcoming (${metrics.upcomingCount})` },
                { id: 'Received', label: `Received (${metrics.receivedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? tab.id === 'Pending'
                      ? 'bg-[#e8276b] text-white'
                      : 'bg-[#121214] text-white'
                    : 'bg-[#faf8f9] text-[#52525b] hover:text-[#121214] border border-black/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-12 text-center border-t border-black/[0.06]">
            <p className="text-sm font-semibold text-[#121214]">
              No payment records for this selection
            </p>
            <p className="text-xs text-[#52525b] mt-1">
              {scope === 'Monthly'
                ? 'Slide to another month or switch to All Time to view lifetime records.'
                : 'Try clearing your search or status filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {filteredRows.map((row) => {
              const isPending = row.status === 'Pending';
              const isUpcoming = row.status === 'Upcoming';
              return (
                <div
                  key={row.booking.id}
                  className="py-4 first:pt-2 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-sm font-bold text-[#121214]">
                        {row.booking.client}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-[#ffeef4] text-[#a50f45]'
                            : isUpcoming
                            ? 'bg-[#faf8f9] text-[#121214] border border-black/[0.1]'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isPending ? (
                          <Clock className="w-2.5 h-2.5" />
                        ) : isUpcoming ? (
                          <CalendarClock className="w-2.5 h-2.5" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        )}
                        {row.status}
                      </span>
                      <span className="text-[11px] font-medium text-[#52525b]">
                        {row.dateLabel} · {row.booking.ref}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525b] mt-1 truncate">
                      {row.packagesLabel}
                      {row.booking.clientPhone ? ` · ${row.booking.clientPhone}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4">
                    <div className="flex items-center gap-5 text-xs tabular-nums">
                      <div>
                        <span className="block text-[11px] text-[#52525b]">Received</span>
                        <span className="font-bold text-[#121214]">{fmtINR(row.received)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#52525b]">Total</span>
                        <span className="font-semibold text-[#52525b]">
                          {fmtINR(row.bookingTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#52525b]">Balance Due</span>
                        <span
                          className={`font-extrabold ${
                            row.balanceDue > 0 ? 'text-[#e8276b]' : 'text-emerald-700'
                          }`}
                        >
                          {fmtINR(row.balanceDue)}
                        </span>
                      </div>
                    </div>

                    {row.balanceDue > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReminderModal(row)}
                          className="h-9 px-3 rounded-xl bg-[#ffeef4] hover:bg-[#e8276b] text-[#a50f45] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Reminder
                        </button>
                        {onRecordPayment && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(row)}
                            className="h-9 px-3 rounded-xl border border-black/[0.1] bg-white hover:border-[#121214] text-xs font-semibold text-[#121214] inline-flex items-center gap-1 transition-colors"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            Mark Paid
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Send Payment Reminder Modal */}
      {reminderRow && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReminderRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reminder-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="reminder-modal-title" className="font-display text-base font-bold text-[#121214]">
                  Send Payment Reminder
                </h3>
                <p className="text-xs text-[#52525b] mt-0.5">
                  {reminderRow.booking.client} · Due{' '}
                  <span className="font-bold text-[#e8276b] tabular-nums">
                    {fmtINR(reminderRow.balanceDue)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderRow(null)}
                aria-label="Close reminder modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label htmlFor="reminder-msg" className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Reminder Message
                </label>
                <textarea
                  id="reminder-msg"
                  rows={4}
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-xs leading-relaxed text-[#121214] focus:outline-none focus:border-[#e8276b] resize-none"
                />
              </div>

              {reminderNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                  {reminderNotice}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenWhatsApp(reminderRow.booking.clientPhone, reminderMessage)
                  }
                  className="h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(reminderRow.booking.id, reminderMessage)}
                  className="h-10 rounded-xl border border-black/[0.12] bg-white hover:bg-[#faf8f9] text-xs font-semibold text-[#121214] inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedId === reminderRow.booking.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      Copied Message
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Message
                    </>
                  )}
                </button>
              </div>

              {onSchedulePaymentReminder && (
                <button
                  type="button"
                  disabled={savingReminder}
                  onClick={handleSaveReminderToStudio}
                  className="w-full h-9 rounded-xl bg-[#faf8f9] hover:bg-[#ffeef4] border border-black/[0.08] text-xs font-semibold text-[#121214] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <BellRing className="w-3.5 h-3.5 text-[#e8276b]" />
                  {savingReminder ? 'Saving Reminder...' : 'Also Save to Studio Reminders'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Remind All Pending Modal */}
      {batchRemindOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setBatchRemindOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-remind-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-black/10 max-h-[88vh] flex flex-col"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="batch-remind-title" className="font-display text-base font-bold text-[#121214]">
                  Send Payment Reminders ({pendingRows.length})
                </h3>
                <p className="text-xs text-[#52525b] mt-0.5">
                  Total pending balance:{' '}
                  <span className="font-bold text-[#e8276b] tabular-nums">
                    {fmtINR(metrics.pendingNowSum)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchRemindOpen(false)}
                aria-label="Close batch reminder modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto pr-1">
              {pendingRows.map((row) => {
                const msg = buildReminderText(row);
                return (
                  <div
                    key={row.booking.id}
                    className="p-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#121214] truncate">
                        {row.booking.client}
                      </p>
                      <p className="text-[11px] text-[#52525b] truncate">
                        {row.dateLabel} · Due{' '}
                        <span className="font-bold text-[#e8276b] tabular-nums">
                          {fmtINR(row.balanceDue)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyText(`batch-${row.booking.id}`, msg)}
                        className="h-8 px-2.5 rounded-lg border border-black/[0.1] bg-white text-[11px] font-semibold text-[#121214] inline-flex items-center gap-1"
                      >
                        {copiedId === `batch-${row.booking.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(row.booking.clientPhone, msg)}
                        className="h-8 px-3 rounded-lg bg-[#e8276b] hover:bg-[#121214] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentRow && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !paySubmitting && setPaymentRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-black/10"
          >
            <div className="flex justify-between items-start pb-4 border-b border-black/[0.06]">
              <div>
                <h3 id="record-payment-title" className="font-display text-base font-bold text-[#121214]">
                  Record Payment
                </h3>
                <p className="text-xs text-[#52525b] mt-0.5">
                  {paymentRow.booking.client} · Balance {fmtINR(paymentRow.balanceDue)}
                </p>
              </div>
              <button
                type="button"
                disabled={paySubmitting}
                onClick={() => setPaymentRow(null)}
                aria-label="Close record payment modal"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#52525b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4">
              {payError && (
                <div className="p-2.5 rounded-xl bg-[#ffeef4] border border-[#e8276b]/30 text-xs font-medium text-[#a50f45]">
                  {payError}
                </div>
              )}

              <div>
                <label htmlFor="pay-amount" className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Amount Received (₹)
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  min="1"
                  max={paymentRow.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf8f9] border border-black/[0.1] text-sm text-[#121214] tabular-nums focus:outline-none focus:border-[#e8276b]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#121214] mb-1.5">
                  Payment Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'upi', label: 'UPI' },
                      { id: 'cash', label: 'Cash' },
                      { id: 'card', label: 'Card' },
                      { id: 'bank_transfer', label: 'Bank Transfer' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPayMode(mode.id)}
                      className={`h-9 rounded-xl text-xs font-semibold border transition-colors ${
                        payMode === mode.id
                          ? 'bg-[#ffeef4] border-[#e8276b] text-[#a50f45]'
                          : 'bg-[#faf8f9] border-black/[0.08] text-[#52525b] hover:text-[#121214]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={paySubmitting}
                  onClick={() => setPaymentRow(null)}
                  className="flex-1 h-10 rounded-xl border border-black/[0.12] bg-white text-xs font-semibold text-[#121214]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="flex-1 h-10 rounded-xl bg-[#e8276b] hover:bg-[#121214] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {paySubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
