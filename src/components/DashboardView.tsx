import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
} from 'lucide-react';

export interface StudioBookingItem {
  name: string;
  price: number;
}

export interface StudioBooking {
  id: string;
  ref: string;
  client: string;
  clientId?: string;
  clientPhone: string;
  bookingDate: string; // YYYY-MM-DD
  day: number;
  month: string; // Short month: Jan..Dec
  year: number;
  time: string;
  meridiem: string;
  items: StudioBookingItem[];
  travel: number;
  total: number;
  advance: number;
  balanceDue: number;
  status: 'Upcoming' | 'Completed' | 'Closed';
  venue: string;
  notes?: string;
}

export interface SelectedDatePrefill {
  day: number;
  monthShort: string;
  year: number;
  isoDate: string;
}

interface DashboardViewProps {
  ownerName: string;
  businessName: string;
  bookings: StudioBooking[];
  monthExpenses: number;
  syncing?: boolean;
  onOpenNewBooking: (prefill?: SelectedDatePrefill) => void;
  onViewAllBookings?: () => void;
  onSelectBooking?: (booking: StudioBooking) => void;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STUDIO_QUOTES = [
  {
    title: 'Artist who makes every moment beautiful.',
    subtitle: 'Behind every radiant smile is your craft, patience, and magic.',
  },
  {
    title: 'Shilpi',
    subtitle: 'For the artists who make every moment beautiful.',
  },
  {
    title: 'Every stroke carries your passion.',
    subtitle: 'Your artistry turns milestones into lifelong confidence.',
  },
  {
    title: 'Every appointment has a story of dedication behind it.',
    subtitle: 'Early mornings, careful prep, and calm precision — it all shows.',
  },
  {
    title: 'You do more than create a look.',
    subtitle: 'You bring grace and calm to someone’s biggest celebration.',
  },
  {
    title: 'Consistent craft builds a studio people trust.',
    subtitle: 'Every booking, detail, and brush stroke stays effortless here.',
  },
];

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const fmtRupees = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

function parseBookingDateLocal(b: StudioBooking): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const mIdx = Math.max(0, MONTH_SHORT.indexOf(b.month));
  return new Date(b.year, mIdx, b.day);
}

function getBookingMinutes(b: StudioBooking): number {
  const [hStr, mStr] = (b.time || '10:00').split(':');
  let hrs = parseInt(hStr || '10', 10) || 10;
  const mins = parseInt(mStr || '0', 10) || 0;
  if (b.meridiem === 'PM' && hrs < 12) hrs += 12;
  if (b.meridiem === 'AM' && hrs === 12) hrs = 0;
  return hrs * 60 + mins;
}

function toIsoDate(year: number, monthIdx: number, day: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function DashboardView({
  ownerName,
  businessName,
  bookings,
  monthExpenses,
  syncing = false,
  onOpenNewBooking,
  onSelectBooking,
}: DashboardViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const marqueeViewportRef = useRef<HTMLDivElement>(null);
  const marqueeItemRef = useRef<HTMLDivElement>(null);
  const calendarExpandRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  const now = useMemo(() => new Date(), []);
  const currentDowLong = DAY_LONG[now.getDay()];
  const currentDay = now.getDate();
  const currentMonthShort = MONTH_SHORT[now.getMonth()];
  const currentMonthLong = MONTH_LONG[now.getMonth()];
  const currentYear = now.getFullYear();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [calExpanded, setCalExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthShort);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthOffset, setMonthOffset] = useState(0);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Upcoming' | 'Completed' | 'Closed'>('Upcoming');

  // 1. Entrance Stagger Choreography (Respects Reduced Motion)
  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('[data-dash-hero]', {
          y: 12,
          opacity: 0,
          duration: 0.45,
        })
          .from(
            '[data-dash-quote]',
            {
              y: 10,
              opacity: 0,
              duration: 0.4,
            },
            0.08
          )
          .from(
            '[data-dash-kpi]',
            {
              y: 14,
              opacity: 0,
              duration: 0.42,
              stagger: 0.04,
              clearProps: 'transform',
            },
            0.14
          )
          .from(
            '[data-dash-section]',
            {
              y: 14,
              opacity: 0,
              duration: 0.44,
              stagger: 0.07,
              clearProps: 'transform',
            },
            0.22
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from('[data-dash-hero], [data-dash-quote], [data-dash-kpi], [data-dash-section]', {
          opacity: 0,
          duration: 0.2,
          ease: 'power1.out',
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // 2. Sequential One-by-One Marquee Transition (Only 1 Quote Visible at a Time)
  useIsomorphicLayoutEffect(() => {
    const viewport = marqueeViewportRef.current;
    const item = marqueeItemRef.current;
    if (!viewport || !item) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          item,
          { opacity: 0, x: 0 },
          { opacity: 1, x: 0, duration: 0.2, ease: 'power1.out' }
        );
      });
      const timer = window.setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % STUDIO_QUOTES.length);
      }, 6500);
      return () => {
        window.clearTimeout(timer);
        ctx.revert();
      };
    }

    const viewportWidth = viewport.clientWidth || 720;
    const itemWidth = item.offsetWidth || 460;
    const startX = viewportWidth;
    const endX = -(itemWidth + 16);
    const distance = startX - endX;
    const duration = Math.max(5.5, distance / 185);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        item,
        { x: startX },
        {
          x: endX,
          duration,
          ease: 'none',
          onComplete: () => {
            setQuoteIndex((prev) => (prev + 1) % STUDIO_QUOTES.length);
          },
        }
      );
    });

    return () => {
      ctx.revert();
    };
  }, [quoteIndex]);

  const activeQuote = STUDIO_QUOTES[quoteIndex];

  // 3. GSAP Calendar Expand & Selected Day Transition
  useIsomorphicLayoutEffect(() => {
    if (!calExpanded || !calendarExpandRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        calendarExpandRef.current,
        { opacity: 0, y: reduced ? 0 : 8 },
        { opacity: 1, y: 0, duration: reduced ? 0.15 : 0.34, ease: 'expo.out', clearProps: 'transform' }
      );
    });
    return () => ctx.revert();
  }, [calExpanded, monthOffset]);

  useIsomorphicLayoutEffect(() => {
    if (!selectedPanelRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        selectedPanelRef.current,
        { opacity: 0.35, y: reduced ? 0 : 4 },
        { opacity: 1, y: 0, duration: reduced ? 0.12 : 0.28, ease: 'expo.out', clearProps: 'transform' }
      );
    });
    return () => ctx.revert();
  }, [selectedDay, selectedMonth, selectedYear]);

  // Helper: Filter bookings for any date
  const getBookingsForDate = (dayNum: number, mShort: string, yrNum: number) =>
    bookings
      .filter((b) => {
        const dt = parseBookingDateLocal(b);
        return (
          dt.getDate() === dayNum &&
          MONTH_SHORT[dt.getMonth()] === mShort &&
          dt.getFullYear() === yrNum
        );
      })
      .sort((a, b) => getBookingMinutes(a) - getBookingMinutes(b));

  // Real Current Week (Sunday 00:00 -> Saturday 23:59 containing today, matching HomeScreen.tsx)
  const weekStart = new Date(currentYear, now.getMonth(), currentDay - now.getDay(), 0, 0, 0);
  const weekEnd = new Date(currentYear, now.getMonth(), currentDay - now.getDay() + 6, 23, 59, 59);

  const thisWeekBookings = bookings
    .filter((b) => {
      const dt = parseBookingDateLocal(b);
      return dt >= weekStart && dt <= weekEnd;
    })
    .sort((a, b) => {
      const diff = parseBookingDateLocal(a).getTime() - parseBookingDateLocal(b).getTime();
      return diff !== 0 ? diff : getBookingMinutes(a) - getBookingMinutes(b);
    });

  // Month-Scoped KPIs (exact parity with mobile HomeScreen.tsx)
  const thisMonthBookings = bookings.filter((b) => {
    const dt = parseBookingDateLocal(b);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === currentYear;
  });

  const toCollect = bookings.reduce((sum, b) => {
    if (b.status === 'Closed') return sum;
    return sum + Math.max(0, b.balanceDue);
  }, 0);

  const monthSales = thisMonthBookings.reduce((sum, b) => sum + b.total, 0);
  const netMonthProfit = monthSales - monthExpenses;
  const formattedMonthProfit =
    netMonthProfit < 0
      ? `-${fmtRupees(Math.abs(netMonthProfit))}`
      : fmtRupees(netMonthProfit);

  // Top Bar Date Strip (14 days from today)
  const dateStripDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayNum = d.getDate();
    const dow = DAY_INITIALS[d.getDay()];
    const mShort = MONTH_SHORT[d.getMonth()];
    const yrNum = d.getFullYear();
    const dayBookings = getBookingsForDate(dayNum, mShort, yrNum);
    return { num: dayNum, dow, month: mShort, year: yrNum, dayBookings };
  });

  // Full Month Calendar Grid
  const displayedDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const displayedMonthIdx = displayedDate.getMonth();
  const displayedMonthShort = MONTH_SHORT[displayedMonthIdx];
  const displayedMonthLong = MONTH_LONG[displayedMonthIdx];
  const displayedYear = displayedDate.getFullYear();
  const firstDayOfMonth = new Date(displayedYear, displayedMonthIdx, 1).getDay();
  const daysInMonth = new Date(displayedYear, displayedMonthIdx + 1, 0).getDate();
  const monthLeadCells = Array.from({ length: firstDayOfMonth }, () => null);
  const monthDayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDayBookings = getBookingsForDate(selectedDay, selectedMonth, selectedYear);
  const hasUpcomingOnSelected = selectedDayBookings.some((b) => b.status === 'Upcoming');
  const selectedMonthIdx = Math.max(0, MONTH_SHORT.indexOf(selectedMonth));

  const renderStatusDots = (dayBookings: StudioBooking[], isDarkSurface: boolean) => {
    if (dayBookings.length === 0) return <span className="h-2 block" />;
    const visible = dayBookings.slice(0, 4);
    return (
      <span className="flex items-center justify-center gap-1 h-2">
        {visible.map((b, idx) => {
          const isDone = b.status === 'Completed' || b.status === 'Closed';
          const colorClass = isDone
            ? isDarkSurface
              ? 'bg-[#22c55e]'
              : 'bg-[#16a34a]'
            : isDarkSurface
            ? 'bg-[#ff4d8d]'
            : 'bg-[#e8276b]';
          return (
            <span
              key={b.id || idx}
              title={`${b.client} · ${b.status}`}
              className={`w-1.5 h-1.5 rounded-full ${colorClass}`}
            />
          );
        })}
        {dayBookings.length > 4 && (
          <span
            className={`text-[9px] font-bold leading-none ${
              isDarkSurface ? 'text-white' : 'text-[#52525b]'
            }`}
          >
            +
          </span>
        )}
      </span>
    );
  };

  return (
    <div ref={rootRef} className="space-y-7 pb-6">
      {/* =================================================================== */}
      {/* 1. GOOD MORNING GREETING + OWNER NAME + STACKED LIVE DATE           */}
      {/* =================================================================== */}
      <section
        data-dash-hero
        aria-label="Studio Greeting and Date"
        className="rounded-2xl bg-[#0c0c0f] text-white px-6 py-5 sm:px-8 sm:py-6 flex flex-wrap items-center justify-between gap-4 border border-black/10"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#ffb3cc]">
            Good Morning,
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white mt-0.5 truncate">
            {ownerName || 'Shilpa R.'}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {businessName}
          </p>
        </div>

        {/* Live Stacked Date: Weekday (small) -> 12 November (large) -> 2026 (small) */}
        <div className="text-right shrink-0 tabular-nums">
          <div className="text-xs font-medium text-white/70">
            {currentDowLong}
          </div>
          <div className="font-display text-2xl sm:text-[1.85rem] font-extrabold tracking-[-0.025em] text-white leading-tight my-0.5">
            {currentDay} {currentMonthLong}
          </div>
          <div className="font-mono text-xs font-medium text-[#ff6b93]">
            {currentYear}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. ONE-BY-ONE QUOTES MARQUEE BAR (NEXT ENTERS AFTER CURRENT EXITS)   */}
      {/* =================================================================== */}
      <section
        data-dash-quote
        aria-label="Studio Inspiration"
        className="rounded-2xl bg-white border border-black/[0.08] px-5 py-3 overflow-hidden"
      >
        <div
          ref={marqueeViewportRef}
          className="relative h-5 overflow-hidden select-none"
        >
          {/* Subtle Edge Fades */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent z-10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10"
          />

          <div
            key={quoteIndex}
            ref={marqueeItemRef}
            className="absolute left-0 top-0 h-full inline-flex items-center gap-2.5 whitespace-nowrap will-change-transform"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8276b] shrink-0" />
            <span className="font-display text-[13px] font-bold text-[#121214]">
              {activeQuote.title}
            </span>
            <span className="text-xs text-[#52525b]">
              — {activeQuote.subtitle}
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. COMPACT SIX-KPI STRIP WITH BREATHABLE WHITESPACE                 */}
      {/* =================================================================== */}
      <section
        aria-label="Studio Key Metrics"
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {/* Card 1: This Week Bookings */}
        <div
          data-dash-kpi
          className="rounded-xl bg-white border border-black/[0.08] px-3.5 py-3 transition-colors hover:border-black/20"
        >
          <span className="text-[11px] font-medium text-[#52525b] block truncate">
            This Week
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-[#121214] mt-1 tabular-nums truncate">
            {thisWeekBookings.length} {thisWeekBookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>

        {/* Card 2: This Month Bookings */}
        <div
          data-dash-kpi
          className="rounded-xl bg-white border border-black/[0.08] px-3.5 py-3 transition-colors hover:border-black/20"
        >
          <span className="text-[11px] font-medium text-[#52525b] block truncate">
            This Month
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-[#121214] mt-1 tabular-nums truncate">
            {thisMonthBookings.length} {thisMonthBookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>

        {/* Card 3: To Collect (Rose Highlight) */}
        <div
          data-dash-kpi
          className="rounded-xl bg-[#ffeef4]/80 border border-[#e8276b]/25 px-3.5 py-3 transition-colors hover:border-[#e8276b]/50"
        >
          <span className="text-[11px] font-semibold text-[#a50f45] block truncate">
            To Collect
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-[#a50f45] mt-1 tabular-nums truncate">
            {fmtRupees(toCollect)}
          </div>
        </div>

        {/* Card 4: {Month} Sales */}
        <div
          data-dash-kpi
          className="rounded-xl bg-white border border-black/[0.08] px-3.5 py-3 transition-colors hover:border-black/20"
        >
          <span className="text-[11px] font-medium text-[#52525b] block truncate">
            {currentMonthLong} Sales
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-[#121214] mt-1 tabular-nums truncate">
            {fmtRupees(monthSales)}
          </div>
        </div>

        {/* Card 5: {Month} Expense */}
        <div
          data-dash-kpi
          className="rounded-xl bg-white border border-black/[0.08] px-3.5 py-3 transition-colors hover:border-black/20"
        >
          <span className="text-[11px] font-medium text-[#52525b] block truncate">
            {currentMonthLong} Expense
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-[#121214] mt-1 tabular-nums truncate">
            {fmtRupees(monthExpenses)}
          </div>
        </div>

        {/* Card 6: {Month} Profit */}
        <div
          data-dash-kpi
          className="rounded-xl bg-[#0c0c0f] text-white border border-black/10 px-3.5 py-3"
        >
          <span className="text-[11px] font-medium text-[#ffb3cc] block truncate">
            {currentMonthLong} Profit
          </span>
          <div className="font-display text-base sm:text-[17px] font-bold text-white mt-1 tabular-nums truncate">
            {formattedMonthProfit}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. ORDERS & APPOINTMENTS (Upcoming, Completed, Closed)              */}
      {/* =================================================================== */}
      <section
        data-dash-section
        aria-label="Studio Orders and Bookings"
        className="rounded-2xl bg-white border border-black/[0.08] overflow-hidden shadow-sm"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display text-base font-bold text-[#121214]">
              Studio Orders
            </h3>
            {/* Filter Tabs: Upcoming, All, Completed, Closed */}
            <div className="inline-flex items-center p-1 bg-[#f4f2f3] rounded-xl border border-black/[0.05] text-xs font-bold">
              {[
                { id: 'Upcoming' as const, label: 'Upcoming', count: bookings.filter((b) => b.status === 'Upcoming').length },
                { id: 'All' as const, label: 'All', count: bookings.length },
                { id: 'Completed' as const, label: 'Completed', count: bookings.filter((b) => b.status === 'Completed').length },
                { id: 'Closed' as const, label: 'Closed', count: bookings.filter((b) => b.status === 'Closed').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    orderFilter === tab.id
                      ? 'bg-white text-[#121214] shadow-sm font-extrabold'
                      : 'text-[#64748b] hover:text-[#121214]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewBooking()}
            className="text-xs font-semibold text-[#a50f45] hover:text-[#e8276b] transition-colors inline-flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>

        {(() => {
          const list =
            orderFilter === 'All'
              ? bookings
              : bookings.filter((b) => b.status === orderFilter);

          if (list.length === 0) {
            return (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-semibold text-[#121214]">No {orderFilter.toLowerCase()} orders found</p>
                <p className="text-xs text-[#52525b] mt-1">
                  Select any open date in your calendar below or create a new booking now.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenNewBooking()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#e8276b] hover:bg-[#c71957] text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Booking</span>
                </button>
              </div>
            );
          }

          return (
            <ul className="divide-y divide-black/[0.06]">
              {list.map((b) => {
                const isFinished = b.status === 'Completed' || b.status === 'Closed';
                return (
                  <li
                    key={b.id}
                    onClick={() => onSelectBooking?.(b)}
                    className="px-5 sm:px-6 py-4 hover:bg-[#ffeef4]/30 cursor-pointer transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Compact Date & Time Column */}
                      <div className="w-20 shrink-0 tabular-nums">
                        <span className="text-xs font-bold text-[#a50f45] block">
                          {b.day} {b.month}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#121214] block mt-0.5">
                          {b.time} {b.meridiem}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-[#121214] group-hover:text-[#e8276b] transition-colors truncate">
                            {b.client}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                              b.status === 'Closed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : b.status === 'Completed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-[#ffeef4] text-[#a50f45] border border-[#e8276b]/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === 'Closed'
                                  ? 'bg-[#16a34a]'
                                  : b.status === 'Completed'
                                  ? 'bg-blue-600'
                                  : 'bg-[#e8276b]'
                              }`}
                            />
                            {b.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#121214]/80 truncate mt-0.5">
                          {b.items.map((i) => i.name).join(' + ')}
                        </p>
                        <p className="text-xs text-[#52525b] flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-[#e8276b] shrink-0" />
                          <span className="truncate">{b.venue}</span>
                        </p>
                      </div>
                    </div>

                    {/* Amount, Due & Quick WhatsApp Receipt */}
                    <div className="flex items-center gap-4 shrink-0 ml-auto">
                      <div className="text-right tabular-nums">
                        <span className="font-display text-sm font-bold text-[#121214] block">
                          {fmtRupees(b.total)}
                        </span>
                        <span
                          className={`text-xs font-semibold block ${
                            b.balanceDue > 0 ? 'text-[#a50f45]' : 'text-emerald-700'
                          }`}
                        >
                          {b.balanceDue > 0 ? `${fmtRupees(b.balanceDue)} due` : 'Paid'}
                        </span>
                      </div>

                      {b.clientPhone && (
                        <a
                          href={`https://wa.me/${b.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${b.client}, your booking (${b.ref}) with ${businessName} is confirmed for ${b.day} ${b.month} ${b.year} at ${b.time} ${b.meridiem}. Total: ${fmtRupees(
                              b.total
                            )}, Balance Due: ${fmtRupees(b.balanceDue)}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Send WhatsApp Receipt"
                          className="w-8 h-8 rounded-lg bg-[#faf8f9] border border-black/[0.08] hover:bg-[#e8276b] hover:border-[#e8276b] text-[#52525b] hover:text-white flex items-center justify-center transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()}
      </section>

      {/* =================================================================== */}
      {/* 5. MY CALENDAR: TOP DATE BAR + FULL MONTH GRID + PINK/GREEN DOTS    */}
      {/* =================================================================== */}
      <section
        data-dash-section
        aria-label="My Calendar"
        className="rounded-2xl bg-white border border-black/[0.08] p-5 sm:p-6 space-y-4"
      >
        {/* Top Calendar Bar Header + Full Month Toggle + Color Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e8276b]" />
              <h3 className="font-display text-base font-bold text-[#121214]">
                My Calendar
              </h3>
            </div>

            {/* Pink & Green Dot Legend */}
            <div className="flex items-center gap-3 text-xs text-[#52525b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e8276b]" />
                <span>Upcoming</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                <span>Completed / Closed</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCalExpanded((prev) => !prev)}
            aria-expanded={calExpanded}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-xl bg-[#faf8f9] hover:bg-[#ffeef4] border border-black/[0.09] hover:border-[#e8276b]/35 text-xs font-semibold text-[#121214] hover:text-[#a50f45] transition-colors"
          >
            <span>{calExpanded ? 'Date Bar' : 'Full Month'}</span>
            {calExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Mode A: Horizontal Top Date Strip Bar (All Upcoming 14 Dates) */}
        {!calExpanded && (
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1.5">
            {dateStripDays.map((d) => {
              const isToday =
                d.num === currentDay && d.month === currentMonthShort && d.year === currentYear;
              const isSelected =
                selectedDay === d.num && selectedMonth === d.month && selectedYear === d.year;

              return (
                <button
                  key={`${d.year}-${d.month}-${d.num}`}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.num);
                    setSelectedMonth(d.month);
                    setSelectedYear(d.year);
                    const targetMonthOffset =
                      (d.year - currentYear) * 12 +
                      (MONTH_SHORT.indexOf(d.month) - now.getMonth());
                    setMonthOffset(targetMonthOffset);
                  }}
                  className={`min-w-[54px] flex-1 py-2.5 px-2 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all tabular-nums ${
                    isSelected
                      ? 'bg-[#0c0c0f] border-[#0c0c0f] text-white shadow-sm'
                      : isToday
                      ? 'bg-[#ffeef4]/65 border-[#e8276b]/45 text-[#121214]'
                      : 'bg-[#faf8f9] border-black/[0.07] text-[#121214] hover:border-black/25'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold ${
                      isSelected
                        ? 'text-[#ffb3cc]'
                        : isToday
                        ? 'text-[#a50f45]'
                        : 'text-[#52525b]'
                    }`}
                  >
                    {d.dow}
                  </span>
                  <span className="font-display text-base font-bold leading-none">
                    {d.num}
                  </span>
                  {renderStatusDots(d.dayBookings, isSelected)}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode B: Expanded Full Month Calendar Grid */}
        {calExpanded && (
          <div ref={calendarExpandRef} className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonthOffset((prev) => prev - 1)}
                className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-[#121214] hover:border-black/25 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-display text-sm font-bold text-[#121214] tracking-wide">
                {displayedMonthLong} {displayedYear}
              </span>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonthOffset((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg border border-black/[0.08] flex items-center justify-center text-[#121214] hover:border-black/25 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* DOW Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-[#52525b]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dow) => (
                <div key={dow} className="py-1">
                  {dow}
                </div>
              ))}
            </div>

            {/* Month Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthLeadCells.map((_, idx) => (
                <div key={`empty-${idx}`} className="h-12 sm:h-14" />
              ))}

              {monthDayCells.map((dayNum) => {
                const dayBookings = getBookingsForDate(dayNum, displayedMonthShort, displayedYear);
                const isToday =
                  dayNum === currentDay &&
                  displayedMonthShort === currentMonthShort &&
                  displayedYear === currentYear;
                const isSelected =
                  selectedDay === dayNum &&
                  selectedMonth === displayedMonthShort &&
                  selectedYear === displayedYear;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      setSelectedDay(dayNum);
                      setSelectedMonth(displayedMonthShort);
                      setSelectedYear(displayedYear);
                    }}
                    className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all tabular-nums ${
                      isSelected
                        ? 'bg-[#0c0c0f] border-[#0c0c0f] text-white'
                        : isToday
                        ? 'bg-[#ffeef4]/65 border-[#e8276b]/45 text-[#121214]'
                        : 'bg-[#faf8f9] border-black/[0.06] text-[#121214] hover:border-black/25'
                    }`}
                  >
                    <span className="font-display text-xs sm:text-sm font-bold leading-none">
                      {dayNum}
                    </span>
                    {renderStatusDots(dayBookings, isSelected)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Date Detail Drawer: Bookings OR "Book It" Free Day Prompt */}
        <div
          ref={selectedPanelRef}
          className="rounded-xl bg-[#faf8f9] border border-black/[0.07] p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#121214] tabular-nums">
              {selectedDayBookings.length}{' '}
              {selectedDayBookings.length === 1 ? 'booking' : 'bookings'} on {selectedDay}{' '}
              {selectedMonth} {selectedYear}
            </span>

            {selectedDayBookings.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onOpenNewBooking({
                    day: selectedDay,
                    monthShort: selectedMonth,
                    year: selectedYear,
                    isoDate: toIsoDate(selectedYear, selectedMonthIdx, selectedDay),
                  })
                }
                className="inline-flex items-center gap-1 px-3 h-7 rounded-lg bg-[#e8276b] hover:bg-[#c71957] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Book It</span>
              </button>
            )}
          </div>

          {selectedDayBookings.length > 0 ? (
            <div className="space-y-2">
              {selectedDayBookings.map((b) => {
                const isFinished = b.status === 'Completed' || b.status === 'Closed';
                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking?.(b)}
                    className="rounded-xl bg-white border border-black/[0.07] hover:border-[#e8276b]/40 hover:shadow-sm cursor-pointer transition-all px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 shrink-0 tabular-nums">
                        <span className="font-mono text-xs font-bold text-[#121214] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#e8276b]" />
                          {b.time}
                        </span>
                        <span className="text-[10px] font-semibold text-[#52525b] pl-4 block">
                          {b.meridiem}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-[#121214] group-hover:text-[#e8276b] transition-colors truncate">
                            {b.client}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === 'Closed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : b.status === 'Completed'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-[#ffeef4] text-[#a50f45]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === 'Closed'
                                  ? 'bg-[#16a34a]'
                                  : b.status === 'Completed'
                                  ? 'bg-blue-600'
                                  : 'bg-[#e8276b]'
                              }`}
                            />
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#52525b] truncate">
                          {b.items.map((i) => i.name).join(' + ')} · {b.venue}
                        </p>
                      </div>
                    </div>

                    <div className="text-right tabular-nums ml-auto shrink-0">
                      <span className="font-display text-sm font-bold text-[#121214] block">
                        {fmtRupees(b.total)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          b.balanceDue > 0 ? 'text-[#a50f45]' : 'text-emerald-700'
                        }`}
                      >
                        {b.balanceDue > 0 ? `${fmtRupees(b.balanceDue)} due` : 'Paid'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!hasUpcomingOnSelected && (
                <div className="pt-1 flex items-center justify-between gap-3 text-xs text-[#52525b]">
                  <span>No upcoming bookings open on this date.</span>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenNewBooking({
                        day: selectedDay,
                        monthShort: selectedMonth,
                        year: selectedYear,
                        isoDate: toIsoDate(selectedYear, selectedMonthIdx, selectedDay),
                      })
                    }
                    className="px-3.5 h-8 rounded-xl bg-[#e8276b] hover:bg-[#c71957] text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    Book It
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-[#52525b]">
                No bookings on {selectedDay} {selectedMonth} — this date is free.
              </p>
              <button
                type="button"
                onClick={() =>
                  onOpenNewBooking({
                    day: selectedDay,
                    monthShort: selectedMonth,
                    year: selectedYear,
                    isoDate: toIsoDate(selectedYear, selectedMonthIdx, selectedDay),
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#e8276b] hover:bg-[#c71957] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book It</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
