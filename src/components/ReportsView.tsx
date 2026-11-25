import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Layers,
  MessageCircle,
  Printer,
  Receipt,
  Search,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { StudioBooking } from './DashboardView';
import { StudioExpense } from './ExpensesView';

interface ReportsViewProps {
  bookings: StudioBooking[];
  expenses: StudioExpense[];
  monthExpenses?: number;
  registeredAt?: string | null;
  studioName?: string;
  artistName?: string;
  syncing?: boolean;
}

const MONTH_SHORT_ARR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_LONG_ARR = [
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

function parseBookingDayLocal(b: StudioBooking, fallbackYear: number): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.bookingDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const mIdx = Math.max(0, MONTH_SHORT_ARR.indexOf(b.month));
  return new Date(b.year || fallbackYear, mIdx, b.day || 1);
}

function parseExpenseDayLocal(e: StudioExpense, fallbackYear: number): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(e.expenseDate || ''));
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const parsed = new Date(e.expenseDate);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(fallbackYear, new Date().getMonth(), 1);
}

function bookingTotalAmount(b: StudioBooking): number {
  if (b.total > 0) return b.total;
  const itemsSum = Array.isArray(b.items)
    ? b.items.reduce((s, item) => s + (item.price || 0), 0)
    : 0;
  return itemsSum + (b.travel || 0);
}

function fmtINR(amount: number): string {
  const prefix = amount < 0 ? '-₹' : '₹';
  return `${prefix}${Math.abs(Math.round(amount)).toLocaleString('en-IN')}`;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  bookings = [],
  expenses = [],
  monthExpenses = 0,
  registeredAt,
  studioName = 'Shilpi Studio',
  artistName = 'Artist',
  syncing = false,
}) => {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currentSerial = toMonthSerial(currentYear, currentMonthIdx);

  // Month navigation boundary
  const regDate = useMemo(() => {
    if (registeredAt) {
      const parsed = new Date(registeredAt);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date(currentYear, currentMonthIdx, 1);
  }, [registeredAt, currentYear, currentMonthIdx]);

  const minSerial = toMonthSerial(regDate.getFullYear(), regDate.getMonth());
  const maxSerial = currentSerial + 12;

  // TOP-LEVEL SLIDER: 'Monthly' vs 'Summary'
  const [topTab, setTopTab] = useState<'Monthly' | 'Summary'>('Monthly');

  // Month Slider State for Monthly View
  const [selectedSerial, setSelectedSerial] = useState<number>(() =>
    Math.max(minSerial, currentSerial)
  );

  // Sub-Tab inside Monthly View: 'Overview' vs 'DayWise'
  const [monthlySubTab, setMonthlySubTab] = useState<'Overview' | 'DayWise'>('Overview');

  // Summary State: Expanded Months in Year
  const [expandedSummaryMonth, setExpandedSummaryMonth] = useState<number | null>(null);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const { year: selectedYear, monthIdx: selectedMonthIdx } = fromMonthSerial(selectedSerial);
  const selectedMonthLong = MONTH_LONG_ARR[selectedMonthIdx];
  const canGoPrev = selectedSerial > minSerial;
  const canGoNext = selectedSerial < maxSerial;
  const prevMonthShort = canGoPrev
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial - 1).monthIdx].toUpperCase()
    : '';
  const nextMonthShort = canGoNext
    ? MONTH_SHORT_ARR[fromMonthSerial(selectedSerial + 1).monthIdx].toUpperCase()
    : '';

  // Data for active selected month in Monthly View
  const monthData = useMemo(() => {
    const monthBookings = bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });

    const monthExp = expenses.filter((e) => {
      const dt = parseExpenseDayLocal(e, selectedYear);
      if (!dt) return false;
      return dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonthIdx;
    });

    let totalSales = 0;
    let totalAdvance = 0;
    const dayWiseMap = new Map<
      number,
      {
        day: number;
        dateStr: string;
        sales: number;
        expenses: number;
        bookingsCount: number;
        bookings: StudioBooking[];
      }
    >();

    monthBookings.forEach((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      const dayNum = dt.getDate();
      const bTotal = bookingTotalAmount(b);
      const bAdvance = Math.min(bTotal, Math.max(0, b.advance || 0));

      totalSales += bTotal;
      totalAdvance += bAdvance;

      const existing = dayWiseMap.get(dayNum) || {
        day: dayNum,
        dateStr: `${dayNum} ${selectedMonthLong.slice(0, 3)}`,
        sales: 0,
        expenses: 0,
        bookingsCount: 0,
        bookings: [],
      };
      existing.sales += bTotal;
      existing.bookingsCount += 1;
      existing.bookings.push(b);
      dayWiseMap.set(dayNum, existing);
    });

    let totalExpense = monthExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (monthExp.length === 0 && selectedSerial === currentSerial && monthExpenses > 0) {
      totalExpense = monthExpenses;
    }

    monthExp.forEach((e) => {
      const dt = parseExpenseDayLocal(e, selectedYear);
      if (dt) {
        const dayNum = dt.getDate();
        const existing = dayWiseMap.get(dayNum) || {
          day: dayNum,
          dateStr: `${dayNum} ${selectedMonthLong.slice(0, 3)}`,
          sales: 0,
          expenses: 0,
          bookingsCount: 0,
          bookings: [],
        };
        existing.expenses += Number(e.amount) || 0;
        dayWiseMap.set(dayNum, existing);
      }
    });

    const profit = totalSales - totalExpense;
    const pendingDues = Math.max(0, totalSales - totalAdvance);
    const upiPaid = Math.round(totalAdvance * 0.75);
    const cashPaid = Math.round(totalAdvance * 0.25);

    // Best Day
    let bestDayStr = '—';
    let maxDaySales = 0;
    dayWiseMap.forEach((val) => {
      if (val.sales > maxDaySales) {
        maxDaySales = val.sales;
        bestDayStr = `${val.dateStr} (${fmtINR(val.sales)})`;
      }
    });

    // 4 Weeks in Month
    const weeksData = [1, 2, 3, 4].map((w) => {
      const startDay = (w - 1) * 7 + 1;
      const endDay = w === 4 ? 31 : w * 7;
      let wSales = 0;
      let wExp = 0;
      dayWiseMap.forEach((val, d) => {
        if (d >= startDay && d <= endDay) {
          wSales += val.sales;
          wExp += val.expenses;
        }
      });
      return {
        label: `Week ${w}`,
        sales: wSales,
        expenses: wExp,
      };
    });

    // Top Services
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    monthBookings.forEach((b) => {
      (b.items || []).forEach((item) => {
        const title = item.name.trim();
        const prev = serviceMap.get(title) || { count: 0, revenue: 0 };
        prev.count += 1;
        prev.revenue += item.price;
        serviceMap.set(title, prev);
      });
    });

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const sortedDayWiseList = Array.from(dayWiseMap.values()).sort((a, b) => a.day - b.day);

    const marginPct = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0;
    const collectionPct = totalSales > 0 ? Math.round((totalAdvance / totalSales) * 100) : 0;

    return {
      monthBookings,
      totalSales,
      totalExpense,
      profit,
      marginPct,
      collectionPct,
      bestDayStr,
      pendingDues,
      cashPaid,
      upiPaid,
      weeksData,
      topServices,
      sortedDayWiseList,
    };
  }, [bookings, expenses, selectedSerial, selectedYear, selectedMonthIdx, selectedMonthLong, currentSerial, monthExpenses]);

  // Annual Summary for Summary Slider
  const annualSummary = useMemo(() => {
    const regYear = regDate.getFullYear();
    const regMonthIdx = regDate.getMonth();

    const yearBookings = bookings.filter((b) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      if (dt.getFullYear() !== selectedYear) return false;
      if (selectedYear === regYear && dt.getMonth() < regMonthIdx) return false;
      if (selectedYear < regYear) return false;
      return true;
    });

    const yearTotalSales = yearBookings.reduce((sum, b) => sum + bookingTotalAmount(b), 0);
    const yearExpenses = expenses
      .filter((e) => {
        const dt = parseExpenseDayLocal(e, selectedYear);
        if (!dt || dt.getFullYear() !== selectedYear) return false;
        if (selectedYear === regYear && dt.getMonth() < regMonthIdx) return false;
        if (selectedYear < regYear) return false;
        return true;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const yearProfit = yearTotalSales - yearExpenses;
    const startMonthIdx = selectedYear === regYear ? regMonthIdx : selectedYear > regYear ? 0 : 12;

    const months: Array<{
      monthIdx: number;
      monthName: string;
      monthShort: string;
      billsCount: number;
      sales: number;
      expenses: number;
      profit: number;
      bookings: StudioBooking[];
    }> = [];

    for (let mIdx = startMonthIdx; mIdx < 12; mIdx++) {
      const mBookings = yearBookings.filter((b) => {
        const dt = parseBookingDayLocal(b, selectedYear);
        return dt.getMonth() === mIdx;
      });

      const mSales = mBookings.reduce((sum, b) => sum + bookingTotalAmount(b), 0);
      const mExp = expenses
        .filter((e) => {
          const dt = parseExpenseDayLocal(e, selectedYear);
          return dt && dt.getFullYear() === selectedYear && dt.getMonth() === mIdx;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      months.push({
        monthIdx: mIdx,
        monthName: MONTH_LONG_ARR[mIdx],
        monthShort: MONTH_SHORT_ARR[mIdx],
        billsCount: mBookings.length,
        sales: mSales,
        expenses: mExp,
        profit: mSales - mExp,
        bookings: mBookings,
      });
    }

    return {
      year: selectedYear,
      ordersCompleted: yearBookings.length,
      yearTotalSales,
      yearExpenses,
      yearProfit,
      months,
    };
  }, [bookings, expenses, selectedYear, regDate]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['SL', 'Date', 'Client', 'Phone', 'Packages', 'Total (INR)', 'Advance (INR)', 'Due (INR)', 'Status'];
    const rows = monthData.monthBookings.map((b, idx) => {
      const dt = parseBookingDayLocal(b, selectedYear);
      const total = bookingTotalAmount(b);
      const advance = Math.min(total, Math.max(0, b.advance || 0));
      const due = Math.max(0, total - advance);
      const itemsStr = (b.items || []).map((i) => i.name).join(' + ') || 'Styling';
      return [
        idx + 1,
        `${dt.getDate()} ${MONTH_SHORT_ARR[dt.getMonth()]} ${dt.getFullYear()}`,
        `"${b.client.replace(/"/g, '""')}"`,
        `"${b.clientPhone || ''}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        total,
        advance,
        due,
        b.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shilpi_Report_${selectedMonthLong}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share Summary Handler
  const handleShareSummary = () => {
    const summaryText = `*${studioName} — Monthly Business Report*\n📅 *${selectedMonthLong} ${selectedYear}*\n\n💰 Total Sales: ${fmtINR(monthData.totalSales)}\n💸 Total Expenses: ${fmtINR(monthData.totalExpense)}\n✨ Net Profit: ${fmtINR(monthData.profit)} (${monthData.marginPct}%)\n⏳ Outstanding Dues: ${fmtINR(monthData.pendingDues)}\n📋 Bookings Completed: ${monthData.monthBookings.length}\n\nGenerated via Shilpi App.`;
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* =========================================================================
          Top Slider Pill Switcher: "Monthly" vs "Summary"
          ========================================================================= */}
      <section className="bg-white rounded-2xl border border-black/[0.07] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 bg-[#f4f2f3] rounded-xl border border-black/[0.06] shadow-inner max-w-fit">
          <button
            type="button"
            onClick={() => setTopTab('Monthly')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              topTab === 'Monthly'
                ? 'bg-white text-[#121214] shadow-sm border border-black/[0.06]'
                : 'text-[#64748b] hover:text-[#121214]'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${topTab === 'Monthly' ? 'text-[#e8276b]' : 'text-current'}`} />
            <span className="hidden sm:inline">Monthly Reports</span>
            <span className="sm:hidden">Monthly</span>
          </button>

          <button
            type="button"
            onClick={() => setTopTab('Summary')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              topTab === 'Summary'
                ? 'bg-white text-[#121214] shadow-sm border border-black/[0.06]'
                : 'text-[#64748b] hover:text-[#121214]'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${topTab === 'Summary' ? 'text-[#e8276b]' : 'text-current'}`} />
            <span className="hidden sm:inline">Annual Summary</span>
            <span className="sm:hidden">Annual</span>
          </button>
        </div>

        {/* Global Export & Preview Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-white border border-black/[0.1] text-xs font-bold text-[#121214] hover:bg-[#faf8f9] transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#e8276b]" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-white border border-black/[0.1] text-xs font-bold text-[#121214] hover:bg-[#faf8f9] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#121214] hover:bg-[#e8276b] text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Copied Summary!' : 'Share WhatsApp'}</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION A: Monthly View
          ========================================================================= */}
      {topTab === 'Monthly' && (
        <div className="space-y-6">
          {/* Month Slider Navigation Header */}
          <div className="bg-[#121214] rounded-2xl p-4 sm:px-6 sm:py-4 flex items-center justify-between text-white shadow-md">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setSelectedSerial((prev) => Math.max(minSerial, prev - 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                canGoPrev ? 'hover:bg-white/10 text-white' : 'opacity-30 cursor-not-allowed text-white/50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{prevMonthShort || 'PREV'}</span>
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#e8276b]" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                {selectedMonthLong} {selectedYear}
              </span>
            </div>

            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setSelectedSerial((prev) => Math.min(maxSerial, prev + 1))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                canGoNext ? 'hover:bg-white/10 text-white' : 'opacity-30 cursor-not-allowed text-white/50'
              }`}
            >
              <span className="hidden sm:inline">{nextMonthShort || 'NEXT'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tab Switcher: OVERVIEW vs DAY-WISE */}
          <div className="flex items-center justify-between border-b border-black/[0.08] pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonthlySubTab('Overview')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                  monthlySubTab === 'Overview'
                    ? 'bg-[#121214] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#121214]'
                }`}
              >
                <span className="hidden sm:inline">Overview & KPIs</span>
                <span className="sm:hidden">Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setMonthlySubTab('DayWise')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                  monthlySubTab === 'DayWise'
                    ? 'bg-[#121214] text-white shadow-sm'
                    : 'text-[#64748b] hover:text-[#121214]'
                }`}
              >
                <span className="hidden sm:inline">Day-Wise ({monthData.monthBookings.length})</span>
                <span className="sm:hidden">Days ({monthData.monthBookings.length})</span>
              </button>
            </div>

            {monthData.bestDayStr !== '—' && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#64748b]">
                <Sparkles className="w-3.5 h-3.5 text-[#e8276b]" />
                <span>Peak Day: <strong className="text-[#121214]">{monthData.bestDayStr}</strong></span>
              </div>
            )}
          </div>

          {/* 1. Monthly Overview */}
          {monthlySubTab === 'Overview' && (
            <div className="space-y-6">
              {/* 4 Main KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#64748b] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
                    <TrendingUp className="w-4 h-4 text-[#16a34a]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#121214] tabular-nums">
                    {fmtINR(monthData.totalSales)}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-1 font-medium">
                    {monthData.monthBookings.length} bookings recorded
                  </p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#64748b] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Expenses</span>
                    <Receipt className="w-4 h-4 text-[#e8276b]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#121214] tabular-nums">
                    {fmtINR(monthData.totalExpense)}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-1 font-medium">
                    Products, rent & travel
                  </p>
                </div>

                {/* Net Profit */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#64748b] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Net Profit</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        monthData.profit >= 0
                          ? 'bg-[#dcfce7] text-[#16a34a]'
                          : 'bg-[#ffeef4] text-[#a50f45]'
                      }`}
                    >
                      {monthData.marginPct}% Margin
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-extrabold tabular-nums ${
                      monthData.profit >= 0 ? 'text-[#16a34a]' : 'text-[#a50f45]'
                    }`}
                  >
                    {fmtINR(monthData.profit)}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-1 font-medium">
                    Sales minus expenses
                  </p>
                </div>

                {/* To Collect / Pending */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[#64748b] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">To Collect</span>
                    <Wallet className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#e8276b] tabular-nums">
                    {fmtINR(monthData.pendingDues)}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-1 font-medium">
                    {monthData.collectionPct}% advance collected
                  </p>
                </div>
              </div>

              {/* 4-Week Breakdown & Top Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 4-Week Progression */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <h4 className="text-xs font-extrabold text-[#121214] uppercase tracking-wider mb-4">
                    4-Week Revenue & Expense
                  </h4>
                  <div className="space-y-4">
                    {monthData.weeksData.map((w) => {
                      const maxVal = Math.max(
                        ...monthData.weeksData.map((d) => Math.max(d.sales, d.expenses)),
                        1
                      );
                      const salesWidth = Math.round((w.sales / maxVal) * 100);
                      const expWidth = Math.round((w.expenses / maxVal) * 100);
                      return (
                        <div key={w.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-[#121214]">
                            <span>{w.label}</span>
                            <span className="tabular-nums">{fmtINR(w.sales)}</span>
                          </div>
                          <div className="w-full h-3 bg-[#f4f2f3] rounded-full overflow-hidden flex gap-1">
                            <div
                              style={{ width: `${salesWidth}%` }}
                              className="h-full bg-[#121214] rounded-full"
                            />
                            <div
                              style={{ width: `${expWidth}%` }}
                              className="h-full bg-[#e8276b] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Services */}
                <div className="bg-white rounded-2xl border border-black/[0.07] p-5 shadow-sm">
                  <h4 className="text-xs font-extrabold text-[#121214] uppercase tracking-wider mb-4">
                    Top Services by Revenue
                  </h4>
                  {monthData.topServices.length === 0 ? (
                    <p className="text-xs text-[#64748b] py-6 text-center">No service data this month</p>
                  ) : (
                    <div className="divide-y divide-black/[0.05]">
                      {monthData.topServices.map((srv, idx) => (
                        <div key={srv.name} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#faf8f9] text-[#121214] text-[11px] font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-[#121214]">{srv.name}</p>
                              <p className="text-[10px] text-[#64748b]">{srv.count} bookings</p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-[#121214] tabular-nums">
                            {fmtINR(srv.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Day-Wise Transactions Table */}
          {monthlySubTab === 'DayWise' && (
            <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm overflow-hidden">
              <div className="p-4 sm:px-6 bg-[#faf8f9] border-b border-black/[0.06] flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#121214] uppercase tracking-wider">
                  Transactions ({monthData.monthBookings.length})
                </h4>
                <span className="text-xs font-bold text-[#64748b]">
                  Total: <strong className="text-[#121214]">{fmtINR(monthData.totalSales)}</strong>
                </span>
              </div>

              {monthData.monthBookings.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#64748b]">
                  No bookings found for {selectedMonthLong} {selectedYear}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/[0.07] bg-[#faf8f9]/50 text-[11px] font-bold text-[#64748b] uppercase">
                        <th className="py-3 px-4 whitespace-nowrap">Date</th>
                        <th className="py-3 px-4 whitespace-nowrap">Client</th>
                        <th className="py-3 px-4 whitespace-nowrap">Service</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Total</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Advance</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Due</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                      {monthData.monthBookings.map((b) => {
                        const dt = parseBookingDayLocal(b, selectedYear);
                        const bTotal = bookingTotalAmount(b);
                        const bAdvance = Math.min(bTotal, Math.max(0, b.advance || 0));
                        const bDue = Math.max(0, bTotal - bAdvance);
                        const servicesStr = (b.items || []).map((i) => i.name).join(', ') || 'Bridal Look';

                        return (
                          <tr key={b.id} className="hover:bg-[#faf8f9]/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#121214] whitespace-nowrap">
                              {dt.getDate()} {MONTH_SHORT_ARR[dt.getMonth()]}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-[#121214]">{b.client}</p>
                              <p className="text-[10px] text-[#64748b] tabular-nums">{b.clientPhone}</p>
                            </td>
                            <td className="py-3 px-4 text-[#52525b] max-w-xs truncate">{servicesStr}</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#121214] tabular-nums">
                              {fmtINR(bTotal)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-[#16a34a] tabular-nums">
                              {fmtINR(bAdvance)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold tabular-nums">
                              <span className={bDue > 0 ? 'text-[#e8276b] font-bold' : 'text-[#64748b]'}>
                                {bDue > 0 ? fmtINR(bDue) : 'Settled'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  b.status === 'Completed' || b.status === 'Closed'
                                    ? 'bg-[#dcfce7] text-[#16a34a]'
                                    : 'bg-[#ffeef4] text-[#e8276b]'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION B: Annual Summary View
          ========================================================================= */}
      {topTab === 'Summary' && (
        <div className="space-y-6">
          {/* Annual Overview KPI Box */}
          <div className="bg-[#121214] text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wide">
                  Annual Overview · {annualSummary.year}
                </h3>
                <p className="text-xs text-white/60">
                  Full studio accounting starting from registration ({MONTH_SHORT_ARR[regDate.getMonth()]} {regDate.getFullYear()})
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                {annualSummary.ordersCompleted} Orders
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-white/60 uppercase font-bold">Total Sales ({annualSummary.year})</p>
                <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">
                  {fmtINR(annualSummary.yearTotalSales)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase font-bold">Total Expenses</p>
                <p className="text-2xl font-extrabold text-[#ff80ab] mt-1 tabular-nums">
                  {fmtINR(annualSummary.yearExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase font-bold">Net Annual Profit</p>
                <p
                  className={`text-2xl font-extrabold mt-1 tabular-nums ${
                    annualSummary.yearProfit >= 0 ? 'text-[#4ade80]' : 'text-[#ff80ab]'
                  }`}
                >
                  {fmtINR(annualSummary.yearProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Month-by-Month Expandable Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#121214] px-1">
              Monthly Financial Breakdown
            </h4>

            {annualSummary.months.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.07] p-8 text-center text-xs text-[#64748b]">
                No transaction months recorded for {annualSummary.year}.
              </div>
            ) : (
              annualSummary.months.map((m) => {
                const isExpanded = expandedSummaryMonth === m.monthIdx;
                return (
                  <div
                    key={m.monthIdx}
                    className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-sm transition-all"
                  >
                    {/* Month Summary Header Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedSummaryMonth(isExpanded ? null : m.monthIdx)}
                      className="w-full p-4 sm:px-6 flex items-center justify-between text-left hover:bg-[#faf8f9] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#faf8f9] border border-black/[0.07] text-[#121214] font-extrabold text-xs flex items-center justify-center">
                          {m.monthShort}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-[#121214]">
                            {m.monthName} {annualSummary.year}
                          </p>
                          <p className="text-[11px] text-[#64748b] font-medium">
                            {m.billsCount} {m.billsCount === 1 ? 'bill' : 'bills'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-[#121214] tabular-nums">
                            {fmtINR(m.sales)}
                          </p>
                          <p className="text-[10px] text-[#64748b]">Sales</p>
                        </div>

                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-[#e8276b] tabular-nums">
                            {fmtINR(m.expenses)}
                          </p>
                          <p className="text-[10px] text-[#64748b]">Expenses</p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-xs font-extrabold tabular-nums ${
                              m.profit >= 0 ? 'text-[#16a34a]' : 'text-[#a50f45]'
                            }`}
                          >
                            {fmtINR(m.profit)}
                          </p>
                          <p className="text-[10px] text-[#64748b]">Net Profit</p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#64748b]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#64748b]" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Month Transactions */}
                    {isExpanded && (
                      <div className="border-t border-black/[0.06] bg-[#faf8f9]/50 p-4 sm:px-6">
                        {m.bookings.length === 0 ? (
                          <p className="text-xs text-[#64748b] py-2 text-center">
                            No bookings recorded in {m.monthName}.
                          </p>
                        ) : (
                          <div className="divide-y divide-black/[0.05]">
                            {m.bookings.map((b) => {
                              const dt = parseBookingDayLocal(b, annualSummary.year);
                              const bTotal = bookingTotalAmount(b);
                              const bAdvance = Math.min(bTotal, Math.max(0, b.advance || 0));
                              const bDue = Math.max(0, bTotal - bAdvance);
                              return (
                                <div
                                  key={b.id}
                                  className="py-2.5 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <p className="font-bold text-[#121214]">
                                      {dt.getDate()} {m.monthShort} · {b.client}
                                    </p>
                                    <p className="text-[11px] text-[#64748b]">
                                      {(b.items || []).map((i) => i.name).join(', ')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-extrabold text-[#121214] tabular-nums">
                                      {fmtINR(bTotal)}
                                    </p>
                                    <p className="text-[10px] text-[#64748b]">
                                      {bDue > 0 ? `Due ${fmtINR(bDue)}` : 'Settled'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          Preview Printable Report Modal
          ========================================================================= */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] mb-5">
              <div>
                <h3 className="text-base font-extrabold text-[#121214]">{studioName}</h3>
                <p className="text-xs text-[#64748b]">
                  Financial Statement · {selectedMonthLong} {selectedYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 h-9 rounded-xl bg-[#121214] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#64748b]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#121214]">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3 bg-[#faf8f9] p-4 rounded-xl border border-black/[0.06]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#64748b]">Total Sales</p>
                  <p className="text-sm font-extrabold tabular-nums mt-0.5">{fmtINR(monthData.totalSales)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#64748b]">Expenses</p>
                  <p className="text-sm font-extrabold text-[#e8276b] tabular-nums mt-0.5">{fmtINR(monthData.totalExpense)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#64748b]">Net Profit</p>
                  <p className="text-sm font-extrabold text-[#16a34a] tabular-nums mt-0.5">{fmtINR(monthData.profit)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#64748b]">Pending</p>
                  <p className="text-sm font-extrabold text-[#e8276b] tabular-nums mt-0.5">{fmtINR(monthData.pendingDues)}</p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-black/[0.06] border-t border-b border-black/[0.06] my-4">
                {monthData.monthBookings.map((b, idx) => {
                  const bTotal = bookingTotalAmount(b);
                  const bAdvance = Math.min(bTotal, Math.max(0, b.advance || 0));
                  const bDue = Math.max(0, bTotal - bAdvance);
                  return (
                    <div key={b.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold">
                          #{idx + 1} {b.client} · {b.day} {b.month}
                        </p>
                        <p className="text-[10px] text-[#64748b]">
                          {(b.items || []).map((i) => i.name).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums">{fmtINR(bTotal)}</p>
                        <p className="text-[10px] text-[#64748b]">
                          {bDue > 0 ? `Due ${fmtINR(bDue)}` : 'Paid'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[10px] text-[#64748b]">
                Verified and generated by Shilpi Studio Management Platform.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
